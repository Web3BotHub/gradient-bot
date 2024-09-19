const { Builder, By, until, Capabilities } = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")
const url = require("url")
const fs = require("fs")
const crypto = require("crypto")
const request = require("request")
const path = require("path")
const FormData = require("form-data")
const proxy = require("selenium-webdriver/proxy")
require("dotenv").config()
const proxyChain = require('proxy-chain')

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"

const USER = process.env.APP_USER || ""
const PASSWORD = process.env.APP_PASS || ""
const PROXY_HTTP_PORT = process.env.PROXY_HTTP_PORT || 2000
const PROXY_SOCKS_PORT = process.env.PROXY_SOCKS_PORT || 2000
const ALLOW_DEBUG = process.env.ALLOW_DEBUG === "True"
const EXTENSION_FILENAME = "app.crx"
const PROXY = process.env.PROXY || undefined

console.log("-> Starting...")
console.log("-> User:", USER)
console.log("-> Pass:", PASSWORD)
console.log("-> Proxy:", PROXY)
console.log("-> Proxy HTTP Port:", PROXY_HTTP_PORT)
console.log("-> Proxy SOCKS Port:", PROXY_SOCKS_PORT)
console.log("-> Debug:", ALLOW_DEBUG)

async function takeScreenshot(driver, filename) {
  const data = await driver.takeScreenshot()
  fs.writeFileSync(filename, Buffer.from(data, "base64"))
}

// proxyUrl: http://username:password@host:port
// proxyUrl: socks5://username:password@host:port
function parseProxyUrl(proxyUrl) {
  try {
    // if without scheme, add http://
    if (!/^https?:\/\//.test(proxyUrl)) {
      proxyUrl = `http://${proxyUrl}`
    }

    const parsedUrl = url.parse(proxyUrl)

    return {
      server: {
        http: `http://${parsedUrl.hostname}:${PROXY_HTTP_PORT}`,
        https: `http://${parsedUrl.hostname}:${PROXY_HTTP_PORT}`,
        socks: `socks5://${parsedUrl.hostname}:${PROXY_SOCKS_PORT}`,
      },
      host: parsedUrl.hostname,
      port: parsedUrl.port,
      auth: parsedUrl.auth,
    }
  } catch (error) {
    console.error(`-> Error proxy URL (${proxyUrl}):`, error)
    return proxyUrl
  }
}

async function getProxyIpInfo(proxyUrl) {
  const url = "https://httpbin.org/ip"

  console.log("-> Getting proxy IP info:", proxyUrl)

  const options = new chrome.Options()

  const newProxyUrl = await proxyChain.anonymizeProxy('http://storm-overtrue2_ip-217.180.20.38:1234578@eu.stormip.cn:2000')

  options.addArguments(`user-agent=${USER_AGENT}`)
  options.addArguments("--headless")
  options.addArguments("--disable-dev-shm-usage")
  options.addArguments("--disable-gpu")
  options.addArguments("--no-sandbox")
  // options.addArguments(`--proxy-server=${newProxyUrl}`)
  // options.addArguments('--proxy-auth=storm-overtrue2_ip-217.180.20.38:123457')

  options.setProxy(
    proxy.manual({
      http: newProxyUrl,
      https: newProxyUrl,
    })
  )

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build()

  try {
    console.log("-> Proxy IP info started!")

    await driver.get(url)
    await driver.wait(until.elementLocated(By.css("body")), 10000)
    const pageText = await driver.findElement(By.css("body")).getText()
    console.log("-> Proxy IP info:", pageText)
  } catch (error) {
    console.error("-> Error getting proxy IP info:", error)
  } finally {
    await driver.quit()
    console.log("-> Proxy IP info done!")
  }
}

const parsed = parseProxyUrl('http://storm-overtrue2_ip-217.180.20.38:1234578@eu.stormip.cn:2000')
getProxyIpInfo(parsed.server.http)
