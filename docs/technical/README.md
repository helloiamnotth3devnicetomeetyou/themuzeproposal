# THE MUZE 기술 인수인계

이 문서는 2026-08-12 현재 저장소의 코드, 설정, SQL 마이그레이션을 기준으로 작성한 개발자용 진입점이다. 기획 문서가 아니라 **현재 구현의 동작 방식과 변경 규칙**을 기록한다.

## 인수인계의 목표

인수받는 사람은 다음 다섯 가지를 혼자 수행할 수 있어야 한다.

1. 로컬에서 앱을 실행하고 공개·관리자 화면에 접근한다.
2. 변경의 위치를 찾고, 필요한 범위의 테스트를 실행한다.
3. Supabase migration과 RLS 변경을 안전하게 적용한다.
4. 배포 환경의 secret과 외부 서비스 책임자를 확인한다.
5. 장애를 앱·Supabase·Vercel·설정 문제로 나누어 대응한다.

이 문서는 secret 값, 고객 데이터, 운영 계정의 이메일을 담지 않는다. 그런 정보는 접근 권한이 제한된 secret store 또는 운영 런북에만 기록하고, 담당자와 마지막 확인일을 함께 남긴다.

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

## 첫날 인수 체크리스트

### 1. 권한과 소유자 확인

다음 시스템에 접근 가능한지 확인한다. 실제 계정이나 token을 이 문서에 기록하지 않는다.

| 시스템                     | 필요한 권한                                          | 인수 시 확인할 것                                                                          |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| GitHub                     | 저장소 read/write, Actions 로그 읽기                 | 기본 브랜치 보호 규칙, 배포 workflow 상태                                                  |
| Vercel                     | 프로젝트·배포 로그·환경 변수 읽기, 필요 시 배포      | production/preview 프로젝트, 연결된 Git repository, 환경 변수 소유자                       |
| Supabase                   | 프로젝트·Auth·SQL·로그 접근                          | production/preview project ref, Database password·service key 보관 위치, Auth redirect URL |
| Cloudflare R2              | public/private bucket, API token, CDN·CORS 설정 접근 | bucket 이름, token rotation 위치, 공개 CDN domain, hero upload CORS                        |
| Google OAuth·메일 provider | 설정을 조회하거나 담당자에게 요청할 수 있는 권한     | OAuth redirect URL, client secret 갱신 절차, 메일 발송 책임자                              |
| 도메인/DNS                 | 설정을 확인하거나 담당자에게 요청할 수 있는 권한     | canonical origin, DNS·TLS 갱신 담당자                                                      |

`super_admin`은 최소 한 명이 존재해야 한다. 일반 `editor`는 콘텐츠를 관리할 수 있지만 관리자 역할을 관리할 수 없다. 특정 담당자 한 명만 super_admin이거나 Vercel/Supabase 소유자인 상태는 인수 완료가 아니다.

### 2. 로컬 환경 확인

1. `node --version`이 22 계열인지 확인한다.
2. `npm ci`로 lockfile 기준 dependency를 설치한다.
3. `.env.example`을 `.env.local`로 복사하고 개발용 secret store의 값을 주입한다.
4. `npm run dev`로 홈과 `/login`을 연다.
5. 권한이 있는 테스트 관리자 계정으로 `/admin`에 로그인한다.
6. `npm run lint`, `npm run typecheck`, `npm run test`를 실행한다.

DB를 건드리는 인수나 변경이라면 Docker를 실행한 뒤 `npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector`와 `npm run db:test`를 추가한다. 운영 프로젝트에 연결된 상태에서 `supabase db reset`을 실행하지 않는다.

### 3. 배포와 외부 연동 확인

production과 preview 각각에 대해 다음을 확인한다.

- `NEXT_PUBLIC_SITE_URL`이 실제 canonical URL과 일치하는지
- Supabase URL과 project ref가 일치하고 R2 공개 CDN URL이 올바른지
- service role key와 두 rate-limit HMAC secret이 서버 환경 변수에만 있는지
- Supabase Auth의 Site URL과 Google OAuth callback/redirect allowlist가 실제 도메인과 일치하는지
- `VERCEL_TOKEN`과 `VERCEL_PROJECT_ID`가 설정된 경우 `/admin/analytics`가 동작하는지
- 비 Vercel production이라면 `TRUSTED_CLIENT_IP_HEADER`와 reverse proxy 설정이 함께 준비됐는지

`npm run validate:env`는 production 수준의 필수 환경 값을 검사하지만, Google OAuth dashboard·도메인 DNS·Vercel 권한까지 검증하지는 않는다. 이들은 인수 담당자가 별도로 확인한다.

## 문서 지도

| 문서                                                               | 답하는 질문                                                      |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| [01-project-overview.md](./01-project-overview.md)                 | 이 제품은 무엇이고 어떤 화면과 기능이 있는가?                    |
| [02-architecture.md](./02-architecture.md)                         | 요청이 어느 계층을 지나고 새 코드는 어디에 두는가?               |
| [03-data-and-supabase.md](./03-data-and-supabase.md)               | 테이블, RLS, R2 객체 저장소, 마이그레이션은 어떻게 연결되는가?   |
| [04-security.md](./04-security.md)                                 | 인증·권한·입력·업로드 보안 경계는 무엇인가?                      |
| [05-frontend-and-design.md](./05-frontend-and-design.md)           | 디자인 언어, CSS, 반응형, 접근성, 다국어 규칙은 무엇인가?        |
| [06-code-style-and-workflows.md](./06-code-style-and-workflows.md) | 코드 스타일과 기능별 구현 절차는 무엇인가?                       |
| [07-testing-and-operations.md](./07-testing-and-operations.md)     | 테스트, CI, 배포, 장애 확인은 어떻게 하는가?                     |
| [08-admin-analytics.md](./08-admin-analytics.md)                   | 관리자 페이지 통계의 설정, 권한, API, 장애 처리는 어떻게 하는가? |

`docs/reference/`는 참고 문서다. 구현 판단은 실제 코드와 migration을 우선한다. 전체 문서 목록은 [../README.md](../README.md)를 본다.

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

- 작업을 시작하기 전과 끝낼 때 `git status`를 확인한다. 소유자가 불명확한 변경은 덮어쓰거나 정리하지 않고 담당자에게 확인한다.
- 문서는 UTF-8로 유지한다. PowerShell 구버전 콘솔에서 한글이 깨져 보일 수 있으므로 파일 자체의 인코딩 문제로 단정하지 말고 UTF-8 지원 편집기에서 재확인한다.
- `supabase/schema.remote.sql`은 `audition_campaigns`, `avatar_assets`, `admin_onboarding_progress`는 포함하지만 2026-08-10의 최신 migration 일부보다 뒤처져 있다. 스냅샷만 보고 현재 스키마라고 판단하지 말고 `npm run db:status`와 migration 전체를 확인한다.
- 감사 로그에는 자동 보존 기간이 없다. 개인정보·운영 정책이 정해지면 DB 보존 작업을 별도로 추가해야 한다.
- 요청 IP 신뢰 모델은 Vercel 배포를 전제로 한다. 비 Vercel 호스팅에서는 IP가 `unknown`으로 묶이므로 프록시 신뢰 정책을 먼저 설계해야 한다.

## 운영 책임 경계

| 영역          | 코드로 관리하는 것                                   | 운영에서 결정·관리할 것                                       |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| 애플리케이션  | Next route, 권한 확인, 입력 검증, cache invalidation | Vercel 배포 권한, 로그 보존, rollback 승인                    |
| Supabase      | migration, RLS, RPC                                  | project 접근권한, Auth provider 설정, DB backup/복구 정책     |
| Cloudflare R2 | 객체 path·서명 URL·파일 검증                         | bucket 접근권한, API token rotation, CDN/CORS, 객체 보존 정책 |
| 콘텐츠        | 관리자 편집 UI, 발행 상태, 감사 로그                 | 콘텐츠 승인 주체, 공개 일정, 개인정보 보존 기준               |
| 외부 연동     | OAuth callback 처리, Vercel Analytics API 호출       | Google/OAuth client 소유자, token rotation, 플랜·비용         |
| 보안          | CSP, same-origin, rate limit, 파일 시그니처 검증     | incident 연락망, secret rotation, 법무·보존 정책              |

코드가 관리하지 않는 운영 결정을 코드의 기본값으로 추정하지 않는다. 예를 들어 `supabase/config.toml`은 로컬 설정일 뿐 hosted production의 Auth 설정을 보장하지 않고, `schema.remote.sql`은 운영 적용 상태를 보장하지 않는다.

## 변경·배포 인수 절차

1. 변경할 사용자 흐름과 영향을 받는 URL/API/테이블을 먼저 적는다.
2. `rg`로 caller, route, RLS policy, migration, unit/E2E/SQL test를 찾는다.
3. 기존 helper·editor·repository를 재사용해 최소 범위로 구현한다.
4. 필요한 검증을 로컬에서 실행한다. DB 권한 변경에는 SQL test, 사용자 흐름 변경에는 E2E를 포함한다.
5. migration은 additive 변경을 먼저 적용하고, 앱 배포 뒤 backfill·관측을 거쳐 별도 migration으로 제거한다.
6. 공개 콘텐츠 영향이 있으면 해당 cache tag가 무효화되는지 확인한다.
7. PR 또는 배포 기록에 아래 인수 항목을 남긴다.

### 변경 기록 템플릿

```md
## 변경 요약

- 사용자 흐름 / URL:
- 영향 범위: 공개 | 관리자 | API | DB | R2 | 외부 연동

## 배포 순서

1.
2.

## 환경·운영 변경

- 새/변경 환경 변수:
- secret store 또는 외부 콘솔에서 수행할 작업:
- cache tag / backfill / 보존 정책:

## 검증

- 실행한 명령:
- 수동 확인한 화면/권한:
- 롤백 또는 복구 방법:
```

## 장애 접수 시 첫 15분

1. 영향 범위를 확인한다: 전체 공개 사이트, 특정 공개 페이지, 관리자, 로그인, 업로드, 제출 중 어디인지 구분한다.
2. 최근 Vercel deployment·GitHub Actions·Supabase 상태와 환경 변수 변경 이력을 확인한다.
3. 재현 가능한 URL, 시간, 계정 역할, 응답 status를 남긴다. token·개인정보·원본 첨부파일은 남기지 않는다.
4. 공개 페이지 문제는 [07-testing-and-operations.md](./07-testing-and-operations.md)의 페이지 실패 절차를, 권한·제출 문제는 [04-security.md](./04-security.md)를 따른다.
5. DB 또는 R2 객체에 영향을 주는 임시 조치는 migration·백업·복구 계획 없이 실행하지 않는다.

장애 종료 후에는 원인, 영향 시간, 임시 조치, 영구 수정, 필요한 문서·테스트 보완을 배포 기록에 남긴다.

## 인수 완료 기준

다음 항목을 모두 확인하면 기술 인수인계를 완료할 수 있다.

- 인수자가 로컬 앱·테스트·관리자 로그인을 독립적으로 실행했다.
- GitHub, Vercel, Supabase, OAuth/메일 provider, 도메인 담당자와 접근 경로를 확인했다.
- production/preview 환경 변수의 보관 위치와 secret rotation 담당자를 확인했다.
- 최소 한 명의 super_admin과 그 복구 절차를 확인했다.
- migration 적용 상태, pending 작업, schema snapshot의 한계를 이해했다.
- 공개 저장 후 cache invalidation, private upload의 거부 사례, 로그인·관리자 보호 경계를 수동으로 확인했다.
- 감사 로그와 private attachment의 보존 정책, 비 Vercel IP 신뢰 정책, 전용 error tracking의 부재를 운영 위험으로 인지하고 담당자를 정했다.
- 최근 변경 또는 배포 한 건에 대해 위 변경 기록 템플릿을 작성할 수 있다.
