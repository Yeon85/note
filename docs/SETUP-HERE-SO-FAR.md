# 서버 세팅 여기까지 정리 (115.68.229.141)

지금까지 한 작업을 순서대로 정리한 문서입니다.

---

## 1. 서버·Node 준비

- **서버**: 115.68.229.141 (iwinv), 프로젝트 `/opt/note` (git clone)
- **Node 20 설치** (npm 없었음):
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  ```
- 커널 업그레이드 창 뜨면 **Enter** 로 닫기 (Ctrl+C 금지)
- 확인: `node -v`, `npm -v`

---

## 2. 앱·의존성

```bash
cd /opt/note && npm install
cd /opt/note/app && npm install
cd /opt/note/server && npm install
```

- `server/.env` 는 `.env.md` 참고해서 별도 생성 (DB, JWT, SMTP 등)

---

## 3. Nginx 설치·13090 포트

- Nginx 설치: `sudo apt install -y nginx`
- 설정 복사: `sudo cp deploy/nginx-note.conf /etc/nginx/sites-available/note`
- 활성화: `sudo ln -sf /etc/nginx/sites-available/note /etc/nginx/sites-enabled/`
- 기본 사이트 제거: `sudo rm -f /etc/nginx/sites-enabled/default`
- 프론트 빌드: `cd /opt/note/app && npm run build`
- 검사·재시작: `sudo nginx -t && sudo systemctl reload nginx`
- 방화벽: `sudo ufw allow 13090 && sudo ufw reload`

접속: **http://115.68.229.141:13090**

---

## 4. DuckDNS 무료 도메인

- **https://www.duckdns.org** → Sign in (Google/GitHub)
- reCAPTCHA 완료 후 **Create Domain** 에서 이름 입력
- 사용 중인 도메인:
  - **auroraroa.duckdns.org**
  - **goldenroa.duckdns.org**
- **Current IP** 를 **115.68.229.141** 로 맞추고 **update ip** 클릭
- IPv6 에러는 무시 (사용 안 함)

---

## 5. HTTPS 인증서 받기 (80 잠깐 사용)

- certbot용 디렉터리:
  ```bash
  sudo mkdir -p /var/www/certbot
  ```
- Nginx에 **80 포트** 블록 추가: `/etc/nginx/sites-available/note`
  - `listen 80;`
  - `server_name auroraroa.duckdns.org goldenroa.duckdns.org;`
  - `root /var/www/certbot;`
  - `location /.well-known/acme-challenge/ { root /var/www/certbot; }`
- `sudo nginx -t && sudo systemctl reload nginx`
- `sudo ufw allow 80 && sudo ufw reload`
- **certbot 설치**:
  ```bash
  sudo apt update
  sudo apt install -y certbot python3-certbot-nginx
  ```
- **인증서 발급** (두 도메인 동시):
  ```bash
  sudo certbot certonly --webroot -w /var/www/certbot -d auroraroa.duckdns.org -d goldenroa.duckdns.org
  ```
- 프롬프트: 이메일 입력 → Terms 동의(Y) → 이메일 수신 Y/N

**여기까지** 진행한 상태. 인증서 발급 성공 시 `/etc/letsencrypt/live/auroraroa.duckdns.org/` 에 저장됨.

---

## 6. 그다음 할 일 (아직 안 한 것)

1. **80 블록 제거**  
   `/etc/nginx/sites-available/note` 에서 `listen 80` 서버 블록 삭제 또는 주석.

2. **13090에 SSL 붙이기**  
   기존 `listen 13090` 블록을 `listen 13090 ssl` 로 바꾸고 아래 추가:
   - `server_name auroraroa.duckdns.org goldenroa.duckdns.org;`
   - `ssl_certificate     /etc/letsencrypt/live/auroraroa.duckdns.org/fullchain.pem;`
   - `ssl_certificate_key /etc/letsencrypt/live/auroraroa.duckdns.org/privkey.pem;`
   - `include /etc/letsencrypt/options-ssl-nginx.conf;`
   - `ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;`  
   (없으면 certbot이 만들어 둠. 없을 때만 `sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048`)

3. **Nginx 재시작**  
   `sudo nginx -t && sudo systemctl reload nginx`

4. **(선택) 80 방화벽 다시 막기**  
   `sudo ufw delete allow 80 && sudo ufw reload`

5. **백엔드 실행**  
   `cd /opt/note && npm run dev:notes:server` (또는 PM2)

6. **접속 확인**  
   - https://auroraroa.duckdns.org:13090  
   - https://goldenroa.duckdns.org:13090  

---

## 참고 문서

- `docs/DUCKDNS_SETUP.md` — DuckDNS + 13090 HTTPS 상세
- `docs/NGINX_SETUP.md` — Nginx 전반
- `docs/SERVER_DEV.md` — 로컬/서버 개발 실행 요약
