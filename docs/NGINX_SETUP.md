# Nginx로 80 포트에서 서비스하기

서버에서 Node(백엔드 4090) + 빌드된 프론트(정적 파일)를 Nginx로 한 포트(80)에 묶는 방법입니다.

---

## 1. 전제

- Node·npm 설치됨 (`node -v`, `npm -v` 확인)
- 백엔드는 **4090**에서 실행 (`npm run dev:notes:server` 또는 PM2 등)
- 프론트는 **빌드**해서 사용 (Vite dev 서버 대신)

---

## 2. Nginx 설치 (Ubuntu)

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 3. 프론트 빌드

```bash
cd /opt/note/app
npm install
npm run build
```

빌드 결과는 `/opt/note/app/dist` 에 들어갑니다.

---

## 4. Nginx 설정 복사 및 활성화

```bash
cd /opt/note
sudo cp deploy/nginx-note.conf /etc/nginx/sites-available/note
sudo ln -sf /etc/nginx/sites-available/note /etc/nginx/sites-enabled/
```

기본 사이트를 끄고 이 사이트만 쓰려면:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

설정 검사 후 재시작:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. 백엔드 실행

Nginx가 `/api` 를 4090으로 넘기므로, 백엔드만 떠 있으면 됩니다.

```bash
cd /opt/note
npm run dev:notes:server
```

또는 PM2로 상시 실행:

```bash
npm install -g pm2
cd /opt/note/server
pm2 start src/index.js --name note-server
pm2 save
pm2 startup
```

---

## 6. 접속

- **http://115.68.229.141** (80 포트)
- 방화벽에서 **80** 허용: `sudo ufw allow 80 && sudo ufw reload`

---

## 7. 프론트만 수정 후 반영

코드 수정 후 다시 빌드해서 덮어쓰면 됩니다.

```bash
cd /opt/note/app
npm run build
# Nginx는 정적 파일만 서빙하므로 재시작 불필요
```

---

## 8. (선택) 도메인·SSL

도메인을 쓰면 `deploy/nginx-note.conf` 에서 `server_name` 을 도메인으로 바꾸고, SSL은 Let's Encrypt로:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

이후 Nginx 설정은 certbot이 자동으로 수정합니다.
