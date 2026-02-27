해결 방법
postinstall을 건너뛰고 설치:
npm install --ignore-scripts
이렇게 하면 husky install은 실행되지 않고, 의존성만 설치됩니다.
이후 개발 서버 실행:
npm run dev


npm install --ignore-scripts
npm run dev