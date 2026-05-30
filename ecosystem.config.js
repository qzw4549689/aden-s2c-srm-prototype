module.exports = {
  apps: [{
    name: 'srm',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_PATH: process.env.HOME + '/srm-data/srm.db'
    },
    // Auto-restart on crash
    autorestart: true,
    // Max memory before restart
    max_memory_restart: '512M',
    // Log files
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Don't restart if crashing too fast
    min_uptime: '10s',
    max_restarts: 5,
    // Graceful shutdown
    kill_timeout: 5000,
    // Wait between restarts
    restart_delay: 3000
  }]
};
