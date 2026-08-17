# 09. UI 요소 전수 — 관리자 아티스트·오디션

> **기준 커밋:** `0d79efb18de637d02ce210464a1d340ba9294def`  
> 모든 항목은 **클릭·입력·확인 절차 → 기대 결과 → 결과 기록** 순서로 실행한다.

| 표기 | 의미 |
| --- | --- |
| **L** | Local에서만 안전하게 재현하는 검증 |
| **S** | Staging/Preview의 QA 데이터·계정으로 수행하는 검증 |
| **P** | Production에서만 확정 가능한 도메인·보안 헤더·외부 연동 검증 |
| **B** | Local과 Staging/Production 양쪽에서 수행하는 검증 |

> Production에서는 **QA 전용 계정·콘텐츠·파일만** 사용한다. 실제 접수·지원·신고·운영 데이터를 생성·수정·삭제하지 않는다.

> **이 파일의 범위:** 아티스트 profile/member/discography/schedule/tracks/scene과 오디션 캠페인 builder·지원서 검토의 실제 조작 요소  
> **케이스 수:** 127건

> 생성·정렬·삭제·저장 이후 공개 화면/지원 폼의 결과가 맞는지 04번 CMS 기능 파일과 교차 확인한다.

### UI-ATOM-070 — button · ArtistSceneManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneManager.tsx:272` · `button` · type: button · 표시 텍스트: 삭제
- **소스 추적:** `src/admin/components/scenes/ArtistSceneManager.tsx:272` · `button` · type: button · 표시 텍스트: 삭제

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-071 — button · ArtistSceneManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneManager.tsx:275` · `button` · type: button · 표시 텍스트: 복구
- **소스 추적:** `src/admin/components/scenes/ArtistSceneManager.tsx:275` · `button` · type: button · 표시 텍스트: 복구

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-072 — div · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:93` · `div` · 표시 텍스트: Interactive scenes 장면마다 멤버 외곽선을 직접 그리고 정밀 마스크를 연결합니다.
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:93` · `div` · 표시 텍스트: Interactive scenes 장면마다 멤버 외곽선을 직접 그리고 정밀 마스크를 연결합니다.

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-073 — button · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:108` · `button` · type: button · id: scene-import · disabled: busy · 표시 텍스트: 대표 이미지 가져오기
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:108` · `button` · type: button · id: scene-import · disabled: busy · 표시 텍스트: 대표 이미지 가져오기

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-074 — button · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:118` · `button` · type: button · id: scene-add · disabled: busy · 표시 텍스트: 장면 추가
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:118` · `button` · type: button · id: scene-add · disabled: busy · 표시 텍스트: 장면 추가

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-075 — input · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:127` · `input` · type: file · accept: image/jpeg,image/png,image/webp
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:127` · `input` · type: file · accept: image/jpeg,image/png,image/webp

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-076 — button · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:149` · `button` · type: button
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:149` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-077 — input · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:180` · `input` · value: selectedScene.link_url || "" · placeholder: https://www.youtube.com/...
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:180` · `input` · value: selectedScene.link_url || "" · placeholder: https://www.youtube.com/...

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-078 — input · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:191` · `input` · type: checkbox
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:191` · `input` · type: checkbox

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-079 — input · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:201` · `input` · type: checkbox
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:201` · `input` · type: checkbox

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-080 — button · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:210` · `button` · type: button · id: scene-delete · disabled: busy · 표시 텍스트: 삭제
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:210` · `button` · type: button · id: scene-delete · disabled: busy · 표시 텍스트: 삭제

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-081 — button · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:220` · `button` · type: button · id: scene-apply · disabled: busy · 표시 텍스트: 장면 적용
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:220` · `button` · type: button · id: scene-apply · disabled: busy · 표시 텍스트: 장면 적용

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-082 — button · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:242` · `button` · type: button
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:242` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-083 — button · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:287` · `button` · type: button · disabled: !draftOutline.length || busy · 표시 텍스트: 다시 그리기
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:287` · `button` · type: button · disabled: !draftOutline.length || busy · 표시 텍스트: 다시 그리기

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-084 — button · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:295` · `button` · type: button · id: scene-outline-apply · disabled: draftOutline.length < 3 || busy · 표시 텍스트: 외곽선 적용
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:295` · `button` · type: button · id: scene-outline-apply · disabled: draftOutline.length < 3 || busy · 표시 텍스트: 외곽선 적용

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-085 — button · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:304` · `button` · type: button · id: scene-mask · disabled: draftOutline.length < 3 || busy · 표시 텍스트: 정밀 마스크 덮어쓰기
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:304` · `button` · type: button · id: scene-mask · disabled: draftOutline.length < 3 || busy · 표시 텍스트: 정밀 마스크 덮어쓰기

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-086 — input · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:319` · `input` · type: file · accept: image/png,image/webp
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:319` · `input` · type: file · accept: image/png,image/webp

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-087 — button · ArtistSceneWorkspace.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/ArtistSceneWorkspace.tsx:330` · `button` · type: button · id: scene-region-delete · disabled: busy || (!draftOutline.length && !selectedRegion) · 표시 텍스트: 멤버 영역 제거
- **소스 추적:** `src/admin/components/scenes/ArtistSceneWorkspace.tsx:330` · `button` · type: button · id: scene-region-delete · disabled: busy || (!draftOutline.length && !selectedRegion) · 표시 텍스트: 멤버 영역 제거

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-088 — button · SceneCanvas.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/SceneCanvas.tsx:83` · `button` · type: button · disabled: zoom === 1 · aria-label: 축소
- **소스 추적:** `src/admin/components/scenes/SceneCanvas.tsx:83` · `button` · type: button · disabled: zoom === 1 · aria-label: 축소

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-089 — button · SceneCanvas.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/SceneCanvas.tsx:92` · `button` · type: button · disabled: zoom === 3 · aria-label: 확대
- **소스 추적:** `src/admin/components/scenes/SceneCanvas.tsx:92` · `button` · type: button · disabled: zoom === 3 · aria-label: 확대

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-090 — button · SceneCanvas.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/scenes/SceneCanvas.tsx:100` · `button` · type: button · disabled: zoom === 1 · aria-label: 화면 이동 모드
- **소스 추적:** `src/admin/components/scenes/SceneCanvas.tsx:100` · `button` · type: button · disabled: zoom === 1 · aria-label: 화면 이동 모드

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-145 — div · DiscographyBulkModal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyBulkModal.tsx:17` · `div` · role: dialog · aria-label: 여러 트랙 붙여넣기 · 표시 텍스트: 여러 곡 붙여넣기 한 줄에 한 곡씩 입력하세요. 앞의 트랙 번호는 자동으로 제거합니다. onChange(event.target.value)} autoFocus placeholder
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyBulkModal.tsx:17` · `div` · role: dialog · aria-label: 여러 트랙 붙여넣기 · 표시 텍스트: 여러 곡 붙여넣기 한 줄에 한 곡씩 입력하세요. 앞의 트랙 번호는 자동으로 제거합니다. onChange(event.target.value)} autoFocus placeholder

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-146 — textarea · DiscographyBulkModal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyBulkModal.tsx:29` · `textarea` · value: value · placeholder: 한 줄에 한 곡씩 입력
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyBulkModal.tsx:29` · `textarea` · value: value · placeholder: 한 줄에 한 곡씩 입력

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-147 — button · DiscographyBulkModal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyBulkModal.tsx:38` · `button` · type: button · 표시 텍스트: 취소
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyBulkModal.tsx:38` · `button` · type: button · 표시 텍스트: 취소

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-148 — button · DiscographyBulkModal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyBulkModal.tsx:45` · `button` · type: button · 표시 텍스트: 트랙 추가
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyBulkModal.tsx:45` · `button` · type: button · 표시 텍스트: 트랙 추가

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-149 — button · DiscographyContextRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:49` · `button` · type: button · aria-label: 새 앨범
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:49` · `button` · type: button · aria-label: 새 앨범

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-150 — input · DiscographyContextRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:58` · `input` · value: search · placeholder: 앨범 검색 · aria-label: 앨범 검색
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:58` · `input` · value: search · placeholder: 앨범 검색 · aria-label: 앨범 검색

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-151 — button · DiscographyContextRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:67` · `button` · type: button
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:67` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-152 — button · DiscographyContextRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:85` · `button` · type: button
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:85` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-153 — button · DiscographyContextRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:95` · `button` · type: button · id: entity-list-item · 표시 텍스트: {album.cover_url ? ( ) : ( )} · 곡
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:95` · `button` · type: button · id: entity-list-item · 표시 텍스트: {album.cover_url ? ( ) : ( )} · 곡

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-154 — button · DiscographyContextRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:133` · `button` · type: button · disabled: index === 0
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:133` · `button` · type: button · disabled: index === 0

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-155 — button · DiscographyContextRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:143` · `button` · type: button · disabled: index === visibleAlbums.length - 1
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:143` · `button` · type: button · disabled: index === visibleAlbums.length - 1

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-156 — button · DiscographyContextRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:166` · `button` · type: button · 표시 텍스트: 순서 저장
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyContextRail.tsx:166` · `button` · type: button · 표시 텍스트: 순서 저장

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-157 — input · DiscographyEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:99` · `input` · value: draft.title
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:99` · `input` · value: draft.title

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-158 — input · DiscographyEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:138` · `input` · type: date · value: draft.release_date
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:138` · `input` · type: date · value: draft.release_date

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-159 — input · DiscographyEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:190` · `input` · type: color · value: draft.color
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:190` · `input` · type: color · value: draft.color

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-160 — input · DiscographyEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:197` · `input` · value: draft.color
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:197` · `input` · value: draft.color

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-161 — textarea · DiscographyEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:226` · `textarea` · placeholder: 앨범의 콘셉트와 이야기를 입력하세요.
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:226` · `textarea` · placeholder: 앨범의 콘셉트와 이야기를 입력하세요.

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-162 — input · DiscographyEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:241` · `input` · value: draft.spotify_id · placeholder: Spotify 앨범 ID 또는 URL
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:241` · `input` · value: draft.spotify_id · placeholder: Spotify 앨범 ID 또는 URL

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-163 — input · DiscographyEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:257` · `input` · type: url · value: draft.youtube_url · placeholder: https://music.youtube.com/…
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:257` · `input` · type: url · value: draft.youtube_url · placeholder: https://music.youtube.com/…

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-164 — input · DiscographyEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:378` · `input` · type: checkbox
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyEditorSections.tsx:378` · `input` · type: checkbox

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-165 — button · DiscographyTrackSection.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:65` · `button` · type: button · id: track-bulk · 표시 텍스트: 여러 곡 붙여넣기
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:65` · `button` · type: button · id: track-bulk · 표시 텍스트: 여러 곡 붙여넣기

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-166 — button · DiscographyTrackSection.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:73` · `button` · type: button · 표시 텍스트: + 트랙 추가
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:73` · `button` · type: button · 표시 텍스트: + 트랙 추가

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-167 — div · DiscographyTrackSection.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:90` · `div` · 표시 텍스트: patchTrack(track.id, ) } placeholder="곡명" /> patchTrack(track.id, ) } /> 타이틀곡
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:90` · `div` · 표시 텍스트: patchTrack(track.id, ) } placeholder="곡명" /> patchTrack(track.id, ) } /> 타이틀곡

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-168 — button · DiscographyTrackSection.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:99` · `button` · type: button
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:99` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-169 — input · DiscographyTrackSection.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:108` · `input` · value: track.title · placeholder: 곡명
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:108` · `input` · value: track.title · placeholder: 곡명

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-170 — input · DiscographyTrackSection.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:116` · `input` · type: checkbox
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:116` · `input` · type: checkbox

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-171 — button · DiscographyTrackSection.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:136` · `button` · type: button · id: track-media
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:136` · `button` · type: button · id: track-media

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-172 — button · DiscographyTrackSection.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:143` · `button` · type: button · id: track-delete · 표시 텍스트: 삭제
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:143` · `button` · type: button · id: track-delete · 표시 텍스트: 삭제

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-173 — input · DiscographyTrackSection.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:182` · `input` · type: url · value: track.spotify_url · placeholder: https://open.spotify.com/track/…
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:182` · `input` · type: url · value: track.spotify_url · placeholder: https://open.spotify.com/track/…

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-174 — input · DiscographyTrackSection.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:196` · `input` · type: url · value: track.youtube_url · placeholder: https://youtube.com/watch?v=…
- **소스 추적:** `src/admin/pages/artists/[id]/discography/DiscographyTrackSection.tsx:196` · `input` · type: url · value: track.youtube_url · placeholder: https://youtube.com/watch?v=…

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-175 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/page.tsx:235` · `button` · type: button · 표시 텍스트: 새 앨범 만들기
- **소스 추적:** `src/admin/pages/artists/[id]/discography/page.tsx:235` · `button` · type: button · 표시 텍스트: 새 앨범 만들기

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-176 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/discography/page.tsx:315` · `button` · type: button · 표시 텍스트: 새 앨범 만들기
- **소스 추적:** `src/admin/pages/artists/[id]/discography/page.tsx:315` · `button` · type: button · 표시 텍스트: 새 앨범 만들기

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-177 — button · MemberActions.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/members/MemberActions.tsx:40` · `button` · type: button · 표시 텍스트: 첫 멤버 추가
- **소스 추적:** `src/admin/pages/artists/[id]/members/MemberActions.tsx:40` · `button` · type: button · 표시 텍스트: 첫 멤버 추가

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-178 — input · MemberEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/members/MemberEditorSections.tsx:62` · `input` · input 요소(동적 라벨 확인 필요)
- **소스 추적:** `src/admin/pages/artists/[id]/members/MemberEditorSections.tsx:62` · `input` · input 요소(동적 라벨 확인 필요)

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-179 — input · MemberEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/members/MemberEditorSections.tsx:104` · `input` · value: draft.birth · placeholder: 2004. 05. 25
- **소스 추적:** `src/admin/pages/artists/[id]/members/MemberEditorSections.tsx:104` · `input` · value: draft.birth · placeholder: 2004. 05. 25

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-180 — input · MemberEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/members/MemberEditorSections.tsx:113` · `input` · value: draft.mbti · placeholder: ESFP
- **소스 추적:** `src/admin/pages/artists/[id]/members/MemberEditorSections.tsx:113` · `input` · value: draft.mbti · placeholder: ESFP

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-181 — input · MemberEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/members/MemberEditorSections.tsx:126` · `input` · type: color · value: draft.color
- **소스 추적:** `src/admin/pages/artists/[id]/members/MemberEditorSections.tsx:126` · `input` · type: color · value: draft.color

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-182 — input · MemberEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/members/MemberEditorSections.tsx:133` · `input` · value: draft.color
- **소스 추적:** `src/admin/pages/artists/[id]/members/MemberEditorSections.tsx:133` · `input` · value: draft.color

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-183 — button · MemberLibraryRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/members/MemberLibraryRail.tsx:70` · `button` · type: button · id: entity-list-item · 표시 텍스트: {member.image_url ? ( ) : ( )}
- **소스 추적:** `src/admin/pages/artists/[id]/members/MemberLibraryRail.tsx:70` · `button` · type: button · id: entity-list-item · 표시 텍스트: {member.image_url ? ( ) : ( )}

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-184 — button · MemberLibraryRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/members/MemberLibraryRail.tsx:142` · `button` · type: button · aria-label: 멤버 추가
- **소스 추적:** `src/admin/pages/artists/[id]/members/MemberLibraryRail.tsx:142` · `button` · type: button · aria-label: 멤버 추가

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-185 — button · MemberLibraryRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/members/MemberLibraryRail.tsx:149` · `button` · type: button
- **소스 추적:** `src/admin/pages/artists/[id]/members/MemberLibraryRail.tsx:149` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-186 — button · MemberLibraryRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/members/MemberLibraryRail.tsx:168` · `button` · type: button · 표시 텍스트: NEW
- **소스 추적:** `src/admin/pages/artists/[id]/members/MemberLibraryRail.tsx:168` · `button` · type: button · 표시 텍스트: NEW

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-187 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/members/page.tsx:232` · `button` · type: button · 표시 텍스트: 첫 멤버 추가
- **소스 추적:** `src/admin/pages/artists/[id]/members/page.tsx:232` · `button` · type: button · 표시 텍스트: 첫 멤버 추가

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-188 — button · ProfileContextRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/profile/ProfileContextRail.tsx:60` · `button` · type: button · 표시 텍스트: 작성 취소
- **소스 추적:** `src/admin/pages/artists/[id]/profile/ProfileContextRail.tsx:60` · `button` · type: button · 표시 텍스트: 작성 취소

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-189 — input · ProfileEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/profile/ProfileEditorSections.tsx:69` · `input` · input 요소(동적 라벨 확인 필요)
- **소스 추적:** `src/admin/pages/artists/[id]/profile/ProfileEditorSections.tsx:69` · `input` · input 요소(동적 라벨 확인 필요)

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-190 — input · ProfileEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/profile/ProfileEditorSections.tsx:91` · `input` · type: date · value: draft.debutDate
- **소스 추적:** `src/admin/pages/artists/[id]/profile/ProfileEditorSections.tsx:91` · `input` · type: date · value: draft.debutDate

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-191 — input · ProfileEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/profile/ProfileEditorSections.tsx:140` · `input` · type: color · value: draft.color
- **소스 추적:** `src/admin/pages/artists/[id]/profile/ProfileEditorSections.tsx:140` · `input` · type: color · value: draft.color

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-192 — input · ProfileEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/profile/ProfileEditorSections.tsx:147` · `input` · value: draft.color
- **소스 추적:** `src/admin/pages/artists/[id]/profile/ProfileEditorSections.tsx:147` · `input` · value: draft.color

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-193 — input · ProfileEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/profile/ProfileEditorSections.tsx:273` · `input` · type: radio
- **소스 추적:** `src/admin/pages/artists/[id]/profile/ProfileEditorSections.tsx:273` · `input` · type: radio

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-194 — input · ProfileEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/profile/ProfileEditorSections.tsx:284` · `input` · type: radio
- **소스 추적:** `src/admin/pages/artists/[id]/profile/ProfileEditorSections.tsx:284` · `input` · type: radio

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-195 — button · ProfileWizard.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/profile/ProfileWizard.tsx:99` · `button` · type: button · id: profile-wizard-back · 표시 텍스트: 이전
- **소스 추적:** `src/admin/pages/artists/[id]/profile/ProfileWizard.tsx:99` · `button` · type: button · id: profile-wizard-back · 표시 텍스트: 이전

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-196 — button · ProfileWizard.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/profile/ProfileWizard.tsx:110` · `button` · type: button · id: profile-wizard-next · disabled: !currentReady · 표시 텍스트: 다음
- **소스 추적:** `src/admin/pages/artists/[id]/profile/ProfileWizard.tsx:110` · `button` · type: button · id: profile-wizard-next · disabled: !currentReady · 표시 텍스트: 다음

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-197 — button · ScheduleActions.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleActions.tsx:36` · `button` · type: button · 표시 텍스트: 일정 추가
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleActions.tsx:36` · `button` · type: button · 표시 텍스트: 일정 추가

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-198 — button · ScheduleActions.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleActions.tsx:50` · `button` · type: button · id: entity-duplicate · 표시 텍스트: 복제
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleActions.tsx:50` · `button` · type: button · id: entity-duplicate · 표시 텍스트: 복제

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-199 — button · ScheduleCalendar.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:63` · `button` · type: button · 표시 텍스트: 오늘
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:63` · `button` · type: button · 표시 텍스트: 오늘

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-200 — button · ScheduleCalendar.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:71` · `button` · type: button · aria-label: 이전 달
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:71` · `button` · type: button · aria-label: 이전 달

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-201 — button · ScheduleCalendar.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:78` · `button` · type: button · aria-label: 다음 달
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:78` · `button` · type: button · aria-label: 다음 달

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-202 — button · ScheduleCalendar.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:86` · `button` · type: button · 표시 텍스트: 일정 추가
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:86` · `button` · type: button · 표시 텍스트: 일정 추가

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-203 — button · ScheduleCalendar.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:122` · `button` · type: button
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:122` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-204 — button · ScheduleCalendar.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:130` · `button` · type: button
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:130` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-205 — button · ScheduleCalendar.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:141` · `button` · type: button · title: item.title_ko · 표시 텍스트: {item.start_time && ( )}
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleCalendar.tsx:141` · `button` · type: button · title: item.title_ko · 표시 텍스트: {item.start_time && ( )}

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-206 — input · ScheduleEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleEditorSections.tsx:57` · `input` · name: eventDate · type: date · value: draft.eventDate · id: Boolean(fieldErrors.eventDate)
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleEditorSections.tsx:57` · `input` · name: eventDate · type: date · value: draft.eventDate · id: Boolean(fieldErrors.eventDate)

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-207 — input · ScheduleEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleEditorSections.tsx:80` · `input` · type: time · value: draft.startTime
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleEditorSections.tsx:80` · `input` · type: time · value: draft.startTime

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-208 — input · ScheduleEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleEditorSections.tsx:139` · `input` · name: linkUrl · type: url · value: draft.linkUrl · placeholder: https:// · id: Boolean(fieldErrors.linkUrl)
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleEditorSections.tsx:139` · `input` · name: linkUrl · type: url · value: draft.linkUrl · placeholder: https:// · id: Boolean(fieldErrors.linkUrl)

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-209 — input · ScheduleEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleEditorSections.tsx:213` · `input` · type: radio
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleEditorSections.tsx:213` · `input` · type: radio

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-210 — input · ScheduleEditorSections.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleEditorSections.tsx:224` · `input` · type: radio
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleEditorSections.tsx:224` · `input` · type: radio

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-211 — button · ScheduleLibraryRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleLibraryRail.tsx:32` · `button` · type: button · aria-label: 일정 추가
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleLibraryRail.tsx:32` · `button` · type: button · aria-label: 일정 추가

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-212 — button · ScheduleLibraryRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleLibraryRail.tsx:44` · `button` · type: button · 표시 텍스트: NEW DATE
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleLibraryRail.tsx:44` · `button` · type: button · 표시 텍스트: NEW DATE

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-213 — button · ScheduleLibraryRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/ScheduleLibraryRail.tsx:62` · `button` · type: button · id: entity-list-item · 표시 텍스트: {date.toLocaleString("en", ).toUpperCase()} {item.start_time ? ` · $ ` : ""}
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/ScheduleLibraryRail.tsx:62` · `button` · type: button · id: entity-list-item · 표시 텍스트: {date.toLocaleString("en", ).toUpperCase()} {item.start_time ? ` · $ ` : ""}

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-214 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/artists/[id]/schedule/page.tsx:540` · `button` · type: button · 표시 텍스트: 일정 추가
- **소스 추적:** `src/admin/pages/artists/[id]/schedule/page.tsx:540` · `button` · type: button · 표시 텍스트: 일정 추가

#### 클릭·입력·확인 절차

1. /admin/artists/{id}/profile|members|discography|schedule|tracks에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-228 — input · CampaignAdminShared.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignAdminShared.tsx:135` · `input` · type: text · placeholder: 답변을 입력하세요
- **소스 추적:** `src/admin/pages/auditions/CampaignAdminShared.tsx:135` · `input` · type: text · placeholder: 답변을 입력하세요

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-229 — textarea · CampaignAdminShared.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignAdminShared.tsx:138` · `textarea` · placeholder: 답변을 입력하세요
- **소스 추적:** `src/admin/pages/auditions/CampaignAdminShared.tsx:138` · `textarea` · placeholder: 답변을 입력하세요

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-230 — select · CampaignAdminShared.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignAdminShared.tsx:145` · `select` · 표시 텍스트: 선택하세요 {field.options.map((option) => ( ))}
- **소스 추적:** `src/admin/pages/auditions/CampaignAdminShared.tsx:145` · `select` · 표시 텍스트: 선택하세요 {field.options.map((option) => ( ))}

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-231 — input · CampaignAdminShared.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignAdminShared.tsx:157` · `input` · type: field.field_type
- **소스 추적:** `src/admin/pages/auditions/CampaignAdminShared.tsx:157` · `input` · type: field.field_type

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-232 — input · CampaignAdminShared.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignAdminShared.tsx:166` · `input` · type: date
- **소스 추적:** `src/admin/pages/auditions/CampaignAdminShared.tsx:166` · `input` · type: date

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-233 — input · CampaignAdminShared.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignAdminShared.tsx:178` · `input` · type: checkbox
- **소스 추적:** `src/admin/pages/auditions/CampaignAdminShared.tsx:178` · `input` · type: checkbox

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-234 — button · CampaignBuilderAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignBuilderAdmin.tsx:212` · `button` · type: button · 표시 텍스트: 다시 시도
- **소스 추적:** `src/admin/pages/auditions/CampaignBuilderAdmin.tsx:212` · `button` · type: button · 표시 텍스트: 다시 시도

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-235 — button · CampaignBuilderAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignBuilderAdmin.tsx:241` · `button` · id: audition-save · type: button · disabled: saving
- **소스 추적:** `src/admin/pages/auditions/CampaignBuilderAdmin.tsx:241` · `button` · id: audition-save · type: button · disabled: saving

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-236 — button · CampaignBuilderPreview.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignBuilderPreview.tsx:37` · `button` · type: button · 표시 텍스트: 제출 내용 검토
- **소스 추적:** `src/admin/pages/auditions/CampaignBuilderPreview.tsx:37` · `button` · type: button · 표시 텍스트: 제출 내용 검토

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-237 — input · CampaignBuilderSettings.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignBuilderSettings.tsx:37` · `input` · value: campaign.title
- **소스 추적:** `src/admin/pages/auditions/CampaignBuilderSettings.tsx:37` · `input` · value: campaign.title

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-238 — input · CampaignBuilderSettings.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignBuilderSettings.tsx:82` · `input` · type: datetime-local · value: localDateTime(campaign.starts_at)
- **소스 추적:** `src/admin/pages/auditions/CampaignBuilderSettings.tsx:82` · `input` · type: datetime-local · value: localDateTime(campaign.starts_at)

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-239 — input · CampaignBuilderSettings.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignBuilderSettings.tsx:93` · `input` · type: datetime-local · value: localDateTime(campaign.ends_at)
- **소스 추적:** `src/admin/pages/auditions/CampaignBuilderSettings.tsx:93` · `input` · type: datetime-local · value: localDateTime(campaign.ends_at)

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-240 — input · CampaignBuilderSettings.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignBuilderSettings.tsx:103` · `input` · type: checkbox
- **소스 추적:** `src/admin/pages/auditions/CampaignBuilderSettings.tsx:103` · `input` · type: checkbox

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-241 — button · CampaignListAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignListAdmin.tsx:189` · `button` · id: audition-create · type: button · 표시 텍스트: 새 캠페인
- **소스 추적:** `src/admin/pages/auditions/CampaignListAdmin.tsx:189` · `button` · id: audition-create · type: button · 표시 텍스트: 새 캠페인

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-242 — button · CampaignListAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignListAdmin.tsx:226` · `button` · id: audition-toggle · type: button
- **소스 추적:** `src/admin/pages/auditions/CampaignListAdmin.tsx:226` · `button` · id: audition-toggle · type: button

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-243 — button · CampaignListAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignListAdmin.tsx:249` · `button` · id: audition-delete · type: button · 표시 텍스트: 삭제
- **소스 추적:** `src/admin/pages/auditions/CampaignListAdmin.tsx:249` · `button` · id: audition-delete · type: button · 표시 텍스트: 삭제

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-244 — button · CampaignQuestionEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignQuestionEditor.tsx:44` · `button` · type: button
- **소스 추적:** `src/admin/pages/auditions/CampaignQuestionEditor.tsx:44` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-245 — input · CampaignQuestionEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignQuestionEditor.tsx:100` · `input` · value: selectedField.help_text ?? ""
- **소스 추적:** `src/admin/pages/auditions/CampaignQuestionEditor.tsx:100` · `input` · value: selectedField.help_text ?? ""

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-246 — textarea · CampaignQuestionEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignQuestionEditor.tsx:115` · `textarea` · value: selectedField.options.join("\n")
- **소스 추적:** `src/admin/pages/auditions/CampaignQuestionEditor.tsx:115` · `textarea` · value: selectedField.options.join("\n")

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-247 — input · CampaignQuestionEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignQuestionEditor.tsx:133` · `input` · type: number · value: selectedField.max_length ?? ""
- **소스 추적:** `src/admin/pages/auditions/CampaignQuestionEditor.tsx:133` · `input` · type: number · value: selectedField.max_length ?? ""

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-248 — input · CampaignQuestionEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignQuestionEditor.tsx:151` · `input` · type: number · value: selectedField.max_file_size_mb ?? 20
- **소스 추적:** `src/admin/pages/auditions/CampaignQuestionEditor.tsx:151` · `input` · type: number · value: selectedField.max_file_size_mb ?? 20

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-249 — input · CampaignQuestionEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignQuestionEditor.tsx:184` · `input` · type: checkbox
- **소스 추적:** `src/admin/pages/auditions/CampaignQuestionEditor.tsx:184` · `input` · type: checkbox

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-250 — input · CampaignQuestionEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignQuestionEditor.tsx:204` · `input` · type: checkbox
- **소스 추적:** `src/admin/pages/auditions/CampaignQuestionEditor.tsx:204` · `input` · type: checkbox

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-251 — input · CampaignQuestionEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignQuestionEditor.tsx:216` · `input` · type: checkbox
- **소스 추적:** `src/admin/pages/auditions/CampaignQuestionEditor.tsx:216` · `input` · type: checkbox

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-252 — div · CampaignQuestionList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignQuestionList.tsx:31` · `div` · id: audition-question-sort · 표시 텍스트: onSelectField(field.id)}> onRemoveField(field.id)} aria-label="질문 삭제" >
- **소스 추적:** `src/admin/pages/auditions/CampaignQuestionList.tsx:31` · `div` · id: audition-question-sort · 표시 텍스트: onSelectField(field.id)}> onRemoveField(field.id)} aria-label="질문 삭제" >

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-253 — button · CampaignQuestionList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignQuestionList.tsx:41` · `button` · type: button
- **소스 추적:** `src/admin/pages/auditions/CampaignQuestionList.tsx:41` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-254 — button · CampaignQuestionList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignQuestionList.tsx:50` · `button` · type: button · id: audition-question-delete · aria-label: 질문 삭제
- **소스 추적:** `src/admin/pages/auditions/CampaignQuestionList.tsx:50` · `button` · type: button · id: audition-question-delete · aria-label: 질문 삭제

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-255 — button · CampaignQuestionList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/CampaignQuestionList.tsx:60` · `button` · id: audition-question-add · type: button · 표시 텍스트: 질문 추가
- **소스 추적:** `src/admin/pages/auditions/CampaignQuestionList.tsx:60` · `button` · id: audition-question-add · type: button · 표시 텍스트: 질문 추가

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-256 — button · SubmissionReviewAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:202` · `button` · type: button · 표시 텍스트: 지원서 목록
- **소스 추적:** `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:202` · `button` · type: button · 표시 텍스트: 지원서 목록

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-257 — a · SubmissionReviewAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:256` · `a` · href: signed[file.path] || undefined · target: _blank
- **소스 추적:** `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:256` · `a` · href: signed[file.path] || undefined · target: _blank

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-258 — textarea · SubmissionReviewAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:275` · `textarea` · value: note
- **소스 추적:** `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:275` · `textarea` · value: note

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-259 — button · SubmissionReviewAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:281` · `button` · type: button · disabled: savingReview || note.trim() === (selected.reviewer_notes || "")
- **소스 추적:** `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:281` · `button` · type: button · disabled: savingReview || note.trim() === (selected.reviewer_notes || "")

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-260 — button · SubmissionReviewAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:293` · `button` · type: button · disabled: savingReview
- **소스 추적:** `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:293` · `button` · type: button · disabled: savingReview

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-261 — input · SubmissionReviewAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:324` · `input` · type: search · value: query · placeholder: 답변 검색
- **소스 추적:** `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:324` · `input` · type: search · value: query · placeholder: 답변 검색

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-262 — select · SubmissionReviewAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:331` · `select` · aria-label: 심사 상태 필터 · value: statusFilter · 표시 텍스트: 모든 상태 {REVIEW_STATUSES.map((status) => ( ))}
- **소스 추적:** `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:331` · `select` · aria-label: 심사 상태 필터 · value: statusFilter · 표시 텍스트: 모든 상태 {REVIEW_STATUSES.map((status) => ( ))}

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-263 — button · SubmissionReviewAdmin.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:352` · `button` · type: button · id: audition-status-prerequisite
- **소스 추적:** `src/admin/pages/auditions/SubmissionReviewAdmin.tsx:352` · `button` · type: button · id: audition-status-prerequisite

#### 클릭·입력·확인 절차

1. /admin/auditions/campaigns 및 하위 builder/submissions에서 대상 button을 화면의 라벨·위치로 식별한다.
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
