# 서버 세팅 여기까지 정리 (115.68.229.141)

시작부터 HTTPS 적용 완료까지 한 작업을 순서대로 정리한 문서입니다.

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
- **13090 포트로 서비스할 때** `server/.env` 에 아래 넣기 (비밀번호 재설정 링크 등에 사용):
  ```env
  APP_BASE_URL=https://auroraroa.duckdns.org:13090
  ```
  (본인 도메인으로 바꿔서 사용. 두 도메인 쓸 거면 하나만 넣어도 됨.)

---

## 3. Nginx 설치·13090

- Nginx 설치: `sudo apt install -y nginx`
- 설정 복사·활성화:
  ```bash
  sudo cp deploy/nginx-note.conf /etc/nginx/sites-available/note
  sudo ln -sf /etc/nginx/sites-available/note /etc/nginx/sites-enabled/
  sudo rm -f /etc/nginx/sites-enabled/default
  ```
- 프론트 빌드: `cd /opt/note/app && npm run build`
- 검사·재시작: `sudo nginx -t && sudo systemctl reload nginx`
- (방화벽 사용 시) `sudo ufw allow 13090 && sudo ufw reload`

접속: **http://115.68.229.141:13090**

---

## 4. DuckDNS 무료 도메인

- **https://www.duckdns.org** → Sign in (Google/GitHub) → reCAPTCHA 완료
- **Create Domain** 에서 이름 입력
- 사용 도메인: **auroraroa.duckdns.org**, **goldenroa.duckdns.org**
- **Current IP** 를 **115.68.229.141** 로 맞추고 **update ip** (두 도메인 모두)
- IPv6 에러는 무시

---

## 5. HTTPS 인증서 (Let's Encrypt)

### 5-1. certbot용 준비

```bash
sudo mkdir -p /var/www/certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 5-2. 80 포트 블록 추가 (인증용)

Nginx 설정에 **listen 80** 서버 블록 추가 (인증서 받을 때만 사용):

- `server_name auroraroa.duckdns.org goldenroa.duckdns.org;`
- `root /var/www/certbot;`
- `location /.well-known/acme-challenge/ { root /var/www/certbot; }`

`sudo nginx -t && sudo systemctl reload nginx`  
(필요 시 `sudo ufw allow 80`)

### 5-3. 인증서 발급

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d auroraroa.duckdns.org -d goldenroa.duckdns.org
```

- 처음에 **DNS SERVFAIL** 나올 수 있음 → 시간 두고 재시도
- **Rate limit** (5회 실패/1시간) 걸리면 안내된 시간 이후 재시도
- **goldenroa** IP가 211.x 로 되어 있으면 DuckDNS에서 **115.68.229.141** 로 수정 후 **update ip**
- 성공 시: `/etc/letsencrypt/live/auroraroa.duckdns.org/fullchain.pem`, `privkey.pem`

### 5-4. 13090 SSL 전용 설정으로 교체

- 80 블록 제거, 13090 SSL 블록만 사용:
  ```bash
  sudo cp /opt/note/deploy/nginx-note-13090-ssl.conf /etc/nginx/sites-available/note
  ```

### 5-5. 없으면 만드는 파일 두 개

**options-ssl-nginx.conf** (없을 때):

```bash
# 방법 1: 저장소에서 복사 (git pull 후)
sudo cp /opt/note/deploy/options-ssl-nginx.conf /etc/letsencrypt/options-ssl-nginx.conf

# 방법 2: 서버에서 직접 생성 (docs/ 에 있는 내용 참고 또는 deploy/ 파일 pull 후 복사)
```

**ssl-dhparams.pem** (없을 때):

```bash
sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
```

(1~2분 소요)

### 5-6. Nginx 적용

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. 백엔드 실행

```bash
cd /opt/note
npm run dev:notes:server
```

(또는 PM2로 상시 실행)

---

## 7. 접속 주소

- **https://auroraroa.duckdns.org:13090**
- **https://goldenroa.duckdns.org:13090**

(반드시 **https** 와 **:13090** 포함)

---

## 8. 그다음 할 일 (세팅 끝난 뒤)

### 8-1. 백엔드 상시 실행 (PM2)

터미널을 닫아도 백엔드가 계속 떠 있게 하려면:

```bash
# 서버에서 (1회)
sudo npm install -g pm2
cd /opt/note/server
pm2 start src/index.js --name note-server
pm2 save
pm2 startup
```

재부팅 후에도 자동으로 백엔드가 올라옵니다.

### 8-2. 코드 수정 후 서버 반영

로컬에서 수정 → 커밋·푸시한 뒤, 서버에서:

```bash
cd /opt/note
sudo git pull
```

- **프론트만** 바꿨으면: `cd app && npm install && npm run build` (Nginx reload 불필요)
- **백엔드만** 바꿨으면 (PM2 쓸 때): `cd server && npm install && pm2 restart note-server`

### 8-3. 접속 확인

브라우저에서 **https://auroraroa.duckdns.org:13090** (또는 goldenroa) 로 들어가서 로그인·노트 쓰기 등 동작 확인.

### 8-4. 나중에 해도 되는 것

- **도메인 IP** → DuckDNS에서 서버 IP 바뀌면 **update ip** 만 다시 누르기
- **인증서 갱신** → certbot 자동 갱신 설정됨 (`sudo certbot renew --dry-run` 로 확인 가능)
- **백업** → DB(또는 데이터) 주기적으로 백업

---

## 9. 참고·문서

| 문서 | 내용 |
|------|------|
| `docs/DUCKDNS_SETUP.md` | DuckDNS + 13090 HTTPS 상세 |
| `docs/NGINX_SETUP.md` | Nginx 전반 |
| `docs/SSL-적용-순서.md` | SSL 적용 단계별 |
| `docs/SERVER_DEV.md` | 로컬/서버 개발 실행 |
| `docs/git-커밋-푸시-방법.md` | Git 커밋·푸시 |
| `deploy/nginx-note-13090-ssl.conf` | 13090 HTTPS 전용 Nginx 설정 |
| `deploy/options-ssl-nginx.conf` | Nginx SSL 옵션 (certbot용) |

---

## 10. 인증서 갱신

- 만료: **2026-06-10** (certbot이 자동 갱신 설정해 둠)
- 수동 테스트: `sudo certbot renew --dry-run`
