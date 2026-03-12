# 1단계: Vite 빌드 (같은 호스트에서 /api 쓰므로 API 주소 비움)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# 같은 도메인에서 nginx가 /api 프록시하므로 빌드 시 API 주소 불필요
ENV VITE_API_BASE_URL=
RUN npm run build

# 2단계: nginx로 정적 파일 서빙
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
