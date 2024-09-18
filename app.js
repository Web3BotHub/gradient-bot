const { Builder, By, until, Capabilities } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const express = require('express')
const fs = require('fs')
const crypto = require('crypto')
const request = require('request')
const path = require('path')
const FormData = require('form-data')
const proxyChain = require('proxy-chain')
const proxy = require('selenium-webdriver/proxy')
require('dotenv').config()

const extensionId = 'caacbgbklghmpodbdafajbgdnegacfmo'
const CRX_URL = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=98.0.4758.102&acceptformat=crx2,crx3&x=id%3D${extensionId}%26uc&nacl_arch=x86-64`
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36'

const USER = process.env.APP_USER || ''
const PASSWORD = process.env.APP_PASS || ''
const ALLOW_DEBUG = process.env.ALLOW_DEBUG === 'True'
const EXTENSION_FILENAME = 'app.crx'
const PROXY = process.env.PROXY || undefined

console.log('-> Starting...')
console.log('-> User:', USER)
console.log('-> Pass:', PASSWORD)
console.log('-> Proxy:', PROXY)
console.log('-> Debug:', ALLOW_DEBUG)

if (!USER || !PASSWORD) {
  console.error('Please set APP_USER and APP_PASS env variables')
  process.exit()
}

if (ALLOW_DEBUG) {
  console.log('-> Debugging is enabled! This will generate a screenshot and console logs on error!')
}

async function downloadExtension(extensionId) {
  const url = CRX_URL.replace(extensionId, extensionId)
  const headers = { 'User-Agent': USER_AGENT }

  console.log('-> Downloading extension from:', url)

  // if file exists, return
  if (fs.existsSync(EXTENSION_FILENAME)) {
    console.log('-> Extension already downloaded!')
    return
  }

  return new Promise((resolve, reject) => {
    request({ url, headers, encoding: null }, (error, response, body) => {
      if (error) {
        console.error('Error downloading extension:', error)
        return reject(error)
      }
      fs.writeFileSync(EXTENSION_FILENAME, body)
      if (ALLOW_DEBUG) {
        const md5 = crypto.createHash('md5').update(body).digest('hex')
        console.log('-> Extension MD5: ' + md5)
      }
      resolve()
    })
  })
}

async function takeScreenshot(driver, filename) {
  const data = await driver.takeScreenshot()
  fs.writeFileSync(filename, Buffer.from(data, 'base64'))
}

async function generateErrorReport(driver) {
  await takeScreenshot(driver, 'error.png')

  const logs = await driver.manage().logs().get('browser')
  fs.writeFileSync('error.log', logs.map(log => `${log.level.name}: ${log.message}`).join('\n'))

  const form = new FormData()
  form.append('file', fs.createReadStream('error.png'))

  const response = await new Promise((resolve, reject) => {
    form.submit('https://imagebin.ca/upload.php', (err, res) => {
      if (err) return reject(err)
      res.resume()
      res.on('data', (chunk) => process.stdout.write(chunk))
      res.on('end', () => resolve())
    })
  })

  console.log('-> Error report uploaded:', response)
}

// proxyUrl: http://username:password@host:port
// proxyUrl: socks://username:password@host:port
async function getProxyUrl(proxyUrl, schema) {
  // ensure starts with http:// or socks://
  if (!proxyUrl.startsWith(`${schema}://`)) {
    proxyUrl = `${schema}://${proxyUrl}`
  }

  try {
    console.log('-> Anonymizing proxy URL:', proxyUrl)

    const anonymizedProxy = await proxyChain.anonymizeProxy(proxyUrl)
    // parse the anonymized proxy URL
    const parsedUrl = new URL(anonymizedProxy)

    // extract the host and port
    const proxyHost = parsedUrl.hostname
    const proxyPort = parsedUrl.port
    const newProxyUrl = `${proxyHost}:${proxyPort}`

    // construct the new proxy string
    console.log('-> Anonymized proxy:', `${newProxyUrl}`)

    return newProxyUrl
  } catch (error) {
    console.error(`-> Error anonymizing proxy URL (${proxyUrl}):`, error)
    return proxyUrl
  }
}

async function getProxyIpInfo(proxyUrl) {
  // const url = `https://httpbin.org/ip`
  const url = 'http://myip.ipip.net'

  console.log('-> Getting proxy IP info:', proxyUrl)

  const options = new chrome.Options()

  options.addArguments(`user-agent=${USER_AGENT}`)
  options.addArguments('--headless')
  options.addArguments('--disable-dev-shm-usage')
  options.addArguments('--disable-gpu')
  options.addArguments('--no-sandbox')

  options.setProxy(proxy.manual({
    http: proxyUrl,
    https: proxyUrl,
  }))

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build()

  try {
    console.log('-> Proxy IP info started!')

    await driver.get(url)
    await driver.sleep(5000)

    const pageText = await driver.findElement(By.css('body')).getText()
    console.log('-> Proxy IP info:', pageText)
  } catch (error) {
    console.error('-> Error getting proxy IP info:', error)
  } finally {
    await driver.quit()
    console.log('-> Proxy IP info done!')
  }
}

(async () => {
  console.log('-> Downloading extension...')
  await downloadExtension(extensionId)
  console.log('-> Downloaded! Installing extension and driver manager...')

  const options = new chrome.Options()

  if (PROXY) {
    const httpProxyUrl = await getProxyUrl(PROXY, 'http')
    // const wssProxyUrl = await getProxyUrl(PROXY.replace('http://', 'ws://').replace(1337, 1338), 'socks')
    const wssProxyUrl = await getProxyUrl(PROXY.replace('http://', 'ws://'), 'socks5')

    options.setProxy(proxy.manual({
      http: httpProxyUrl,
      https: httpProxyUrl,
    }))

    // options.setProxy(proxy.socks(wssProxyUrl, 5))
    options.addArguments(`--proxy-server=socks5://${wssProxyUrl}`)

    console.log('-> Using proxy http:', httpProxyUrl)
    console.log('-> Using proxy ws:', wssProxyUrl)

    // await getProxyIpInfo(httpProxyUrl)
  } else {
    console.log('-> No proxy set!')
  }

  options.addArguments(`user-agent=${USER_AGENT}`)
  options.addArguments('--headless')
  options.addArguments('--disable-dev-shm-usage')
  options.addArguments('--no-sandbox')
  options.addArguments('--disable-gpu')
  options.addArguments('--disable-ipv6')
  options.addArguments('--remote-allow-origins=*')
  options.addArguments('--disable-features=InsecureDoNotUseIpv6')
  options.addExtensions(path.resolve(__dirname, EXTENSION_FILENAME))

  let driver
  try {
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build()

    console.log('-> Started! Logging in...')
    await driver.get('https://app.gradient.network/')

    const emailInput = By.css('[placeholder="Enter Email"]')
    const passwordInput = By.css('[type="password"]')
    const loginButton = By.css('button')

    await driver.wait(until.elementLocated(emailInput), 15000)
    await driver.wait(until.elementLocated(passwordInput), 15000)
    await driver.wait(until.elementLocated(loginButton), 15000)

    await driver.findElement(emailInput).sendKeys(USER)
    await driver.findElement(passwordInput).sendKeys(PASSWORD)
    await driver.findElement(loginButton).click()

    await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Copy Referral Link")]')), 30000)

    console.log('-> Logged in! Waiting for open extension...')

    // 截图登录状态
    takeScreenshot(driver, 'login.png')

    await driver.get(`chrome-extension://${extensionId}/popup.html`)

    // 直到找到 "Status" 文本的 div 元素
    await driver.wait(until.elementLocated(By.xpath('//div[contains(text(), "Status")]')), 30000)

    await driver.sleep(5000)

    console.log('-> Extension loaded!')

    // if there is a page with a button "I got it", click it
    try {
      const gotItButton = await driver.findElement(By.xpath('//button[contains(text(), "I got it")]'))
      await gotItButton.click()
      console.log('-> "I got it" button clicked!')
    } catch (error) {
      // save rendered dom to file
      const dom = await driver.findElement(By.css('html')).getAttribute('outerHTML')
      fs.writeFileSync('dom.html', dom)
      console.error('-> No "I got it" button found!')
    }

    // if found a div include text "Sorry, Gradient is not yet available in your region. ", then exit
    try {
      const notAvailable = await driver.findElement(By.xpath('//*[contains(text(), "Sorry, Gradient is not yet available in your region.")]'))
      console.log('-> Sorry, Gradient is not yet available in your region. ')
      await driver.quit()
      process.exit(1)
    } catch (error) {
      console.log('-> Gradient is available in your region. ')
    }

    await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Today\'s Taps")]')), 30000)

    const statusBadge = await driver.findElement(By.css('.absolute.mt-3.right-0.z-10')).getText()

    const dom = await driver.findElement(By.css('html')).getAttribute('outerHTML')
    fs.writeFileSync('dom.html', dom)

    await takeScreenshot(driver, 'status.png')

    console.log('-> Status:', statusBadge)

    if (statusBadge.includes('Disconnected')) {
      console.log('-> Failed to connect! may be the proxy has been banned \nGenerating error report...')
      await generateErrorReport(driver)
      await driver.quit()
      process.exit(1)
    }

    console.log('-> Connected! Starting API...')

    // 截图链接状态
    takeScreenshot(driver, 'connected.png')

    // <div class="absolute mt-3 right-0 z-10">
    const supportStatus = await driver.findElement(By.css('.absolute.mt-3.right-0.z-10')).getText()

    // <div class="Helveticae w-1/2 flex justify-center items-center text-[14px] select-none cursor-pointer z-20 text-white">Reward</div>
    const statusTab = await driver.findElement(By.xpath('//div[contains(text(), "Status")]'))
    const rewardTab = await driver.findElement(By.xpath('//div[contains(text(), "Reward")]'))

    // todaysTaps:
    // <div class="Helveticae font-bold flex justify-center items-center select-none mt-[2px]" style="font-size: 24px;">0</div>
    const todaysTaps = await driver.findElement(By.css('.border-theme-gray-border-2 > .font-bold.items-center')).getText()
    const tadaysUptime = await driver.findElement(By.css('.border-theme-gray-border-2 > .font-bold.items-center')).getText()

    // // click on rewardTab tab
    await rewardTab.click()

    // todayReward:
    // <div class="Helveticae font-bold flex justify-center items-center select-none mt-[2px]" style="font-size: 24px;">0</div>
    const todayReward = await driver.findElement(By.css('.border-theme-gray-border-2 > .font-bold.items-center')).getText()
    const seasonReward = await driver.findElement(By.css('.border-theme-gray-border-2 > .font-bold.items-center')).getText()

    console.log({
      support_status: supportStatus,
      today_taps: todaysTaps,
      today_uptime: tadaysUptime,
      today_reward: todayReward,
      season_reward: seasonReward,
    })
  } catch (error) {
    console.error('Error occurred:', error)
    // show error line
    console.error(error.stack)

    if (driver) {
      await generateErrorReport(driver)
      driver.quit()
    }
  }

  console.log('-> Done!')

  // keep the process running
  setInterval(() => {
    console.log('-> Running...')
  }, 1000)
})()
