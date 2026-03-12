# iwinv 서버에 Docker로 SHELL-NOTE 배포하기

iwinv에서 만든 Ubuntu 서버(예: 공인 IP `115.68.229.141`)에 이 프로젝트를 Docker로 올리는 방법입니다.

---

## 0. Git으로 처음부터 배포하기 (추천)

**전제:** 이 프로젝트를 GitHub(또는 GitLab 등)에 올려둔 상태여야 합니다. 아직이면 로컬에서 `git push` 한 번 해 두세요.

### 서버에서 할 일 (순서대로)

**1) 기존 폴더 정리 (이미 `/opt/note` 가 있다면)**

```bash
sudo docker compose -f /opt/note/docker-compose.yml down 2>/dev/null || true
sudo rm -rf /opt/note
```

**2) Git에서 클론**

```bash
sudo mkdir -p /opt
cd /opt
sudo git clone https://github.com/본인아이디/저장소이름.git note
cd note
```

(URL은 본인 저장소 주소로 바꾸세요.)

**3) 환경 변수만 만들기**

```bash
sudo nano server/.env
```

아래를 **본인 값으로** 채운 뒤 저장(`Ctrl+O` → Enter → `Ctrl+X`):

```env
DATABASE_URL=mysql://사용자:비밀번호@호스트:포트/DB이름
JWT_SECRET=아무긴비밀문자열32자이상
JWT_EXPIRES_IN=7d
APP_BASE_URL=http://115.68.229.141:13090
PORT=4000
```

(SMTP 쓰면 `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` 추가)

**4) 빌드 & 실행**

```bash
cd /opt/note
sudo docker compose build
sudo docker compose up -d
```

**5) 확인**

```bash
sudo docker compose ps
```

둘 다 **Up** 이면 브라우저에서 **http://115.68.229.141:13090** 접속. 방화벽에서 **TCP 13090** 허용해 두세요.

---

## 1. 서버 접속

iwinv 콘솔에서 SSH 접속 정보 확인 후 접속합니다.

### Windows에서 SSH가 안 될 때

PowerShell에서 `ssh`를 찾을 수 없다면 다음 중 하나를 사용하세요.

**방법 1: OpenSSH 클라이언트 설치**

1. **설정** → **앱** → **선택적 기능** → **기능 추가**
2. **OpenSSH 클라이언트** 검색 후 설치
3. PowerShell을 다시 연 뒤 `ssh root@115.68.229.141` 실행

**방법 2: 전체 경로로 실행**

```powershell
& "$env:SystemRoot\System32\OpenSSH\ssh.exe" root@115.68.229.141
```

(이미 OpenSSH가 설치돼 있으면 위 명령으로 접속 가능)

**방법 3: PuTTY 사용**

1. [PuTTY](https://www.putty.org/) 설치
2. Host에 `115.68.229.141`, Port 22, Connection type SSH 로 접속
3. 로그인 사용자명 `root` (또는 iwinv 안내 계정)

### Linux / macOS

```bash
ssh root@115.68.229.141
```

(또는 iwinv에서 안내하는 사용자명/키 사용)

---

## 2. Docker 설치 (Ubuntu)

서버에 Docker가 없으면 한 번만 설치합니다.

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

설치 확인:

```bash
docker --version
docker compose version
```

---

## 3. 프로젝트 올리기

### 방법 A: Git으로 클론 (추천)

```bash
cd /opt   # 또는 원하는 디렉터리
sudo git clone https://github.com/여기서는_본인_저장소_경로.git note
cd note
```

### 방법 B: 로컬에서 파일 복사

로컬 PC에서 SCP로 전체 프로젝트 복사:

```bash
scp -r C:\work\mypro\dev\note root@115.68.229.141:/opt/note
```

그 다음 서버에서:

```bash
cd /opt/note
```

---

## 4. 환경 변수 설정 (필수)

서버의 **백엔드**용 `.env`를 만들어야 합니다.

```bash
cd /opt/note
sudo nano server/.env
```

아래 내용을 **본인 값으로** 채워 넣습니다.

```env
# DB (Railway 등 기존 MySQL URL 그대로 사용 가능)
DATABASE_URL=mysql://사용자:비밀번호@호스트:포트/DB이름

# JWT (비밀번호 재설정 등에 사용, 랜덤 문자열로 변경 권장)
JWT_SECRET=본인이_정한_긴_비밀문자열
JWT_EXPIRES_IN=7d

# 서비스 주소 (비밀번호 재설정 링크 등에 사용)
# 기본 포트 13090 사용 시:
APP_BASE_URL=http://115.68.229.141:13090

# SMTP (이메일 비밀번호 재설정 사용 시)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=앱비밀번호
SMTP_FROM=your@gmail.com

# 서버 포트 (도커 내부용, 기본 4000 유지)
PORT=4000
```

저장: `Ctrl+O` → Enter → `Ctrl+X`

---

## 5. Docker 이미지 빌드 및 실행

프로젝트 루트(`/opt/note`)에서:

```bash
sudo docker compose build
sudo docker compose up -d
```

실행 확인:

```bash
sudo docker compose ps
```

두 컨테이너(`note-app`, `note-server`)가 **Up** 이면 성공입니다.

---

## 6. 접속 주소

- **웹 앱**: `http://115.68.229.141:13090` (기본 포트 13090)
- API는 같은 주소의 `/api/...` 로 nginx가 자동 프록시합니다.

브라우저에서 `http://115.68.229.141:13090` 로 접속해 보세요.

---

## 7. 방화벽 / 포트

iwinv에서 **방화벽**을 켜 둔 경우, **13090 포트**를 열어야 합니다.

- iwinv 콘솔: 해당 서버 → 방화벽 설정에서 **TCP 13090** 허용
- Ubuntu 방화벽 사용 시: `sudo ufw allow 13090 && sudo ufw reload`

**다른 포트 쓰기:** 프로젝트 루트에 `.env` 만들고 `NOTE_APP_PORT=원하는포트` 넣으면 됩니다.

---

## 8. 자주 쓰는 명령어

| 명령어 | 설명 |
|--------|------|
| `docker compose up -d` | 백그라운드 실행 |
| `docker compose down` | 중지 및 컨테이너 제거 |
| `docker compose logs -f` | 로그 보기 |
| `docker compose pull && docker compose build --no-cache && docker compose up -d` | 코드/설정 변경 후 재배포 |

---

## 9. HTTPS(도메인) 쓰고 싶을 때

1. 도메인을 이 서버 IP(`115.68.229.141`)로 연결
2. nginx에 SSL 설정 추가 (Let’s Encrypt 등)
3. `APP_BASE_URL` 을 `https://도메인` 으로 바꾼 뒤 다시 `docker compose up -d`

필요하면 nginx 설정만 따로 정리해 드릴 수 있습니다.
