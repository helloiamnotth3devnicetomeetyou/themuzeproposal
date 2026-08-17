# 03. 문의·권리보호 신고·오디션 QA

> **기준 커밋:** `0d79efb18de637d02ce210464a1d340ba9294def`  
> 모든 항목은 **클릭·입력·확인 절차 → 기대 결과 → 결과 기록** 순서로 실행한다.

| 표기 | 의미 |
| --- | --- |
| **L** | Local에서만 안전하게 재현하는 검증 |
| **S** | Staging/Preview의 QA 데이터·계정으로 수행하는 검증 |
| **P** | Production에서만 확정 가능한 도메인·보안 헤더·외부 연동 검증 |
| **B** | Local과 Staging/Production 양쪽에서 수행하는 검증 |

> Production에서는 **QA 전용 계정·콘텐츠·파일만** 사용한다. 실제 접수·지원·신고·운영 데이터를 생성·수정·삭제하지 않는다.

> **이 파일의 범위:** 문의, 제보/권리보호 신고, 오디션 캠페인·동적 폼·파일·review·내 지원 기능 시나리오와 기존 기능 케이스  
> **케이스 수:** 30건

> 모든 제출은 QA 전용 데이터로 수행하고, 소유권·쿼터·첨부 파일 관련 보안 케이스는 01번 파일과 함께 확인한다.

### FORM-001 — 일반 문의 진입

- **구역:** Contact
- **실행 환경:** B
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. /contact를 연다.
2. 2. General 카테고리를 선택한다.

#### 기대 결과

일반 문의용 필드·필수 표시·privacy consent·submit 버튼이 보인다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-002 — 비즈니스 문의 카테고리

- **구역:** Contact
- **실행 환경:** B
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. Business 카테고리를 선택한다.
2. 2. General과 비교한다.

#### 기대 결과

business 전용 회사/첨부 등 필요한 field만 추가되고 category 전환 시 validation이 정확히 갱신된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-003 — 필수/형식 validation

- **구역:** Contact
- **실행 환경:** B
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 빈 form, 잘못된 email/phone, 최대 길이 초과 message로 submit한다.

#### 기대 결과

각 오류가 field 근처에 표시되고 submit·quota·DB row가 생성되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-004 — 개인정보 동의

- **구역:** Contact
- **실행 환경:** B
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. consent 미체크 상태로 submit한다.
2. 2. 정책 link를 연다.

#### 기대 결과

미동의 제출은 차단되고 실제 개인정보처리방침 route가 열린다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-005 — 첨부파일 정상 제출

- **구역:** Contact
- **실행 환경:** S/P
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 정상 business PDF를 첨부한다.
2. 2. valid fields/CAPTCHA 후 submit한다.

#### 기대 결과

성공 화면·remaining quota가 보이고 admin inbox에 동일 문의와 authorized attachment가 생성된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-006 — 첨부파일 실패

- **구역:** Contact
- **실행 환경:** L/B
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. wrong MIME/extension/size/broken file을 각각 첨부한다.

#### 기대 결과

업로드 전 또는 서버 검증에서 차단되며 object·row·daily quota가 남지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-007 — 저장 실패 복구

- **구역:** Contact
- **실행 환경:** L
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. R2 또는 DB insert failure fixture를 활성화한다.
2. 2. 정상 form을 submit한다.

#### 기대 결과

사용자는 실패 안내를 받고 uploaded object가 cleanup되며 quota reservation이 release된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-008 — 중복 클릭/네트워크 재시도

- **구역:** Contact
- **실행 환경:** B
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. submit을 빠르게 2회 클릭하거나 요청 중 네트워크를 끊는다.
2. 2. 재시도한다.

#### 기대 결과

중복 inquiry·중복 파일·잘못된 quota 소비가 없고 결과를 이해할 수 있다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-009 — 로그인 요구

- **구역:** Protect
- **실행 환경:** B
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. /protect와 protect submit API를 연다.
2. 2. CTA를 클릭한다.

#### 기대 결과

로그인 안내/redirect가 표시되고 비로그인 상태로 draft·제보·private data가 생성되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-010 — 제보 작성/제출

- **구역:** Protect
- **실행 환경:** S/P
- **테스터 역할:** QA-USER-A
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. artist/type/title/body/platform/URL/date/evidence를 valid하게 입력한다.
2. 2. CAPTCHA 후 제출한다.

#### 기대 결과

성공 안내가 보이고 A 소유 report·attachment만 생성되며 admin Protect list에 표시된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-011 — 제보 draft 복구

- **구역:** Protect
- **실행 환경:** B
- **테스터 역할:** QA-USER-A
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 일부 field를 입력한다.
2. 2. 새로고침/다른 페이지 이동 후 돌아온다.

#### 기대 결과

정의된 draft는 복구되며 logout/계정 변경/손상 storage에서는 타 사용자 내용이 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-012 — 제보 validation/권한

- **구역:** Protect
- **실행 환경:** L/B
- **테스터 역할:** QA-USER-A/B
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. invalid artist/URL/date/UUID/file을 입력한다.
2. 2. A report ID로 B가 접근한다.

#### 기대 결과

잘못된 입력은 차단되고 B는 A의 report/evidence를 읽거나 수정할 수 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-013 — 캠페인 목록/상태

- **구역:** Audition
- **실행 환경:** B
- **테스터 역할:** QA-ANON
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. /audition을 연다.
2. 2. upcoming/open/closed/full/hidden campaign fixture를 확인한다.

#### 기대 결과

public open campaign만 신청 CTA를 제공하고 나머지는 정책에 맞는 상태/안내를 표시한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-014 — 캠페인 상세/폼

- **구역:** Audition
- **실행 환경:** B
- **테스터 역할:** QA-USER-A
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. open campaign을 연다.
2. 2. 각 section/question/option/required field를 확인한다.

#### 기대 결과

admin builder 정의와 field 순서·라벨·helper·locale·required 정책이 일치한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-015 — field별 validation

- **구역:** Audition
- **실행 환경:** B
- **테스터 역할:** QA-USER-A
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 각 question type에 empty/invalid/long answer를 넣는다.
2. 2. submit한다.

#### 기대 결과

client/server validation이 일치하며 첫 오류로 이동하거나 사용자가 이해할 수 있게 표시한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-016 — 파일 제출/교체

- **구역:** Audition
- **실행 환경:** B
- **테스터 역할:** QA-USER-A
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 허용 파일을 업로드한다.
2. 2. replace/delete를 수행한다.
3. 3. invalid file도 시도한다.

#### 기대 결과

정상 preview·delete·replace가 작동하고 old object cleanup/attachment record가 정확하다. invalid file은 저장되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-017 — 정상 제출

- **구역:** Audition
- **실행 환경:** S/P
- **테스터 역할:** QA-USER-A
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 모든 required answer/file을 채운다.
2. 2. CAPTCHA 후 submit한다.

#### 기대 결과

최종 confirm/success, 정확한 quota/attempt UI, admin submission review record가 생성된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-018 — 마감/중복/소유권

- **구역:** Audition
- **실행 환경:** B
- **테스터 역할:** QA-USER-A/B
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. closed/full campaign 또는 deadline 직후 submit한다.
2. 2. 같은 A로 중복 지원한다.
3. 3. B로 A submission을 연다.

#### 기대 결과

마감·중복은 정책대로 차단되고 B는 A submission을 조회/수정/파일 접근할 수 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-019 — 저장 실패/remaining

- **구역:** Audition
- **실행 환경:** L
- **테스터 역할:** QA-USER-A
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. upload/DB/RPC failure fixture를 각각 활성화한다.
2. 2. submit한다.

#### 기대 결과

object/row cleanup과 quota release가 수행되며 success 때만 remaining이 감소한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### FORM-020 — rate limit 표시

- **구역:** Forms
- **실행 환경:** L/S
- **테스터 역할:** QA-ANON, QA-USER-A
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. Contact/Protect/Audition에서 test limiter를 제한 직전/초과 상태로 만든다.
2. 2. 화면과 API response를 비교한다.

#### 기대 결과

사용자에게 표시된 remaining/429/retry 안내가 실제 blocking key 정책과 일치한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### UI-FLOW-091 — 문의 폼 필수값·유효 입력·제출

- **구역:** 문의
- **실행 환경:** B/S
- **테스터 역할:** QA-ANON / QA-USER-A
- **사전 조건:** 제출 정책에 맞는 QA 계정과 데이터

#### 클릭·입력·확인 절차

1. 필수 필드를 비우고 제출한다.
2. 정상 이름·이메일·제목·내용을 입력하고 동의 후 제출한다.

#### 기대 결과

필수 항목 오류가 필드 근처에 나타나며 정상 제출은 한 번만 생성된다. 성공 후 명확한 완료 상태와 재제출 방지가 동작한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-092 — 문의 폼 글자 수·상태·오류 닫기

- **구역:** 문의
- **실행 환경:** B/S
- **테스터 역할:** QA-ANON / QA-USER-A
- **사전 조건:** 문의 화면

#### 클릭·입력·확인 절차

1. 텍스트의 최소·최대·초과 길이를 입력한다.
2. 오류를 만든 뒤 닫기 버튼이 있으면 누른다.

#### 기대 결과

글자 수·검증·버튼 비활성/활성이 일관되고, 오류 닫기는 화면만 닫되 잘못된 데이터 성공으로 오인시키지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-093 — 신고 탭과 내 신고 목록

- **구역:** 권리보호 신고
- **실행 환경:** B/S
- **테스터 역할:** QA-USER-A
- **사전 조건:** 로그인 상태 및 신고 데이터 준비

#### 클릭·입력·확인 절차

1. 신고하기와 내 신고 탭을 오간다.
2. 내 신고 항목을 선택하거나 신고하기 이동 버튼을 누른다.

#### 기대 결과

탭 활성 상태·목록·빈 상태가 계정 소유 데이터와 일치하며, 다른 사용자 신고가 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-094 — 신고 정보·플랫폼·확인 동의 입력

- **구역:** 권리보호 신고
- **실행 환경:** B/S
- **테스터 역할:** QA-USER-A
- **사전 조건:** 신고 화면

#### 클릭·입력·확인 절차

1. 제목·내용·플랫폼·게시 URL·게시일·작성자·IP를 각각 입력한다.
2. 확인 체크를 해제·체크하고 제출한다.

#### 기대 결과

입력별 placeholder·형식·필수 정책이 작동하고, 동의 전에는 제출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-095 — 신고 증빙 파일 추가·삭제·제출

- **구역:** 권리보호 신고
- **실행 환경:** B/S
- **테스터 역할:** QA-USER-A
- **사전 조건:** 허용·비허용 QA 파일

#### 클릭·입력·확인 절차

1. 증빙 파일을 추가한다.
2. 목록에서 제거한다.
3. 여러 파일과 0개 파일 상태로 제출한다.

#### 기대 결과

파일명·업로드 상태·제거 동작이 정확하며 최종 제출에는 표시된 파일만 연결된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-096 — 캠페인 목록·상세·지원 CTA

- **구역:** 오디션
- **실행 환경:** B
- **테스터 역할:** QA-ANON / QA-USER-A
- **사전 조건:** 모집중/마감/예정 캠페인 준비

#### 클릭·입력·확인 절차

1. 캠페인 카드를 하나씩 열거나 지원 버튼을 누른다.
2. 마감/예정 캠페인도 확인한다.

#### 기대 결과

모집 상태·기간·설명이 정확하고, 가능한 캠페인만 지원 폼으로 이동한다. 마감 캠페인은 제출 경로가 열리지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-097 — 오디션 로그인 요구·오류 닫기

- **구역:** 오디션
- **실행 환경:** B/S
- **테스터 역할:** QA-ANON
- **사전 조건:** 로그아웃 상태

#### 클릭·입력·확인 절차

1. 지원 CTA를 누른다.
2. 표시된 로그인 안내·오류가 있으면 닫는다.

#### 기대 결과

로그인 필요 안내가 명확하고 로그인 후 원래 캠페인으로 복귀한다. 닫기는 페이지 상태를 손상시키지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-098 — 오디션 동적 질문 유형별 입력

- **구역:** 오디션
- **실행 환경:** B/S
- **테스터 역할:** QA-USER-A
- **사전 조건:** 텍스트·textarea·select·radio·checkbox·date·file 질문이 있는 QA 캠페인

#### 클릭·입력·확인 절차

1. 각 질문 유형에 정상·빈·경계값을 입력한다.
2. radio/checkbox를 변경하고 select를 바꾼다.

#### 기대 결과

질문 라벨·필수 표시·선택 상태·오류가 질문별로 독립적으로 동작하고, 입력값이 review 화면과 일치한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-099 — 오디션 파일 선택·제거·재선택

- **구역:** 오디션
- **실행 환경:** B/S
- **테스터 역할:** QA-USER-A
- **사전 조건:** 파일 질문이 있는 QA 캠페인

#### 클릭·입력·확인 절차

1. 정상 파일을 선택한다.
2. 제거 버튼을 누른 뒤 다른 파일을 선택한다.
3. 비허용 파일도 시도한다.

#### 기대 결과

파일 상태·오류·제거가 시각적으로 분명하고, 삭제한 파일이 review/제출 데이터에 남지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-100 — 오디션 review와 최종 제출·내 지원 보기

- **구역:** 오디션
- **실행 환경:** S
- **테스터 역할:** QA-USER-A
- **사전 조건:** 필수 질문 충족

#### 클릭·입력·확인 절차

1. Review를 누른다.
2. 입력값을 확인한 뒤 이전으로 돌아가 하나를 수정한다.
3. 최종 제출 후 내 지원 보기를 누른다.

#### 기대 결과

review는 제출 전 정확한 값을 보여 주며 수정값이 반영된다. 최종 제출은 한 번만 생성되고 내 지원 목록에 해당 캠페인·상태가 보인다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

## 완료 기준

각 케이스에 `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`, `N/A` 중 하나를 표시하고, `FAIL` 또는 `BLOCKED`는 반드시 증거와 결함 ID/차단 사유를 연결한다.
