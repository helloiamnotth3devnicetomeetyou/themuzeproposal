# THE MUZE 기술 인수인계

이 문서는 2026-08-08 현재 저장소의 코드, 설정, SQL 마이그레이션을 기준으로 작성한 개발자용 진입점이다. 기획 문서가 아니라 **현재 구현의 동작 방식과 변경 규칙**을 기록한다.

## 10분 안에 시작하기

필수 환경은 Node.js 22, npm 10, Git이다. 데이터베이스 마이그레이션과 DB 보안 테스트까지 실행하려면 Docker와 Supabase CLI가 필요하다. Supabase CLI는 dev dependency에 포함되어 있으므로 전역 설치하지 않는다.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

`.env.local`에는 실제 개발용 Supabase 프로젝트 값을 넣는다. 앱은 환경 변수가 없으면 초기 import 단계에서 실패할 수 있다. 기본 주소는 `http://localhost:3000`이다.

첫 변경 전 최소 확인:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

DB까지 변경한다면 Docker 실행 후 추가 확인:

```powershell
npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector
npm run db:test
```

## 문서 지도

| 문서 | 답하는 질문 |
| --- | --- |
| [01-project-overview.md](./01-project-overview.md) | 이 제품은 무엇이고 어떤 화면과 기능이 있는가? |
| [02-architecture.md](./02-architecture.md) | 요청이 어느 계층을 지나고 새 코드는 어디에 두는가? |
| [03-data-and-supabase.md](./03-data-and-supabase.md) | 테이블, RLS, Storage, 마이그레이션은 어떻게 연결되는가? |
| [04-security.md](./04-security.md) | 인증·권한·입력·업로드 보안 경계는 무엇인가? |
| [05-frontend-and-design.md](./05-frontend-and-design.md) | 디자인 언어, CSS, 반응형, 접근성, 다국어 규칙은 무엇인가? |
| [06-code-style-and-workflows.md](./06-code-style-and-workflows.md) | 코드 스타일과 기능별 구현 절차는 무엇인가? |
| [07-testing-and-operations.md](./07-testing-and-operations.md) | 테스트, CI, 배포, 장애 확인은 어떻게 하는가? |

기존 `docs/design-system.md`, `docs/design-tokens.json`, `docs/content-data-model.md`는 과거 설계 참고 자료다. 현재 런타임과 불일치할 수 있으므로 구현 판단은 이 폴더와 실제 코드·마이그레이션을 우선한다.

## 가장 중요한 규칙

1. `src/app`은 URL과 Next.js 메타데이터를 연결하는 얇은 어댑터다. 실제 화면과 로직은 `src/public`, `src/admin`, `src/core`에 둔다.
2. 공개 조회는 anon client + RLS를 사용한다. 사용자 세션 조회는 server client, RLS를 우회해야 하는 제한된 서버 작업만 service-role client를 사용한다.
3. `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용이다. `NEXT_PUBLIC_` 접두사를 붙이거나 Client Component에서 import하지 않는다.
4. 외부 입력은 UI 검증을 신뢰하지 않는다. 서버에서 origin, 인증·권한, 크기, 스키마, 파일 시그니처 순으로 다시 검증한다.
5. DB 변경은 기존 SQL 수정이 아니라 새 timestamp migration으로 추가한다. `schema.remote.sql`은 생성물이며 직접 편집하지 않는다.
6. 공개 콘텐츠 변경 후 관련 Next cache tag를 무효화한다. 현재 허용 tag는 보안상 enum으로 제한돼 있다.
7. 코드 변경에는 가장 가까운 단위 테스트 하나를, 사용자 흐름 변경에는 필요한 E2E 하나를 갱신한다. DB 권한 변경은 반드시 SQL 보안 테스트를 추가한다.
8. 색상 리터럴은 foundations 또는 `design-tokens.ts`에만 둔다. 컴포넌트는 의미 토큰을 사용한다.

## 현재 확인된 인수인계 주의사항

- 작업 트리에 문서 작업 전부터 미커밋 변경이 존재한다. 인수인계 시 `git status`로 소유자를 확인하고 덮어쓰지 않는다.
- 루트 `README.md`와 일부 오래된 문서·문자열은 현재 콘솔에서 문자 인코딩이 깨져 보인다. 새 파일은 UTF-8로 유지한다.
- `supabase/schema.remote.sql`은 최근 migration의 `audition_campaigns`, `avatar_assets`, `admin_onboarding_progress` 등을 포함하지 않는다. 스냅샷만 보고 현재 스키마라고 판단하지 말고 `npm run db:status`와 migration 전체를 확인한다.
- 감사 로그에는 자동 보존 기간이 없다. 개인정보·운영 정책이 정해지면 DB 보존 작업을 별도로 추가해야 한다.
- 요청 IP 신뢰 모델은 Vercel 배포를 전제로 한다. 비 Vercel 호스팅에서는 IP가 `unknown`으로 묶이므로 프록시 신뢰 정책을 먼저 설계해야 한다.

## 완료 기준

변경을 넘길 때는 다음을 PR 설명에 남긴다.

- 바뀐 사용자 흐름과 URL
- DB migration 및 되돌림/복구 방법
- 새 환경 변수와 배포 전 설정
- 실행한 검증 명령
- 캐시 무효화 tag 또는 운영 후속 작업
