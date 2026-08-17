# 장애 대응 Runbook

이 문서는 담당자가 화면에서 실제로 클릭·확인하는 절차다. 판단 기준과 원인 분류는 [07-testing-and-operations.md](./07-testing-and-operations.md)를 따르고, 이 문서는 "어느 대시보드에서 무엇을 본다"에 집중한다. secret 값, 실제 URL, 담당자 개인 연락처는 이 문서에 쓰지 않는다 — 운영 secret store와 on-call 명단을 가리키는 참조만 남긴다.

## 0. 먼저 할 것 (5분 이내)

1. 영향 범위를 한 문장으로 적는다: 전체 공개 사이트 / 특정 페이지 / 관리자 / 로그인 / 업로드 / 제출 중 어디인가.
2. 아래 표에서 증상에 맞는 화면으로 바로 간다. 순서대로 다 보지 않는다.
3. 조치 전에 "지금 상태"를 스크린샷이나 텍스트로 남긴다 — 롤백 여부를 판단할 증거가 된다.

## 1. 증상 → 확인할 화면

| 증상 | 1차로 볼 화면 | 확인할 것 |
| --- | --- | --- |
| 사이트 전체가 안 뜸 / 500 | Vercel → Deployments | 최근 배포 상태(Building/Error), 직전 배포와의 diff, Build/Function 로그 |
| 특정 페이지만 깨짐 | Sentry → Issues (해당 project: server/edge/client) | 최근 이벤트의 스택트레이스, 발생 시각과 배포 시각의 상관관계 |
| 502/504, 함수 timeout | Vercel → Deployments → Functions 로그 | 어떤 route인지, cold start인지 반복 실패인지 |
| 로그인/회원가입 실패 | Supabase → Authentication → Logs, Sentry | rate limit 503인지, OAuth redirect 오류인지, 이메일 확인 문제인지 |
| DB 오류, RLS 거부 | Supabase → Logs → Postgres Logs, Database → Roles/Policies | 정책 이름, 위반한 제약, 최근 migration 적용 여부(`npm run db:status`) |
| 업로드/이미지 실패 | Cloudflare R2 → 해당 bucket → Metrics/Objects, Vercel Function 로그 | object가 실제로 생성됐는지, CORS 오류인지, 크기/서명 검증 실패인지 |
| 관리자 통계 비어 있음/오류 | Vercel → Settings → Environment Variables, `/admin/analytics` 응답 | `VERCEL_TOKEN`/`VERCEL_PROJECT_ID` 유효성, Vercel Analytics API rate limit |
| Retention cron 실패 | Vercel → Cron Jobs 실행 로그, Supabase → `retention_deletion_jobs` 상태 | `status`가 `failed`로 멈춘 row, `CRON_SECRET` 인증 실패 여부 |
| 급증한 요청 / 의심되는 abuse | Vercel → Analytics/Firewall, Supabase rate-limit 관련 테이블 | IP 패턴, rate limit 429/503 비율 |

각 화면에서 "언제부터"인지 먼저 확정한다. 배포 시각과 증상 시작 시각이 겹치면 최우선 용의자는 그 배포다.

## 2. 화면별 세부 확인

### Vercel
- **Deployments**: 실패한 빌드는 로그 하단 에러부터 본다. `npm run validate:env`가 실패하면 배포 자체가 막힌다 — 이건 정상 동작이다.
- **Functions**: route별 invocation, 에러율, duration. timeout 반복이면 외부 호출(R2, Supabase, OpenRouter, Vercel Analytics API) 중 하나가 느려진 것이다.
- **Cron Jobs**: retention cron의 최근 실행 성공/실패, 실행 시각(03:00 UTC 기준).
- **Environment Variables**: 값 자체를 문서화하지 않는다. 존재 여부·최근 변경 시각만 확인한다.

### Supabase
- **Postgres Logs**: RLS 거부, constraint violation, deadlock.
- **Auth → Logs**: 로그인 실패 사유(잘못된 자격증명 vs rate limit vs email 미확인).
- **Database → Roles/Policies**: `is_admin()`, `is_super_admin()` 정책이 기대와 일치하는지.
- **Advisors**: 보안/성능 경고가 이번 장애와 관련 있는지.

### Sentry
- server(`sentry.server.config.ts`)/edge(`sentry.edge.config.ts`)/client(`src/instrumentation-client.ts`) 세 project를 따로 확인한다 — 문제 계층에 따라 이벤트가 다른 곳에 쌓인다.
- 같은 fingerprint의 이벤트 수와 최초 발생 시각으로 신규 회귀인지 기존 이슈 재발인지 구분한다.
- release/deployment 태그로 어떤 배포부터 발생했는지 확인한다.

### Cloudflare R2
- bucket별(`artist-assets`, `album-covers`, `track-assets`, `business-assets`, `contact-attachments`, `protect-evidence`, `audition-attachments`) Metrics에서 요청 실패율.
- CORS 관련 실패는 브라우저 콘솔의 preflight 오류와 R2 bucket CORS 설정을 함께 본다.
- API token 만료/scope 축소는 R2 요청이 전부 인증 오류로 실패하는 형태로 나타난다.

## 3. Escalation 기준

| 심각도 | 기준 | 대응 |
| --- | --- | --- |
| SEV1 | 전체 공개 사이트 접근 불가, 로그인 전면 불가, 데이터 유출 의심 | 즉시 on-call 담당자에게 연락(연락 경로는 secret store/운영 런북 참조). 원인 불명이어도 먼저 알린다. |
| SEV2 | 특정 기능(제출, 업로드, 관리자 통계) 장애, 일부 사용자만 영향 | 담당 영역 owner에게 알리고 1시간 내 1차 원인 공유. 야간이면 다음 근무 시작 시 확인 가능한 수준이면 즉시 호출하지 않는다. |
| SEV3 | UI 오류, 성능 저하, 재현 안 되는 산발적 오류 | 티켓으로 기록하고 정규 근무 시간에 처리. |

담당자 배정은 [technical/README.md](./README.md)의 "권한과 소유자 확인" 표를 따른다: 애플리케이션/Vercel 문제는 애플리케이션 owner, Supabase/DB 문제는 Supabase owner, R2/CDN 문제는 Cloudflare owner, OAuth/메일 문제는 해당 provider 담당자. 소유자가 불명확하면 SEV1/SEV2는 즉시 전체 채널에 알리고 소유자를 찾는 것 자체를 첫 조치로 삼는다.

DB 또는 R2 객체에 영향을 주는 임시 조치는 migration·백업·복구 계획 없이 실행하지 않는다(원칙은 [technical/README.md](./README.md#장애-접수-시-첫-15분)와 동일).

## 4. 종료 후

- 원인, 영향 시간, 임시 조치, 영구 수정, 필요한 문서/테스트 보완을 배포 기록에 남긴다.
- 이번 장애로 새로 알게 된 "확인할 화면"이 있으면 이 문서의 1절 표를 갱신한다.
- 재발 방지가 코드/migration 변경이면 [CONTRIBUTING.md](../../CONTRIBUTING.md)의 문서 갱신 규칙을 따른다.
