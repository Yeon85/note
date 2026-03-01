해결 방법
postinstall을 건너뛰고 설치:
npm install --ignore-scripts
이렇게 하면 husky install은 실행되지 않고, 의존성만 설치됩니다.
이후 개발 서버 실행:
npm run dev


npm install --ignore-scripts
npm run dev


.env 관리
프로젝트 루트(`note`)에 `.env` 파일을 생성하고 아래 값을 필요에 맞게 설정:
VITE_FONT_PROXY_TARGET=http://localhost:5174
VITE_FONT_PROXY_PATH=/font
# 선택값
# VITE_DEV_HOST=127.0.0.1
# VITE_DEV_PORT=5173