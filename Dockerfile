# Start from the official Node.js LTS (Long Term Support) image based on Alpine Linux for a smaller footprint
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Set Node environment to production
ENV NODE_ENV=production

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install exact production dependencies securely without creating a heavy node_modules payload
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Run the application securely bypassing npm start script overhead
CMD ["node", "server.js"]
