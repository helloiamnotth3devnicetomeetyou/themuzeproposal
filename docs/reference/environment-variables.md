# 환경 변수와 외부 서비스 매트릭스

> 기준: `.env.example`, `scripts/validate-env.mjs`, `next.config.ts`, `vercel.json`

이 문서는 변수 이름과 필수 여부만 다룬다. **실제 값은 절대 여기 포함하지 않는다.** 값은 각 환경의 secret store(Vercel Environment Variables, 팀 password manager 등)에만 둔다. 개별 변수의 의미와 사용처는 [technical/04-security.md](../technical/04-security.md#환경과-secret)와 [technical/README.md](../technical/README.md)를 함께 본다.

## 표 읽는 법

- **Local**: `.env.local`, 개발자 개인 Supabase 프로젝트 기준.
- **Preview**: Vercel preview 배포.
- **Production**: Vercel production 배포 및 `STRICT_ENV_VALIDATION=1`을 설정한 비-Vercel production.
- **필수 여부**: 필수 / 선택(기능 저하) / 선택(완전 무시).
- **회전 영향**: 값을 바꿨을 때 무엇이 끊기는지. 즉시 재배포가 필요한지 여부를 포함한다.

## Supabase

| 변수 | Local | Preview | Production | 저장 위치 | 회전 영향 |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 필수 | 필수 | 필수 | Vercel env (public) | 값 변경 시 프로젝트 자체가 바뀌므로 anon key/project ref와 반드시 함께 변경, 재배포 필요 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 필수 | 필수 | 필수 | Vercel env (public) | RLS만 적용되는 public key. 유출돼도 RLS가 방어선이지만, 다른 값으로 교체 시 재배포 필요 |
| `NEXT_PUBLIC_SUPABASE_PROJECT_REF` | 필수 | 필수 | 필수 | Vercel env (public) | URL과 project ref 불일치 시 `validate:env`가 build를 실패시킴 |
| `SUPABASE_SERVICE_ROLE_KEY` | 필수 | 필수 | 필수 | Vercel env (server-only), 절대 client bundle에 노출 금지 | 회전 시 서버 전체가 즉시 새 키로 재배포돼야 함(구 키는 즉시 폐기 권장). 유출 시 RLS 완전 우회 위험 — SEV1 |
| `SUPABASE_DB_URL` | 선택(CLI 연결 실패 시) | 불필요(일반적으로) | 불필요(일반적으로) | 개발자 로컬 secret store | `npm run db:status`/`db:push`/`db:dump`에만 사용, 앱 런타임과 무관. DB 비밀번호 회전 시 함께 갱신 |

## Rate limit / 인증

| 변수 | Local | Preview | Production | 저장 위치 | 회전 영향 |
| --- | --- | --- | --- | --- | --- |
| `AUTH_RATE_LIMIT_SECRET` | 필수(32자+) | 필수 | 필수 | Vercel env (server-only) | 회전 시 기존 rate-limit identifier가 전부 무효화됨(사용자 영향 없음, 카운터만 리셋). preview/production 다른 값 권장 |
| `SUBMISSION_RATE_LIMIT_SECRET` | 필수(32자+) | 필수 | 필수 | Vercel env (server-only) | 위와 동일한 성격, contact/protect/audition 세 scope 공유 |
| `TRUSTED_CLIENT_IP_HEADER` | 불필요 | 조건부 필수(비-Vercel proxy 사용 시) | 조건부 필수(비-Vercel 배포 또는 앞단 proxy 존재 시) | Vercel env | 잘못 설정하면 클라이언트가 IP header를 위조해 rate limit 우회 가능 — 변경 시 proxy 설정과 반드시 동기화 |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | 필수 | 필수 | 필수 | Vercel env (public) | Supabase Auth의 CAPTCHA provider 설정과 동일한 키 쌍이어야 함, 하나만 바꾸면 로그인 CAPTCHA 불일치 |
| `TURNSTILE_SECRET_KEY` | 필수 | 필수 | 필수 | Vercel env (server-only) | 위와 동일 키 쌍, 회전 시 Cloudflare Turnstile 대시보드와 Supabase Auth 설정 동시 갱신 필요 |

## AI

| 변수 | Local | Preview | Production | 저장 위치 | 장애 시 대체 동작 |
| --- | --- | --- | --- | --- | --- |
| `OPENROUTER_API_KEY` | 선택 | 선택 | 선택 | Vercel env (server-only) | 없거나 호출 실패 시 `requestJsonCompletion()`이 `null` 반환 → 문의 분류/번역 실패해도 제출·저장은 그대로 성공(fail-open by design) |
| `AI_TEXT_MODEL` | 선택(기본값 사용) | 선택 | 선택 | Vercel env | 미설정 시 `google/gemini-3.1-flash-lite` 사용. 잘못된 모델 id는 OpenRouter 호출 실패로 이어지지만 위와 같은 이유로 사용자 흐름은 막히지 않음 |

## Cloudflare R2

| 변수 | Local | Preview | Production | 저장 위치 | 회전 영향 |
| --- | --- | --- | --- | --- | --- |
| `R2_ACCOUNT_ID` | 필수 | 필수 | 필수 | Vercel env (server-only) | 계정 자체 식별자, 사실상 회전 대상 아님 |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | 필수 | 필수 | 필수 | Vercel env (server-only) | 회전 시 즉시 재배포 필요, 구 token은 즉시 폐기. 업로드/삭제 전체가 이 token에 의존 |
| `R2_PUBLIC_BUCKET` / `R2_PRIVATE_BUCKET` | 필수 | 필수 | 필수 | Vercel env | bucket 이름 변경은 기존 저장된 객체 경로와 불일치를 유발하므로 마이그레이션 계획 없이 바꾸지 않음 |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | 필수 | 필수 | 필수 | Vercel env (public) | CDN 도메인 변경 시 기존 공개 콘텐츠 URL이 깨짐, hero 업로드 CORS 설정도 이 origin 기준 |

## Vercel Analytics (관리자 통계)

| 변수 | Local | Preview | Production | 저장 위치 | 장애 시 대체 동작 |
| --- | --- | --- | --- | --- | --- |
| `VERCEL_TOKEN` | 선택 | 선택 | 선택(설정 시 service-role key 수준으로 취급) | Vercel env (server-only) | 없으면 `/admin/analytics`가 비활성 표시로 저하, 다른 기능에는 영향 없음 |
| `VERCEL_PROJECT_ID` | 선택 | 선택 | 선택 | Vercel env | 위와 동일 |
| `VERCEL_TEAM_ID` | 불필요(개인 프로젝트) | 조건부 | 조건부(팀 소속 프로젝트일 때) | Vercel env | 팀 소속 프로젝트인데 누락되면 Analytics API가 프로젝트를 찾지 못함 |

## Cron / 사이트 기본

| 변수 | Local | Preview | Production | 저장 위치 | 회전 영향 |
| --- | --- | --- | --- | --- | --- |
| `CRON_SECRET` | 불필요 | 필수 | 필수 | Vercel env (server-only) | retention cron 인증 토큰. 회전 시 Vercel이 자동으로 새 값을 헤더에 실어 보내므로 Vercel 소유 secret이면 별도 동기화 불필요 |
| `NEXT_PUBLIC_SITE_URL` | 필수 | 필수(preview 자체 도메인 또는 고정값) | 필수 | Vercel env (public) | Supabase Auth Site URL/Redirect URL과 반드시 일치, 불일치 시 OAuth 콜백 실패 |
| `STRICT_ENV_VALIDATION` | 불필요 | 불필요(Vercel은 이미 엄격 검증) | 비-Vercel 호스팅에서만 설정 | Vercel/CI env | `1`로 설정 시 누락 변수를 build 실패로 처리 |

## 필수 확인 순서 (신규 환경 구성 시)

1. Supabase 4종 → 앱이 최소 기동 가능.
2. `AUTH_RATE_LIMIT_SECRET`, `SUBMISSION_RATE_LIMIT_SECRET` → 로그인/제출 가능.
3. Turnstile 2종, Supabase Auth CAPTCHA 설정 동기화 → 로그인/회원가입 CAPTCHA 통과 가능.
4. R2 5종 → 업로드/이미지 정상.
5. `CRON_SECRET` (preview/production) → retention cron 인증 가능.
6. 선택 항목(AI, Vercel Analytics) → 없어도 배포는 되지만 해당 기능만 저하.

`npm run validate:env`는 이 중 production 수준 필수 값만 검사한다. Google OAuth dashboard 설정, Supabase Auth 대시보드의 CAPTCHA provider, DNS는 스크립트가 검증하지 않으므로 수동으로 확인한다.
