# 테스트와 운영

## 로컬 검증

### 빠른 개발 루프

수정한 파일의 colocated test를 먼저 실행한다.

```powershell
npx vitest run src/core/http/same-origin.test.ts
```

기능 완료 전:

```powershell
npm run lint
npm run typecheck
npm run test
```

production 경계를 확인할 때:

```powershell
npm run validate:env
npm run build
```

E2E:

```powershell
npx playwright install chromium
npm run test:e2e
```

이미 dev server를 실행 중이거나 다른 base URL을 검사할 때:

```powershell
$env:SKIP_WEBSERVER='1'
$env:PLAYWRIGHT_TEST_BASE_URL='http://localhost:3000'
npm run test:e2e
```

### DB 테스트

Docker가 필요하다.

```powershell
npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector
npm run db:test
```

전체 migration/seed 재현이 필요한 schema 변경에서는 로컬 DB reset도 수행한다. reset은 로컬 Supabase data를 지우므로 대상이 local인지 반드시 확인한다.

## 테스트 계층

### Vitest

- 위치: `src/**/*.test.{ts,tsx}`, `test/**/*.test.{ts,tsx}`
- 환경: jsdom
- `server-only`는 `test/server-only.ts` shim으로 대체
- 순수 mapper/parser/security helper, hook, component 동작, route handler를 빠르게 검증
- 공통 setup은 `test/setup.ts`

테스트는 구현 세부보다 계약을 본다. 보안 route는 최소 성공, 미인증/권한 없음, 잘못된 input, 의존 서비스 실패를 위험에 맞춰 다룬다. timer/storage/listener가 있는 hook은 cleanup과 recovery도 확인한다.

### Playwright

현재 Chromium desktop 프로젝트 하나, 로컬 2 worker, CI 1 worker다. 실패 시 screenshot, 첫 retry에 trace를 남긴다. 주요 spec:

- navigation health
- notice
- contact flow
- auth rate limit
- protect flow
- file validation
- artist scene
- discography playback

사용자에게 보이는 URL/폼/재생/관리자 보호 경계가 바뀌면 해당 spec을 갱신한다. selector는 가능하면 role/label/text 계약을 사용하고 CSS 구조에 결합하지 않는다.

### Supabase SQL tests

`supabase/tests`는 다음 보안 경계를 검증한다.

- admin audit append-only/민감 필드
- admin onboarding ownership
- avatar asset/profile 연계
- 전반적인 public/admin/user RLS boundary

policy, grant, security-definer function, role, Storage ownership을 변경하면 허용과 거부를 SQL 테스트에 함께 추가한다. 앱 mock test만으로 RLS를 검증했다고 보지 않는다.

## coverage

```powershell
npm run test:coverage
```

V8 text와 HTML report를 만들며 `coverage/`는 Git에서 제외된다. 현재 CI는 수치 threshold를 강제하지 않지만 coverage job과 high-level dependency audit가 별도로 실행된다. 숫자만 높이기보다 보안 분기와 데이터 변환의 회귀 방지를 우선한다.

## CI

`master` push와 PR에서 두 workflow가 실행된다.

### `ci.yml`

1. lint
2. typecheck
3. unit/component test
4. 위 세 개 성공 후 production build
5. build 성공 후 Playwright E2E

Node 22와 `npm ci`를 사용한다. build/E2E job은 형태가 유효한 placeholder env를 사용한다.

### `quality.yml`

- coverage + `npm audit --audit-level=high`
- local Supabase 시작 + `npm run db:test`

lockfile이나 dependency를 바꾸면 두 workflow 비용과 `postinstall`의 `patch-package` 적용을 확인한다. `patches/minimatch+3.1.5.patch`를 제거하려면 upstream package graph에서 patch가 정말 불필요해졌는지 먼저 검증한다.

## 환경과 빌드

`.env.example`을 복사하되 실제 값은 `.env.local`에만 둔다. `scripts/validate-env.mjs`는 production Vercel, `STRICT_ENV_VALIDATION=1`, production CI에서 엄격 모드다.

검사 내용:

- 필수 변수 8개 존재
- site/Supabase/Storage URL 형식
- Supabase URL hostname과 project ref 일치
- Storage origin과 Supabase origin 일치
- 두 HMAC secret 32자 이상

`VERCEL_TOKEN`과 `VERCEL_PROJECT_ID`를 설정하면 관리자 대시보드와 `/admin/analytics`에서 Vercel Web Analytics를 조회한다. 두 값이 없으면 해당 화면은 빈 통계로 표시되며 앱 빌드를 막지 않는다. API는 7일·30일·12주·12개월 범위를 지원하고, Vercel 요금제의 기간 제한은 정상 `200` 응답의 제한 상태로 화면에 안내한다. 상세 설정과 API 계약은 [08-admin-analytics.md](./08-admin-analytics.md)를 본다.

`npm run build`는 환경 검증 후 `next build --webpack`을 실행한다. dev에서 warning으로 지나간 env 누락이 production에서는 build 실패가 될 수 있다.

## 배포 전 체크리스트

- `git status`에 `.env*`, build/test output, 사용자 데이터가 없음
- Node 22 + `npm ci` 기준 네 가지 app check 통과
- DB 변경은 migration status와 DB test 통과
- migration이 app보다 먼저/나중에 적용돼야 하는지 순서 명시
- production Supabase Auth redirect URL과 Google provider callback 확인
- public site URL/canonical/Storage URL이 production origin과 일치
- service key와 HMAC secret이 production secret store에 설정
- 관리자 계정과 최소 한 명의 super_admin 존재
- 새 remote image/storage origin이 Next config/CSP와 맞음
- 공개 저장 후 cache invalidation 확인
- mobile/keyboard/reduced-motion smoke test

## 배포·DB 순서

호환 가능한 additive 변경의 기본 순서:

1. nullable column/table/function/policy migration 적용
2. 기존 앱이 계속 동작하는지 확인
3. 새 앱 배포
4. backfill과 관측
5. 충분한 기간 후 별도 migration으로 old column/contract 제거

한 번에 column rename/drop과 앱 변경을 배포하지 않는다. Supabase migration은 자동 rollback이 아니므로 destructive 변경 전 복구 SQL/backup을 준비한다.

## 관측과 장애 확인

현재 코드에 Vercel Analytics와 Speed Insights가 포함돼 있지만 전용 error tracking/log aggregation은 확인되지 않는다. 장애 시 다음 순서로 범위를 줄인다.

### 관리자 페이지 통계가 비어 있음

1. `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`와 선택적인 `VERCEL_TEAM_ID`가 서버 환경 변수에 있는지 확인
2. 해당 토큰이 Vercel Web Analytics API와 대상 프로젝트를 조회할 수 있는지 확인
3. `/api/admin/page-stats?range=7d`가 관리자 세션으로 403 또는 502를 반환하는지 확인
4. Vercel 요금제의 조회 가능 기간을 넘지 않았는지 확인

### 페이지가 전체 실패

1. deployment build log와 env validation
2. Supabase URL/project ref/storage origin
3. root layout의 env import와 `connection()`
4. CSP violation/network error
5. Supabase status와 anon query/RLS

### 로그인/보호 페이지 redirect loop

1. browser Supabase auth cookie 존재
2. production Auth Site URL/redirect allowlist
3. proxy matcher와 `updateSession` cookie copy
4. `getClaims()` error
5. profile row와 role 값

### 관리자는 저장됐는데 공개에 안 보임

1. DB row의 `is_active`/`is_published`/`published_at`
2. 관련 artist/album 상위 entity 활성 상태
3. anon RLS query 결과
4. `/api/admin/revalidate` 응답과 tag allowlist
5. 300초 cache TTL 경과 여부

### 업로드 실패

1. route 400/401/403/413/422/503 code
2. body/file/bucket limit 일치
3. 실제 magic byte와 extension
4. safe path와 bucket allowlist
5. service role env
6. Storage policy/용량
7. DB 실패 후 orphan object 존재 여부

### rate limit이 모두에게 걸림

1. Vercel 환경인지와 `VERCEL=1`
2. `x-vercel-forwarded-for`가 단일 값인지
3. 비 Vercel에서 `unknown` bucket 공유 여부
4. private rate-limit table/RPC migration 적용 여부
5. HMAC secret 누락/rotation 여부

## 운영 데이터 주의

- `admin_audit_logs`는 자동 만료되지 않는다. 증가량과 보존 정책을 관측한다.
- private attachment bucket의 orphan file을 정기적으로 대조할 작업은 현재 확인되지 않는다. 실패 cleanup은 route 단위 best effort다.
- `supabase/config.toml`의 signup, confirmation, password minimum, network restriction은 로컬 설정이다. hosted production dashboard 설정과 같다고 가정하지 않는다.
- production schema 판단은 `db:status`와 linked project를 우선한다. 오래된 dump만으로 migration 적용 여부를 추정하지 않는다.

## 인수인계 시 남길 정보

- production/preview Supabase project ref와 접근 담당자(값 자체는 secret 문서에)
- Vercel project와 환경 변수 관리 위치
- Google OAuth/메일 provider 관리 주체
- 현재 super_admin 복구 절차
- pending migration과 적용 순서
- 최근 실패한 CI/E2E 및 재현 방법
- audit/attachment 보존 정책의 결정 상태
