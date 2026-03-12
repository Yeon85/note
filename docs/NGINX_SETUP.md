# Nginx로 13090 포트에서 서비스하기

서버에서 Node(백엔드 4090) + 빌드된 프론트(정적 파일)를 Nginx로 한 포트(13090)에 묶는 방법입니다.

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

- **http://115.68.229.141:13090**
- 방화벽에서 **13090** 허용: `sudo ufw allow 13090 && sudo ufw reload`

---

## 7. 프론트만 수정 후 반영

코드 수정 후 다시 빌드해서 덮어쓰면 됩니다.

```bash
cd /opt/note/app
npm run build
# Nginx는 정적 파일만 서빙하므로 재시작 불필요
```

---

## 8. HTTPS 적용 (Let's Encrypt)

**필수:** 공인 **도메인**이 있어야 합니다. IP(115.68.229.141)만으로는 Let's Encrypt 인증서를 받을 수 없습니다.

### 8-1. 도메인 DNS 설정

도메인(예: `note.example.com`)의 **A 레코드**를 서버 IP `115.68.229.141` 로 연결해 두세요.

### 8-2. Nginx에 도메인·80 포트 추가

인증서 발급 시 Let's Encrypt가 **80 포트**로 접속해 검증합니다. 먼저 HTTP(80) 사이트를 열어 둡니다.

`deploy/nginx-note.conf` 에서 `server_name` 주석 해제하고 도메인 넣은 뒤, **80 포트용** 블록을 하나 추가하거나, 기존 서버 블록을 잠시 80으로 바꿉니다.

```bash
sudo nano /etc/nginx/sites-available/note
```

예시 (80으로 잠시 listen):

```nginx
server {
    listen 80;
    server_name note.example.com;   # 본인 도메인

    root /opt/note/app/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location /api/ {
        proxy_pass http://127.0.0.1:4090/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
    location /uploads/ { proxy_pass http://127.0.0.1:4090/uploads/; proxy_set_header Host $host; }
}
```

저장 후:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo ufw allow 80
sudo ufw reload
```

### 8-3. Certbot 설치 및 인증서 발급

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d note.example.com
```

이메일 입력, 약관 동의 후 인증서가 발급되고, certbot이 Nginx 설정에 **443(HTTPS)** 블록을 자동으로 추가합니다.

### 8-4. 13090에서 HTTPS 쓰려면

certbot은 기본적으로 **443** 포트에 SSL을 붙입니다. **13090**에서 HTTPS를 쓰려면:

1. certbot으로 인증서만 발급 (`--nginx` 대신 `certonly`):

   ```bash
   sudo certbot certonly --webroot -w /opt/note/app/dist -d note.example.com
   ```

2. `deploy/nginx-note-https.conf` 를 참고해 **13090 ssl** 서버 블록을 추가하고,  
   `ssl_certificate` / `ssl_certificate_key` 를 `/etc/letsencrypt/live/도메인/` 경로로 맞춘 뒤  
   `sites-available/note` 에 넣거나 include 하세요.

3. 설정 검사 후 재시작:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

접속: **https://note.example.com:13090**

### 8-5. 인증서 자동 갱신

Let's Encrypt 인증서는 90일마다 갱신합니다. 자동 갱신은 기본 설정돼 있습니다.

```bash
sudo certbot renew --dry-run
```

문제 없으면 실제 갱신도 같은 방식으로 됩니다.
