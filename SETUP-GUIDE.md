# SHELL-NOTE 설정·배포 가이드

로컬 개발부터 iwinv Docker 배포까지 한 번에 정리한 문서입니다.

---

## 1. 로컬에서 실행하기

### 의존성 설치

```bash
cd c:\work\mypro\dev\note
npm install
npm install --prefix app
npm install --prefix server
```

### 실행

```bash
npm run dev
```

- **프론트:** http://127.0.0.1:3190  
- **API:** http://127.0.0.1:4090  

(포트는 3190 / 4090 으로 설정해 두었음. 충돌 시 `app/.env` 에 `VITE_DEV_PORT`, `server/.env` 에 `PORT` 로 변경 가능)

### DB

- Railway 등 **외부 MySQL** 쓰면 `server/.env` 에 `DATABASE_URL` 만 넣으면 됨.
- 서버용 `.env` 는 `server/.env` 에 두고, 루트 `.env.md` 는 참고용.

---

## 2. Windows에서 SSH / SCP 안 될 때

### SSH

- **설정 → 앱 → 선택적 기능 → 기능 추가** 에서 **OpenSSH 클라이언트** 설치  
  또는  
  ```powershell
  & "$env:SystemRoot\System32\OpenSSH\ssh.exe" root@115.68.229.141
  ```
- PuTTY 쓰면 Host `115.68.229.141`, Port 22, SSH 로 접속

### SCP (파일 복사)

```powershell
& "$env:SystemRoot\System32\OpenSSH\scp.exe" C:\work\mypro\dev\note\docker-compose.yml root@115.68.229.141:/opt/note/
```

(OpenSSH 없으면 PuTTY의 PSCP 사용)

---

## 3. nano 에디터 저장·나가기

- **저장:** `Ctrl+O` → Enter  
- **나가기:** `Ctrl+X`  
- 저장 없이 나가기: `Ctrl+X` → `N`  

Windows 원격 터미널에서는 `Ctrl+Shift+O`, `Ctrl+Shift+X` 로 해보기.

---

## 4. iwinv 서버 배포 (Git으로 처음부터)

### 전제

- GitHub 등에 이 프로젝트가 올라가 있어야 함.
- **Docker 관련 파일이 저장소에 있어야 함** (아래 4.1 참고).

### 4.1 로컬에서 Docker 파일 푸시 (한 번만)

저장소에 `docker-compose.yml`, `server/Dockerfile`, `app/Dockerfile`, `app/nginx.conf` 가 없으면 서버에서 `git clone` 해도 `no configuration file provided` 에러가 남.

**로컬**에서:

```bash
cd c:\work\mypro\dev\note
git add docker-compose.yml server/Dockerfile app/Dockerfile app/nginx.conf
git commit -m "Add Docker deploy files for iwinv"
git push origin main
```

(브랜치 이름이 다르면 `main` 대신 해당 이름 사용)

### 4.2 서버 접속 후 클론

**주의:** `/opt/note` 를 지운 뒤에는 셸이 **그 폴더 안에 있으면** `git clone` 이 실패함. 반드시 **먼저** 다른 디렉터리로 이동할 것.

```bash
cd /opt
sudo rm -rf /opt/note
sudo git clone https://github.com/본인아이디/저장소이름.git note
cd /opt/note
```

(예: `https://github.com/Yeon85/note.git`)

### 4.3 환경 변수 (서버에서 한 번만)

```bash
sudo nano /opt/note/server/.env
```

아래를 **본인 값으로** 채운 뒤 저장·종료 (`Ctrl+O` → Enter → `Ctrl+X`):

```env
DATABASE_URL=mysql://사용자:비밀번호@호스트:포트/DB이름
JWT_SECRET=아무긴비밀문자열32자이상
JWT_EXPIRES_IN=7d
APP_BASE_URL=http://115.68.229.141:13090
PORT=4000
```

SMTP 쓰면 `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` 추가.

### 4.4 빌드 & 실행

```bash
cd /opt/note
sudo docker compose build
sudo docker compose up -d
sudo docker compose ps
```

`note-app`, `note-server` 둘 다 **Up** 이면 성공.

### 4.5 접속

- **주소:** http://115.68.229.141:13090  
- iwinv 방화벽에서 **TCP 13090** 허용.

---

## 5. server/.env 안 날아가게 하기

- `server/.env` 는 **Git에 포함되지 않음** (`.gitignore`).
- `docker compose restart`, `git pull` 후 재빌드 등 **일반 재시작·업데이트** 시에는 **다시 입력할 필요 없음**.
- **`rm -rf /opt/note` 하고 새로 클론**할 때만 없어지므로, 그때만 다시 만들면 됨.

### 백업 (선택)

서버에서:

```bash
sudo cp /opt/note/server/.env /root/note-env.backup
```

나중에 새로 클론한 뒤:

```bash
sudo cp /root/note-env.backup /opt/note/server/.env
```

---

## 6. 포트 정리

| 용도           | 값    | 비고                    |
|----------------|--------|-------------------------|
| 로컬 프론트    | 3190   | `VITE_DEV_PORT`         |
| 로컬 API       | 4090   | `server` PORT           |
| iwinv 웹 앱    | 13090  | `NOTE_APP_PORT` (기본)  |

다른 포트 쓰려면 iwinv 서버 프로젝트 **루트**에 `.env` 만들고:

```env
NOTE_APP_PORT=원하는포트
```

그리고 `APP_BASE_URL` 도 `http://IP:원하는포트` 로 맞추기.

---

## 7. 자주 쓰는 명령어

| 상황           | 명령어 |
|----------------|--------|
| 로컬 실행      | `npm run dev` |
| 서버 배포 실행 | `cd /opt/note && sudo docker compose up -d` |
| 서버 중지      | `sudo docker compose down` |
| 서버 로그      | `sudo docker compose logs -f` |
| 코드 반영 후   | `git pull && sudo docker compose build && sudo docker compose up -d` |

---

## 8. 상세 배포 문서

iwinv Docker 설치, 방화벽, HTTPS 등은 **DEPLOY-IWINV.md** 에 정리되어 있음.
