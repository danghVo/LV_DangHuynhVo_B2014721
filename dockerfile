FROM node:latest

ARG SERVICE_NAME

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

CMD ["node", "dist/main.js"]