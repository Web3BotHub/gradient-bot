FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=3000
ENV APP_USER=gradient-bot
ENV APP_PASS=gradient-bot

ADD . /app

WORKDIR /app

RUN npm install
RUN npm install pm2 -g

CMD ["pm2-runtime", "app.js"]
