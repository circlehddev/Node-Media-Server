FROM node:alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i

COPY . .

EXPOSE 1935 8000

CMD ["npm","start"]
