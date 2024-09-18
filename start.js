// 1. read proxies from file
const fs = require('fs')
const path = require('path')
const proxies = fs.readFileSync(path.resolve(__dirname, 'proxies.txt'), 'utf-8').split('\n').filter(Boolean)

// 2. start pm2 with PROXY env
const { execSync } = require('child_process')

for (const proxy of proxies) {
  execSync(`PROXY=${proxy} pm2 start ecosystem.config.js --name=gradient-bot-${proxy}`)
}
