module.exports = {
  apps: [
    {
      name: 'gradient-bot',
      exec_mode: 'cluster',
      instances: 2,
      cwd: '/app',
      script: 'app.js',
      args: ''
    }
  ]
}
