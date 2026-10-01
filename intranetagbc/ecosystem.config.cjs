module.exports = {
  apps: [
    {
      name: "intranetagbc",
      script: "server.js",
      args: "--prod",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
