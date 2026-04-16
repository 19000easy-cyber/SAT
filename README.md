# AI Study (MVP)

간단한 학습 플랫폼 MVP입니다. 동영상 강의, 간단한 퀴즈, 진도 저장 기능이 포함되어 있습니다.

빠른 시작

1. 의존성 설치

```bash
npm install
```

2. 개발 서버 실행

```bash
npm run dev
```

3. 브라우저에서 열기: http://localhost:3000

구성
- 진도 데이터는 `data/progress.json`에 저장됩니다 (간단한 로컬 저장 방식).

다음 단계 제안
- 관리자용 CMS 추가
- PostgreSQL/Prisma로 마이그레이션
- 소셜 로그인(선택)

바로 시작하기 (Windows)

- 프로젝트 폴더에서 더블클릭으로 실행: `start-dev.bat` (의존성 설치 후 개발서버 시작)
- 또는 우클릭해서 PowerShell로 실행: `start-dev.ps1`

직접 클릭으로 시작할 수 있도록 루트에 `start-dev.bat` 및 `start-dev.ps1` 파일을 추가했습니다.

문제가 있거나 macOS/Linux용 실행 스크립트를 원하시면 알려주세요.
