# 06. UI 요소 전수 — 공개 사이트·로그인·계정

> **기준 커밋:** `0d79efb18de637d02ce210464a1d340ba9294def`  
> 모든 항목은 **클릭·입력·확인 절차 → 기대 결과 → 결과 기록** 순서로 실행한다.

| 표기 | 의미 |
| --- | --- |
| **L** | Local에서만 안전하게 재현하는 검증 |
| **S** | Staging/Preview의 QA 데이터·계정으로 수행하는 검증 |
| **P** | Production에서만 확정 가능한 도메인·보안 헤더·외부 연동 검증 |
| **B** | Local과 Staging/Production 양쪽에서 수행하는 검증 |

> Production에서는 **QA 전용 계정·콘텐츠·파일만** 사용한다. 실제 접수·지원·신고·운영 데이터를 생성·수정·삭제하지 않는다.

> **이 파일의 범위:** 공개 화면, 공용 헤더/푸터, 홈·아티스트·디스코그래피·스케줄·공지·About, 로그인·계정, 전역 오류/404의 실제 조작 요소  
> **케이스 수:** 120건

> `소스 추적`의 파일·줄 번호와 화면의 실제 위치를 대조해 버튼·링크·입력·폼·영상·클릭 가능한 컨테이너를 하나도 빠뜨리지 않고 확인한다.

### UI-ATOM-364 — button · error.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/app/error.tsx:53` · `button` · type: button
- **소스 추적:** `src/app/error.tsx:53` · `button` · type: button

#### 클릭·입력·확인 절차

1. 전역 오류·404 또는 해당 앱 라우트에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-365 — a · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/app/sentry-example-page/page.tsx:53` · `a` · target: _blank · href: https://notth3dev.sentry.io/issues/?project=4511921061822464 · 표시 텍스트: Issues Page
- **소스 추적:** `src/app/sentry-example-page/page.tsx:53` · `a` · target: _blank · href: https://notth3dev.sentry.io/issues/?project=4511921061822464 · 표시 텍스트: Issues Page

#### 클릭·입력·확인 절차

1. /sentry-example-page (Production 비노출 여부 확인)에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-366 — a · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/app/sentry-example-page/page.tsx:61` · `a` · target: _blank · href: https://docs.sentry.io/platforms/javascript/guides/nextjs/ · 표시 텍스트: read our docs
- **소스 추적:** `src/app/sentry-example-page/page.tsx:61` · `a` · target: _blank · href: https://docs.sentry.io/platforms/javascript/guides/nextjs/ · 표시 텍스트: read our docs

#### 클릭·입력·확인 절차

1. /sentry-example-page (Production 비노출 여부 확인)에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-367 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/app/sentry-example-page/page.tsx:71` · `button` · type: button · disabled: !isConnected · 표시 텍스트: Throw Sample Error
- **소스 추적:** `src/app/sentry-example-page/page.tsx:71` · `button` · type: button · disabled: !isConnected · 표시 텍스트: Throw Sample Error

#### 클릭·입력·확인 절차

1. /sentry-example-page (Production 비노출 여부 확인)에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-368 — a · SkipLink.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/components/a11y/SkipLink.tsx:8` · `a` · href: #main-content
- **소스 추적:** `src/core/components/a11y/SkipLink.tsx:8` · `a` · href: #main-content

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

링크가 표시된 라벨·현재 컨텍스트와 일치하는 목적지로 한 번만 이동한다. 404, 빈 페이지, 잘못된 상태 전파가 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-369 — button · DisclaimerBanner.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/components/banner/DisclaimerBanner.tsx:73` · `button` · type: button · aria-label: Notice dismissal · 표시 텍스트: 닫기
- **소스 추적:** `src/core/components/banner/DisclaimerBanner.tsx:73` · `button` · type: button · aria-label: Notice dismissal · 표시 텍스트: 닫기

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-370 — button · CustomSelect.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/components/form/CustomSelect.tsx:204` · `button` · type: button · aria-label: ariaLabel · aria-expanded: open · disabled: disabled
- **소스 추적:** `src/core/components/form/CustomSelect.tsx:204` · `button` · type: button · aria-label: ariaLabel · aria-expanded: open · disabled: disabled

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-371 — div · CustomSelect.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/components/form/CustomSelect.tsx:235` · `div` · role: listbox · aria-label: ariaLabel · 표시 텍스트: {options.map((option, index) => ( !option.disabled && setActiveIndex(index)} onMouseDown= onClick= >
- **소스 추적:** `src/core/components/form/CustomSelect.tsx:235` · `div` · role: listbox · aria-label: ariaLabel · 표시 텍스트: {options.map((option, index) => ( !option.disabled && setActiveIndex(index)} onMouseDown= onClick= >

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-372 — div · CustomSelect.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/components/form/CustomSelect.tsx:256` · `div` · role: option · disabled: option.disabled || undefined
- **소스 추적:** `src/core/components/form/CustomSelect.tsx:256` · `div` · role: option · disabled: option.disabled || undefined

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-373 — form · AccountBasicForms.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountBasicForms.tsx:43` · `form` · 표시 텍스트: onNameChange(event.target.value)} required autoComplete="name" maxLength= />
- **소스 추적:** `src/core/pages/account/AccountBasicForms.tsx:43` · `form` · 표시 텍스트: onNameChange(event.target.value)} required autoComplete="name" maxLength= />

#### 클릭·입력·확인 절차

1. /account에서 해당 폼의 모든 필수 필드를 비운 채 제출한다.
2. 정상 QA 값을 입력해 Enter와 버튼 제출을 각각 시도한다.
3. 제출 중 다시 클릭·새로고침·뒤로가기를 시도한다.

#### 기대 결과

필수값과 형식 오류는 제출 전에 식별 가능하게 표시된다. 정상 제출은 한 번만 처리되며, 로딩·성공·실패·재시도 상태가 명확하다. 중복 레코드나 부분 저장이 생기지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-374 — input · AccountBasicForms.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountBasicForms.tsx:46` · `input` · id: account-name · value: name
- **소스 추적:** `src/core/pages/account/AccountBasicForms.tsx:46` · `input` · id: account-name · value: name

#### 클릭·입력·확인 절차

1. /account에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-375 — button · AccountBasicForms.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountBasicForms.tsx:56` · `button` · type: submit · disabled: saving !== null
- **소스 추적:** `src/core/pages/account/AccountBasicForms.tsx:56` · `button` · type: submit · disabled: saving !== null

#### 클릭·입력·확인 절차

1. /account에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-376 — form · AccountBasicForms.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountBasicForms.tsx:89` · `form` · 표시 텍스트: onSelect(null)} > {avatarArtists.map((artist) => ( {artist.avatars.map((avatar, index) => ( onSelect
- **소스 추적:** `src/core/pages/account/AccountBasicForms.tsx:89` · `form` · 표시 텍스트: onSelect(null)} > {avatarArtists.map((artist) => ( {artist.avatars.map((avatar, index) => ( onSelect

#### 클릭·입력·확인 절차

1. /account에서 해당 폼의 모든 필수 필드를 비운 채 제출한다.
2. 정상 QA 값을 입력해 Enter와 버튼 제출을 각각 시도한다.
3. 제출 중 다시 클릭·새로고침·뒤로가기를 시도한다.

#### 기대 결과

필수값과 형식 오류는 제출 전에 식별 가능하게 표시된다. 정상 제출은 한 번만 처리되며, 로딩·성공·실패·재시도 상태가 명확하다. 중복 레코드나 부분 저장이 생기지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-377 — button · AccountBasicForms.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountBasicForms.tsx:94` · `button` · type: button · aria-label: t.defaultAvatar
- **소스 추적:** `src/core/pages/account/AccountBasicForms.tsx:94` · `button` · type: button · aria-label: t.defaultAvatar

#### 클릭·입력·확인 절차

1. /account에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-378 — button · AccountBasicForms.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountBasicForms.tsx:117` · `button` · type: button
- **소스 추적:** `src/core/pages/account/AccountBasicForms.tsx:117` · `button` · type: button

#### 클릭·입력·확인 절차

1. /account에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-379 — button · AccountBasicForms.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountBasicForms.tsx:149` · `button` · type: submit · disabled: saving !== null || avatarAssetId === savedAvatarAssetId
- **소스 추적:** `src/core/pages/account/AccountBasicForms.tsx:149` · `button` · type: submit · disabled: saving !== null || avatarAssetId === savedAvatarAssetId

#### 클릭·입력·확인 절차

1. /account에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-380 — form · AccountBasicForms.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountBasicForms.tsx:176` · `form` · 표시 텍스트: onEmailChange(event.target.value)} required autoComplete="email" />
- **소스 추적:** `src/core/pages/account/AccountBasicForms.tsx:176` · `form` · 표시 텍스트: onEmailChange(event.target.value)} required autoComplete="email" />

#### 클릭·입력·확인 절차

1. /account에서 해당 폼의 모든 필수 필드를 비운 채 제출한다.
2. 정상 QA 값을 입력해 Enter와 버튼 제출을 각각 시도한다.
3. 제출 중 다시 클릭·새로고침·뒤로가기를 시도한다.

#### 기대 결과

필수값과 형식 오류는 제출 전에 식별 가능하게 표시된다. 정상 제출은 한 번만 처리되며, 로딩·성공·실패·재시도 상태가 명확하다. 중복 레코드나 부분 저장이 생기지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-381 — input · AccountBasicForms.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountBasicForms.tsx:179` · `input` · id: account-email · type: email · value: email
- **소스 추적:** `src/core/pages/account/AccountBasicForms.tsx:179` · `input` · id: account-email · type: email · value: email

#### 클릭·입력·확인 절차

1. /account에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-382 — button · AccountBasicForms.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountBasicForms.tsx:190` · `button` · type: submit · disabled: saving !== null
- **소스 추적:** `src/core/pages/account/AccountBasicForms.tsx:190` · `button` · type: submit · disabled: saving !== null

#### 클릭·입력·확인 절차

1. /account에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-383 — button · AccountBasicForms.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountBasicForms.tsx:219` · `button` · type: button · disabled: saving !== null
- **소스 추적:** `src/core/pages/account/AccountBasicForms.tsx:219` · `button` · type: button · disabled: saving !== null

#### 클릭·입력·확인 절차

1. /account에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-384 — button · AccountHeader.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountHeader.tsx:37` · `button` · type: button
- **소스 추적:** `src/core/pages/account/AccountHeader.tsx:37` · `button` · type: button

#### 클릭·입력·확인 절차

1. /account에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-385 — form · AccountPasswordForm.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountPasswordForm.tsx:47` · `form` · 표시 텍스트: onCurrentPasswordChange(event.target.value)} onBlur= onKeyDown={(event) => { if (event.key === "Ente
- **소스 추적:** `src/core/pages/account/AccountPasswordForm.tsx:47` · `form` · 표시 텍스트: onCurrentPasswordChange(event.target.value)} onBlur= onKeyDown={(event) => { if (event.key === "Ente

#### 클릭·입력·확인 절차

1. /account에서 해당 폼의 모든 필수 필드를 비운 채 제출한다.
2. 정상 QA 값을 입력해 Enter와 버튼 제출을 각각 시도한다.
3. 제출 중 다시 클릭·새로고침·뒤로가기를 시도한다.

#### 기대 결과

필수값과 형식 오류는 제출 전에 식별 가능하게 표시된다. 정상 제출은 한 번만 처리되며, 로딩·성공·실패·재시도 상태가 명확하다. 중복 레코드나 부분 저장이 생기지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-386 — input · AccountPasswordForm.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountPasswordForm.tsx:50` · `input` · id: account-current-password · type: password · value: currentPassword
- **소스 추적:** `src/core/pages/account/AccountPasswordForm.tsx:50` · `input` · id: account-current-password · type: password · value: currentPassword

#### 클릭·입력·확인 절차

1. /account에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-387 — input · AccountPasswordForm.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountPasswordForm.tsx:91` · `input` · id: account-password · type: password · value: password · disabled: !currentPasswordVerified
- **소스 추적:** `src/core/pages/account/AccountPasswordForm.tsx:91` · `input` · id: account-password · type: password · value: password · disabled: !currentPasswordVerified

#### 클릭·입력·확인 절차

1. /account에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-388 — input · AccountPasswordForm.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountPasswordForm.tsx:104` · `input` · id: account-password-confirm · type: password · value: passwordConfirm · disabled: !currentPasswordVerified
- **소스 추적:** `src/core/pages/account/AccountPasswordForm.tsx:104` · `input` · id: account-password-confirm · type: password · value: passwordConfirm · disabled: !currentPasswordVerified

#### 클릭·입력·확인 절차

1. /account에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-389 — button · AccountPasswordForm.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/account/AccountPasswordForm.tsx:117` · `button` · type: submit · disabled: saving !== null || checkingCurrentPassword || !currentPasswordVerified
- **소스 추적:** `src/core/pages/account/AccountPasswordForm.tsx:117` · `button` · type: submit · disabled: saving !== null || checkingCurrentPassword || !currentPasswordVerified

#### 클릭·입력·확인 절차

1. /account에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-390 — button · GoogleSignInButton.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/login/components/GoogleSignInButton.tsx:33` · `button` · type: button · disabled: loading
- **소스 추적:** `src/core/pages/login/components/GoogleSignInButton.tsx:33` · `button` · type: button · disabled: loading

#### 클릭·입력·확인 절차

1. /login에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-391 — input · LoginFormPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/login/components/LoginFormPanel.tsx:44` · `input` · id: id · type: type · value: value · placeholder: placeholder
- **소스 추적:** `src/core/pages/login/components/LoginFormPanel.tsx:44` · `input` · id: id · type: type · value: value · placeholder: placeholder

#### 클릭·입력·확인 절차

1. /login에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-392 — button · LoginFormPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/login/components/LoginFormPanel.tsx:128` · `button` · type: button
- **소스 추적:** `src/core/pages/login/components/LoginFormPanel.tsx:128` · `button` · type: button

#### 클릭·입력·확인 절차

1. /login에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-393 — button · LoginFormPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/login/components/LoginFormPanel.tsx:154` · `button` · type: button
- **소스 추적:** `src/core/pages/login/components/LoginFormPanel.tsx:154` · `button` · type: button

#### 클릭·입력·확인 절차

1. /login에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-394 — form · LoginFormPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/login/components/LoginFormPanel.tsx:237` · `form` · 표시 텍스트: {(!isSignup || signupStep === 1) && ( <> {isSignup && ( )} )} {(!isSignup || signupStep === 2) && ( 
- **소스 추적:** `src/core/pages/login/components/LoginFormPanel.tsx:237` · `form` · 표시 텍스트: {(!isSignup || signupStep === 1) && ( <> {isSignup && ( )} )} {(!isSignup || signupStep === 2) && ( 

#### 클릭·입력·확인 절차

1. /login에서 해당 폼의 모든 필수 필드를 비운 채 제출한다.
2. 정상 QA 값을 입력해 Enter와 버튼 제출을 각각 시도한다.
3. 제출 중 다시 클릭·새로고침·뒤로가기를 시도한다.

#### 기대 결과

필수값과 형식 오류는 제출 전에 식별 가능하게 표시된다. 정상 제출은 한 번만 처리되며, 로딩·성공·실패·재시도 상태가 명확하다. 중복 레코드나 부분 저장이 생기지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-395 — button · LoginFormPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/login/components/LoginFormPanel.tsx:280` · `button` · type: submit · disabled: loading
- **소스 추적:** `src/core/pages/login/components/LoginFormPanel.tsx:280` · `button` · type: submit · disabled: loading

#### 클릭·입력·확인 절차

1. /login에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-396 — button · LoginFormPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/login/components/LoginFormPanel.tsx:300` · `button` · type: button
- **소스 추적:** `src/core/pages/login/components/LoginFormPanel.tsx:300` · `button` · type: button

#### 클릭·입력·확인 절차

1. /login에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-397 — button · LoginFormPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/core/pages/login/components/LoginFormPanel.tsx:322` · `button` · type: button
- **소스 추적:** `src/core/pages/login/components/LoginFormPanel.tsx:322` · `button` · type: button

#### 클릭·입력·확인 절차

1. /login에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-398 — div · DesktopNav.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/layout/DesktopNav.tsx:77` · `div` · 표시 텍스트: setExpandedArtist(artist.slug)} className={`$ ${expandedArtist === artist.slug || pathname.startsWit
- **소스 추적:** `src/public/components/layout/DesktopNav.tsx:77` · `div` · 표시 텍스트: setExpandedArtist(artist.slug)} className={`$ ${expandedArtist === artist.slug || pathname.startsWit

#### 클릭·입력·확인 절차

1. 모든 공개 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-399 — button · DesktopNav.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/layout/DesktopNav.tsx:83` · `button` · type: button · aria-expanded: expandedArtist === artist.slug · 표시 텍스트: {artist.logo_url ? ( ) : ( )}
- **소스 추적:** `src/public/components/layout/DesktopNav.tsx:83` · `button` · type: button · aria-expanded: expandedArtist === artist.slug · 표시 텍스트: {artist.logo_url ? ( ) : ( )}

#### 클릭·입력·확인 절차

1. 모든 공개 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-400 — button · DesktopNav.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/layout/DesktopNav.tsx:168` · `button` · type: button · aria-label: isDark ? t.common.lightMode : t.common.darkMode · 표시 텍스트: {isDark ? : }
- **소스 추적:** `src/public/components/layout/DesktopNav.tsx:168` · `button` · type: button · aria-label: isDark ? t.common.lightMode : t.common.darkMode · 표시 텍스트: {isDark ? : }

#### 클릭·입력·확인 절차

1. 모든 공개 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-401 — a · Footer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/layout/Footer.tsx:96` · `a` · href: item.url · target: _blank · aria-label: accessibleLabel · title: accessibleLabel
- **소스 추적:** `src/public/components/layout/Footer.tsx:96` · `a` · href: item.url · target: _blank · aria-label: accessibleLabel · title: accessibleLabel

#### 클릭·입력·확인 절차

1. 모든 공개 화면에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-402 — button · MobileNav.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/layout/MobileNav.tsx:86` · `button` · type: button · aria-label: isDark ? t.common.lightMode : t.common.darkMode · 표시 텍스트: {isDark ? : }
- **소스 추적:** `src/public/components/layout/MobileNav.tsx:86` · `button` · type: button · aria-label: isDark ? t.common.lightMode : t.common.darkMode · 표시 텍스트: {isDark ? : }

#### 클릭·입력·확인 절차

1. 모든 공개 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-403 — button · MobileNav.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/layout/MobileNav.tsx:137` · `button` · type: button · aria-label: isOpen ? t.common.closeMenu : t.common.openMenu · aria-expanded: isOpen · aria-controls: mobile-menu
- **소스 추적:** `src/public/components/layout/MobileNav.tsx:137` · `button` · type: button · aria-label: isOpen ? t.common.closeMenu : t.common.openMenu · aria-expanded: isOpen · aria-controls: mobile-menu

#### 클릭·입력·확인 절차

1. 모든 공개 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-404 — div · MobileNav.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/layout/MobileNav.tsx:157` · `div` · id: mobile-menu · role: dialog · aria-label: t.common.mobileMenu · 표시 텍스트: {(artists || []).map((artist) => { const open = mobileOpenArtist === artist.slug; return ( setMobile
- **소스 추적:** `src/public/components/layout/MobileNav.tsx:157` · `div` · id: mobile-menu · role: dialog · aria-label: t.common.mobileMenu · 표시 텍스트: {(artists || []).map((artist) => { const open = mobileOpenArtist === artist.slug; return ( setMobile

#### 클릭·입력·확인 절차

1. 모든 공개 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-405 — button · MobileNav.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/layout/MobileNav.tsx:186` · `button` · type: button · 표시 텍스트: {artist.logo_url ? ( ) : ( )}
- **소스 추적:** `src/public/components/layout/MobileNav.tsx:186` · `button` · type: button · 표시 텍스트: {artist.logo_url ? ( ) : ( )}

#### 클릭·입력·확인 절차

1. 모든 공개 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-406 — input · NoticeBoard.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/notices/NoticeBoard.tsx:214` · `input` · value: search · placeholder: copy.search
- **소스 추적:** `src/public/components/notices/NoticeBoard.tsx:214` · `input` · value: search · placeholder: copy.search

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-407 — button · NoticeBoard.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/notices/NoticeBoard.tsx:226` · `button` · type: button · aria-label: copy.closeSearch
- **소스 추적:** `src/public/components/notices/NoticeBoard.tsx:226` · `button` · type: button · aria-label: copy.closeSearch

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-408 — button · NoticeBoard.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/notices/NoticeBoard.tsx:234` · `button` · type: button · aria-label: searchOpen ? copy.closeSearch : copy.search
- **소스 추적:** `src/public/components/notices/NoticeBoard.tsx:234` · `button` · type: button · aria-label: searchOpen ? copy.closeSearch : copy.search

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-409 — button · NoticeBoard.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/notices/NoticeBoard.tsx:297` · `button` · type: button · disabled: currentPage === 1 · aria-label: copy.previousPage
- **소스 추적:** `src/public/components/notices/NoticeBoard.tsx:297` · `button` · type: button · disabled: currentPage === 1 · aria-label: copy.previousPage

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-410 — button · NoticeBoard.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/components/notices/NoticeBoard.tsx:308` · `button` · type: button · disabled: currentPage === pageCount · aria-label: copy.nextPage
- **소스 추적:** `src/public/components/notices/NoticeBoard.tsx:308` · `button` · type: button · disabled: currentPage === pageCount · aria-label: copy.nextPage

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-411 — input · GlobalPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/features/player/GlobalPlayer.tsx:69` · `input` · type: range · value: safeProgress · disabled: !safeDuration · aria-label: label
- **소스 추적:** `src/public/features/player/GlobalPlayer.tsx:69` · `input` · type: range · value: safeProgress · disabled: !safeDuration · aria-label: label

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-412 — button · GlobalPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/features/player/GlobalPlayer.tsx:183` · `button` · type: button · aria-expanded: desktopOpen · aria-controls: global-player-popover
- **소스 추적:** `src/public/features/player/GlobalPlayer.tsx:183` · `button` · type: button · aria-expanded: desktopOpen · aria-controls: global-player-popover

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-413 — section · GlobalPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/features/player/GlobalPlayer.tsx:205` · `section` · id: global-player-popover · role: dialog · 표시 텍스트: {album ? ` - $ ` : ""}
- **소스 추적:** `src/public/features/player/GlobalPlayer.tsx:205` · `section` · id: global-player-popover · role: dialog · 표시 텍스트: {album ? ` - $ ` : ""}

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 section을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-414 — button · GlobalPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/features/player/GlobalPlayer.tsx:222` · `button` · type: button · aria-label: copy.previous
- **소스 추적:** `src/public/features/player/GlobalPlayer.tsx:222` · `button` · type: button · aria-label: copy.previous

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-415 — button · GlobalPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/features/player/GlobalPlayer.tsx:230` · `button` · type: button · aria-label: isPlaying ? copy.pause : copy.play
- **소스 추적:** `src/public/features/player/GlobalPlayer.tsx:230` · `button` · type: button · aria-label: isPlaying ? copy.pause : copy.play

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-416 — button · GlobalPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/features/player/GlobalPlayer.tsx:242` · `button` · type: button · aria-label: copy.next
- **소스 추적:** `src/public/features/player/GlobalPlayer.tsx:242` · `button` · type: button · aria-label: copy.next

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-417 — button · GlobalPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/features/player/GlobalPlayer.tsx:281` · `button` · type: button · aria-label: copy.previous
- **소스 추적:** `src/public/features/player/GlobalPlayer.tsx:281` · `button` · type: button · aria-label: copy.previous

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-418 — button · GlobalPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/features/player/GlobalPlayer.tsx:289` · `button` · type: button · aria-label: isPlaying ? copy.pause : copy.play
- **소스 추적:** `src/public/features/player/GlobalPlayer.tsx:289` · `button` · type: button · aria-label: isPlaying ? copy.pause : copy.play

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-419 — button · GlobalPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/features/player/GlobalPlayer.tsx:301` · `button` · type: button · aria-label: copy.next
- **소스 추적:** `src/public/features/player/GlobalPlayer.tsx:301` · `button` · type: button · aria-label: copy.next

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-420 — button · GlobalPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/features/player/GlobalPlayer.tsx:309` · `button` · type: button · aria-label: mobileCollapsed ? copy.open : copy.close · aria-expanded: !mobileCollapsed
- **소스 추적:** `src/public/features/player/GlobalPlayer.tsx:309` · `button` · type: button · aria-label: mobileCollapsed ? copy.open : copy.close · aria-expanded: !mobileCollapsed

#### 클릭·입력·확인 절차

1. 해당 컴포넌트를 렌더링하는 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-421 — button · DesktopArtistScene.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/DesktopArtistScene.tsx:96` · `button` · type: button · aria-expanded: groupFocused · aria-controls: groupBio ? "group-artist-bio" : undefined · 표시 텍스트: {artist.logo_url && ( )}
- **소스 추적:** `src/public/pages/[artistid]/artist/DesktopArtistScene.tsx:96` · `button` · type: button · aria-expanded: groupFocused · aria-controls: groupBio ? "group-artist-bio" : undefined · 표시 텍스트: {artist.logo_url && ( )}

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-422 — button · MemberDetailOverlay.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/MemberDetailOverlay.tsx:32` · `button` · type: button · aria-label: copy.close
- **소스 추적:** `src/public/pages/[artistid]/artist/MemberDetailOverlay.tsx:32` · `button` · type: button · aria-label: copy.close

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-423 — button · MemberDetailOverlay.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/MemberDetailOverlay.tsx:48` · `button` · type: button · aria-label: copy.previous
- **소스 추적:** `src/public/pages/[artistid]/artist/MemberDetailOverlay.tsx:48` · `button` · type: button · aria-label: copy.previous

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-424 — button · MemberDetailOverlay.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/MemberDetailOverlay.tsx:55` · `button` · type: button · aria-label: copy.next
- **소스 추적:** `src/public/pages/[artistid]/artist/MemberDetailOverlay.tsx:55` · `button` · type: button · aria-label: copy.next

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-425 — a · MobileArtistScene.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/MobileArtistScene.tsx:93` · `a` · href: activeLink · aria-label: copy.openLink · title: copy.openLink · target: isExternalLink ? "_blank" : undefined · 표시 텍스트: {faviconUrl ? ( ) : ( )}
- **소스 추적:** `src/public/pages/[artistid]/artist/MobileArtistScene.tsx:93` · `a` · href: activeLink · aria-label: copy.openLink · title: copy.openLink · target: isExternalLink ? "_blank" : undefined · 표시 텍스트: {faviconUrl ? ( ) : ( )}

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

링크가 표시된 라벨·현재 컨텍스트와 일치하는 목적지로 한 번만 이동한다. 404, 빈 페이지, 잘못된 상태 전파가 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-426 — button · MobileSceneControls.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/MobileSceneControls.tsx:49` · `button` · type: button · aria-label: copy.close
- **소스 추적:** `src/public/pages/[artistid]/artist/MobileSceneControls.tsx:49` · `button` · type: button · aria-label: copy.close

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-427 — button · MobileSceneControls.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/MobileSceneControls.tsx:64` · `button` · type: button
- **소스 추적:** `src/public/pages/[artistid]/artist/MobileSceneControls.tsx:64` · `button` · type: button

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-428 — button · MobileSceneControls.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/MobileSceneControls.tsx:68` · `button` · type: button
- **소스 추적:** `src/public/pages/[artistid]/artist/MobileSceneControls.tsx:68` · `button` · type: button

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-429 — button · MobileSceneControls.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/MobileSceneControls.tsx:89` · `button` · type: button · disabled: activeIndex === 0 · aria-label: copy.previous
- **소스 추적:** `src/public/pages/[artistid]/artist/MobileSceneControls.tsx:89` · `button` · type: button · disabled: activeIndex === 0 · aria-label: copy.previous

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-430 — button · MobileSceneControls.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/MobileSceneControls.tsx:100` · `button` · type: button · disabled: activeIndex === scenes.length - 1 · aria-label: copy.next
- **소스 추적:** `src/public/pages/[artistid]/artist/MobileSceneControls.tsx:100` · `button` · type: button · disabled: activeIndex === scenes.length - 1 · aria-label: copy.next

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-431 — button · MobileSceneControls.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/MobileSceneControls.tsx:116` · `button` · type: button · 표시 텍스트: {member.image_url && ( )}
- **소스 추적:** `src/public/pages/[artistid]/artist/MobileSceneControls.tsx:116` · `button` · type: button · 표시 텍스트: {member.image_url && ( )}

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-432 — div · SceneCanvas.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/SceneCanvas.tsx:75` · `div` · 표시 텍스트: {focusRegions.map((region) => { const path = outlineToPath(region.outline); if (!path) return null; 
- **소스 추적:** `src/public/pages/[artistid]/artist/SceneCanvas.tsx:75` · `div` · 표시 텍스트: {focusRegions.map((region) => { const path = outlineToPath(region.outline); if (!path) return null; 

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-433 — button · SceneDock.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/SceneDock.tsx:54` · `button` · type: button
- **소스 추적:** `src/public/pages/[artistid]/artist/SceneDock.tsx:54` · `button` · type: button

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-434 — a · SceneDock.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/SceneDock.tsx:72` · `a` · href: activeSceneLink · aria-label: copy.openLink · title: copy.openLink · target: isExternalLink ? "_blank" : undefined
- **소스 추적:** `src/public/pages/[artistid]/artist/SceneDock.tsx:72` · `a` · href: activeSceneLink · aria-label: copy.openLink · title: copy.openLink · target: isExternalLink ? "_blank" : undefined

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

링크가 표시된 라벨·현재 컨텍스트와 일치하는 목적지로 한 번만 이동한다. 404, 빈 페이지, 잘못된 상태 전파가 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-435 — button · SceneDock.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/artist/SceneDock.tsx:96` · `button` · type: button · 표시 텍스트: ALL
- **소스 추적:** `src/public/pages/[artistid]/artist/SceneDock.tsx:96` · `button` · type: button · 표시 텍스트: ALL

#### 클릭·입력·확인 절차

1. /{artistSlug}/artist에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-436 — div · AlbumArtwork.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/AlbumArtwork.tsx:53` · `div` · div 요소(동적 라벨 확인 필요)
- **소스 추적:** `src/public/pages/[artistid]/discography/components/AlbumArtwork.tsx:53` · `div` · div 요소(동적 라벨 확인 필요)

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-437 — div · AlbumArtwork.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/AlbumArtwork.tsx:138` · `div` · div 요소(동적 라벨 확인 필요)
- **소스 추적:** `src/public/pages/[artistid]/discography/components/AlbumArtwork.tsx:138` · `div` · div 요소(동적 라벨 확인 필요)

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-438 — a · AlbumDetails.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/AlbumDetails.tsx:96` · `a` · href: album.links.spotify · target: _blank
- **소스 추적:** `src/public/pages/[artistid]/discography/components/AlbumDetails.tsx:96` · `a` · href: album.links.spotify · target: _blank

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-439 — button · AlbumDetails.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/AlbumDetails.tsx:115` · `button` · 표시 텍스트: {activeTab === tab.id && ( )}
- **소스 추적:** `src/public/pages/[artistid]/discography/components/AlbumDetails.tsx:115` · `button` · 표시 텍스트: {activeTab === tab.id && ( )}

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-440 — button · AlbumDock.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/AlbumDock.tsx:46` · `button` · aria-label: sortBy === "date-desc" ? t.discography.sortAscending : t.discography.sortDescending · title: sortBy === "date-desc" ? t.discography.newest : t.discography.oldest
- **소스 추적:** `src/public/pages/[artistid]/discography/components/AlbumDock.tsx:46` · `button` · aria-label: sortBy === "date-desc" ? t.discography.sortAscending : t.discography.sortDescending · title: sortBy === "date-desc" ? t.discography.newest : t.discography.oldest

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-441 — button · AlbumDock.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/AlbumDock.tsx:73` · `button` · disabled: albumIndex === 0 · aria-label: t.discography.previousAlbum
- **소스 추적:** `src/public/pages/[artistid]/discography/components/AlbumDock.tsx:73` · `button` · disabled: albumIndex === 0 · aria-label: t.discography.previousAlbum

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-442 — button · AlbumDock.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/AlbumDock.tsx:99` · `button` · button 요소(동적 라벨 확인 필요)
- **소스 추적:** `src/public/pages/[artistid]/discography/components/AlbumDock.tsx:99` · `button` · button 요소(동적 라벨 확인 필요)

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-443 — button · AlbumDock.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/AlbumDock.tsx:174` · `button` · disabled: albumIndex === albums.length - 1 · aria-label: t.discography.nextAlbum
- **소스 추적:** `src/public/pages/[artistid]/discography/components/AlbumDock.tsx:174` · `button` · disabled: albumIndex === albums.length - 1 · aria-label: t.discography.nextAlbum

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-444 — button · MemberGalleryFilters.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/MemberGalleryFilters.tsx:41` · `button` · type: button
- **소스 추적:** `src/public/pages/[artistid]/discography/components/MemberGalleryFilters.tsx:41` · `button` · type: button

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-445 — button · MemberGalleryFilters.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/MemberGalleryFilters.tsx:68` · `button` · type: button · 표시 텍스트: {member.imageUrl ? ( ) : ( )} {count > 0 && ( )}
- **소스 추적:** `src/public/pages/[artistid]/discography/components/MemberGalleryFilters.tsx:68` · `button` · type: button · 표시 텍스트: {member.imageUrl ? ( ) : ( )} {count > 0 && ( )}

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-446 — button · MemberGalleryGrid.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/MemberGalleryGrid.tsx:93` · `button` · type: button · 표시 텍스트: {showMember && member ? ( ) : ( )} {item.caption && ( )}
- **소스 추적:** `src/public/pages/[artistid]/discography/components/MemberGalleryGrid.tsx:93` · `button` · type: button · 표시 텍스트: {showMember && member ? ( ) : ( )} {item.caption && ( )}

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-447 — div · MemberGalleryLightbox.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/MemberGalleryLightbox.tsx:76` · `div` · role: dialog · aria-label: photo.caption || "Gallery image" · 표시 텍스트: } style={{ position: "fixed", top: "1.25rem", right: "1.25rem", zIndex: 10000, backgroundColor: "rgb
- **소스 추적:** `src/public/pages/[artistid]/discography/components/MemberGalleryLightbox.tsx:76` · `div` · role: dialog · aria-label: photo.caption || "Gallery image" · 표시 텍스트: } style={{ position: "fixed", top: "1.25rem", right: "1.25rem", zIndex: 10000, backgroundColor: "rgb

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-448 — button · MemberGalleryLightbox.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/MemberGalleryLightbox.tsx:86` · `button` · type: button · aria-label: Close Lightbox
- **소스 추적:** `src/public/pages/[artistid]/discography/components/MemberGalleryLightbox.tsx:86` · `button` · type: button · aria-label: Close Lightbox

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-449 — div · MemberGalleryLightbox.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/MemberGalleryLightbox.tsx:107` · `div` · div 요소(동적 라벨 확인 필요)
- **소스 추적:** `src/public/pages/[artistid]/discography/components/MemberGalleryLightbox.tsx:107` · `div` · div 요소(동적 라벨 확인 필요)

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-450 — button · MemberGalleryLightbox.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/MemberGalleryLightbox.tsx:148` · `button` · type: button · disabled: index === 0 · aria-label: Previous image
- **소스 추적:** `src/public/pages/[artistid]/discography/components/MemberGalleryLightbox.tsx:148` · `button` · type: button · disabled: index === 0 · aria-label: Previous image

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-451 — button · MemberGalleryLightbox.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/MemberGalleryLightbox.tsx:158` · `button` · type: button · disabled: index === gallery.length - 1 · aria-label: Next image
- **소스 추적:** `src/public/pages/[artistid]/discography/components/MemberGalleryLightbox.tsx:158` · `button` · type: button · disabled: index === gallery.length - 1 · aria-label: Next image

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-452 — div · MobileAlbumView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/MobileAlbumView.tsx:159` · `div` · 표시 텍스트: {previousAlbum && ( )}
- **소스 추적:** `src/public/pages/[artistid]/discography/components/MobileAlbumView.tsx:159` · `div` · 표시 텍스트: {previousAlbum && ( )}

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-453 — button · MobileAlbumView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/MobileAlbumView.tsx:249` · `button` · type: button · aria-current: current ? "true" : undefined
- **소스 추적:** `src/public/pages/[artistid]/discography/components/MobileAlbumView.tsx:249` · `button` · type: button · aria-current: current ? "true" : undefined

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-454 — button · MobileAlbumView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/MobileAlbumView.tsx:326` · `button` · type: button · disabled: !canPlay · aria-label: isPlaying ? t.discography.pause : t.discography.play
- **소스 추적:** `src/public/pages/[artistid]/discography/components/MobileAlbumView.tsx:326` · `button` · type: button · disabled: !canPlay · aria-label: isPlaying ? t.discography.pause : t.discography.play

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-455 — button · MobileDiscographyPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/MobileDiscographyPlayer.tsx:76` · `button` · type: button · role: tab · 표시 텍스트: {tab === "tracks" && ( )}
- **소스 추적:** `src/public/pages/[artistid]/discography/components/MobileDiscographyPlayer.tsx:76` · `button` · type: button · role: tab · 표시 텍스트: {tab === "tracks" && ( )}

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-456 — button · TrackList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/TrackList.tsx:48` · `button` · type: button
- **소스 추적:** `src/public/pages/[artistid]/discography/components/TrackList.tsx:48` · `button` · type: button

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-457 — a · TrackList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/TrackList.tsx:81` · `a` · href: spotifyHref · target: _blank · 표시 텍스트: SP
- **소스 추적:** `src/public/pages/[artistid]/discography/components/TrackList.tsx:81` · `a` · href: spotifyHref · target: _blank · 표시 텍스트: SP

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-458 — a · TrackList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/TrackList.tsx:92` · `a` · href: videoHref · target: _blank · 표시 텍스트: MV
- **소스 추적:** `src/public/pages/[artistid]/discography/components/TrackList.tsx:92` · `a` · href: videoHref · target: _blank · 표시 텍스트: MV

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-459 — input · TrackPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/TrackPlayer.tsx:64` · `input` · type: range · value: safeProgress · disabled: !audioHref · aria-label: t.discography.progress
- **소스 추적:** `src/public/pages/[artistid]/discography/components/TrackPlayer.tsx:64` · `input` · type: range · value: safeProgress · disabled: !audioHref · aria-label: t.discography.progress

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-460 — button · TrackPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/TrackPlayer.tsx:80` · `button` · type: button · aria-label: t.discography.previousTrack
- **소스 추적:** `src/public/pages/[artistid]/discography/components/TrackPlayer.tsx:80` · `button` · type: button · aria-label: t.discography.previousTrack

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-461 — button · TrackPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/TrackPlayer.tsx:88` · `button` · type: button · disabled: !audioHref · aria-label: isPlaying ? t.discography.pause : t.discography.play · title: audioHref ? isPlaying ? t.discography.pause : t.discography.play : t.discography.noAudio
- **소스 추적:** `src/public/pages/[artistid]/discography/components/TrackPlayer.tsx:88` · `button` · type: button · disabled: !audioHref · aria-label: isPlaying ? t.discography.pause : t.discography.play · title: audioHref ? isPlaying ? t.discography.pause : t.discography.play : t.discography.noAudio

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-462 — button · TrackPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/TrackPlayer.tsx:109` · `button` · type: button · aria-label: t.discography.nextTrack
- **소스 추적:** `src/public/pages/[artistid]/discography/components/TrackPlayer.tsx:109` · `button` · type: button · aria-label: t.discography.nextTrack

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-463 — a · TrackPlayer.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/discography/components/TrackPlayer.tsx:119` · `a` · href: youtubeHref · target: _blank · 표시 텍스트: MV
- **소스 추적:** `src/public/pages/[artistid]/discography/components/TrackPlayer.tsx:119` · `a` · href: youtubeHref · target: _blank · 표시 텍스트: MV

#### 클릭·입력·확인 절차

1. /{artistSlug}/discography에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-464 — button · schedule-view.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/schedule/schedule-view.tsx:101` · `button` · type: button · aria-expanded: isSelected
- **소스 추적:** `src/public/pages/[artistid]/schedule/schedule-view.tsx:101` · `button` · type: button · aria-expanded: isSelected

#### 클릭·입력·확인 절차

1. /{artistSlug}/schedule에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-465 — button · schedule-view.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/schedule/schedule-view.tsx:114` · `button` · type: button
- **소스 추적:** `src/public/pages/[artistid]/schedule/schedule-view.tsx:114` · `button` · type: button

#### 클릭·입력·확인 절차

1. /{artistSlug}/schedule에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-466 — a · schedule-view.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/schedule/schedule-view.tsx:139` · `a` · href: href · target: _blank
- **소스 추적:** `src/public/pages/[artistid]/schedule/schedule-view.tsx:139` · `a` · href: href · target: _blank

#### 클릭·입력·확인 절차

1. /{artistSlug}/schedule에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-467 — button · schedule-view.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/schedule/schedule-view.tsx:154` · `button` · type: button · disabled: page === 0 · aria-label: t.previous
- **소스 추적:** `src/public/pages/[artistid]/schedule/schedule-view.tsx:154` · `button` · type: button · disabled: page === 0 · aria-label: t.previous

#### 클릭·입력·확인 절차

1. /{artistSlug}/schedule에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-468 — button · schedule-view.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/schedule/schedule-view.tsx:165` · `button` · type: button · disabled: page >= totalPages - 1 · aria-label: t.next
- **소스 추적:** `src/public/pages/[artistid]/schedule/schedule-view.tsx:165` · `button` · type: button · disabled: page >= totalPages - 1 · aria-label: t.next

#### 클릭·입력·확인 절차

1. /{artistSlug}/schedule에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-469 — button · schedule-view.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/schedule/schedule-view.tsx:217` · `button` · type: button · aria-label: t.previousYear
- **소스 추적:** `src/public/pages/[artistid]/schedule/schedule-view.tsx:217` · `button` · type: button · aria-label: t.previousYear

#### 클릭·입력·확인 절차

1. /{artistSlug}/schedule에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-470 — button · schedule-view.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/schedule/schedule-view.tsx:229` · `button` · type: button · aria-label: t.nextYear
- **소스 추적:** `src/public/pages/[artistid]/schedule/schedule-view.tsx:229` · `button` · type: button · aria-label: t.nextYear

#### 클릭·입력·확인 절차

1. /{artistSlug}/schedule에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-471 — button · schedule-view.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/schedule/schedule-view.tsx:241` · `button` · type: button
- **소스 추적:** `src/public/pages/[artistid]/schedule/schedule-view.tsx:241` · `button` · type: button

#### 클릭·입력·확인 절차

1. /{artistSlug}/schedule에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-472 — button · schedule-view.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/schedule/schedule-view.tsx:251` · `button` · type: button · aria-current: cursor.getMonth() === index
- **소스 추적:** `src/public/pages/[artistid]/schedule/schedule-view.tsx:251` · `button` · type: button · aria-current: cursor.getMonth() === index

#### 클릭·입력·확인 절차

1. /{artistSlug}/schedule에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-473 — button · schedule-view.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/schedule/schedule-view.tsx:289` · `button` · type: button · disabled: !dayEvents.length · aria-label: t.dayLabel( cursor.getMonth() + 1, day, dayEvents.length, ) · 표시 텍스트: {!!dayEvents.length && ( {[...new Set(dayEvents.map((event) => event.category))] .slice(0, 3) .map((
- **소스 추적:** `src/public/pages/[artistid]/schedule/schedule-view.tsx:289` · `button` · type: button · disabled: !dayEvents.length · aria-label: t.dayLabel( cursor.getMonth() + 1, day, dayEvents.length, ) · 표시 텍스트: {!!dayEvents.length && ( {[...new Set(dayEvents.map((event) => event.category))] .slice(0, 3) .map((

#### 클릭·입력·확인 절차

1. /{artistSlug}/schedule에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-474 — button · schedule-view.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/[artistid]/schedule/schedule-view.tsx:327` · `button` · type: button
- **소스 추적:** `src/public/pages/[artistid]/schedule/schedule-view.tsx:327` · `button` · type: button

#### 클릭·입력·확인 절차

1. /{artistSlug}/schedule에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-475 — a · AboutClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/about/AboutClient.tsx:281` · `a` · a 요소(동적 라벨 확인 필요)
- **소스 추적:** `src/public/pages/about/AboutClient.tsx:281` · `a` · a 요소(동적 라벨 확인 필요)

#### 클릭·입력·확인 절차

1. /about에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

링크가 표시된 라벨·현재 컨텍스트와 일치하는 목적지로 한 번만 이동한다. 404, 빈 페이지, 잘못된 상태 전파가 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-476 — button · AboutClient.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/about/AboutClient.tsx:344` · `button` · 표시 텍스트: → {isActive ? ( /* Active State: Highlight background, bold text, no strike-through */ ) : ( /* Inac
- **소스 추적:** `src/public/pages/about/AboutClient.tsx:344` · `button` · 표시 텍스트: → {isActive ? ( /* Active State: Highlight background, bold text, no strike-through */ ) : ( /* Inac

#### 클릭·입력·확인 절차

1. /about에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-510 — video · HomeSlide.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/home/HomeSlide.tsx:91` · `video` · video 요소(동적 라벨 확인 필요)
- **소스 추적:** `src/public/pages/home/HomeSlide.tsx:91` · `video` · video 요소(동적 라벨 확인 필요)

#### 클릭·입력·확인 절차

1. /에서 영상 요소가 표시되는 상태를 만든다.
2. 최초 로딩·재생 대상 전환·탭 비활성화/복귀를 관찰한다.
3. 영상 요청 실패를 네트워크 차단으로 재현한다.

#### 기대 결과

영상의 로딩·재생·정지·poster/fallback이 화면 상태와 일치하고 실패 시에도 전체 화면이 멈추지 않는다. 자동재생은 정책에 맞는 muted/inline 동작을 지킨다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-511 — button · HomeSlide.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/home/HomeSlide.tsx:226` · `button` · type: button · aria-expanded: open
- **소스 추적:** `src/public/pages/home/HomeSlide.tsx:226` · `button` · type: button · aria-expanded: open

#### 클릭·입력·확인 절차

1. /에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-512 — button · HomeSlide.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/home/HomeSlide.tsx:239` · `button` · type: button · aria-label: Close streaming options
- **소스 추적:** `src/public/pages/home/HomeSlide.tsx:239` · `button` · type: button · aria-label: Close streaming options

#### 클릭·입력·확인 절차

1. /에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-513 — a · HomeSlide.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/home/HomeSlide.tsx:291` · `a` · href: href · target: _blank · aria-label: label
- **소스 추적:** `src/public/pages/home/HomeSlide.tsx:291` · `a` · href: href · target: _blank · aria-label: label

#### 클릭·입력·확인 절차

1. /에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-514 — button · HomeSlideControls.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/home/HomeSlideControls.tsx:30` · `button` · type: button · aria-label: Previous album
- **소스 추적:** `src/public/pages/home/HomeSlideControls.tsx:30` · `button` · type: button · aria-label: Previous album

#### 클릭·입력·확인 절차

1. /에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-515 — button · HomeSlideControls.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/home/HomeSlideControls.tsx:38` · `button` · type: button · aria-label: Next album
- **소스 추적:** `src/public/pages/home/HomeSlideControls.tsx:38` · `button` · type: button · aria-label: Next album

#### 클릭·입력·확인 절차

1. /에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-516 — button · HomeSlideControls.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** B
- **테스터 역할:** QA-ANON 또는 해당 화면 권한 계정
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/public/pages/home/HomeSlideControls.tsx:67` · `button` · type: button · aria-current: index === currentSlide ? "true" : undefined
- **소스 추적:** `src/public/pages/home/HomeSlideControls.tsx:67` · `button` · type: button · aria-current: index === currentSlide ? "true" : undefined

#### 클릭·입력·확인 절차

1. /에서 대상 button을 화면의 라벨·위치로 식별한다.
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
