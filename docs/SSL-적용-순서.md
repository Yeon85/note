# SSL 적용 순서 (서버에서 처음부터)

**전제:** 인증서는 이미 발급됨 (`certbot certonly` 완료). 서버 **115.68.229.141** 에 SSH 접속한 상태에서 진행합니다.

---

## 1단계: 서버에 접속

- 로컬 PC에서 터미널(PowerShell 등) 열기
- `ssh root@115.68.229.141` 실행 후 로그인
- 프롬프트가 `root@icanspeak-302802:~#` 같은 형태로 바뀌면 서버에 접속된 것

---

## 2단계: Nginx 설정 파일 열기

서버에서 아래 한 줄 입력 후 Enter:

```bash
sudo nano /etc/nginx/sites-available/note
```

- `nano` 라는 편집기로 `/etc/nginx/sites-available/note` 파일이 열림
- 여러 줄의 설정이 보이면 정상

---

## 3단계: 80 포트 블록 제거

**할 일:** 인증서 받을 때만 쓰던 `listen 80` 이 있는 `server { ... }` 블록 전체를 지우거나 주석 처리.

1. **화살표 키**로 위아래 이동하면서 **`listen 80`** 이 적힌 줄을 찾기
2. 그 블록은 대략 이런 형태:
   ```nginx
   server {
       listen 80;
       server_name auroraroa.duckdns.org ...;
       root /var/www/certbot;
       location / { ... }
       location /.well-known/acme-challenge/ { ... }
   }
   ```
3. **그 블록 전체**를 삭제하거나, 맨 앞에 `#` 를 붙여서 주석 처리  
   (예: `# server {` , `#     listen 80;` ... 블록 끝 `}` 까지)
4. **13090** 이 있는 `server { ... }` 블록은 그대로 두기 (다음 단계에서 수정)

---

## 4단계: 13090 블록에 SSL 설정 넣기

**할 일:** `listen 13090` 이 있는 `server { }` 안을 아래처럼 바꾸기.

1. **`listen 13090;`** 찾기  
   → **`listen 13090 ssl;`** 로 고치기 (뒤에 ` ssl` 추가)

2. **`server_name`** 줄 찾기  
   - 주석(`# server_name ...`) 되어 있으면 주석 해제하고  
   - 아래 한 줄로 넣기 (두 도메인 공백으로 구분):
   ```nginx
   server_name auroraroa.duckdns.org goldenroa.duckdns.org;
   ```

3. **`server_name` 다음 줄**에 아래 4줄을 **그대로** 추가:
   ```nginx
   ssl_certificate     /etc/letsencrypt/live/auroraroa.duckdns.org/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/auroraroa.duckdns.org/privkey.pem;
   include /etc/letsencrypt/options-ssl-nginx.conf;
   ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
   ```

**예시 (13090 블록이 이렇게 보이면 됨):**

```nginx
server {
    listen 13090 ssl;
    server_name auroraroa.duckdns.org goldenroa.duckdns.org;

    ssl_certificate     /etc/letsencrypt/live/auroraroa.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/auroraroa.duckdns.org/privkey.pem;
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

---

## 5단계: 저장하고 nano 나가기

1. **Ctrl+O** (저장)
2. 아래쪽에 파일 이름 나오면 **Enter** 한 번
3. **Ctrl+X** (나가기)

이제 터미널만 보이는 상태로 돌아옴.

---

## 6단계: Nginx 설정 검사 및 재시작

서버 터미널에서 아래 **한 줄씩** 실행:

```bash
sudo nginx -t
```

- `syntax is ok` / `test is successful` 나오면 OK.

그 다음:

```bash
sudo systemctl reload nginx
```

- 에러 메시지 없이 프롬프트만 나오면 성공.

---

## 7단계: 백엔드가 떠 있는지 확인

노트 앱 API는 **4090** 포트에서 동작해야 합니다.

- 이미 다른 터미널에서 `npm run dev:notes:server` 를 켜 둔 상태면 그대로 두기.
- 꺼져 있으면 서버에서:
  ```bash
  cd /opt/note
  npm run dev:notes:server
  ```
  (이 터미널은 그대로 두고, 새 터미널로 SSH 접속해서 다른 작업 가능)

---

## 8단계: 브라우저에서 접속

**로컬 PC**의 브라우저 주소창에 **아래 둘 중 하나** 입력 (반드시 **https** 와 **:13090** 포함):

- **https://auroraroa.duckdns.org:13090**
- **https://goldenroa.duckdns.org:13090**

- 자물쇠 아이콘으로 "연결이 안전함" 표시되면 SSL 적용 완료.
- "주의 요함"이면 아직 **http** 로 들어갔거나, **:13090** 을 빼고 들어간 경우일 수 있음 → 주소를 **https://...:13090** 으로 다시 입력.

---

## 문제 생겼을 때

- **`options-ssl-nginx.conf` or `ssl-dhparams.pem` 없다고 나오면**  
  certbot이 한 번도 Nginx 플러그인으로 설정을 건드린 적이 없을 수 있음. 그럴 때:
  ```bash
  sudo apt install -y certbot python3-certbot-nginx
  sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
  ```
  `options-ssl-nginx.conf` 는 보통 certbot 설치 시 `/etc/letsencrypt/` 에 들어 있음. 없으면:
  ```bash
  sudo ls /etc/letsencrypt/
  ```
  로 경로 확인.

- **인증서 경로가 없다고 나오면**  
  ```bash
  sudo ls /etc/letsencrypt/live/auroraroa.duckdns.org/
  ```
  로 `fullchain.pem`, `privkey.pem` 있는지 확인.
