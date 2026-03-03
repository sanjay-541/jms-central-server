#!/bin/bash
set -e

echo "Starting JPSMS Central VPS Server secure deployment..."

# Step 1: Secure Server
echo "Securing server..."
echo "Please enter the NEW secure password for the 'root' user:"
passwd root

echo "Creating 'deploy' user for secure, non-root operations..."
adduser --disabled-password --gecos "" deploy
echo "Please enter the password for the new 'deploy' user:"
passwd deploy
usermod -aG sudo deploy

echo "Disabling root SSH login..."
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

echo "Configuring UFW Firewall..."
ufw --force enable
ufw allow 22
ufw allow 80
ufw allow 443

echo "Updating system and installing dependencies..."
export DEBIAN_FRONTEND=noninteractive
apt update && apt upgrade -y
apt install -y fail2ban curl git nginx certbot python3-certbot-nginx apt-transport-https ca-certificates software-properties-common

systemctl enable fail2ban
systemctl start fail2ban

# Step 2: Install Docker
echo "Installing Docker Engine..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker deploy
systemctl enable docker
systemctl start docker

# Step 3: Production Directory Structure
echo "Setting up production structure..."
mkdir -p /opt/jpsms/{app,backups,logs,scripts,nginx}
chown -R deploy:deploy /opt/jpsms

echo "Cloning GitHub repo..."
cd /opt/jpsms/app
if [ ! -d ".git" ]; then
    git clone https://github.com/sanjay-541/jms-central-server.git .
else
    git fetch && git reset --hard origin/main
fi

# Step 4: Environment Config & Files
echo "Creating .env.production..."
cat << 'EOF' > /opt/jpsms/app/.env.production
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=SecureJPSMS_ProdDB_2026!
DB_NAME=jpsms
EOF

echo "Creating production docker-compose.yml..."
cat << 'EOF' > /opt/jpsms/app/docker-compose.prod.yml
version: "3.9"
services:
  jms-app:
    build: .
    container_name: jpsms-app
    restart: always
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      - postgres
    env_file:
      - .env.production
    volumes:
      - appdata:/app/uploads
    networks:
      - jpsms_network

  postgres:
    image: postgres:15-alpine
    container_name: jpsms-db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: SecureJPSMS_ProdDB_2026!
      POSTGRES_DB: jpsms
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - jpsms_network

volumes:
  pgdata:
  appdata:

networks:
  jpsms_network:
    driver: bridge
EOF

# Step 5: Build Image
echo "Building Docker Image cleanly..."
export DOCKER_BUILDKIT=1
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Step 6: Configure Nginx
echo "Configuring Nginx Reverse Proxy..."
cat << 'EOF' > /etc/nginx/sites-available/jpsms
server {
    listen 80;
    server_name 72.62.228.195;

    client_max_body_size 50M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
ln -sf /etc/nginx/sites-available/jpsms /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

# Step 7: Auto Restart on Reboot
echo "Configuring systemd auto-restart service..."
cat << 'EOF' > /etc/systemd/system/jpsms.service
[Unit]
Description=JPSMS Docker Compose Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/jpsms/app
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable jpsms.service

# Step 8: Backup Script
echo "Creating automated database backup script..."
cat << 'EOF' > /opt/jpsms/scripts/backup.sh
#!/bin/bash
docker exec jpsms-db pg_dump -U postgres jpsms > /opt/jpsms/backups/jpsms_$(date +%Y%m%d_%H%M%S).sql
EOF
chmod +x /opt/jpsms/scripts/backup.sh
CRON_JOB="0 2 * * * root /opt/jpsms/scripts/backup.sh"
(crontab -l | grep -v -F "/opt/jpsms/scripts/backup.sh" ; echo "$CRON_JOB") | crontab -

# Step 9: Update Script
echo "Creating automated update script..."
cat << 'EOF' > /opt/jpsms/scripts/update.sh
#!/bin/bash
cd /opt/jpsms/app
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
EOF
chmod +x /opt/jpsms/scripts/update.sh

# Display Final Output
echo "=========================================="
echo "    FINAL DEPLOYMENT OUTPUT               "
echo "=========================================="
echo "* Running containers:"
docker ps
echo "------------------------------------------"
echo "* Open ports:"
ss -tuln | grep -E ":80|:443|:22"
echo "------------------------------------------"
echo "* Nginx status:"
systemctl status nginx --no-pager | grep Active
echo "------------------------------------------"
echo "* Docker version:"
docker --version
echo "------------------------------------------"
echo "* Backup path:"
echo "  /opt/jpsms/backups/"
echo "------------------------------------------"
echo "* Update command:"
echo "  /opt/jpsms/scripts/update.sh"
echo "=========================================="
echo "CONFIRMATION: CENTRAL SERVER READY AND SECURED."
echo "=========================================="
