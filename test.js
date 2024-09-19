let url = require('url')

function parseProxyUrl(proxyUrl) {
  try {
    const parsedUrl = url.parse(proxyUrl)

    return {
      server: {
        http: `${parsedUrl.hostname}:${PROXY_HTTP_PORT}`,
        https: `${parsedUrl.hostname}:${PROXY_HTTP_PORT}`,
        socks: `${parsedUrl.hostname}:${PROXY_SOCKS_PORT}`,
      },
      parsedUrl,
      host: parsedUrl.hostname,
      port: parsedUrl.port,
      auth: parsedUrl.auth,
    }
  } catch (error) {
    console.error(`-> Error proxy URL (${proxyUrl}):`, error)
    return proxyUrl
  }
}

console.log(url.parse('http://tootudrdrpckkwovr-country-DE-state-Berlin-session-ljsqnv1b-package-residential:m8o30xm05vdl@resi.proxies.fo:1338'));

