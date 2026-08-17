# 애플리케이션 구조

## 의존 방향

```text
src/app  ───────▶  src/public ──┐
   │                            ├──▶ src/core
   └───────────▶  src/admin  ───┘

Supabase/Postgres/Auth + Cloudflare R2 ◀── repository, server module, API route
```

- `core`는 인증, Supabase client, HTTP 안전장치, i18n, preview, 공용 UI·유틸을 소유한다.
- `public`과 `admin`은 서로 직접 의존하지 않고 각각 `core`를 사용한다.
- `app`은 Next.js가 요구하는 route 파일만 소유하고 feature 구현을 import/re-export한다.
- 공용화할지 애매하면 먼저 feature 폴더에 둔다. 두 영역이 실제로 공유할 때만 `core`로 이동한다.

## `src/app`: 라우팅 어댑터

Route Group은 세 가지다.

- `(public)`: 공개 layout과 공개·계정 페이지
- `(admin)`: 관리자 layout, 관리자 페이지와 관리자 API
- `(core)`: 로그인, OAuth callback, 제출·인증·preview API

일반적인 page 어댑터는 metadata를 선언하고 feature page를 re-export하거나 서버 데이터를 준비한다.

```tsx
import Home from "@/public/pages/home/page";
import { getPublicHomeSlidesForPage } from "@/public/features/home/server";

export default async function HomePage() {
  return <Home initialSlides={await getPublicHomeSlidesForPage()} />;
}
```

Route Handler 어댑터는 feature route 함수를 그대로 export한다. 파일 업로드·DOMPurify·Sharp처럼 Node API가 필요한 route는 `runtime = "nodejs"`를 유지한다.

새 URL을 추가할 때 `app` 안에 대형 컴포넌트나 DB query를 넣지 않는다. URL 변경과 feature 이동을 분리할 수 있어야 한다.

## `src/public`: 공개 제품

### 데이터 조회 표준

권장 흐름은 다음과 같다.

1. `features/<feature>/types.ts`: 화면에 필요한 DTO
2. `repository.ts`: 주입받은 `SupabaseClient`로 query하고 row를 DTO로 변환
3. `server.ts`: anon server client 생성, 필요한 경우 `unstable_cache`
4. `pages/**/page.tsx`: 결과를 받고 not-found/load-failure UI 결정
5. Client Component: 상호작용만 처리

Repository가 client를 인자로 받으므로 실제 Supabase 없이 단위 테스트할 수 있다. DB row type과 UI DTO를 분리하고 snake_case를 컴포넌트 전역으로 퍼뜨리지 않는다.

공개 캐시는 대체로 300초다.

| tag                                                                 | 소비자                 |
| ------------------------------------------------------------------- | ---------------------- |
| `public-navigation-artists`                                         | 공개 layout navigation |
| `public-site-settings`                                              | footer·회사 설정       |
| `public-notices`                                                    | 회사/아티스트 공지     |
| `artist-scene-data`                                                 | 아티스트 scene         |
| `public-artist-title`, `public-member-title`, `public-notice-title` | SEO metadata           |

관리자 저장 후 즉시 반영해야 하는 tag는 `/api/admin/revalidate` allowlist에도 추가하고 호출부 테스트를 함께 갱신한다. TTL만 기다리는 방식으로 편집 UX를 깨뜨리지 않는다.

### 서버와 클라이언트 경계

- DB 조회·metadata·권한 판단은 Server Component/`server-only` 모듈에 둔다.
- state, effect, event handler, browser storage, audio/drag UI만 `"use client"`를 붙인다.
- Server Component에서 직렬화 가능한 DTO만 Client Component에 전달한다.
- 공개 조회용 server client는 session을 저장하지 않는 anon client다. 사용자별 조회는 cookie 기반 `createSupabaseServerClient()`를 사용한다.
- 공개 layout은 캐시 가능한 아티스트·사이트 설정만 서버에서 준비한다. navbar의 사용자 상태는 초기 익명 DTO로 시작하고, hydration 뒤 `GET /api/navigation/account`를 `private, no-store`로 조회한다. 로그인·프로필 변경 이벤트도 이 endpoint를 다시 조회한다.

## `src/admin`: 관리 스튜디오

### shell과 권한

`src/app/(admin)/admin/layout.tsx`는 서버에서 JWT claims와 DB role을 확인한 뒤 `AdminShell`을 렌더링한다. `src/proxy.ts`도 `/admin` 진입 전에 같은 경계를 적용한다. 중복은 의도된 defense-in-depth다.

role은 `super_admin | editor | null`이다.

- `editor`: 일반 콘텐츠 관리
- `super_admin`: editor 권한 + 관리자 계정 초대·역할 변경·해제
- 일반 사용자: `null`

역할 문자열을 UI에서만 검사하지 않는다. 서버 route와 RLS/DB 함수가 최종 권한을 가져야 한다.

### 편집기 패턴

관리 화면은 domain별 `*-editor-model.ts`와 공통 훅을 사용한다.

- `useAdminEntityEditor`: draft/snapshot, dirty 여부, save/delete/loading, 오류·toast, localStorage backup
- `usePageDrafts`: 한 페이지의 여러 editor 등록과 순차 commit
- `buildDraftDiff`: 저장 전 변경 요약
- `ContentWorkbench`: rail + editor stage 레이아웃
- `DraftSaveButton`, `DeleteConfirmDialog`: 저장·파괴 작업 UX
- `upload-admin-asset`: 검증된 관리자 업로드 API 사용

새 편집 화면은 DB row를 그대로 uncontrolled form에 연결하지 말고, model에서 초기 draft와 저장 payload를 명시한다. 저장 성공 후 `commitDraft`, 서버에서 다시 읽었으면 `resetDraft`를 호출한다.

`usePageDrafts.commit()`은 현재 여러 요청을 순차 실행한다. 서로 다른 테이블이 반드시 함께 성공하거나 함께 실패해야 하는 기능은 이 훅을 확장하지 말고 Postgres RPC로 트랜잭션을 만든다.

### 페이지 통계

`/admin` 대시보드와 `/admin/analytics`는 동일한 관리자 전용 `GET /api/admin/page-stats`를 사용한다. 대시보드는 최근 7일의 요약만 요청하고, 상세 화면은 추이와 차원별 분석을 요청한다. 이 데이터는 Supabase에 저장하지 않고 Vercel Web Analytics API에서 요청마다 조회하므로 cache는 `no-store`다.

```text
Admin browser
  → /api/admin/page-stats?range=…
  → session user + profiles.role 확인
  → VERCEL_TOKEN / VERCEL_PROJECT_ID 확인
  → Vercel visits aggregate API (7초 timeout)
  → 화면 DTO (추이·합계·분석 차원)
```

Vercel 설정이 없으면 endpoint는 빈 통계와 `configured: false`를 반환한다. 외부 API 실패는 사용자에게 내부 오류를 노출하지 않고 `502` 또는 조회 기간 제한 상태로 변환한다. 이 경계의 상세 계약은 [08-admin-analytics.md](./08-admin-analytics.md)를 따른다.

### 미리보기와 가이드 sandbox

관리자 preview는 저장 전 payload를 임시 localStorage envelope로 공유하고, 서버는 관리자 확인 후 Next draft mode cookie를 켠다. 허용 경로는 `entry-route.ts`의 정규식 allowlist로 제한된다. preview token과 envelope에는 TTL이 있다.

온보딩 guide sandbox는 쓰기 요청을 가로채 가짜 성공 응답과 blob URL을 반환한다. Auth, progress 저장, 일부 읽기 RPC는 실제 요청을 허용한다. 새 관리자 write endpoint를 만들면 sandbox 대상인지 확인한다. 실데이터가 바뀌면 안 되는 연습 단계는 `guideSandboxFetch`를 사용해야 한다.

## `src/core`: 공유 기반

| 하위 경로    | 책임                                                              |
| ------------ | ----------------------------------------------------------------- |
| `auth/`      | browser auth facade, server login/verify/OAuth, role helpers      |
| `supabase/`  | browser/server/service/proxy client와 guide sandbox               |
| `http/`      | same-origin, client IP, 요청 크기, URL, rate limit                |
| `uploads/`   | magic-byte 검증, 객체 path 안전성, Supabase service client export |
| `storage/`   | R2 S3 client, 공개 URL, 서명 URL, 객체 삭제, asset proxy          |
| `i18n/`      | locale 판별·fallback·메시지·서버 cookie                           |
| `preview/`   | draft preview token/envelope/entry/exit/provider                  |
| `ai/`        | `text-completion-provider`(OpenRouter 호출 단일 seam), 문의 분류(`classify-inquiry`), 관리자 콘텐츠 번역(`translate-admin-content`) |
| `providers/` | theme와 locale context                                            |
| `seo/`       | 공통 metadata                                                     |
| `utils/`     | rich text, SVG, redirect, 음악/scene/schedule 순수 로직           |

`server-only` import가 있는 파일을 Client Component에서 import하면 안 된다. 브라우저와 서버 양쪽에서 필요한 순수 함수는 별도 파일로 분리한다.

AI 텍스트 작업(문의 분류, 관리자 콘텐츠 번역)은 모두 `src/core/ai/text-completion-provider.ts`를 통해 OpenRouter를 호출한다. 새 AI 기능을 추가할 때도 이 provider를 재사용하고, 별도 client를 만들지 않는다. `OPENROUTER_API_KEY`가 없으면 호출은 `null`을 반환하며 호출부는 이를 실패로 취급해 기존 흐름(제출, 저장)을 계속 진행해야 한다. 모델은 `AI_TEXT_MODEL` 환경 변수로 override한다(기본값 `google/gemini-3.1-flash-lite`).

## 요청 생명주기

### 페이지 요청

```text
Browser
  → proxy.ts (CSP nonce, 보호 경로 session refresh/redirect)
  → root layout (정적 기본 `ko`/dark, theme bootstrap, analytics)
  → public/admin layout
  → app page adapter
  → server/repository
  → Supabase anon 또는 session client
  → RLS
  → DTO + React response
```

`RootLayout`은 요청 cookie를 읽지 않는다. 기본 `ko`/dark HTML을 정적으로 렌더링하고, `theme-bootstrap.js`가 hydration 전 `muze-theme` cookie를 적용한다. locale과 theme provider는 hydration 뒤 cookie/localStorage 값을 적용한다. 이를 요청별 렌더링으로 되돌릴 때는 공개 캐시와 초기 theme/locale 동작을 함께 검토한다.

### 서버 쓰기 요청

```text
Browser
  → same-origin 검사
  → Content-Length + 실제 stream 크기 제한
  → session/JWT와 role 확인
  → DB 기반 rate limit
  → Zod/명시적 값 검증
  → magic-byte + extension + allowlist 검증
  → service-role DB 작업 + R2 객체 작업
  → 실패 시 생성 자원 정리
  → no-store 응답
```

모든 route가 모든 단계를 필요로 하지는 않지만 순서를 바꾸면 큰 body나 인증 없는 요청이 비싼 작업에 도달할 수 있다.

## 새 코드 위치 결정

| 만들려는 것         | 위치                                                        |
| ------------------- | ----------------------------------------------------------- |
| 새 공개 URL         | `src/app/(public)/...` 어댑터 + `src/public/pages/...`      |
| 공개 query          | `src/public/features/<domain>/repository.ts`                |
| 관리자 화면         | `src/admin/pages/<domain>` 또는 `components/<domain>`       |
| API 로직            | public/admin/core의 domain route + `src/app` re-export      |
| 서버 전용 공통 보안 | `src/core/http`, `auth`, `uploads`, `supabase`              |
| DB 권한/제약/함수   | 새 `supabase/migrations/<timestamp>_*.sql`                  |
| CSS literal token   | `src/styles/(core)/foundations`                             |
| feature 전용 CSS    | 해당 public/admin styles 폴더의 module 또는 page stylesheet |
