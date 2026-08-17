# 05. 운영·외부서비스·Production 스모크 QA

> **기준 커밋:** `0d79efb18de637d02ce210464a1d340ba9294def`  
> 모든 항목은 **클릭·입력·확인 절차 → 기대 결과 → 결과 기록** 순서로 실행한다.

| 표기 | 의미 |
| --- | --- |
| **L** | Local에서만 안전하게 재현하는 검증 |
| **S** | Staging/Preview의 QA 데이터·계정으로 수행하는 검증 |
| **P** | Production에서만 확정 가능한 도메인·보안 헤더·외부 연동 검증 |
| **B** | Local과 Staging/Production 양쪽에서 수행하는 검증 |

> Production에서는 **QA 전용 계정·콘텐츠·파일만** 사용한다. 실제 접수·지원·신고·운영 데이터를 생성·수정·삭제하지 않는다.

> **이 파일의 범위:** 외부 서비스, 관측, 배포 뒤 기본 동작, 실제 도메인에서의 Production 스모크와 기존 운영/프로덕션 케이스  
> **케이스 수:** 19건

> 이 파일은 배포 직후 빠르게 실행한다. 심층 보안 점검은 01번 파일, 시각/조작 점검은 UI 원자 파일을 병행한다.

### OPS-001 — clean build

- **구역:** Build
- **실행 환경:** L
- **테스터 역할:** QA-DEV
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 새 clone에서 npm ci를 수행한다.
2. 2. typecheck/test:ci/build를 차례로 실행한다.

#### 기대 결과

각 command 결과가 문서화된 baseline과 일치하며 실패 시 재현 command/log가 남는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### OPS-002 — 실제 CI 환경 lint

- **구역:** Lint
- **실행 환경:** L/S
- **테스터 역할:** QA-DEV
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. CI와 동일 Node/npm/lockfile environment에서 npm run lint를 실행한다.

#### 기대 결과

lint가 통과하거나 환경 차이일 경우 exact version/dependency tree/CI status가 기록된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### OPS-003 — migration/db test

- **구역:** DB
- **실행 환경:** L/S
- **테스터 역할:** QA-DEV
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 빈 local Supabase에 migration을 적용한다.
2. 2. npm run db:test를 실행한다.

#### 기대 결과

schema/RLS/RPC/retention test가 전체 통과한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### OPS-004 — 브라우저 E2E

- **구역:** E2E
- **실행 환경:** L/S
- **테스터 역할:** QA-DEV
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. local Supabase와 test env를 기동한다.
2. 2. npm run test:e2e를 실행한다.

#### 기대 결과

artist/auth/contact/discography/file/navigation/notice/protect E2E가 통과하고 실패 trace가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### OPS-005 — CORS/policy

- **구역:** R2
- **실행 환경:** P
- **테스터 역할:** QA-DEV
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. production origin과 다른 origin에서 public/private bucket 요청을 시도한다.
2. 2. hero direct upload도 확인한다.

#### 기대 결과

필요한 public asset/authorized upload만 가능하고 private object/임의 origin 요청은 차단된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### OPS-006 — 실 도메인 token

- **구역:** Turnstile
- **실행 환경:** P
- **테스터 역할:** QA-DEV
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. production 도메인에서 login/contact/protect/audition CAPTCHA를 수행한다.

#### 기대 결과

hostname/action key mismatch 없이 통과하며 실패 token은 의도대로 거부된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### OPS-007 — AI 성공/실패 fallback

- **구역:** OpenRouter
- **실행 환경:** S/P
- **테스터 역할:** QA-DEV
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. optional AI classification을 켠 상태에서 QA record를 제출한다.
2. 2. provider timeout/key 없음도 확인한다.

#### 기대 결과

성공 결과는 해당 record에만 반영되고 failure/비활성 상태에서도 핵심 제출 흐름은 성공한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### OPS-008 — analytics dashboard

- **구역:** Vercel Analytics
- **실행 환경:** P
- **테스터 역할:** QA-SUPER
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. admin analytics를 연다.
2. 2. 기간/empty/error 상태를 확인한다.

#### 기대 결과

실제 Vercel data만 보이고 token이 browser/API response/Sentry에 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### OPS-009 — daily retention cron

- **구역:** Cron
- **실행 환경:** S/P
- **테스터 역할:** QA-SUPER
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 전용 QA expired record를 준비한다.
2. 2. authenticated cron을 1회 실행한다.
3. 3. 같은 cron을 재실행한다.

#### 기대 결과

첫 실행은 정책대로 purge/retry하고 두 번째 실행은 중복 삭제/오류 없이 idempotent하다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### OPS-010 — release/alert

- **구역:** Sentry
- **실행 환경:** P
- **테스터 역할:** QA-DEV
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. release SHA가 포함된 controlled error를 전송한다.
2. 2. source map, environment, alert channel을 확인한다.

#### 기대 결과

오류가 올바른 release/environment으로 표시되고 stack trace가 읽히며 예제 route 없이 운영팀이 알림을 받는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### OPS-011 — 외부 장애 복구

- **구역:** Recovery
- **실행 환경:** S
- **테스터 역할:** QA-DEV
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. Supabase/R2/Turnstile/OpenRouter 각각 timeout/5xx fixture를 적용한다.
2. 2. public/admin 흐름을 수행한다.

#### 기대 결과

사용자 오류 copy·재시도·cleanup·Sentry/운영 로그가 일관되고 복구 후 데이터가 중복/유실되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### SMOKE-001 — production 기본 진입

- **구역:** 배포
- **실행 환경:** P
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 실제 production URL을 desktop/mobile에서 연다.
2. 2. build SHA/version과 page load를 확인한다.

#### 기대 결과

새 배포가 정상 서빙되고 home/layout/hero/nav에 blocking error가 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### SMOKE-002 — 핵심 public 탐색

- **구역:** 배포
- **실행 환경:** P
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. Home→Artist→Album→Track/외부 link→Notice를 순서대로 이동한다.

#### 기대 결과

핵심 콘텐츠 동선이 전부 동작하고 404, stale cache, broken media가 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### SMOKE-003 — 로그인/계정

- **구역:** 배포
- **실행 환경:** P
- **테스터 역할:** QA-USER-A
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. QA 계정으로 login→account→logout한다.

#### 기대 결과

세션·redirect·account·logout이 정상이다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### SMOKE-004 — Contact QA 제출

- **구역:** 배포
- **실행 환경:** P
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 전용 QA form data/PDF로 Contact를 submit한다.
2. 2. admin inbox를 확인한다.

#### 기대 결과

정상 submit·file·inbox·quota·status가 end-to-end로 일치한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### SMOKE-005 — Protect/Audition QA 제출

- **구역:** 배포
- **실행 환경:** P
- **테스터 역할:** QA-USER-A
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 전용 test report/campaign에 제출한다.
2. 2. admin triage/review에서 확인한다.

#### 기대 결과

권한·file·quota·review·audit가 end-to-end로 일치한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### SMOKE-006 — CMS QA content publish

- **구역:** 배포
- **실행 환경:** P
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 전용 QA notice 또는 content를 preview→publish한다.
2. 2. public page를 확인한다.
3. 3. unpublish/cleanup한다.

#### 기대 결과

preview/public/cache/audit가 정상이고 실제 운영 콘텐츠를 변경하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### SMOKE-007 — Sentry/보안 확인

- **구역:** 배포
- **실행 환경:** P
- **테스터 역할:** QA-DEV
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. headers를 확인한다.
2. 2. Sentry controlled event에서 PII mask와 release를 확인한다.
3. 3. sentry example routes를 연다.

#### 기대 결과

보안 header·Sentry privacy가 정상이고 example page/API는 404다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### SMOKE-008 — sign-off

- **구역:** 배포
- **실행 환경:** P
- **테스터 역할:** QA-SUPER
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. Vercel deployment/log, migration status, cron schedule, Sentry release를 확인한다.
2. 2. 결과를 release sheet에 기록한다.

#### 기대 결과

배포 SHA와 운영 증거가 일치하며 fail/waiver가 없는 상태 또는 승인된 exception만 남는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

## 완료 기준

각 케이스에 `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`, `N/A` 중 하나를 표시하고, `FAIL` 또는 `BLOCKED`는 반드시 증거와 결함 ID/차단 사유를 연결한다.
