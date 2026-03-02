module.exports = {
    apps: [{
        name: "jpsms-backend",
        script: "./server.js",
        instances: "max", // Utilize all available CPU cores
        exec_mode: "cluster", // Enables Zero-Downtime Reloads
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
}
