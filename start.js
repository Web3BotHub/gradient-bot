// 1. read proxies from file
const fs = require('fs')
const path = require('path')
const proxies = fs.readFileSync(path.resolve(__dirname, 'proxies.txt'), 'utf-8').split('\n').filter(Boolean)

// 2. start pm2 with PROXY env
const { execSync } = require('child_process')
const USER = process.env.APP_USER || ''
const PASSWORD = process.env.APP_PASS || ''

if (!USER || !PASSWORD) {
  console.error("Please set APP_USER and APP_PASS env variables")
  process.exit()
}

let index = 0
for (const proxy of proxies) {
  const name = `gradient-${index++}`
  execSync(`PROXY=${proxy} APP_USER='${USER}' APP_PASS='${PASSWORD}' pm2 start app.js --name ${name}`)
  console.log(`-> Started ${name} with proxy ${proxy}`)
}

// 3. save proxies to file
console.log('-> √ All proxies started!')

// 4. pm2 status
execSync('pm2 status')
