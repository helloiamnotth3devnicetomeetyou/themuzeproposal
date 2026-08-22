# THE MUZE

Themuzeproposal(themuzeproposal.notth3.dev)

## 포함 기능

- 공개 사이트: 아티스트, 멤버 scene, 디스코그래피·오디오, 일정, 공지, 회사 소개, 문의, 오디션
- 계정·Protect: 이메일/Google 로그인, 프로필, 오디션 지원 조회, 권리침해 제보와 비공개 증빙
- 관리자: 콘텐츠 편집, 접수함, 감사 로그, 초안 미리보기, 온보딩, Vercel Web Analytics 기반 페이지 통계

## 시작하기

필수 환경은 Node.js 22와 npm 10이다. DB migration과 SQL 보안 테스트까지 실행하려면 Docker가 필요하다.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

`.env.local`에는 개발용 Supabase 설정과 서버 전용 secret을 넣는다. 실제 secret은 Git·문서·클라이언트 코드에 넣지 않는다. 기본 개발 주소는 `http://localhost:3000`이다.

## 주요 명령

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run db:test
```

`npm run build`는 환경 변수를 먼저 검사한다. `db:test`는 Docker와 로컬 Supabase 실행이 필요하며, DB/RLS/migration 변경 시 함께 실행한다.

## 문서

기술 문서는 [docs/technical/README.md](./docs/technical/README.md)에서 시작한다.

- [프로젝트 개요](./docs/technical/01-project-overview.md): 제품 범위, URL, API
- [애플리케이션 구조](./docs/technical/02-architecture.md): 레이어, 요청 흐름, 코드 위치
- [데이터·인증과 R2](./docs/technical/03-data-and-supabase.md): schema, RLS, R2 객체 저장소, migration
- [보안 모델](./docs/technical/04-security.md): 인증·권한·입력·업로드 경계
- [프론트엔드와 디자인](./docs/technical/05-frontend-and-design.md): 토큰, 접근성, 다국어
- [코드 스타일과 개발 절차](./docs/technical/06-code-style-and-workflows.md): 구현·검증 규칙
- [테스트와 운영](./docs/technical/07-testing-and-operations.md): CI, 배포, 장애 대응
- [관리자 페이지 통계](./docs/technical/08-admin-analytics.md): Vercel Web Analytics 설정·권한·운영
