# Git 커밋·푸시 방법

로컬에서 변경 사항을 커밋하고 원격 저장소로 푸시하는 방법입니다.

---

## 1. 변경 내용 확인

```bash
cd c:\work\mypro\dev\note
git status
```

추가·수정된 파일 목록이 나옵니다.

---

## 2. 스테이징 (커밋할 파일 고르기)

**전부 넣을 때:**
```bash
git add .
```

**특정 파일/폴더만 넣을 때:**
```bash
git add deploy/options-ssl-nginx.conf
git add docs/
```

---

## 3. 커밋

```bash
git commit -m "커밋 메시지"
```

예:
```bash
git commit -m "Add SSL options file and setup docs"
```

---

## 4. 푸시

```bash
git push
```

기본 브랜치가 `main`이 아니면:
```bash
git push origin main
```

현재 브랜치 확인: `git branch`

---

## 한 번에 실행

```bash
cd c:\work\mypro\dev\note
git add .
git commit -m "커밋 메시지 입력"
git push
```

---

## 서버에서 최신 코드 받기

서버(SSH)에서:

```bash
cd /opt/note
sudo git pull
```
