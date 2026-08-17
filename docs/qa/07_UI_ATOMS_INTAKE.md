# 07. UI 요소 전수 — 문의·권리보호 신고·오디션

> **기준 커밋:** `0d79efb18de637d02ce210464a1d340ba9294def`  
> 모든 항목은 **클릭·입력·확인 절차 → 기대 결과 → 결과 기록** 순서로 실행한다.

| 표기 | 의미 |
| --- | --- |
| **L** | Local에서만 안전하게 재현하는 검증 |
| **S** | Staging/Preview의 QA 데이터·계정으로 수행하는 검증 |
| **P** | Production에서만 확정 가능한 도메인·보안 헤더·외부 연동 검증 |
| **B** | Local과 Staging/Production 양쪽에서 수행하는 검증 |

> Production에서는 **QA 전용 계정·콘텐츠·파일만** 사용한다. 실제 접수·지원·신고·운영 데이터를 생성·수정·삭제하지 않는다.

> **이 파일의 범위:** 문의, 권리보호 신고, 오디션의 실제 버튼·입력·선택·파일·폼·클릭 가능한 컨테이너  
> **케이스 수:** 49건

> 파일 업로드·동적 질문·오류 닫기·내 목록은 시각 상태와 키보드 동작 모두 확인한다.

### UI-ATOM-477 — button · AuditionClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/AuditionClient.tsx:94` · `button` · type: button
- **소스 추적:** `src/public/pages/audition/AuditionClient.tsx:94` · `button` · type: button

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-478 — button · AuditionClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/AuditionClient.tsx:104` · `button` · type: button
- **소스 추적:** `src/public/pages/audition/AuditionClient.tsx:104` · `button` · type: button

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-479 — button · AuditionClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/AuditionClient.tsx:125` · `button` · type: button · aria-label: m.closeError · 표시 텍스트: ×
- **소스 추적:** `src/public/pages/audition/AuditionClient.tsx:125` · `button` · type: button · aria-label: m.closeError · 표시 텍스트: ×

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-480 — button · AuditionClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/AuditionClient.tsx:149` · `button` · type: button
- **소스 추적:** `src/public/pages/audition/AuditionClient.tsx:149` · `button` · type: button

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-481 — button · AuditionClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/AuditionClient.tsx:207` · `button` · type: button
- **소스 추적:** `src/public/pages/audition/AuditionClient.tsx:207` · `button` · type: button

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-482 — button · CampaignFormClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/CampaignFormClient.tsx:230` · `button` · type: button
- **소스 추적:** `src/public/pages/audition/CampaignFormClient.tsx:230` · `button` · type: button

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-483 — button · CampaignFormClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/CampaignFormClient.tsx:269` · `button` · type: button
- **소스 추적:** `src/public/pages/audition/CampaignFormClient.tsx:269` · `button` · type: button

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-484 — button · CampaignFormClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/CampaignFormClient.tsx:272` · `button` · type: button · disabled: submitting || !turnstileToken
- **소스 추적:** `src/public/pages/audition/CampaignFormClient.tsx:272` · `button` · type: button · disabled: submitting || !turnstileToken

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-485 — button · CampaignFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/CampaignFormFields.tsx:74` · `button` · type: button · aria-label: messages.closeError · 표시 텍스트: ×
- **소스 추적:** `src/public/pages/audition/CampaignFormFields.tsx:74` · `button` · type: button · aria-label: messages.closeError · 표시 텍스트: ×

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-486 — textarea · CampaignFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/CampaignFormFields.tsx:102` · `textarea` · id: id · value: String(value ?? "")
- **소스 추적:** `src/public/pages/audition/CampaignFormFields.tsx:102` · `textarea` · id: id · value: String(value ?? "")

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-487 — input · CampaignFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/CampaignFormFields.tsx:113` · `input` · id: id · type: EMAIL_KEYS.has(field.field_key) ? "email" : "text" · value: String(value ?? "")
- **소스 추적:** `src/public/pages/audition/CampaignFormFields.tsx:113` · `input` · id: id · type: EMAIL_KEYS.has(field.field_key) ? "email" : "text" · value: String(value ?? "")

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-488 — input · CampaignFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/CampaignFormFields.tsx:147` · `input` · id: id · type: date · value: String(value ?? "")
- **소스 추적:** `src/public/pages/audition/CampaignFormFields.tsx:147` · `input` · id: id · type: date · value: String(value ?? "")

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-489 — input · CampaignFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/CampaignFormFields.tsx:169` · `input` · type: field.field_type · name: field.field_key
- **소스 추적:** `src/public/pages/audition/CampaignFormFields.tsx:169` · `input` · type: field.field_type · name: field.field_key

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-490 — input · CampaignFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/CampaignFormFields.tsx:206` · `input` · id: id · type: file · accept: field.accepted_file_types.join(",") || ALL_FILE_TYPES
- **소스 추적:** `src/public/pages/audition/CampaignFormFields.tsx:206` · `input` · id: id · type: file · accept: field.accepted_file_types.join(",") || ALL_FILE_TYPES

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-491 — button · CampaignFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/CampaignFormFields.tsx:239` · `button` · type: button · aria-label: messages.removeFile
- **소스 추적:** `src/public/pages/audition/CampaignFormFields.tsx:239` · `button` · type: button · aria-label: messages.removeFile

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-492 — input · CampaignFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/CampaignFormFields.tsx:262` · `input` · id: id · type: checkbox
- **소스 추적:** `src/public/pages/audition/CampaignFormFields.tsx:262` · `input` · id: id · type: checkbox

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-493 — button · CampaignFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/audition/CampaignFormFields.tsx:285` · `button` · type: button
- **소스 추적:** `src/public/pages/audition/CampaignFormFields.tsx:285` · `button` · type: button

#### 클릭·입력·확인 절차

1. /audition 또는 /audition/{campaignId}에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-494 — button · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:104` · `button` · type: button
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:104` · `button` · type: button

#### 클릭·입력·확인 절차

1. /contact에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-495 — button · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:120` · `button` · type: button · aria-current: !isBusiness ? "page" : undefined
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:120` · `button` · type: button · aria-current: !isBusiness ? "page" : undefined

#### 클릭·입력·확인 절차

1. /contact에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-496 — button · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:128` · `button` · type: button · aria-current: isBusiness ? "page" : undefined
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:128` · `button` · type: button · aria-current: isBusiness ? "page" : undefined

#### 클릭·입력·확인 절차

1. /contact에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-497 — button · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:164` · `button` · type: button · aria-label: messages.closeErrorLabel · 표시 텍스트: ×
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:164` · `button` · type: button · aria-label: messages.closeErrorLabel · 표시 텍스트: ×

#### 클릭·입력·확인 절차

1. /contact에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-498 — a · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:183` · `a` · href: pressKitHref
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:183` · `a` · href: pressKitHref

#### 클릭·입력·확인 절차

1. /contact에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

링크가 표시된 라벨·현재 컨텍스트와 일치하는 목적지로 한 번만 이동한다. 404, 빈 페이지, 잘못된 상태 전파가 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-499 — a · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:188` · `a` · href: profilePdfHref
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:188` · `a` · href: profilePdfHref

#### 클릭·입력·확인 절차

1. /contact에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

링크가 표시된 라벨·현재 컨텍스트와 일치하는 목적지로 한 번만 이동한다. 404, 빈 페이지, 잘못된 상태 전파가 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-500 — form · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:196` · `form` · 표시 텍스트: {draftRestored && } * { setForm((current) => ( )); setError(); }} options= placeholder= /> {isBusine
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:196` · `form` · 표시 텍스트: {draftRestored && } * { setForm((current) => ( )); setError(); }} options= placeholder= /> {isBusine

#### 클릭·입력·확인 절차

1. /contact에서 해당 폼의 모든 필수 필드를 비운 채 제출한다.
2. 정상 QA 값을 입력해 Enter와 버튼 제출을 각각 시도한다.
3. 제출 중 다시 클릭·새로고침·뒤로가기를 시도한다.

#### 기대 결과

필수값과 형식 오류는 제출 전에 식별 가능하게 표시된다. 정상 제출은 한 번만 처리되며, 로딩·성공·실패·재시도 상태가 명확하다. 중복 레코드나 부분 저장이 생기지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-501 — input · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:228` · `input` · id: contact-company · value: form.companyName · placeholder: messages.placeholders.company
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:228` · `input` · id: contact-company · value: form.companyName · placeholder: messages.placeholders.company

#### 클릭·입력·확인 절차

1. /contact에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-502 — input · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:243` · `input` · id: contact-name · value: form.name · placeholder: isBusiness ? messages.placeholders.nameBusiness : messages.placeholders.nameGeneral
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:243` · `input` · id: contact-name · value: form.name · placeholder: isBusiness ? messages.placeholders.nameBusiness : messages.placeholders.nameGeneral

#### 클릭·입력·확인 절차

1. /contact에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-503 — input · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:262` · `input` · id: contact-phone · value: form.phone · placeholder: isBusiness ? messages.placeholders.phoneBusiness : messages.placeholders.phoneGeneral
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:262` · `input` · id: contact-phone · value: form.phone · placeholder: isBusiness ? messages.placeholders.phoneBusiness : messages.placeholders.phoneGeneral

#### 클릭·입력·확인 절차

1. /contact에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-504 — input · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:282` · `input` · id: contact-email · value: form.email · placeholder: isAuthenticated ? undefined : "you@example.com"
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:282` · `input` · id: contact-email · value: form.email · placeholder: isAuthenticated ? undefined : "you@example.com"

#### 클릭·입력·확인 절차

1. /contact에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-505 — input · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:309` · `input` · type: file · accept: .pdf,application/pdf
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:309` · `input` · type: file · accept: .pdf,application/pdf

#### 클릭·입력·확인 절차

1. /contact에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-506 — button · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:324` · `button` · type: button · aria-label: messages.attachment.remove(attachment.name)
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:324` · `button` · type: button · aria-label: messages.attachment.remove(attachment.name)

#### 클릭·입력·확인 절차

1. /contact에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-507 — textarea · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:342` · `textarea` · id: contact-message · value: form.message · placeholder: isBusiness ? messages.placeholders.proposal : messages.placeholders.message
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:342` · `textarea` · id: contact-message · value: form.message · placeholder: isBusiness ? messages.placeholders.proposal : messages.placeholders.message

#### 클릭·입력·확인 절차

1. /contact에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-508 — input · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:377` · `input` · type: checkbox
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:377` · `input` · type: checkbox

#### 클릭·입력·확인 절차

1. /contact에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-509 — button · ContactClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/contact/ContactClient.tsx:403` · `button` · type: submit · disabled: submitting
- **소스 추적:** `src/public/pages/contact/ContactClient.tsx:403` · `button` · type: submit · disabled: submitting

#### 클릭·입력·확인 절차

1. /contact에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-517 — button · ProtectClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/ProtectClient.tsx:95` · `button` · type: button
- **소스 추적:** `src/public/pages/protect/ProtectClient.tsx:95` · `button` · type: button

#### 클릭·입력·확인 절차

1. /protect에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-518 — button · ProtectClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/ProtectClient.tsx:117` · `button` · type: button
- **소스 추적:** `src/public/pages/protect/ProtectClient.tsx:117` · `button` · type: button

#### 클릭·입력·확인 절차

1. /protect에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-519 — button · ProtectClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/ProtectClient.tsx:127` · `button` · type: button
- **소스 추적:** `src/public/pages/protect/ProtectClient.tsx:127` · `button` · type: button

#### 클릭·입력·확인 절차

1. /protect에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-520 — button · ProtectClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/ProtectClient.tsx:152` · `button` · type: button · aria-label: t.protect.closeError · 표시 텍스트: ×
- **소스 추적:** `src/public/pages/protect/ProtectClient.tsx:152` · `button` · type: button · aria-label: t.protect.closeError · 표시 텍스트: ×

#### 클릭·입력·확인 절차

1. /protect에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-521 — input · ReportEvidenceUpload.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/components/ReportEvidenceUpload.tsx:39` · `input` · id: evidenceFiles · type: file · disabled: files.length >= 3 · accept: image/jpeg,image/png,image/webp,image/gif,application/pdf
- **소스 추적:** `src/public/pages/protect/components/ReportEvidenceUpload.tsx:39` · `input` · id: evidenceFiles · type: file · disabled: files.length >= 3 · accept: image/jpeg,image/png,image/webp,image/gif,application/pdf

#### 클릭·입력·확인 절차

1. /protect에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-522 — button · ReportEvidenceUpload.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/components/ReportEvidenceUpload.tsx:61` · `button` · type: button · aria-label: t.protect.removeFile(file.name)
- **소스 추적:** `src/public/pages/protect/components/ReportEvidenceUpload.tsx:61` · `button` · type: button · aria-label: t.protect.removeFile(file.name)

#### 클릭·입력·확인 절차

1. /protect에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-523 — form · ReportForm.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/components/ReportForm.tsx:381` · `form` · 표시 텍스트: {hasSavedDraft && } } onConfirmedChange={(next) => } startSubmitHold= cancelSubmitHold= turnstileRef
- **소스 추적:** `src/public/pages/protect/components/ReportForm.tsx:381` · `form` · 표시 텍스트: {hasSavedDraft && } } onConfirmedChange={(next) => } startSubmitHold= cancelSubmitHold= turnstileRef

#### 클릭·입력·확인 절차

1. /protect에서 해당 폼의 모든 필수 필드를 비운 채 제출한다.
2. 정상 QA 값을 입력해 Enter와 버튼 제출을 각각 시도한다.
3. 제출 중 다시 클릭·새로고침·뒤로가기를 시도한다.

#### 기대 결과

필수값과 형식 오류는 제출 전에 식별 가능하게 표시된다. 정상 제출은 한 번만 처리되며, 로딩·성공·실패·재시도 상태가 명확하다. 중복 레코드나 부분 저장이 생기지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-524 — input · ReportFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/components/ReportFormFields.tsx:145` · `input` · id: title · value: form.title · placeholder: placeholders.title
- **소스 추적:** `src/public/pages/protect/components/ReportFormFields.tsx:145` · `input` · id: title · value: form.title · placeholder: placeholders.title

#### 클릭·입력·확인 절차

1. /protect에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-525 — textarea · ReportFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/components/ReportFormFields.tsx:162` · `textarea` · id: content · value: form.content · placeholder: placeholders.content
- **소스 추적:** `src/public/pages/protect/components/ReportFormFields.tsx:162` · `textarea` · id: content · value: form.content · placeholder: placeholders.content

#### 클릭·입력·확인 절차

1. /protect에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-526 — input · ReportFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/components/ReportFormFields.tsx:198` · `input` · id: postUrl · type: url · value: form.postUrl · placeholder: placeholders.postUrl
- **소스 추적:** `src/public/pages/protect/components/ReportFormFields.tsx:198` · `input` · id: postUrl · type: url · value: form.postUrl · placeholder: placeholders.postUrl

#### 클릭·입력·확인 절차

1. /protect에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-527 — input · ReportFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/components/ReportFormFields.tsx:213` · `input` · id: postedAt · type: date · value: form.postedAt
- **소스 추적:** `src/public/pages/protect/components/ReportFormFields.tsx:213` · `input` · id: postedAt · type: date · value: form.postedAt

#### 클릭·입력·확인 절차

1. /protect에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-528 — input · ReportFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/components/ReportFormFields.tsx:227` · `input` · id: authorName · value: form.authorName · placeholder: placeholders.authorName
- **소스 추적:** `src/public/pages/protect/components/ReportFormFields.tsx:227` · `input` · id: authorName · value: form.authorName · placeholder: placeholders.authorName

#### 클릭·입력·확인 절차

1. /protect에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-529 — input · ReportFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/components/ReportFormFields.tsx:239` · `input` · id: postIp · value: form.postIp · placeholder: placeholders.postIp
- **소스 추적:** `src/public/pages/protect/components/ReportFormFields.tsx:239` · `input` · id: postIp · value: form.postIp · placeholder: placeholders.postIp

#### 클릭·입력·확인 절차

1. /protect에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-530 — input · ReportFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/components/ReportFormFields.tsx:255` · `input` · id: reportConfirmation · type: checkbox
- **소스 추적:** `src/public/pages/protect/components/ReportFormFields.tsx:255` · `input` · id: reportConfirmation · type: checkbox

#### 클릭·입력·확인 절차

1. /protect에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-531 — button · ReportFormFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/components/ReportFormFields.tsx:285` · `button` · type: button · disabled: submitting
- **소스 추적:** `src/public/pages/protect/components/ReportFormFields.tsx:285` · `button` · type: button · disabled: submitting

#### 클릭·입력·확인 절차

1. /protect에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-532 — button · ReportList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/protect/components/ReportList.tsx:55` · `button` · type: button
- **소스 추적:** `src/public/pages/protect/components/ReportList.tsx:55` · `button` · type: button

#### 클릭·입력·확인 절차

1. /protect에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

## 완료 기준

각 케이스에 `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`, `N/A` 중 하나를 표시하고, `FAIL` 또는 `BLOCKED`는 반드시 증거와 결함 ID/차단 사유를 연결한다.
