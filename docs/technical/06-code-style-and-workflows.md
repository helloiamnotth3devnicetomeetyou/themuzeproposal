# 코드 스타일과 개발 절차

## TypeScript

- `strict: true`, `noEmit: true`가 기준이다. `any`, non-null assertion, 광범위 type cast로 query 오류를 숨기지 않는다.
- import는 `@/` alias를 사용한다. 같은 feature 내부의 짧은 형제 import는 상대 경로도 허용한다.
- 타입 전용 import는 `import type`을 사용한다.
- 외부 입력은 `unknown`으로 받고 검증 후 좁힌다.
- 고정 enum/설정은 `as const`, 필요한 map은 `satisfies`로 누락을 검사한다.
- 화면 DTO, DB row, form draft를 필요에 따라 분리한다. 한 거대한 `AppData` 타입을 만들지 않는다.
- 함수와 type 이름은 역할을 말한다: `getPublicNotices`, `NoticeRow`, `NoticeDTO`, `loadPublicNotice`.
- 서버 전용 module 최상단에는 `import "server-only"`를 둔다.

저장소에는 오래된 single quote와 현재 double quote가 일부 섞여 있다. 새 파일은 주변 파일의 스타일을 따르고 포맷만을 위한 대규모 diff는 만들지 않는다. 별도 Prettier 설정은 없으며 ESLint와 TypeScript가 자동화된 기준이다.

## React와 Next.js

- 기본은 Server Component다. browser API, state/effect/event가 필요할 때만 `"use client"`.
- `src/app` page는 metadata, params, preload, server fetch만 담당하는 얇은 adapter로 유지한다.
- query는 render 중 Client Component에서 시작하지 말고 가능한 한 서버에서 병렬로 준비한다.
- 독립 query는 `Promise.all`로 묶는다.
- page params/searchParams는 Next 16의 실제 타입과 기존 route 패턴을 따른다.
- metadata는 `createPageMetadata` 또는 `createPrivatePageMetadata`를 재사용한다.
- 찾을 수 없는 공개 entity는 `notFound()`, 일시적 조회 장애는 명시적 load-failure UI로 구분한다.
- effect는 timer/listener/object URL을 cleanup하고, dependency를 빠뜨려 lint를 무력화하지 않는다.
- context는 theme/locale/preview처럼 앱 범위 상태에만 사용한다. 단일 컴포넌트 state를 context로 승격하지 않는다.

## 함수와 오류 처리

- 순수 변환·검증을 I/O 함수에서 분리해 작은 단위 테스트가 가능하게 한다.
- 정상적인 “없음”은 `null`/empty DTO, 실제 query 실패는 error 또는 `{ loadFailed: true }`처럼 호출자가 구분할 수 있게 한다.
- `catch {}`는 의도적으로 복구 가능한 browser storage/cookie 등에서만 사용하고 주석으로 이유를 남긴다.
- Route Handler는 안정된 machine code와 HTTP status를 반환한다. raw provider error를 그대로 전달하지 않는다.
- 여러 side effect가 있고 DB transaction을 쓸 수 없으면 생성 자원 목록을 추적해 catch에서 보상 정리한다.
- 원자성이 제품 요구라면 클라이언트 순차 호출 대신 Postgres RPC를 사용한다.

## Supabase query

- 필요한 column만 `.select("...")`한다. 민감 table에서 `select("*")` 금지.
- public query는 RLS가 있어도 `is_active`, `is_published`, `published_at` 조건을 명시해 의도를 드러낸다.
- 단건이 반드시 있어야 하면 `.single()`, 없어도 정상이라면 `.maybeSingle()`.
- 정렬과 limit를 DB에서 적용한다.
- write 후 UI에 필요한 projection만 `.select()`로 반환한다.
- cross-row invariant는 unique/check/FK/RPC로 DB에 둔다.
- browser write는 RLS 범위 내에서만, service role은 검증된 server route에서만 쓴다.

## CSS

- literal color는 foundations/design token 파일만.
- 기존 semantic variable과 layout variable을 우선한다.
- mobile-first 또는 해당 파일의 기존 breakpoint 방향을 일관되게 따른다.
- selector specificity를 낮게 유지하고 DOM 깊이에 강하게 결합하지 않는다.
- 전역 class 이름은 domain prefix(`admin-`, feature block)를 쓴다.
- 복잡한 feature-local 스타일은 CSS Module로 격리한다.
- motion에는 reduced-motion 결과가 있어야 한다.

## 파일·이름 규칙

현재 관례:

- React component: `PascalCase.tsx`
- hook: `useSomething.ts`
- route adapter: Next 규약 `page.tsx`, `layout.tsx`, `route.ts`
- domain server route: `*-route.ts`
- model/repository/util: `kebab-case.ts`
- colocated test: 대상명 `.test.ts`/`.test.tsx`
- E2E: 기능명 `.spec.ts`
- migration: `YYYYMMDDHHMMSS_snake_case.sql`
- CSS Module: `PascalCase.module.css` 또는 page domain module

한 파일에서만 쓰는 type/helper는 같은 파일에 둔다. 재사용이 실제로 생기기 전 `utils/common/helpers`로 옮기지 않는다.

## 주석

코드가 무엇을 하는지는 이름으로 표현하고, 주석은 왜 제약이 있는지 설명한다. 보안 가정, 브라우저 제약, migration 호환성, 의도적 단순화는 남긴다.

알려진 한계 때문에 단순 구현을 택했다면 `ponytail:` 주석으로 ceiling과 upgrade trigger를 기록한다. 예: 현재 multi-editor batch는 cross-table atomic rollback이 필요할 때 RPC로 바꾼다.

## 기능별 작업 절차

### 새 공개 읽기 화면

1. 기존 URL/feature/repository가 있는지 검색한다.
2. `public/features/<domain>`에 DTO와 repository query를 작성한다.
3. public anon/RLS 조건으로 비공개 row가 보이지 않는지 테스트한다.
4. 필요할 때만 `server.ts`에 cache와 tag를 둔다.
5. `public/pages`에 Server/Client UI를 구성한다.
6. `app/(public)`에 얇은 page와 metadata를 연결한다.
7. not-found, empty, query failure, ko/en/ja fallback을 확인한다.

### 새 관리자 CRUD

1. DB constraint/RLS/audit가 작업을 허용하는지 먼저 확인한다.
2. 인접 `*-editor-model.ts`와 `useAdminEntityEditor`를 재사용한다.
3. draft ↔ payload 변환과 필수값 검증을 model에 둔다.
4. 저장 성공 후 snapshot/backup을 commit한다.
5. 삭제는 confirmation과 FK/R2 객체 정리 순서를 명시한다.
6. 공개 영향이 있으면 cache tag를 무효화한다.
7. guide sandbox에서 실제 write가 발생하지 않는지 확인한다.

### 새 JSON API

1. app route는 feature handler를 re-export한다.
2. same-origin을 먼저 확인한다.
3. `Content-Length` 상한과 parse 실패를 처리한다.
4. session과 role/ownership을 확인한다.
5. 필요하면 DB rate limit을 먼저 소비한다.
6. Zod schema로 body를 좁힌다.
7. DB constraint/RLS를 최종 방어선으로 둔다.
8. 안정된 code/status/no-store 응답과 거부 테스트를 추가한다.

### 새 외부 운영 API 연동

1. 기존 server route가 이미 요구를 충족하는지 확인하고, 단순 조회를 위해 DB 테이블이나 background job을 추가하지 않는다.
2. token·project 식별자는 server-only 환경 변수로 읽고 client component에 전달하지 않는다.
3. 사용자 세션과 role을 외부 요청보다 먼저 확인한다.
4. `AbortSignal.timeout` 등으로 외부 요청의 상한을 두고 `cache: "no-store"` 여부를 명시한다.
5. provider 응답은 필요한 최소 DTO로 좁히며 provider 오류 본문·token·식별자를 그대로 반환하거나 로그에 남기지 않는다.
6. 설정 누락, 권한 거부, provider 실패, provider의 기능/요금제 제한을 서로 구분해 UI가 복구 가능한 상태를 표시하게 한다.
7. URL parameter, 인증 거부, 정상 집계, provider 제한·실패를 route test로 확인한다.

### 새 파일 업로드

1. 정말 새 MIME이 필요한지 확인한다.
2. `ValidatedFileType`, extension, detection, profile allowlist를 최소 변경한다.
3. route body/file/bucket limit와 R2 객체 제한을 맞춘다.
4. 사용자 파일명 대신 안전한 path를 생성한다.
5. DB 작업 실패 시 object cleanup을 추가한다.
6. valid signature, spoofed MIME, wrong extension, oversized, unauthorized 테스트를 만든다.

### DB schema 변경

1. 모든 caller/query/RPC/policy/test를 `rg`로 찾는다.
2. 새 migration을 만든다.
3. 로컬 reset/DB test로 처음부터 재현되는지 확인한다.
4. app typecheck/unit test를 실행한다.
5. linked status 확인 후 push한다.
6. remote snapshot을 refresh한다.
7. 배포 순서가 필요한 breaking change는 expand → app deploy → contract로 나눈다.

### 새 다국어 필드

1. DB `_ko/_en/_ja` 또는 i18n JSON 형태를 기존 entity와 맞춘다.
2. 관리자 draft/validation/save를 갱신한다.
3. public repository DTO와 `localizeText` fallback을 갱신한다.
4. preview payload, SEO, form label을 확인한다.
5. 세 언어와 빈 번역 fallback 테스트를 추가한다.

## 리뷰 체크리스트

- 기존 helper/component/query를 중복 구현하지 않았는가
- client boundary가 불필요하게 넓어지지 않았는가
- service role과 secret이 서버에만 남아 있는가
- public/private 상태가 query와 RLS에서 모두 일치하는가
- 외부 입력 길이·enum·URL·파일이 서버에서 검증되는가
- 캐시 tag 무효화가 빠지지 않았는가
- failure cleanup과 사용자가 재시도할 오류가 있는가
- dark/light, mobile, keyboard, locale을 확인했는가
- migration, unit, E2E 중 변경 위험에 맞는 가장 작은 검증이 있는가
- 생성물과 `.env.local`이 diff에 들어오지 않았는가
