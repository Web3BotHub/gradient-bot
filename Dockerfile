FROM node:20

ENV NODE_ENV=production
ENV APP_USER=
ENV APP_PASS=

ARG JRE_VERSION=17
ARG TZ=Asia/Beijing

WORKDIR /app

RUN apt-get update -qq -y && \
    apt-get install -y vim acl bzip2 ca-certificates tzdata sudo unzip jq curl gnupg2 wget xvfb \
    # Install Google Chrome dependencies
    libxss1 libappindicator1 libgconf-2-4 \
    fonts-liberation libasound2 libnspr4 libnss3 libx11-xcb1 libxtst6 lsb-release xdg-utils \
    libgbm1 libnss3-tools libatk-bridge2.0-0 libgtk-4-1 libx11-xcb1 libxcb-dri3-0

#===================
# Timezone settings
# Possible alternative: https://github.com/docker/docker/issues/3359#issuecomment-32150214
#===================
RUN ln -fs /usr/share/zoneinfo/${TZ} /etc/localtime && \
    dpkg-reconfigure -f noninteractive tzdata && \
    cat /etc/timezone

#===================
# Google Chrome
#===================
ARG CHROME_VERSION="google-chrome-stable"
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor | tee /etc/apt/trusted.gpg.d/google.gpg >/dev/null \
  && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update -qqy \
  && if echo "${CHROME_VERSION}" | grep -qE "google-chrome-stable[_|=][0-9]*"; \
    then \
      CHROME_VERSION=$(echo "$CHROME_VERSION" | tr '=' '_') \
      && wget -qO google-chrome.deb "https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/${CHROME_VERSION}_$(dpkg --print-architecture).deb" \
      && apt-get -qqy --no-install-recommends install --allow-downgrades ./google-chrome.deb \
      && rm -rf google-chrome.deb ; \
    else \
      apt-get -qqy --no-install-recommends install ${CHROME_VERSION} ; \
    fi \
  && rm /etc/apt/sources.list.d/google-chrome.list \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

#============================================
# Chrome webdriver
#============================================
# can specify versions by CHROME_DRIVER_VERSION
# Latest released version will be used by default
#============================================
ARG CHROME_DRIVER_VERSION
RUN DRIVER_ARCH=$(if [ "$(dpkg --print-architecture)" = "amd64" ]; then echo "linux64"; else echo "linux-aarch64"; fi) \
  && if [ ! -z "$CHROME_DRIVER_VERSION" ]; \
  then CHROME_DRIVER_URL=https://storage.googleapis.com/chrome-for-testing-public/$CHROME_DRIVER_VERSION/${DRIVER_ARCH}/chromedriver-${DRIVER_ARCH}.zip ; \
  else CHROME_MAJOR_VERSION=$(google-chrome --version | sed -E "s/.* ([0-9]+)(\.[0-9]+){3}.*/\1/") \
    && echo "Geting ChromeDriver latest version from https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_${CHROME_MAJOR_VERSION}" \
    && CHROME_DRIVER_VERSION=$(wget -qO- https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_${CHROME_MAJOR_VERSION} | sed 's/\r$//') \
    && CHROME_DRIVER_URL=https://storage.googleapis.com/chrome-for-testing-public/$CHROME_DRIVER_VERSION/${DRIVER_ARCH}/chromedriver-${DRIVER_ARCH}.zip ; \
  fi \
  && echo "Using ChromeDriver from: "$CHROME_DRIVER_URL \
  && echo "Using ChromeDriver version: "$CHROME_DRIVER_VERSION \
  && wget --no-verbose -O /tmp/chromedriver_${DRIVER_ARCH}.zip $CHROME_DRIVER_URL \
  && rm -rf /opt/selenium/chromedriver \
  && unzip /tmp/chromedriver_${DRIVER_ARCH}.zip -d /opt/selenium \
  && rm /tmp/chromedriver_${DRIVER_ARCH}.zip \
  && mv /opt/selenium/chromedriver-${DRIVER_ARCH}/chromedriver /opt/selenium/chromedriver-$CHROME_DRIVER_VERSION \
  && chmod 755 /opt/selenium/chromedriver-$CHROME_DRIVER_VERSION \
  && ln -fs /opt/selenium/chromedriver-$CHROME_DRIVER_VERSION /usr/bin/chromedriver

ADD . /app/

ENV CHROMEDRIVER_SKIP_DOWNLOAD=true
ENV SE_CHROMEDRIVER=/usr/bin/chromedriver
ENV SE_CHROME=/usr/bin/google-chrome

# install dependencies
RUN npm install --omit=dev
RUN npm install pm2 -g
RUN npm install chromedriver
RUN chmod +x /app/entrypoint.sh

CMD ["/bin/bash", "/app/entrypoint.sh"]
