FROM node:20-alpine

ENV NODE_ENV=production
ENV APP_USER=
ENV APP_PASS=

ADD . /app

WORKDIR /app

RUN npm install
RUN npm install pm2 -g

CMD ["node", "start.js"]
