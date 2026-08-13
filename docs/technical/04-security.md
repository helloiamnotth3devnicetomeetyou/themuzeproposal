# 보안 모델

## 신뢰 경계

브라우저, URL/query/cookie/header, Supabase anon 응답, 업로드 파일명과 MIME, 관리자 UI의 role 표시는 모두 신뢰하지 않는다. 최종 강제 지점은 서버 Route Handler와 Postgres RLS/constraint/function이다.

보안 관련 변경은 UI만 고치지 말고 다음 네 계층을 함께 확인한다.

1. `src/proxy.ts`와 Next response header
2. Route Handler의 origin/auth/validation/rate limit
3. Supabase RLS, grant, constraint, security-definer function
4. R2 접근 키 경계와 실제 파일 검증

## 인증과 세션

### 브라우저

`core/auth/auth.ts`가 로그인·OAuth·회원가입·프로필 변경의 브라우저 facade다. 비밀번호 로그인은 Supabase를 브라우저에서 직접 호출하지 않고 `/api/auth/login`을 통과해 애플리케이션 rate limit을 적용한다.

Google OAuth callback은 `code`를 서버에서 session으로 교환한다. `next`는 `safeRedirect`로 내부 상대 경로만 허용해 open redirect를 막는다.

Supabase Auth는 모든 환경에서 이메일 확인을 요구하고, 12자 이상이면서 영문 대·소문자·숫자·기호를 포함한 비밀번호 정책을 강제한다. 배포 전 hosted dashboard 설정을 `supabase/config.toml`과 동일하게 맞춘다.

### 서버

- 보호 페이지의 proxy는 `getClaims()`로 JWT 서명을 검증하고 session cookie를 refresh한다.
- 관리자 layout도 다시 claims와 DB role을 확인한다.
- 민감 Route Handler는 필요에 따라 `getUser()`로 Supabase Auth 서버 확인을 수행한다.
- `getSession()`의 cookie 값만으로 권한을 결정하지 않는다.

보호 URL은 현재 `/admin/**`, `/account`, `/protect`다. 새 사용자 전용 page를 추가하면 proxy의 `isAuthRoute` 범위와 redirect query를 갱신한다.

## 권한

`profiles.role`이 권한의 정본이다.

| 역할 | 권한 |
| --- | --- |
| `null` | 일반 계정, 본인 데이터만 |
| `editor` | 관리자 스튜디오와 콘텐츠 작업 |
| `super_admin` | editor 권한 + 관리자 계정 관리 |

`/api/admin/accounts`는 다음 위험 작업을 막는다.

- 자기 역할 변경/해제
- 마지막 super admin 강등/해제
- 존재하지 않는 대상 변경
- editor의 계정 관리 접근

DB의 `public.is_admin()`, `is_super_admin()`, RLS가 같은 의미를 가져야 한다. role을 추가하거나 이름을 바꿀 때 TypeScript union, Zod enum, DB check, helper, policy, navigation을 전부 검색한다.

## CSRF와 요청 출처

상태 변경 Route Handler는 `isSameOriginRequest()`로 `Origin`을 필수 확인한다. origin이 없거나 파싱 불가능하거나 request origin과 다르면 거부한다. cookie의 SameSite만으로 대체하지 않는다.

새 POST/PATCH/DELETE route의 기본 순서:

```text
same-origin → body size → auth → role → rate limit → parse/schema → side effect
```

GET에서 상태를 변경하지 않는다. API 성공·실패 응답은 민감 경로에서 `Cache-Control: no-store`를 설정한다.

## 입력 검증과 오류

- JSON shape는 Zod 또는 명시적 parser로 서버에서 검증한다.
- UUID, 이메일, 날짜, enum, URL, 문자열 최대 길이를 제한한다.
- URL 렌더링은 `safeHref()`로 HTTP(S)만 허용한다.
- rich text는 허용 tag/attribute만 DOMPurify로 남기고 링크에 `noopener noreferrer`를 강제한다.
- SVG는 doctype/entity와 script를 거부하고 SVG profile로 정화한 후 서버에서만 처리한다.
- 클라이언트 오류에는 내부 Supabase 메시지, SQL, key, stack을 노출하지 않고 안정된 code를 반환한다.
- 서비스 장애와 사용자 오류를 구분한다: 잘못된 입력 400/422, 미인증 401, 권한 403, 중복 409, rate limit 429, 과대 파일 413, 의존 서비스 실패 503.

## 요청 크기

`Content-Length`는 빠른 거부용일 뿐이다. multipart route는 `parseFormDataWithinLimit()`으로 stream을 직접 세어 chunked body 우회를 막는다. 새 업로드 route는 전체 body 상한을 파일 상한 + 작은 metadata 여유로 정한다.

현재 중요한 상한은 route별 상수다. 한 곳의 값을 바꾸면 다음을 함께 확인한다.

- browser UI 표시
- Route Handler body/file 제한
- `validateFileSignature` profile
- Supabase bucket `file_size_limit`
- form field의 `max_file_size_mb`
- E2E file-validation 테스트

## 파일 업로드

브라우저가 보내는 `file.type`과 확장자를 신뢰하지 않는다. `validateFileSignature()`가 header magic bytes/container metadata로 JPEG, PNG, WebP, GIF, PDF, ZIP, PPT/PPTX, MP3, MP4를 판별하고 profile allowlist와 대조한다. 이어 원래 확장자도 검증한다.

업로드 체크리스트:

1. 인증·role/ownership
2. same-origin
3. body와 개별 파일 크기
4. 파일 개수
5. magic byte와 profile
6. extension 일치
7. 안전한 bucket/path allowlist
8. 서버 생성 UUID path
9. private bucket 접근 policy
10. DB 실패 시 이미 올린 object 제거

관리자 MP3 업로드는 서버가 실제 전체 파일의 크기와 시그니처를 검증한 뒤 service-role 경로로 저장한다. 클라이언트가 제시한 미리보기나 metadata만으로 업로드 권한을 발급하지 않는다.

## 속도 제한

### 로그인

이메일과 IP를 `AUTH_RATE_LIMIT_SECRET` HMAC-SHA256으로 hash하고 `consume_login_rate_limit` RPC가 private table을 원자적으로 갱신한다. 성공 시 identifier 제한을 reset한다. 클라이언트는 `Retry-After`를 읽는다.

### 제출

`SUBMISSION_RATE_LIMIT_SECRET`과 scope별 설정을 사용한다.

| scope | 제한 |
| --- | --- |
| `contact_inquiry` | IP당 15분 5회 |
| `protect_report` | IP 및 user당 15분 5회 |
| `audition_submission` | IP 및 user당 24시간 3회 |

rate-limit 저장소나 secret이 없으면 fail-open하지 않고 503으로 실패한다.

### IP 신뢰

`clientIp()`는 `VERCEL=1`일 때 Vercel이 덮어쓰는 `x-vercel-forwarded-for`의 단일 값만 신뢰한다. 비 Vercel 운영 배포는 proxy가 덮어쓰는 `TRUSTED_CLIENT_IP_HEADER`를 반드시 설정하며, 값이 없거나 모호하면 로그인은 503으로 안전하게 실패한다. 임의 `x-forwarded-for` 신뢰는 금지한다.

## 응답 보안 헤더와 CSP

`next.config.ts`가 전역으로 다음을 설정한다.

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- HSTS 1년 + subdomain + preload
- strict-origin-when-cross-origin referrer policy
- camera/microphone/geolocation/payment/usb 차단

`proxy.ts`는 production page response에 요청별 nonce CSP를 만든다. 기본 self, object 금지, frame ancestor 금지, form self, image/media HTTPS를 허용한다. Vercel preview toolbar만 조건부 origin을 추가한다. 개발 모드에서는 HMR 때문에 CSP를 생략한다.

외부 script/font/connect origin을 추가할 때 wildcard보다 정확한 origin을 추가하고, production에서 실제 nonce/CSP 위반을 확인한다. proxy matcher는 `/api`, Next static/image, favicon/images를 제외하므로 API 보안은 header보다 route validation이 중심이다.

## 미리보기 보안

preview 진입은 다음을 모두 요구한다.

- 형식이 맞는 preview token
- 내부 origin의 allowlisted pathname
- 유효 session
- admin role
- TTL 안의 localStorage envelope

허용 page를 추가할 때 `ALLOWED_PATHS`를 넓은 `.*`로 바꾸지 않는다. query의 `path`가 외부 origin으로 해석되지 않는지 유지한다. 종료 route는 draft cookie와 local payload를 정리한다.

## 감사와 민감정보

관리자 콘텐츠 변경은 trigger로 `admin_audit_logs`에 남는다. 문의·제보·지원서의 audit은 status와 관리자 메모처럼 제한된 필드만 기록해 원문 개인정보 복제를 피한다. R2 객체를 바꾸는 서버 route도 별도 audit row를 쓴다.

하지 말아야 할 것:

- request body, 비밀번호, token, service key, 원본 증빙을 console에 기록
- 감사 편의를 이유로 민감 row 전체를 audit JSON에 복사
- 공개 bucket에 문의·제보·오디션 파일 저장
- `schema.remote.sql`이나 seed에 실제 사용자 데이터 포함

현재 audit table은 append-only이며 자동 retention이 없다. 보존 기간, 삭제 권한, 백업 정책은 운영·법무 결정 후 migration/job으로 추가한다.

## 환경과 secret

| 변수 | 공개 가능 | 용도 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 예 | canonical site origin |
| `NEXT_PUBLIC_SUPABASE_URL` | 예 | Supabase origin |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 예 | RLS 적용 공개 key |
| `NEXT_PUBLIC_SUPABASE_PROJECT_REF` | 예 | URL 일치 검증 |
| `SUPABASE_SERVICE_ROLE_KEY` | 아니오 | 서버 RLS 우회 작업 |
| `AUTH_RATE_LIMIT_SECRET` | 아니오 | 로그인 identifier HMAC |
| `SUBMISSION_RATE_LIMIT_SECRET` | 아니오 | 제출 identifier HMAC |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | 아니오 | R2 S3 API 접근 |
| `R2_PUBLIC_BUCKET`, `R2_PRIVATE_BUCKET` | 아니오 | 물리 R2 bucket 이름 |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | 예 | 공개 R2 CDN base |
| `VERCEL_TOKEN` | 아니오 | 서버의 Vercel Web Analytics API 인증 |
| `VERCEL_PROJECT_ID` | 아니오 | 조회할 Vercel 프로젝트 식별자 |
| `VERCEL_TEAM_ID` | 아니오 | 팀 소속 프로젝트일 때의 선택 식별자 |
| `STRICT_ENV_VALIDATION` | 설정 | 비 Vercel production의 엄격 검증 |

production/Vercel build는 누락, URL/project 불일치, 32자 미만 rate-limit secret을 실패시킨다. secret은 코드·문서·브라우저·CI 로그에 실제 값을 쓰지 않는다.

Vercel Analytics 설정은 선택 사항이므로 build의 필수 환경 변수는 아니다. 그러나 값이 설정된 환경에서는 `VERCEL_TOKEN`을 service-role key와 같은 수준의 서버 전용 secret으로 취급한다. `/api/admin/page-stats`는 session과 DB admin role을 확인한 뒤에만 token을 사용하고, 외부 API 오류·요금제 정보·응답 원문을 그대로 브라우저에 전달하지 않는다.

## 보안 변경 완료 조건

- 허용 사례와 거부 사례가 모두 테스트됨
- 인증/role/RLS가 UI와 서버 양쪽에서 일치
- 큰 body와 잘못된 content type이 side effect 전에 거부됨
- 실패 중 생성된 DB row/object가 정리됨
- service key가 client graph에 들어가지 않음
- 민감 응답과 오류가 `no-store`이며 내부 메시지를 숨김
- 관련 SQL security boundary test 통과
- `npm audit --audit-level=high` 통과 또는 명시된 예외 승인
