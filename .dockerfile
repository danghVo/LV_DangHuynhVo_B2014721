FROM node:latest

ARG SERVICE_NAME

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . ./$SERVICE_NAME
COPY ../utils ./utils
COPY ../prisma ./prisma

RUN npm run build

CMD ["node", "dist/main.js"]