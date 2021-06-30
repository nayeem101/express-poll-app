FROM node:14.15.3-alpine3.12

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm","start"]


