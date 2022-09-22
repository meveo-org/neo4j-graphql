FROM node:16.17

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY src .

EXPOSE 7000

EXPOSE 4000

VOLUME /data

CMD [ "node", "index.js"]