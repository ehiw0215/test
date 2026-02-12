# 로컬 서버 실행 가이드

브라우저에서 `연결할 수 없음`이 보일 때는 서버 프로세스가 종료된 경우가 대부분입니다.
아래 스크립트로 서버를 다시 띄우면 됩니다.

## 시작

```bash
./scripts/start_local_server.sh 8080
```

## 중지

```bash
./scripts/stop_local_server.sh 8080
```

## 확인

```bash
curl -I http://127.0.0.1:8080/
```

> 참고: 이 저장소는 정적 페이지(`index.html`)를 Python HTTP 서버로 확인하는 구조입니다.
