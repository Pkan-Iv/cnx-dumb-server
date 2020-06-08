module.exports = {
  apps : [{
    exec_mode: 'fork',
    name: 'cnx-dumb-server',
    script: 'index.js',
    interpreter: './node_modules/.bin/babel-node',
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    ignore_watch: [
      '.git',
      'node_modules'
    ],
    env: {
      NODE_ENV: 'development',
      watch: true
    },
    env_production: {
      NODE_ENV: 'production',
      watch: false
    }
  }]
};
