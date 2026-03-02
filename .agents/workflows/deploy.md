---
description: Deploy JPSMS Backend using PM2 Cluster Mode
---

This workflow automates the zero-downtime deployment of the JPSMS backend using PM2 cluster mode. It will pull the latest changes, install dependencies, and reload the PM2 processes.

// turbo-all
1. Install PM2 globally if it is not already installed:
```powershell
npm install -g pm2
```

2. Install any new dependencies:
```powershell
npm ci --only=production
```

3. Start or reload the application using the ecosystem config file. This ensures zero-downtime reloads:
```powershell
pm2 startOrReload ecosystem.config.js
```

4. Save the PM2 process list so it automatically restarts on system boot:
```powershell
pm2 save
```

5. (Optional) Set PM2 to start on boot:
```powershell
pm2 startup
```
