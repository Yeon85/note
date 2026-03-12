# 서버에서 개발 모드로 띄우기 (115.68.229.141)

## 1. 지금까지 한 것 (정리)

- **목표**: 서버 IP로 `http://115.68.229.141:3190` 접속해서 앱 확인
- **원인**: 서버에 Node/npm 없음 + Vite 기본이 `127.0.0.1`만 listen
- **한 일**:
  - Node 20 설치 (NodeSource):  
    `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -` → `sudo apt install -y nodejs`
  - 커널 업그레이드 창 뜨면 **Enter** 한 번으로 닫기 (Ctrl+C 말고)
- **확인**: `node -v`, `npm -v` 로 버전 나오면 OK

---

## 2. 그다음 스텝

### 2-1. 서버에서 의존성 설치 (최초 1회)

```bash
cd /opt/note
npm install

cd /opt/note/app
npm install

cd /opt/note/server
npm install
```

서버용 env가 있다면:

```bash
# server/.env 있으면 이미 되어 있음. 없으면 .env.md 참고해서 생성
cp /opt/note/.env.md /opt/note/server/.env   # 후에 server/.env만 수정
```

### 2-2. 포트 열기 (방화벽 사용 시)

```bash
sudo ufw allow 3190
sudo ufw allow 4090
sudo ufw reload
```

### 2-3. 앱 실행 (외부에서 3190 접속 가능하게)

**방법 A – 프론트만 0.0.0.0으로 띄우기 (백엔드는 별도 터미널)**

터미널 1 (백엔드):

```bash
cd /opt/note
npm run dev:notes:server
```

터미널 2 (프론트, 외부 접속 가능):

```bash
cd /opt/note/app
VITE_DEV_HOST=0.0.0.0 npm run dev
```

**방법 B – 한 번에 띄우기 (스크립트에 host 지정)**

```bash
cd /opt/note
VITE_DEV_HOST=0.0.0.0 npm run dev:notes
```

### 2-4. 접속 확인

- 브라우저: **http://115.68.229.141:3190**
- API: **http://115.68.229.141:4090** (백엔드)

---

## 3. Nginx 넣어서 80으로 서비스

개발 포트(3190) 대신 **80 포트**로 서비스하려면 Nginx를 쓰면 됩니다.

- **설정 파일**: `deploy/nginx-note.conf`
- **설치·적용 방법**: `docs/NGINX_SETUP.md` 참고

요약: Nginx 설치 → 앱 빌드(`app/dist`) → 설정 복사·활성화 → 백엔드(4090)만 실행 → **http://115.68.229.141:13090** 접속.

---

## 4. 참고

- `server/.env` 는 서버 전용. `.env.md` 는 참고용이고, 실제로는 `server/.env` 를 읽음.
- 실서비스는 빌드(`npm run build`) 후 Nginx로 서빙하는 방식 권장. 3190 개발 서버는 테스트용.
