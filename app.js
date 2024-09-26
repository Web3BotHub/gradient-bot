const { Builder, By, until } = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")
const fs = require("fs")
const crypto = require("crypto")
const request = require("request")
const path = require("path")
const proxy = require("selenium-webdriver/proxy")
const proxyChain = require("proxy-chain")
require("dotenv").config()

const extensionId = "caacbgbklghmpodbdafajbgdnegacfmo"
const CRX_URL = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=98.0.4758.102&acceptformat=crx2,crx3&x=id%3D${extensionId}%26uc&nacl_arch=x86-64`
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36"

const USER = process.env.APP_USER || ""
const PASSWORD = process.env.APP_PASS || ""
const EXTENSION_FILENAME = "app.crx"
const PROXY = process.env.PROXY || undefined

console.log("-> Starting...")
console.log("-> User:", USER)
console.log("-> Pass:", PASSWORD)
console.log("-> Proxy:", PROXY)

if (!USER || !PASSWORD) {
  console.error("Please set APP_USER and APP_PASS env variables")
  process.exit()
}

async function downloadExtension(extensionId) {
  const url = CRX_URL.replace(extensionId, extensionId)
  const headers = { "User-Agent": USER_AGENT }

  console.log("-> Downloading extension from:", url)

  // if file exists, return
  // if (fs.existsSync(EXTENSION_FILENAME)) {
  //   console.log("-> Extension already downloaded! skip download...")
  //   return
  // }

  return new Promise((resolve, reject) => {
    request({ url, headers, encoding: null }, (error, response, body) => {
      if (error) {
        console.error("Error downloading extension:", error)
        return reject(error)
      }
      fs.writeFileSync(EXTENSION_FILENAME, body)
      const md5 = crypto.createHash("md5").update(body).digest("hex")
      console.log("-> Extension MD5: " + md5)
      resolve()
    })
  })
}

async function takeScreenshot(driver, filename) {
  const data = await driver.takeScreenshot()
  fs.writeFileSync(filename, Buffer.from(data, "base64"))
}

async function generateErrorReport(driver) {
  await takeScreenshot(driver, "error.png")

  const logs = await driver.manage().logs().get("browser")
  fs.writeFileSync(
    "error.log",
    logs.map((log) => `${log.level.name}: ${log.message}`).join("\n")
  )
}

async function getDriverOptions() {
  const options = new chrome.Options()
  const userId = USER.replace("@", "_").replace(".", "_").replace("+", "_")

  console.log(`-> Setting up driver options with userId: ${userId}...`)

  options.addArguments("--no-sandbox")
  options.addArguments("--headless=new")
  options.addArguments("--disable-dev-shm-usage")
  // options.addArguments("--incognito")
  options.addArguments("--start-maximized")
  options.addArguments("--remote-allow-origins=*")
  options.addArguments("--no-first-run")
  options.addArguments(`user-agent=${USER_AGENT}`)
  options.addArguments(`--enable-automation`)
  options.addArguments(`--safebrowsing-disable-download-protection`)

  if (PROXY) {
    console.log("-> Setting up proxy...", PROXY)

    let proxyUrl = PROXY

    // if no scheme, add http://
    if (!proxyUrl.includes("://")) {
      proxyUrl = `http://${proxyUrl}`
    }

    const newProxyUrl = await proxyChain.anonymizeProxy(proxyUrl)

    console.log("-> New proxy URL:", newProxyUrl)

    options.setProxy(
      proxy.manual({
        http: newProxyUrl,
        https: newProxyUrl,
        bypass: ["localhost", "127.0.0.1"],
      })
    )
    const url = new URL(newProxyUrl)
    console.log("-> Proxy host:", url.hostname)
    console.log("-> Proxy port:", url.port)
    options.addArguments(`--proxy-server=socks5://${url.hostname}:${url.port}`)
    console.log("-> Setting up proxy done!")
  } else {
    console.log("-> No proxy set!")
  }

  return options
}

async function getProxyIpInfo(driver, proxyUrl) {
  const url = "https://httpbin.org/ip"
  // const url = "https://myip.ipip.net"

  console.log("-> Getting proxy IP info:", proxyUrl)

  try {
    await driver.get(url)
    await driver.wait(until.elementLocated(By.css("body")), 30000)
    const pageText = await driver.findElement(By.css("body")).getText()
    console.log("-> Proxy IP info:", pageText)
  } catch (error) {
    console.error("-> Failed to get proxy IP info:", error)
  }
}

(async () => {
  await downloadExtension(extensionId)

  const options = await getDriverOptions()

  options.addExtensions(path.resolve(__dirname, EXTENSION_FILENAME))

  console.log(`-> Extension added! ${EXTENSION_FILENAME}`)

  let driver
  try {
    console.log("-> Starting browser...")

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build()

    console.log("-> Browser started!")

    if (PROXY) {
      await getProxyIpInfo(driver, PROXY)
    }

    console.log("-> Started! Logging in https://app.gradient.network/...")
    await driver.get("https://app.gradient.network/")

    const emailInput = By.css('[placeholder="Enter Email"]')
    const passwordInput = By.css('[type="password"]')
    const loginButton = By.css("button")

    await takeScreenshot(driver, "login-page.png")

    await driver.wait(until.elementLocated(emailInput), 30000)
    await driver.wait(until.elementLocated(passwordInput), 30000)
    await driver.wait(until.elementLocated(loginButton), 30000)

    await driver.findElement(emailInput).sendKeys(USER)
    await driver.findElement(passwordInput).sendKeys(PASSWORD)
    await driver.findElement(loginButton).click()

    await driver.wait(
      until.elementLocated(
        By.xpath('//*[contains(text(), "Copy Referral Link")]')
      ),
      30000
    )

    console.log("-> Logged in! Waiting for open extension...")

    // 截图登录状态
    takeScreenshot(driver, "login.png")

    await driver.get(`chrome-extension://${extensionId}/popup.html`)

    // 直到找到 "Status" 文本的 div 元素
    await driver.wait(
      until.elementLocated(By.xpath('//div[contains(text(), "Status")]')),
      30000
    )

    console.log("-> Extension loaded!")

    // if there is a page with a button "I got it", click it
    try {
      const gotItButton = await driver.findElement(
        By.xpath('//button[contains(text(), "I got it")]')
      )
      await gotItButton.click()
      console.log('-> "I got it" button clicked!')
    } catch (error) {
      // save rendered dom to file
      const dom = await driver
        .findElement(By.css("html"))
        .getAttribute("outerHTML")
      fs.writeFileSync("dom.html", dom)
      console.error('-> No "I got it" button found!')
    }

    // if found a div include text "Sorry, Gradient is not yet available in your region. ", then exit
    try {
      const notAvailable = await driver.findElement(
        By.xpath(
          '//*[contains(text(), "Sorry, Gradient is not yet available in your region.")]'
        )
      )
      console.log("-> Sorry, Gradient is not yet available in your region. ")
      await driver.quit()
      process.exit(1)
    } catch (error) {
      console.log("-> Gradient is available in your region. ")
    }

    // <div class="absolute mt-3 right-0 z-10">
    const supportStatus = await driver
      .findElement(By.css(".absolute.mt-3.right-0.z-10"))
      .getText()

    const dom = await driver
      .findElement(By.css("html"))
      .getAttribute("outerHTML")
    fs.writeFileSync("dom.html", dom)

    await takeScreenshot(driver, "status.png")

    console.log("-> Status:", supportStatus)

    if (supportStatus.includes("Disconnected")) {
      console.log(
        "-> Failed to connect! may be the proxy has been banned \nGenerating error report..."
      )
      await generateErrorReport(driver)
      await driver.quit()
      process.exit(1)
    }

    console.log("-> Connected! Starting rolling...")

    // 截图链接状态
    takeScreenshot(driver, "connected.png")

    console.log({
      support_status: supportStatus,
    })

    console.log("-> Lunched!")

    // keep the process running
    setInterval(() => {
      driver.getTitle().then((title) => {
        console.log(`-> [${USER}] Running...`, title)
      })

      if (PROXY) {
        console.log(`-> [${USER}] Running with proxy ${PROXY}...`)
      } else {
        console.log(`-> [${USER}] Running without proxy...`)
      }
    }, 10000)
  } catch (error) {
    console.error("Error occurred:", error)
    // show error line
    console.error(error.stack)

    if (driver) {
      await generateErrorReport(driver)
      driver.quit()
      process.exit(1)
    }
  }
})()
