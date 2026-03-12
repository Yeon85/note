#서버시작
cd /opt/note
sudo cp deploy/nginx-note.conf /etc/nginx/sites-available/note        
-available/note /etc/nginx/sites-enabled/     
sudo rm -f /etc/nginx/sites-enabled/default   
sudo nginx -t
sudo systemctl reload nginx
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
eak-302802:/opt/note# cd /opt/note
npm run dev:notes:server

# DuckDNS로 무료 도메인 받고 HTTPS까지 쓰기 (13090만 사용)

평소에는 **13090 포트만** 쓰고, **80은 인증서 받을 때만 잠깐** 씁니다.  
인증서 발급이 끝나면 80은 다시 끄고 **https://도메인.duckdns.org:13090** 만 쓰면 됩니다.

---

## 1. DuckDNS 가입 및 도메인 만들기

1. **https://www.duckdns.org** 접속
2. **Sign in** → Google 또는 GitHub로 로그인
3. **Create Domain** 에 원하는 이름 입력 (예: `mynote`) → **goldenroa.duckdns.org**
4. **Current IP** 에 **115.68.229.141** 입력 후 **update ip** 클릭

---

## 2. 인증서 받을 때만 80 잠깐 열기

Let's Encrypt는 검증을 위해 **80 포트**로 접속합니다. 인증서만 받을 때만 80을 켜고, 받은 뒤엔 끕니다.

### 2-1. certbot용 디렉터리 만들기

```bash
sudo mkdir -p /var/www/certbot
```

### 2-2. 80 포트 블록만 잠깐 추가

```bash
sudo nano /etc/nginx/sites-available/note
```

**맨 위에** 아래 블록을 추가합니다. (이미 있는 `listen 13090` 블록은 그대로 두세요.)

```nginx
# 인증서 받을 때만 사용. 받은 뒤 이 블록 삭제하거나 주석 처리.
server {
    listen 80;
    server_name mynote.duckdns.org;   # 본인 DuckDNS 주소로 변경
    root /var/www/certbot;
    location / { return 404; }
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
```

저장 후:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo ufw allow 80
sudo ufw reload
```

### 2-3. 인증서 발급

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --webroot -w /var/www/certbot -d mynote.duckdns.org
```

이메일 입력, 약관 동의(Y) 하면 인증서가 `/etc/letsencrypt/live/mynote.duckdns.org/` 에 들어갑니다.

### 2-4. 80 포트 블록 제거 (다시 13090만 쓰기)

```bash
sudo nano /etc/nginx/sites-available/note
```

방금 넣은 **listen 80** 인 `server { ... }` 블록 전체를 지우거나 주석 처리한 뒤 저장합니다.

---

## 3. 13090에 HTTPS 붙이기

같은 파일에서 **listen 13090** 인 블록을 **13090 ssl** 로 바꿉니다.

```bash
sudo nano /etc/nginx/sites-available/note
```

예시 (기존 `listen 13090;` 블록을 아래처럼 교체):

```nginx
server {
    listen 13090 ssl;
    server_name mynote.duckdns.org;   # 본인 도메인

    ssl_certificate     /etc/letsencrypt/live/mynote.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mynote.duckdns.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /opt/note/app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4090/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:4090/uploads/;
        proxy_set_header Host $host;
    }
}
```

`mynote.duckdns.org` 는 본인 DuckDNS 주소로 바꾸세요.  
`options-ssl-nginx.conf` / `ssl-dhparams.pem` 이 없으면 certbot이 만든 걸 쓰면 됩니다. 없을 때만 생성:

```bash
sudo apt install -y certbot python3-certbot-nginx
# 한 번이라도 certbot 실행했으면 보통 생김. 없으면:
# sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
```

설정 확인 후 재시작:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

(선택) 80 다시 막기: `sudo ufw delete allow 80` 후 `sudo ufw reload`

---

## 4. 접속

**https://mynote.duckdns.org:13090** 로 접속합니다. (주소는 본인 DuckDNS 도메인으로.)

---

## 5. 인증서 자동 갱신

갱신할 때는 **80을 잠깐 열어두거나**, certbot이 **webroot**로 갱신하도록 해 두면 됩니다.  
갱신 시에도 `.well-known` 만 쓰면 되므로, 2-2에서 80 블록을 **삭제하지 말고** 주석만 해제해 두었다가 갱신 후 다시 주석 처리해도 됩니다.  
또는 80 블록을 그대로 두고 `location / { return 404; }` 로 두면 갱신만 80으로 할 수 있습니다.

```bash
sudo certbot renew --dry-run
```

---

## 요약 (13090만 쓰는 경우)

| 단계 | 할 일 |
|------|--------|
| 1 | DuckDNS 도메인 생성, IP 115.68.229.141 로 업데이트 |
| 2 | 80 포트 블록 추가(certbot용) → `certbot certonly --webroot -w /var/www/certbot -d xxx.duckdns.org` → 80 블록 제거 |
| 3 | 13090 블록에 ssl_certificate 붙이고 reload |
| 4 | **https://xxx.duckdns.org:13090** 접속, (선택) 80 방화벽 다시 막기 |
