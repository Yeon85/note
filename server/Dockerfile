# SHELL-NOTE API 서버
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN mkdir -p uploads

EXPOSE 4000

ENV NODE_ENV=production
CMD ["node", "src/index.js"]
