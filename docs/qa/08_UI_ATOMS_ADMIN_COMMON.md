# 08. UI 요소 전수 — 관리자 공통·콘텐츠·운영

> **기준 커밋:** `0d79efb18de637d02ce210464a1d340ba9294def`  
> 모든 항목은 **클릭·입력·확인 절차 → 기대 결과 → 결과 기록** 순서로 실행한다.

| 표기 | 의미 |
| --- | --- |
| **L** | Local에서만 안전하게 재현하는 검증 |
| **S** | Staging/Preview의 QA 데이터·계정으로 수행하는 검증 |
| **P** | Production에서만 확정 가능한 도메인·보안 헤더·외부 연동 검증 |
| **B** | Local과 Staging/Production 양쪽에서 수행하는 검증 |

> Production에서는 **QA 전용 계정·콘텐츠·파일만** 사용한다. 실제 접수·지원·신고·운영 데이터를 생성·수정·삭제하지 않는다.

> **이 파일의 범위:** 사이드바, 검색, 온보딩, 자산, 콘텐츠/공지, Hero, 대시보드/분석, 접수, 감사, 보존, 설정의 실제 조작 요소  
> **케이스 수:** 236건

> 역할별로 보이지 않아야 할 제어가 노출되지 않는지 01번 보안 파일과 함께 확인한다.

### UI-ATOM-001 — button · GalleryManagerView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/GalleryManagerView.tsx:103` · `button` · type: button · 표시 텍스트: 삭제
- **소스 추적:** `src/admin/components/assets/GalleryManagerView.tsx:103` · `button` · type: button · 표시 텍스트: 삭제

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-002 — button · GalleryManagerView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/GalleryManagerView.tsx:106` · `button` · type: button · 표시 텍스트: 복구
- **소스 추적:** `src/admin/components/assets/GalleryManagerView.tsx:106` · `button` · type: button · 표시 텍스트: 복구

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-003 — div · GalleryManagerView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/GalleryManagerView.tsx:111` · `div` · 표시 텍스트: JPG, PNG, WebP · 파일당 최대 10MB · 여러 장 선택 가능
- **소스 추적:** `src/admin/components/assets/GalleryManagerView.tsx:111` · `div` · 표시 텍스트: JPG, PNG, WebP · 파일당 최대 10MB · 여러 장 선택 가능

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-004 — button · GalleryManagerView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/GalleryManagerView.tsx:135` · `button` · type: button · id: gallery-upload · disabled: uploading
- **소스 추적:** `src/admin/components/assets/GalleryManagerView.tsx:135` · `button` · type: button · id: gallery-upload · disabled: uploading

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-005 — input · GalleryManagerView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/GalleryManagerView.tsx:143` · `input` · type: file · accept: image/jpeg,image/png,image/webp
- **소스 추적:** `src/admin/components/assets/GalleryManagerView.tsx:143` · `input` · type: file · accept: image/jpeg,image/png,image/webp

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-006 — button · GalleryManagerView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/GalleryManagerView.tsx:203` · `button` · type: button · 표시 텍스트: {(itemAlbum || itemMember) && ( )}
- **소스 추적:** `src/admin/components/assets/GalleryManagerView.tsx:203` · `button` · type: button · 표시 텍스트: {(itemAlbum || itemMember) && ( )}

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-007 — button · GalleryManagerView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/GalleryManagerView.tsx:244` · `button` · type: button · aria-label: 이미지 편집 닫기
- **소스 추적:** `src/admin/components/assets/GalleryManagerView.tsx:244` · `button` · type: button · aria-label: 이미지 편집 닫기

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-008 — input · GalleryManagerView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/GalleryManagerView.tsx:262` · `input` · value: selectedItem.caption · placeholder: 촬영명 또는 이미지 설명
- **소스 추적:** `src/admin/components/assets/GalleryManagerView.tsx:262` · `input` · value: selectedItem.caption · placeholder: 촬영명 또는 이미지 설명

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-009 — input · GalleryManagerView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/GalleryManagerView.tsx:316` · `input` · type: checkbox
- **소스 추적:** `src/admin/components/assets/GalleryManagerView.tsx:316` · `input` · type: checkbox

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-010 — button · GalleryManagerView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/GalleryManagerView.tsx:329` · `button` · type: button · aria-label: 맨 앞으로 · title: 맨 앞으로 · disabled: items[0]?.id === selectedItem.id
- **소스 추적:** `src/admin/components/assets/GalleryManagerView.tsx:329` · `button` · type: button · aria-label: 맨 앞으로 · title: 맨 앞으로 · disabled: items[0]?.id === selectedItem.id

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-011 — button · GalleryManagerView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/GalleryManagerView.tsx:339` · `button` · type: button · aria-label: 맨 뒤로 · title: 맨 뒤로 · disabled: items.at(-1)?.id === selectedItem.id
- **소스 추적:** `src/admin/components/assets/GalleryManagerView.tsx:339` · `button` · type: button · aria-label: 맨 뒤로 · title: 맨 뒤로 · disabled: items.at(-1)?.id === selectedItem.id

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-012 — button · GalleryManagerView.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/GalleryManagerView.tsx:349` · `button` · type: button · id: gallery-delete · 표시 텍스트: 삭제
- **소스 추적:** `src/admin/components/assets/GalleryManagerView.tsx:349` · `button` · type: button · id: gallery-delete · 표시 텍스트: 삭제

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-013 — div · ImageAssetField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/ImageAssetField.tsx:138` · `div` · 표시 텍스트: · 최대 MB
- **소스 추적:** `src/admin/components/assets/ImageAssetField.tsx:138` · `div` · 표시 텍스트: · 최대 MB

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-014 — button · ImageAssetField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/ImageAssetField.tsx:174` · `button` · type: button · disabled: busy · 표시 텍스트: 제거
- **소스 추적:** `src/admin/components/assets/ImageAssetField.tsx:174` · `button` · type: button · disabled: busy · 표시 텍스트: 제거

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-015 — input · ImageAssetField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/ImageAssetField.tsx:183` · `input` · id: inputId · type: file · accept: kind === "artist-logo" ? "image/jpeg,image/png,image/webp,image/svg+xml,.svg" : "image/jpeg,image/png,image/we · disabled: busy
- **소스 추적:** `src/admin/components/assets/ImageAssetField.tsx:183` · `input` · id: inputId · type: file · accept: kind === "artist-logo" ? "image/jpeg,image/png,image/webp,image/svg+xml,.svg" : "image/jpeg,image/png,image/we · disabled: busy

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-016 — div · MusicAssetFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/MusicAssetFields.tsx:117` · `div` · 표시 텍스트: {value ? ( ) : ( 커버 없음 )}
- **소스 추적:** `src/admin/components/assets/MusicAssetFields.tsx:117` · `div` · 표시 텍스트: {value ? ( ) : ( 커버 없음 )}

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-017 — input · MusicAssetFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/MusicAssetFields.tsx:149` · `input` · id: inputId · type: file · accept: image/jpeg,image/png,image/webp · disabled: busy
- **소스 추적:** `src/admin/components/assets/MusicAssetFields.tsx:149` · `input` · id: inputId · type: file · accept: image/jpeg,image/png,image/webp · disabled: busy

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-018 — div · MusicAssetFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/MusicAssetFields.tsx:206` · `div` · 표시 텍스트: {value ? ( ) : ( 16:9 HERO IMAGE )}
- **소스 추적:** `src/admin/components/assets/MusicAssetFields.tsx:206` · `div` · 표시 텍스트: {value ? ( ) : ( 16:9 HERO IMAGE )}

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-019 — button · MusicAssetFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/MusicAssetFields.tsx:244` · `button` · type: button · disabled: busy · 표시 텍스트: 제거
- **소스 추적:** `src/admin/components/assets/MusicAssetFields.tsx:244` · `button` · type: button · disabled: busy · 표시 텍스트: 제거

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-020 — input · MusicAssetFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/MusicAssetFields.tsx:254` · `input` · id: inputId · type: file · accept: image/jpeg,image/png,image/webp · disabled: busy
- **소스 추적:** `src/admin/components/assets/MusicAssetFields.tsx:254` · `input` · id: inputId · type: file · accept: image/jpeg,image/png,image/webp · disabled: busy

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-021 — div · MusicAssetFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/MusicAssetFields.tsx:373` · `div` · 표시 텍스트: {kind === "logo" && value ? ( ) : ( )} {href && ( 보기 )} {value && ( )} } />
- **소스 추적:** `src/admin/components/assets/MusicAssetFields.tsx:373` · `div` · 표시 텍스트: {kind === "logo" && value ? ( ) : ( )} {href && ( 보기 )} {value && ( )} } />

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-022 — a · MusicAssetFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/MusicAssetFields.tsx:422` · `a` · href: href · target: _blank · 표시 텍스트: 보기
- **소스 추적:** `src/admin/components/assets/MusicAssetFields.tsx:422` · `a` · href: href · target: _blank · 표시 텍스트: 보기

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-023 — button · MusicAssetFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/MusicAssetFields.tsx:428` · `button` · type: button
- **소스 추적:** `src/admin/components/assets/MusicAssetFields.tsx:428` · `button` · type: button

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-024 — input · MusicAssetFields.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/assets/MusicAssetFields.tsx:432` · `input` · id: inputId · type: file · accept: accept · disabled: busy
- **소스 추적:** `src/admin/components/assets/MusicAssetFields.tsx:432` · `input` · id: inputId · type: file · accept: accept · disabled: busy

#### 클릭·입력·확인 절차

1. 자산 업로드가 있는 관리자 편집 화면에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-025 — button · AdminLanguageTabs.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/AdminLanguageTabs.tsx:31` · `button` · type: button
- **소스 추적:** `src/admin/components/content/AdminLanguageTabs.tsx:31` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-026 — button · AdminTranslationButton.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/AdminTranslationButton.tsx:132` · `button` · type: button · disabled: !pending.length || translating · title: pending.length ? "비어 있는 EN·JP 번역 생성" : "번역할 빈 EN·JP 필드가 없습니다"
- **소스 추적:** `src/admin/components/content/AdminTranslationButton.tsx:132` · `button` · type: button · disabled: !pending.length || translating · title: pending.length ? "비어 있는 EN·JP 번역 생성" : "번역할 빈 EN·JP 필드가 없습니다"

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-027 — button · ContentWorkbench.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/ContentWorkbench.tsx:96` · `button` · type: button
- **소스 추적:** `src/admin/components/content/ContentWorkbench.tsx:96` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-028 — button · ContentWorkbench.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/ContentWorkbench.tsx:116` · `button` · type: button · id: draft-discard · 표시 텍스트: 삭제
- **소스 추적:** `src/admin/components/content/ContentWorkbench.tsx:116` · `button` · type: button · id: draft-discard · 표시 텍스트: 삭제

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-029 — button · ContentWorkbench.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/ContentWorkbench.tsx:123` · `button` · type: button · id: draft-restore · 표시 텍스트: 복구
- **소스 추적:** `src/admin/components/content/ContentWorkbench.tsx:123` · `button` · type: button · id: draft-restore · 표시 텍스트: 복구

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-030 — button · ContentWorkbench.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/ContentWorkbench.tsx:137` · `button` · type: button · 표시 텍스트: 닫기
- **소스 추적:** `src/admin/components/content/ContentWorkbench.tsx:137` · `button` · type: button · 표시 텍스트: 닫기

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-031 — button · ContentWorkbench.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/ContentWorkbench.tsx:146` · `button` · type: button · aria-expanded: railOpen · aria-controls: admin-mobile-rail
- **소스 추적:** `src/admin/components/content/ContentWorkbench.tsx:146` · `button` · type: button · aria-expanded: railOpen · aria-controls: admin-mobile-rail

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-032 — button · ContentWorkbench.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/ContentWorkbench.tsx:173` · `button` · type: button · aria-current: activeTab === tab.id ? "page" : undefined · 표시 텍스트: {!tab.complete && Boolean(tab.missing) && ( )}
- **소스 추적:** `src/admin/components/content/ContentWorkbench.tsx:173` · `button` · type: button · aria-current: activeTab === tab.id ? "page" : undefined · 표시 텍스트: {!tab.complete && Boolean(tab.missing) && ( )}

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-033 — button · DraftSaveButton.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/DraftSaveButton.tsx:135` · `button` · type: button · id: draft-reset · disabled: !dirty || saving · 표시 텍스트: 되돌리기
- **소스 추적:** `src/admin/components/content/DraftSaveButton.tsx:135` · `button` · type: button · id: draft-reset · disabled: !dirty || saving · 표시 텍스트: 되돌리기

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-034 — button · DraftSaveButton.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/DraftSaveButton.tsx:145` · `button` · type: button · id: draft-save · disabled: saveDisabled
- **소스 추적:** `src/admin/components/content/DraftSaveButton.tsx:145` · `button` · type: button · id: draft-save · disabled: saveDisabled

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-035 — textarea · FormField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/FormField.tsx:48` · `textarea` · id: fieldId · required: requiredHere · value: value · id: Boolean(error)
- **소스 추적:** `src/admin/components/content/FormField.tsx:48` · `textarea` · id: fieldId · required: requiredHere · value: value · id: Boolean(error)

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-036 — input · FormField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/FormField.tsx:59` · `input` · id: fieldId · type: type · required: requiredHere · value: value · id: Boolean(error)
- **소스 추적:** `src/admin/components/content/FormField.tsx:59` · `input` · id: fieldId · type: type · required: requiredHere · value: value · id: Boolean(error)

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-037 — input · NoticeCategoryInput.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeCategoryInput.tsx:95` · `input` · value: value · placeholder: 분류 검색 또는 새로 입력 · aria-label: 공지 분류 · role: combobox · aria-expanded: showPanel
- **소스 추적:** `src/admin/components/content/NoticeCategoryInput.tsx:95` · `input` · value: value · placeholder: 분류 검색 또는 새로 입력 · aria-label: 공지 분류 · role: combobox · aria-expanded: showPanel

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-038 — button · NoticeCategoryInput.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeCategoryInput.tsx:131` · `button` · type: button · role: option
- **소스 추적:** `src/admin/components/content/NoticeCategoryInput.tsx:131` · `button` · type: button · role: option

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-039 — button · NoticeManagerActions.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerActions.tsx:37` · `button` · type: button · 표시 텍스트: 공지 작성
- **소스 추적:** `src/admin/components/content/NoticeManagerActions.tsx:37` · `button` · type: button · 표시 텍스트: 공지 작성

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-040 — button · NoticeManagerActions.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerActions.tsx:51` · `button` · type: button · id: entity-duplicate · 표시 텍스트: 복제
- **소스 추적:** `src/admin/components/content/NoticeManagerActions.tsx:51` · `button` · type: button · id: entity-duplicate · 표시 텍스트: 복제

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-041 — button · NoticeManagerActions.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerActions.tsx:62` · `button` · type: button · id: entity-delete
- **소스 추적:** `src/admin/components/content/NoticeManagerActions.tsx:62` · `button` · type: button · id: entity-delete

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-042 — button · NoticeManagerEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerEditor.tsx:47` · `button` · type: button · 표시 텍스트: 공지 작성
- **소스 추적:** `src/admin/components/content/NoticeManagerEditor.tsx:47` · `button` · type: button · 표시 텍스트: 공지 작성

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-043 — input · NoticeManagerEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerEditor.tsx:75` · `input` · type: date · value: draft.date · id: Boolean(fieldErrors.date)
- **소스 추적:** `src/admin/components/content/NoticeManagerEditor.tsx:75` · `input` · type: date · value: draft.date · id: Boolean(fieldErrors.date)

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-044 — input · NoticeManagerEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerEditor.tsx:112` · `input` · value: language === "en" ? draft.categoryEn : draft.categoryJa
- **소스 추적:** `src/admin/components/content/NoticeManagerEditor.tsx:112` · `input` · value: language === "en" ? draft.categoryEn : draft.categoryJa

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-045 — input · NoticeManagerEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerEditor.tsx:190` · `input` · type: radio
- **소스 추적:** `src/admin/components/content/NoticeManagerEditor.tsx:190` · `input` · type: radio

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-046 — input · NoticeManagerEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerEditor.tsx:201` · `input` · type: radio
- **소스 추적:** `src/admin/components/content/NoticeManagerEditor.tsx:201` · `input` · type: radio

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-047 — button · NoticeManagerRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerRail.tsx:38` · `button` · type: button · aria-label: 공지 작성
- **소스 추적:** `src/admin/components/content/NoticeManagerRail.tsx:38` · `button` · type: button · aria-label: 공지 작성

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-048 — input · NoticeManagerRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerRail.tsx:43` · `input` · id: notice-search · value: search · placeholder: 공지 검색 · aria-label: 공지 검색
- **소스 추적:** `src/admin/components/content/NoticeManagerRail.tsx:43` · `input` · id: notice-search · value: search · placeholder: 공지 검색 · aria-label: 공지 검색

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-049 — button · NoticeManagerRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerRail.tsx:52` · `button` · type: button
- **소스 추적:** `src/admin/components/content/NoticeManagerRail.tsx:52` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-050 — button · NoticeManagerRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerRail.tsx:73` · `button` · type: button · 표시 텍스트: NEW ·
- **소스 추적:** `src/admin/components/content/NoticeManagerRail.tsx:73` · `button` · type: button · 표시 텍스트: NEW ·

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-051 — button · NoticeManagerRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/NoticeManagerRail.tsx:90` · `button` · type: button · id: entity-list-item · 표시 텍스트: ·
- **소스 추적:** `src/admin/components/content/NoticeManagerRail.tsx:90` · `button` · type: button · id: entity-list-item · 표시 텍스트: ·

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-052 — button · OverflowDeleteMenu.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/OverflowDeleteMenu.tsx:47` · `button` · type: button · id: editor-more-actions · aria-label: label · aria-expanded: open · disabled: disabled
- **소스 추적:** `src/admin/components/content/OverflowDeleteMenu.tsx:47` · `button` · type: button · id: editor-more-actions · aria-label: label · aria-expanded: open · disabled: disabled

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-053 — button · OverflowDeleteMenu.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/OverflowDeleteMenu.tsx:66` · `button` · type: button · id: entity-delete · role: menuitem
- **소스 추적:** `src/admin/components/content/OverflowDeleteMenu.tsx:66` · `button` · type: button · id: entity-delete · role: menuitem

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-054 — button · PreviewButton.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/PreviewButton.tsx:13` · `button` · type: button · id: preview · disabled: disabled · title: 저장 전 변경사항을 새 창에서 확인합니다. · 표시 텍스트: 미리보기
- **소스 추적:** `src/admin/components/content/PreviewButton.tsx:13` · `button` · type: button · id: preview · disabled: disabled · title: 저장 전 변경사항을 새 창에서 확인합니다. · 표시 텍스트: 미리보기

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-055 — button · RichTextEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/RichTextEditor.tsx:148` · `button` · type: button · aria-label: toolLabel[format] · title: toolLabel[format]
- **소스 추적:** `src/admin/components/content/RichTextEditor.tsx:148` · `button` · type: button · aria-label: toolLabel[format] · title: toolLabel[format]

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-056 — button · RichTextEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/RichTextEditor.tsx:201` · `button` · type: button · aria-label: 글머리 목록 · title: 글머리 목록
- **소스 추적:** `src/admin/components/content/RichTextEditor.tsx:201` · `button` · type: button · aria-label: 글머리 목록 · title: 글머리 목록

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-057 — button · RichTextEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/RichTextEditor.tsx:210` · `button` · type: button · aria-label: 번호 목록 · title: 번호 목록
- **소스 추적:** `src/admin/components/content/RichTextEditor.tsx:210` · `button` · type: button · aria-label: 번호 목록 · title: 번호 목록

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-058 — button · RichTextEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/RichTextEditor.tsx:220` · `button` · type: button · aria-label: 링크 · title: 링크
- **소스 추적:** `src/admin/components/content/RichTextEditor.tsx:220` · `button` · type: button · aria-label: 링크 · title: 링크

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-059 — button · RichTextEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/RichTextEditor.tsx:231` · `button` · type: button · aria-label: 실행 취소 · title: 실행 취소
- **소스 추적:** `src/admin/components/content/RichTextEditor.tsx:231` · `button` · type: button · aria-label: 실행 취소 · title: 실행 취소

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-060 — button · RichTextEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/RichTextEditor.tsx:240` · `button` · type: button · aria-label: 다시 실행 · title: 다시 실행
- **소스 추적:** `src/admin/components/content/RichTextEditor.tsx:240` · `button` · type: button · aria-label: 다시 실행 · title: 다시 실행

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-061 — button · RichTextEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/RichTextEditor.tsx:249` · `button` · type: button · aria-label: 서식 지우기 · title: 서식 지우기
- **소스 추적:** `src/admin/components/content/RichTextEditor.tsx:249` · `button` · type: button · aria-label: 서식 지우기 · title: 서식 지우기

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-062 — div · RichTextEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/RichTextEditor.tsx:260` · `div` · id: id · role: textbox · aria-label: label · id: invalid · placeholder: placeholder
- **소스 추적:** `src/admin/components/content/RichTextEditor.tsx:260` · `div` · id: id · role: textbox · aria-label: label · id: invalid · placeholder: placeholder

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-063 — button · SocialLinksField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/SocialLinksField.tsx:104` · `button` · type: button · 표시 텍스트: 계정 추가
- **소스 추적:** `src/admin/components/content/SocialLinksField.tsx:104` · `button` · type: button · 표시 텍스트: 계정 추가

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-064 — button · SocialLinksField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/SocialLinksField.tsx:113` · `button` · type: button · 표시 텍스트: 공식 계정이 아직 없습니다. 첫 계정 추가
- **소스 추적:** `src/admin/components/content/SocialLinksField.tsx:113` · `button` · type: button · 표시 텍스트: 공식 계정이 아직 없습니다. 첫 계정 추가

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-065 — input · SocialLinksField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/SocialLinksField.tsx:158` · `input` · value: link.label · placeholder: 플랫폼과 계정 이름
- **소스 추적:** `src/admin/components/content/SocialLinksField.tsx:158` · `input` · value: link.label · placeholder: 플랫폼과 계정 이름

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-066 — input · SocialLinksField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/SocialLinksField.tsx:174` · `input` · type: url · value: link.url · placeholder: https://...
- **소스 추적:** `src/admin/components/content/SocialLinksField.tsx:174` · `input` · type: url · value: link.url · placeholder: https://...

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-067 — button · SocialLinksField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/content/SocialLinksField.tsx:194` · `button` · type: button
- **소스 추적:** `src/admin/components/content/SocialLinksField.tsx:194` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-068 — button · AdminFeedback.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/feedback/AdminFeedback.tsx:16` · `button` · type: button · 표시 텍스트: 닫기
- **소스 추적:** `src/admin/components/feedback/AdminFeedback.tsx:16` · `button` · type: button · 표시 텍스트: 닫기

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

### UI-ATOM-069 — button · AdminFeedback.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/feedback/AdminFeedback.tsx:36` · `button` · type: button
- **소스 추적:** `src/admin/components/feedback/AdminFeedback.tsx:36` · `button` · type: button

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

### UI-ATOM-091 — div · AdminDialogProvider.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/AdminDialogProvider.tsx:53` · `div` · role: presentation
- **소스 추적:** `src/admin/components/shell/AdminDialogProvider.tsx:53` · `div` · role: presentation

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-092 — button · AdminDialogProvider.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/AdminDialogProvider.tsx:101` · `button` · type: button
- **소스 추적:** `src/admin/components/shell/AdminDialogProvider.tsx:101` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-093 — button · AdminDialogProvider.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/AdminDialogProvider.tsx:108` · `button` · type: button
- **소스 추적:** `src/admin/components/shell/AdminDialogProvider.tsx:108` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-094 — button · AdminShell.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/AdminShell.tsx:297` · `button` · type: button · aria-label: 관리 메뉴 열기 · aria-expanded: isNavigationOpen · aria-controls: admin-navigation
- **소스 추적:** `src/admin/components/shell/AdminShell.tsx:297` · `button` · type: button · aria-label: 관리 메뉴 열기 · aria-expanded: isNavigationOpen · aria-controls: admin-navigation

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-095 — button · AdminShell.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/AdminShell.tsx:310` · `button` · type: button
- **소스 추적:** `src/admin/components/shell/AdminShell.tsx:310` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-096 — button · AdminShell.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/AdminShell.tsx:342` · `button` · type: button · aria-label: 관리 메뉴 닫기 · 표시 텍스트: )}
- **소스 추적:** `src/admin/components/shell/AdminShell.tsx:342` · `button` · type: button · aria-label: 관리 메뉴 닫기 · 표시 텍스트: )}

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-097 — button · AdminShell.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/AdminShell.tsx:354` · `button` · type: button
- **소스 추적:** `src/admin/components/shell/AdminShell.tsx:354` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-098 — button · AdminShell.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/AdminShell.tsx:406` · `button` · type: button · id: admin-mobile-more · aria-label: 전체 관리자 메뉴 열기 · aria-expanded: isNavigationOpen · aria-controls: admin-navigation · 표시 텍스트: 더보기
- **소스 추적:** `src/admin/components/shell/AdminShell.tsx:406` · `button` · type: button · id: admin-mobile-more · aria-label: 전체 관리자 메뉴 열기 · aria-expanded: isNavigationOpen · aria-controls: admin-navigation · 표시 텍스트: 더보기

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-099 — div · ArtistNavGroup.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/ArtistNavGroup.tsx:70` · `div` · 표시 텍스트: {artist.logo_url ? ( ) : ( )} {!isCollapsed && isExpanded && ( {artistLinks.map((item) => { const hr
- **소스 추적:** `src/admin/components/shell/ArtistNavGroup.tsx:70` · `div` · 표시 텍스트: {artist.logo_url ? ( ) : ( )} {!isCollapsed && isExpanded && ( {artistLinks.map((item) => { const hr

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-100 — button · ArtistNavGroup.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/ArtistNavGroup.tsx:80` · `button` · type: button · aria-expanded: isExpanded · title: isCollapsed ? artist.name : undefined · 표시 텍스트: {artist.logo_url ? ( ) : ( )}
- **소스 추적:** `src/admin/components/shell/ArtistNavGroup.tsx:80` · `button` · type: button · aria-expanded: isExpanded · title: isCollapsed ? artist.name : undefined · 표시 텍스트: {artist.logo_url ? ( ) : ( )}

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-101 — div · DeleteConfirmDialog.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/DeleteConfirmDialog.tsx:78` · `div` · role: presentation · 표시 텍스트: !
- **소스 추적:** `src/admin/components/shell/DeleteConfirmDialog.tsx:78` · `div` · role: presentation · 표시 텍스트: !

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-102 — section · DeleteConfirmDialog.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/DeleteConfirmDialog.tsx:85` · `section` · role: dialog · 표시 텍스트: ! 확인을 위해 을(를) 다시 입력하세요. * } onKeyDown={(event) => } autoFocus autoComplete="off" /> 이름이 일치하면 삭제 버튼을 
- **소스 추적:** `src/admin/components/shell/DeleteConfirmDialog.tsx:85` · `section` · role: dialog · 표시 텍스트: ! 확인을 위해 을(를) 다시 입력하세요. * } onKeyDown={(event) => } autoFocus autoComplete="off" /> 이름이 일치하면 삭제 버튼을 

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 section을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-103 — input · DeleteConfirmDialog.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/DeleteConfirmDialog.tsx:109` · `input` · value: value
- **소스 추적:** `src/admin/components/shell/DeleteConfirmDialog.tsx:109` · `input` · value: value

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-104 — button · DeleteConfirmDialog.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/DeleteConfirmDialog.tsx:127` · `button` · type: button · disabled: busy · 표시 텍스트: 취소
- **소스 추적:** `src/admin/components/shell/DeleteConfirmDialog.tsx:127` · `button` · type: button · disabled: busy · 표시 텍스트: 취소

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-105 — button · DeleteConfirmDialog.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/DeleteConfirmDialog.tsx:135` · `button` · type: button · disabled: !matches || busy || completed
- **소스 추적:** `src/admin/components/shell/DeleteConfirmDialog.tsx:135` · `button` · type: button · disabled: !matches || busy || completed

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-106 — button · Sidebar.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/Sidebar.tsx:249` · `button` · type: button · aria-label: 관리 메뉴 닫기
- **소스 추적:** `src/admin/components/shell/Sidebar.tsx:249` · `button` · type: button · aria-label: 관리 메뉴 닫기

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-107 — button · Sidebar.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/Sidebar.tsx:258` · `button` · type: button · aria-label: isCollapsed ? "관리 메뉴 펼치기" : "관리 메뉴 접기"
- **소스 추적:** `src/admin/components/shell/Sidebar.tsx:258` · `button` · type: button · aria-label: isCollapsed ? "관리 메뉴 펼치기" : "관리 메뉴 접기"

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-108 — button · Sidebar.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/Sidebar.tsx:318` · `button` · type: button · aria-label: 로그아웃 · title: 로그아웃
- **소스 추적:** `src/admin/components/shell/Sidebar.tsx:318` · `button` · type: button · aria-label: 로그아웃 · title: 로그아웃

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-109 — button · SidebarNavigation.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/SidebarNavigation.tsx:143` · `button` · type: button · aria-expanded: !collapsedGroups.analytics · 표시 텍스트: 운영 현황
- **소스 추적:** `src/admin/components/shell/SidebarNavigation.tsx:143` · `button` · type: button · aria-expanded: !collapsedGroups.analytics · 표시 텍스트: 운영 현황

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-110 — button · SidebarNavigation.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/SidebarNavigation.tsx:158` · `button` · type: button · aria-expanded: !collapsedGroups.inbox · 표시 텍스트: 접수함
- **소스 추적:** `src/admin/components/shell/SidebarNavigation.tsx:158` · `button` · type: button · aria-expanded: !collapsedGroups.inbox · 표시 텍스트: 접수함

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-111 — button · SidebarNavigation.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/SidebarNavigation.tsx:200` · `button` · type: button · aria-expanded: !collapsedGroups.service · 표시 텍스트: 서비스 관리
- **소스 추적:** `src/admin/components/shell/SidebarNavigation.tsx:200` · `button` · type: button · aria-expanded: !collapsedGroups.service · 표시 텍스트: 서비스 관리

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-112 — button · SidebarNavigation.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/SidebarNavigation.tsx:215` · `button` · type: button · aria-expanded: !collapsedGroups.system · 표시 텍스트: 시스템
- **소스 추적:** `src/admin/components/shell/SidebarNavigation.tsx:215` · `button` · type: button · aria-expanded: !collapsedGroups.system · 표시 텍스트: 시스템

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-113 — button · SidebarNavigation.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/SidebarNavigation.tsx:231` · `button` · type: button · aria-expanded: !collapsedGroups.artist · 표시 텍스트: 아티스트
- **소스 추적:** `src/admin/components/shell/SidebarNavigation.tsx:231` · `button` · type: button · aria-expanded: !collapsedGroups.artist · 표시 텍스트: 아티스트

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-114 — input · SidebarSearch.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/SidebarSearch.tsx:221` · `input` · type: search · value: query · placeholder: 메뉴 검색 · aria-label: 관리자 메뉴 검색 · role: combobox
- **소스 추적:** `src/admin/components/shell/SidebarSearch.tsx:221` · `input` · type: search · value: query · placeholder: 메뉴 검색 · aria-label: 관리자 메뉴 검색 · role: combobox

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-115 — button · SidebarSearch.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/SidebarSearch.tsx:246` · `button` · type: button · aria-label: 검색어 지우기
- **소스 추적:** `src/admin/components/shell/SidebarSearch.tsx:246` · `button` · type: button · aria-label: 검색어 지우기

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-116 — button · SidebarSearchResults.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/SidebarSearchResults.tsx:86` · `button` · type: button · aria-label: 검색 닫기 · 표시 텍스트: , document.body, )} {isOpen && resultsPosition && createPortal( {Object.entries(groups).map(([label,
- **소스 추적:** `src/admin/components/shell/SidebarSearchResults.tsx:86` · `button` · type: button · aria-label: 검색 닫기 · 표시 텍스트: , document.body, )} {isOpen && resultsPosition && createPortal( {Object.entries(groups).map(([label,

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-117 — button · SidebarSearchResults.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/components/shell/SidebarSearchResults.tsx:120` · `button` · type: button · role: option · 표시 텍스트: {(item.artistName || query.trim()) && ( )}
- **소스 추적:** `src/admin/components/shell/SidebarSearchResults.tsx:120` · `button` · type: button · role: option · 표시 텍스트: {(item.artistName || query.trim()) && ( )}

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-118 — button · AdminOnboardingLauncher.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingLauncher.tsx:23` · `button` · type: button · 표시 텍스트: {!isCollapsed && ( {pausedRun ? `\uC5F0\uC2B5 \uBAA8\uB4DC \u00B7 $ ` : `$ /$ \uC2A4\uD15D \u00B7 $ 
- **소스 추적:** `src/admin/onboarding/AdminOnboardingLauncher.tsx:23` · `button` · type: button · 표시 텍스트: {!isCollapsed && ( {pausedRun ? `\uC5F0\uC2B5 \uBAA8\uB4DC \u00B7 $ ` : `$ /$ \uC2A4\uD15D \u00B7 $ 

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-119 — div · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:98` · `div` · role: dialog · 표시 텍스트: THE MUZE / ADMIN GUIDE 어디부터 둘러볼까요? 실제 데이터를 바꾸지 않고 모든 업무 버튼의 용도와 주의사항을 바로 익힐 수 있습니다. void chooseWelco
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:98` · `div` · role: dialog · 표시 텍스트: THE MUZE / ADMIN GUIDE 어디부터 둘러볼까요? 실제 데이터를 바꾸지 않고 모든 업무 버튼의 용도와 주의사항을 바로 익힐 수 있습니다. void chooseWelco

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-120 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:99` · `button` · type: button · aria-label: 가이드 닫기
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:99` · `button` · type: button · aria-label: 가이드 닫기

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-121 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:104` · `button` · type: button · 표시 텍스트: 01 전체 둘러보기 메인 노출부터 검색까지 업무 순서대로
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:104` · `button` · type: button · 표시 텍스트: 01 전체 둘러보기 메인 노출부터 검색까지 업무 순서대로

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-122 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:105` · `button` · type: button · 표시 텍스트: 02 필요한 것만 보기 목차에서 원하는 업무를 골라 바로 이동
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:105` · `button` · type: button · 표시 텍스트: 02 필요한 것만 보기 목차에서 원하는 업무를 골라 바로 이동

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-123 — aside · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:112` · `aside` · role: dialog · 표시 텍스트: 진행 / 관리자 업무 가이드 % 확인 {GUIDE_CHAPTERS.map((chapter, index) => { const stats = chapterStats[chapter.id
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:112` · `aside` · role: dialog · 표시 텍스트: 진행 / 관리자 업무 가이드 % 확인 {GUIDE_CHAPTERS.map((chapter, index) => { const stats = chapterStats[chapter.id

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 aside을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-124 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:113` · `button` · type: button · aria-label: 목차 닫기
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:113` · `button` · type: button · aria-label: 목차 닫기

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-125 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:119` · `button` · type: button · 표시 텍스트: /
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:119` · `button` · type: button · 표시 텍스트: /

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-126 — section · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:127` · `section` · role: dialog · 표시 텍스트: 챕터 · 개 기능 }> 목차 {chapterIntro.index > 0 && openStep(chapterIntro.chapterId, 0, chapterIntro.mode)}>처
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:127` · `section` · role: dialog · 표시 텍스트: 챕터 · 개 기능 }> 목차 {chapterIntro.index > 0 && openStep(chapterIntro.chapterId, 0, chapterIntro.mode)}>처

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 section을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-127 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:128` · `button` · type: button · aria-label: 챕터 소개 닫기
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:128` · `button` · type: button · aria-label: 챕터 소개 닫기

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-128 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:130` · `button` · type: button · 표시 텍스트: 목차
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:130` · `button` · type: button · 표시 텍스트: 목차

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-129 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:130` · `button` · type: button · 표시 텍스트: 처음부터 보기
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:130` · `button` · type: button · 표시 텍스트: 처음부터 보기

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-130 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:130` · `button` · type: button
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:130` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-131 — section · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:137` · `section` · role: dialog · 표시 텍스트: } aria-expanded= > / CHAPTER · {visibleRect ? <> / {!isMobileGuide && 안전 모드 가이드에서 변경해도 운영 DB와 실제 파일에
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:137` · `section` · role: dialog · 표시 텍스트: } aria-expanded= > / CHAPTER · {visibleRect ? <> / {!isMobileGuide && 안전 모드 가이드에서 변경해도 운영 DB와 실제 파일에

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 section을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-132 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:138` · `button` · type: button · aria-expanded: mobileSheetExpanded · 표시 텍스트: /
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:138` · `button` · type: button · aria-expanded: mobileSheetExpanded · 표시 텍스트: /

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 같은 열기/닫기 동작을 수행한다. aria-expanded와 연결 패널의 가시성·포커스가 동기화되고, 다른 화면 요소와 겹치거나 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-133 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:138` · `button` · type: button · aria-label: 가이드 종료
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:138` · `button` · type: button · aria-label: 가이드 종료

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-134 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:139` · `button` · type: button · aria-label: 가이드 종료
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:139` · `button` · type: button · aria-label: 가이드 종료

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-135 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · 표시 텍스트: 안전 모드
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · 표시 텍스트: 안전 모드

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-136 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · 표시 텍스트: 대상 다시 보기
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · 표시 텍스트: 대상 다시 보기

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-137 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · 표시 텍스트: 목차
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · 표시 텍스트: 목차

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-138 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · 표시 텍스트: 실습 건너뛰기
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · 표시 텍스트: 실습 건너뛰기

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-139 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · disabled: run.index === 0 · 표시 텍스트: 이전
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · disabled: run.index === 0 · 표시 텍스트: 이전

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-140 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · disabled: Boolean(step.practice && !practiceComplete)
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · disabled: Boolean(step.practice && !practiceComplete)

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-141 — button · AdminOnboardingPortal.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · 표시 텍스트: 여기서 멈추고 나중에 이어보기
- **소스 추적:** `src/admin/onboarding/AdminOnboardingPortal.tsx:140` · `button` · type: button · 표시 텍스트: 여기서 멈추고 나중에 이어보기

#### 클릭·입력·확인 절차

1. /admin의 모든 화면에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-142 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/analytics/page.tsx:85` · `button` · type: button
- **소스 추적:** `src/admin/pages/analytics/page.tsx:85` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/analytics에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-143 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/analytics/page.tsx:170` · `button` · type: button
- **소스 추적:** `src/admin/pages/analytics/page.tsx:170` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/analytics에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-144 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/analytics/page.tsx:226` · `button` · type: button · 표시 텍스트: 페이지뷰 방문자
- **소스 추적:** `src/admin/pages/analytics/page.tsx:226` · `button` · type: button · 표시 텍스트: 페이지뷰 방문자

#### 클릭·입력·확인 절차

1. /admin/analytics에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-215 — button · AuditLogDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/AuditLogDetail.tsx:67` · `button` · type: button · aria-label: 변경 상세 닫기
- **소스 추적:** `src/admin/pages/audit-logs/AuditLogDetail.tsx:67` · `button` · type: button · aria-label: 변경 상세 닫기

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-216 — button · AuditLogDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/AuditLogDetail.tsx:93` · `button` · type: button
- **소스 추적:** `src/admin/pages/audit-logs/AuditLogDetail.tsx:93` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-217 — form · AuditLogFilters.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/AuditLogFilters.tsx:30` · `form` · id: audit-filters · 표시 텍스트: 조회 조건 {activeFilterCount > 0 && 개 적용 중 } 시작일 onChange("fromDate", event.target.value)} /> 종료일 onChan
- **소스 추적:** `src/admin/pages/audit-logs/AuditLogFilters.tsx:30` · `form` · id: audit-filters · 표시 텍스트: 조회 조건 {activeFilterCount > 0 && 개 적용 중 } 시작일 onChange("fromDate", event.target.value)} /> 종료일 onChan

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 해당 폼의 모든 필수 필드를 비운 채 제출한다.
2. 정상 QA 값을 입력해 Enter와 버튼 제출을 각각 시도한다.
3. 제출 중 다시 클릭·새로고침·뒤로가기를 시도한다.

#### 기대 결과

필수값과 형식 오류는 제출 전에 식별 가능하게 표시된다. 정상 제출은 한 번만 처리되며, 로딩·성공·실패·재시도 상태가 명확하다. 중복 레코드나 부분 저장이 생기지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-218 — input · AuditLogFilters.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/AuditLogFilters.tsx:44` · `input` · type: date · value: draftFilters.fromDate
- **소스 추적:** `src/admin/pages/audit-logs/AuditLogFilters.tsx:44` · `input` · type: date · value: draftFilters.fromDate

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-219 — input · AuditLogFilters.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/AuditLogFilters.tsx:52` · `input` · type: date · value: draftFilters.toDate
- **소스 추적:** `src/admin/pages/audit-logs/AuditLogFilters.tsx:52` · `input` · type: date · value: draftFilters.toDate

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-220 — input · AuditLogFilters.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/AuditLogFilters.tsx:60` · `input` · type: search · value: draftFilters.actor · placeholder: admin@themuze.kr
- **소스 추적:** `src/admin/pages/audit-logs/AuditLogFilters.tsx:60` · `input` · type: search · value: draftFilters.actor · placeholder: admin@themuze.kr

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-221 — input · AuditLogFilters.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/AuditLogFilters.tsx:105` · `input` · type: search · value: draftFilters.recordId · placeholder: UUID 또는 설정 키
- **소스 추적:** `src/admin/pages/audit-logs/AuditLogFilters.tsx:105` · `input` · type: search · value: draftFilters.recordId · placeholder: UUID 또는 설정 키

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-222 — button · AuditLogFilters.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/AuditLogFilters.tsx:114` · `button` · type: button · id: audit-reset · disabled: !activeFilterCount && !Object.values(draftFilters).some(Boolean) · 표시 텍스트: 초기화
- **소스 추적:** `src/admin/pages/audit-logs/AuditLogFilters.tsx:114` · `button` · type: button · id: audit-reset · disabled: !activeFilterCount && !Object.values(draftFilters).some(Boolean) · 표시 텍스트: 초기화

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-223 — button · AuditLogFilters.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/AuditLogFilters.tsx:124` · `button` · type: submit · id: audit-search · 표시 텍스트: 이력 조회
- **소스 추적:** `src/admin/pages/audit-logs/AuditLogFilters.tsx:124` · `button` · type: submit · id: audit-search · 표시 텍스트: 이력 조회

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-224 — button · AuditLogList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/AuditLogList.tsx:87` · `button` · type: button · id: audit-open · 표시 텍스트: {entries.length > 1 && ( + )} {log.changed_fields.length > 2 ? ` 외 $ ` : ""}
- **소스 추적:** `src/admin/pages/audit-logs/AuditLogList.tsx:87` · `button` · type: button · id: audit-open · 표시 텍스트: {entries.length > 1 && ( + )} {log.changed_fields.length > 2 ? ` 외 $ ` : ""}

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-225 — button · AuditLogList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/AuditLogList.tsx:145` · `button` · type: button · disabled: page <= 1 || loading · aria-label: 이전 페이지
- **소스 추적:** `src/admin/pages/audit-logs/AuditLogList.tsx:145` · `button` · type: button · disabled: page <= 1 || loading · aria-label: 이전 페이지

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-226 — button · AuditLogList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/AuditLogList.tsx:153` · `button` · type: button · disabled: page >= totalPages || loading · aria-label: 다음 페이지
- **소스 추적:** `src/admin/pages/audit-logs/AuditLogList.tsx:153` · `button` · type: button · disabled: page >= totalPages || loading · aria-label: 다음 페이지

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-227 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/audit-logs/page.tsx:166` · `button` · type: button · 표시 텍스트: 다시 시도
- **소스 추적:** `src/admin/pages/audit-logs/page.tsx:166` · `button` · type: button · 표시 텍스트: 다시 시도

#### 클릭·입력·확인 절차

1. /admin/audit-logs에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-264 — button · ContactDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactDetail.tsx:77` · `button` · type: button · 표시 텍스트: 문의 목록
- **소스 추적:** `src/admin/pages/contact/ContactDetail.tsx:77` · `button` · type: button · 표시 텍스트: 문의 목록

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

### UI-ATOM-265 — button · ContactDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactDetail.tsx:84` · `button` · type: button · 표시 텍스트: 닫기
- **소스 추적:** `src/admin/pages/contact/ContactDetail.tsx:84` · `button` · type: button · 표시 텍스트: 닫기

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

### UI-ATOM-266 — a · ContactDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactDetail.tsx:120` · `a` · 표시 텍스트: 이메일로 답장하기
- **소스 추적:** `src/admin/pages/contact/ContactDetail.tsx:120` · `a` · 표시 텍스트: 이메일로 답장하기

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

### UI-ATOM-267 — button · ContactDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactDetail.tsx:127` · `button` · type: button · disabled: saving || viewing.status === "answered" · 표시 텍스트: 답변 완료로 기록
- **소스 추적:** `src/admin/pages/contact/ContactDetail.tsx:127` · `button` · type: button · disabled: saving || viewing.status === "answered" · 표시 텍스트: 답변 완료로 기록

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

### UI-ATOM-268 — button · ContactDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactDetail.tsx:139` · `button` · type: button · 표시 텍스트: 다시 시도
- **소스 추적:** `src/admin/pages/contact/ContactDetail.tsx:139` · `button` · type: button · 표시 텍스트: 다시 시도

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

### UI-ATOM-269 — a · ContactDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactDetail.tsx:143` · `a` · href: attachmentUrl || undefined · target: _blank · disabled: !attachmentUrl · 표시 텍스트: {attachmentUrl ? `$ / 새 창에서 열기` : "보안 링크 생성 중"}
- **소스 추적:** `src/admin/pages/contact/ContactDetail.tsx:143` · `a` · href: attachmentUrl || undefined · target: _blank · disabled: !attachmentUrl · 표시 텍스트: {attachmentUrl ? `$ / 새 창에서 열기` : "보안 링크 생성 중"}

#### 클릭·입력·확인 절차

1. /contact에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-270 — textarea · ContactDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactDetail.tsx:175` · `textarea` · value: note · placeholder: 검토 내용과 후속 조치를 기록하세요.
- **소스 추적:** `src/admin/pages/contact/ContactDetail.tsx:175` · `textarea` · value: note · placeholder: 검토 내용과 후속 조치를 기록하세요.

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

### UI-ATOM-271 — button · ContactDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactDetail.tsx:178` · `button` · type: button · disabled: saving || note === (viewing.admin_note || "") · 표시 텍스트: 메모 저장
- **소스 추적:** `src/admin/pages/contact/ContactDetail.tsx:178` · `button` · type: button · disabled: saving || note === (viewing.admin_note || "") · 표시 텍스트: 메모 저장

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

### UI-ATOM-272 — button · ContactDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactDetail.tsx:185` · `button` · type: button · disabled: saving
- **소스 추적:** `src/admin/pages/contact/ContactDetail.tsx:185` · `button` · type: button · disabled: saving

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

### UI-ATOM-273 — button · ContactList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactList.tsx:124` · `button` · type: button · 표시 텍스트: 다시 시도
- **소스 추적:** `src/admin/pages/contact/ContactList.tsx:124` · `button` · type: button · 표시 텍스트: 다시 시도

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

### UI-ATOM-274 — button · ContactList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactList.tsx:149` · `button` · type: button
- **소스 추적:** `src/admin/pages/contact/ContactList.tsx:149` · `button` · type: button

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

### UI-ATOM-275 — input · ContactList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactList.tsx:166` · `input` · value: query · placeholder: 이름, 이메일, 회사명, 내용 검색
- **소스 추적:** `src/admin/pages/contact/ContactList.tsx:166` · `input` · value: query · placeholder: 이름, 이메일, 회사명, 내용 검색

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

### UI-ATOM-276 — button · ContactList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactList.tsx:205` · `button` · type: button · disabled: classifying · 표시 텍스트: {classifying ? "분류 중" : `전체 미분류 $ 건 분류`}
- **소스 추적:** `src/admin/pages/contact/ContactList.tsx:205` · `button` · type: button · disabled: classifying · 표시 텍스트: {classifying ? "분류 중" : `전체 미분류 $ 건 분류`}

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

### UI-ATOM-277 — input · ContactList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactList.tsx:229` · `input` · type: checkbox · aria-label: 현재 페이지 문의 전체 선택
- **소스 추적:** `src/admin/pages/contact/ContactList.tsx:229` · `input` · type: checkbox · aria-label: 현재 페이지 문의 전체 선택

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

### UI-ATOM-278 — button · ContactList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactList.tsx:247` · `button` · type: button · disabled: deleting · 표시 텍스트: {deleting ? "삭제 중" : `$ 건 삭제`}
- **소스 추적:** `src/admin/pages/contact/ContactList.tsx:247` · `button` · type: button · disabled: deleting · 표시 텍스트: {deleting ? "삭제 중" : `$ 건 삭제`}

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

### UI-ATOM-279 — input · ContactList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactList.tsx:266` · `input` · type: checkbox
- **소스 추적:** `src/admin/pages/contact/ContactList.tsx:266` · `input` · type: checkbox

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

### UI-ATOM-280 — button · ContactList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactList.tsx:275` · `button` · type: button · id: contact-open · 표시 텍스트: {inquiry.is_likely_spam && ( 스팸 의심 )}
- **소스 추적:** `src/admin/pages/contact/ContactList.tsx:275` · `button` · type: button · id: contact-open · 표시 텍스트: {inquiry.is_likely_spam && ( 스팸 의심 )}

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

### UI-ATOM-281 — button · ContactList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactList.tsx:342` · `button` · type: button · disabled: page === 1 · 표시 텍스트: 이전
- **소스 추적:** `src/admin/pages/contact/ContactList.tsx:342` · `button` · type: button · disabled: page === 1 · 표시 텍스트: 이전

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

### UI-ATOM-282 — button · ContactList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactList.tsx:352` · `button` · type: button · aria-current: item === page ? "page" : undefined
- **소스 추적:** `src/admin/pages/contact/ContactList.tsx:352` · `button` · type: button · aria-current: item === page ? "page" : undefined

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

### UI-ATOM-283 — button · ContactList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/contact/ContactList.tsx:372` · `button` · type: button · disabled: page === totalPages · 표시 텍스트: 다음
- **소스 추적:** `src/admin/pages/contact/ContactList.tsx:372` · `button` · type: button · disabled: page === totalPages · 표시 텍스트: 다음

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

### UI-ATOM-284 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/content/page.tsx:70` · `button` · type: button · 표시 텍스트: 다시 시도
- **소스 추적:** `src/admin/pages/content/page.tsx:70` · `button` · type: button · 표시 텍스트: 다시 시도

#### 클릭·입력·확인 절차

1. /admin/content 또는 /admin/notices에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-285 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/dashboard/page.tsx:226` · `button` · type: button · 표시 텍스트: 다시 시도
- **소스 추적:** `src/admin/pages/dashboard/page.tsx:226` · `button` · type: button · 표시 텍스트: 다시 시도

#### 클릭·입력·확인 절차

1. /admin에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-286 — input · HeroAlbumCatalog.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroAlbumCatalog.tsx:57` · `input` · value: query · placeholder: 앨범명 또는 아티스트 검색
- **소스 추적:** `src/admin/pages/hero/HeroAlbumCatalog.tsx:57` · `input` · value: query · placeholder: 앨범명 또는 아티스트 검색

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-287 — button · HeroAlbumCatalog.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroAlbumCatalog.tsx:117` · `button` · type: button · id: hero-add · disabled: selected || savingId === album.id
- **소스 추적:** `src/admin/pages/hero/HeroAlbumCatalog.tsx:117` · `button` · type: button · id: hero-add · disabled: selected || savingId === album.id

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-288 — button · HeroSlideCard.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroSlideCard.tsx:113` · `button` · type: button · disabled: disabled · title: 끌어서 순서 변경 · 표시 텍스트: 끌어서 이동
- **소스 추적:** `src/admin/pages/hero/HeroSlideCard.tsx:113` · `button` · type: button · disabled: disabled · title: 끌어서 순서 변경 · 표시 텍스트: 끌어서 이동

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-289 — button · HeroSlideCard.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroSlideCard.tsx:143` · `button` · type: button · aria-label: 위로 이동 · disabled: disabled || !canMoveUp
- **소스 추적:** `src/admin/pages/hero/HeroSlideCard.tsx:143` · `button` · type: button · aria-label: 위로 이동 · disabled: disabled || !canMoveUp

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-290 — button · HeroSlideCard.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroSlideCard.tsx:151` · `button` · type: button · aria-label: 아래로 이동 · disabled: disabled || !canMoveDown
- **소스 추적:** `src/admin/pages/hero/HeroSlideCard.tsx:151` · `button` · type: button · aria-label: 아래로 이동 · disabled: disabled || !canMoveDown

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-291 — button · HeroSlideCard.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroSlideCard.tsx:159` · `button` · type: button · id: hero-remove · aria-label: 목록에서 제외 · title: 목록에서 제외 · disabled: disabled
- **소스 추적:** `src/admin/pages/hero/HeroSlideCard.tsx:159` · `button` · type: button · id: hero-remove · aria-label: 목록에서 제외 · title: 목록에서 제외 · disabled: disabled

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-292 — button · HeroSlideEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroSlideEditor.tsx:176` · `button` · type: button · id: draft-discard · 표시 텍스트: 삭제
- **소스 추적:** `src/admin/pages/hero/HeroSlideEditor.tsx:176` · `button` · type: button · id: draft-discard · 표시 텍스트: 삭제

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-293 — button · HeroSlideEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroSlideEditor.tsx:183` · `button` · type: button · id: draft-restore · 표시 텍스트: 복구
- **소스 추적:** `src/admin/pages/hero/HeroSlideEditor.tsx:183` · `button` · type: button · id: draft-restore · 표시 텍스트: 복구

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-294 — button · HeroSlideEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroSlideEditor.tsx:197` · `button` · type: button · 표시 텍스트: 닫기
- **소스 추적:** `src/admin/pages/hero/HeroSlideEditor.tsx:197` · `button` · type: button · 표시 텍스트: 닫기

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-295 — section · HeroVideoClipEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroVideoClipEditor.tsx:155` · `section` · 표시 텍스트: 히어로 영상 {guideSandboxActive ? ( 연습 모드 종료 ) : ( setOpen(true)} > )} {open && typeof document !== "unde
- **소스 추적:** `src/admin/pages/hero/HeroVideoClipEditor.tsx:155` · `section` · 표시 텍스트: 히어로 영상 {guideSandboxActive ? ( 연습 모드 종료 ) : ( setOpen(true)} > )} {open && typeof document !== "unde

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 section을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-296 — button · HeroVideoClipEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroVideoClipEditor.tsx:166` · `button` · type: button · 표시 텍스트: 연습 모드 종료
- **소스 추적:** `src/admin/pages/hero/HeroVideoClipEditor.tsx:166` · `button` · type: button · 표시 텍스트: 연습 모드 종료

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-297 — button · HeroVideoClipEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroVideoClipEditor.tsx:174` · `button` · type: button · disabled: disabled
- **소스 추적:** `src/admin/pages/hero/HeroVideoClipEditor.tsx:174` · `button` · type: button · disabled: disabled

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-298 — div · HeroVideoClipEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroVideoClipEditor.tsx:186` · `div` · role: presentation · 표시 텍스트: { if (event.key === "Escape") }} > HERO VIDEO 12초 영상 저장
- **소스 추적:** `src/admin/pages/hero/HeroVideoClipEditor.tsx:186` · `div` · role: presentation · 표시 텍스트: { if (event.key === "Escape") }} > HERO VIDEO 12초 영상 저장

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-299 — section · HeroVideoClipEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroVideoClipEditor.tsx:193` · `section` · role: dialog · 표시 텍스트: HERO VIDEO 12초 영상 저장 FHD H.264 MP4에서 원하는 12초 구간만 메인 슬라이드에 저장합니다. {source ? ( } /> ) : ( 영상을 선택하면 여기에
- **소스 추적:** `src/admin/pages/hero/HeroVideoClipEditor.tsx:193` · `section` · role: dialog · 표시 텍스트: HERO VIDEO 12초 영상 저장 FHD H.264 MP4에서 원하는 12초 구간만 메인 슬라이드에 저장합니다. {source ? ( } /> ) : ( 영상을 선택하면 여기에

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 section을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-300 — video · HeroVideoClipEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroVideoClipEditor.tsx:218` · `video` · video 요소(동적 라벨 확인 필요)
- **소스 추적:** `src/admin/pages/hero/HeroVideoClipEditor.tsx:218` · `video` · video 요소(동적 라벨 확인 필요)

#### 클릭·입력·확인 절차

1. /admin/hero에서 영상 요소가 표시되는 상태를 만든다.
2. 최초 로딩·재생 대상 전환·탭 비활성화/복귀를 관찰한다.
3. 영상 요청 실패를 네트워크 차단으로 재현한다.

#### 기대 결과

영상의 로딩·재생·정지·poster/fallback이 화면 상태와 일치하고 실패 시에도 전체 화면이 멈추지 않는다. 자동재생은 정책에 맞는 muted/inline 동작을 지킨다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-301 — label · HeroVideoClipEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroVideoClipEditor.tsx:241` · `label` · 표시 텍스트: 1920×1080 H.264 MP4 · 선택한 12초 구간만 저장됩니다 selectFile(event.target.files?.[0] ?? null) } />
- **소스 추적:** `src/admin/pages/hero/HeroVideoClipEditor.tsx:241` · `label` · 표시 텍스트: 1920×1080 H.264 MP4 · 선택한 12초 구간만 저장됩니다 selectFile(event.target.files?.[0] ?? null) } />

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 label을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-302 — input · HeroVideoClipEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroVideoClipEditor.tsx:262` · `input` · type: file · accept: video/mp4,.mp4 · disabled: disabled || busy
- **소스 추적:** `src/admin/pages/hero/HeroVideoClipEditor.tsx:262` · `input` · type: file · accept: video/mp4,.mp4 · disabled: disabled || busy

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-303 — input · HeroVideoClipEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroVideoClipEditor.tsx:277` · `input` · type: range · value: start · disabled: disabled || busy
- **소스 추적:** `src/admin/pages/hero/HeroVideoClipEditor.tsx:277` · `input` · type: range · value: start · disabled: disabled || busy

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-304 — button · HeroVideoClipEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroVideoClipEditor.tsx:323` · `button` · type: button · disabled: disabled || busy · 표시 텍스트: 영상 제거
- **소스 추적:** `src/admin/pages/hero/HeroVideoClipEditor.tsx:323` · `button` · type: button · disabled: disabled || busy · 표시 텍스트: 영상 제거

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-305 — button · HeroVideoClipEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroVideoClipEditor.tsx:343` · `button` · type: button
- **소스 추적:** `src/admin/pages/hero/HeroVideoClipEditor.tsx:343` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-306 — button · HeroVideoClipEditor.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/hero/HeroVideoClipEditor.tsx:350` · `button` · type: button · disabled: disabled || busy || !hasSourceFile || duration < CLIP_SECONDS
- **소스 추적:** `src/admin/pages/hero/HeroVideoClipEditor.tsx:350` · `button` · type: button · disabled: disabled || busy || !hasSourceFile || duration < CLIP_SECONDS

#### 클릭·입력·확인 절차

1. /admin/hero에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-307 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/inbox/page.tsx:90` · `button` · type: button · 표시 텍스트: 다시 시도
- **소스 추적:** `src/admin/pages/inbox/page.tsx:90` · `button` · type: button · 표시 텍스트: 다시 시도

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

### UI-ATOM-308 — button · ProtectReportDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportDetail.tsx:84` · `button` · type: button · 표시 텍스트: 접수 목록
- **소스 추적:** `src/admin/pages/protect/ProtectReportDetail.tsx:84` · `button` · type: button · 표시 텍스트: 접수 목록

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

### UI-ATOM-309 — button · ProtectReportDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportDetail.tsx:91` · `button` · type: button · 표시 텍스트: 닫기
- **소스 추적:** `src/admin/pages/protect/ProtectReportDetail.tsx:91` · `button` · type: button · 표시 텍스트: 닫기

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

### UI-ATOM-310 — a · ProtectReportDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportDetail.tsx:143` · `a` · id: protect-source · href: safeHref(viewing.post_url) · target: _blank · 표시 텍스트: 원문 게시물 열기
- **소스 추적:** `src/admin/pages/protect/ProtectReportDetail.tsx:143` · `a` · id: protect-source · href: safeHref(viewing.post_url) · target: _blank · 표시 텍스트: 원문 게시물 열기

#### 클릭·입력·확인 절차

1. /protect에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-311 — button · ProtectReportDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportDetail.tsx:155` · `button` · type: button · 표시 텍스트: 다시 시도
- **소스 추적:** `src/admin/pages/protect/ProtectReportDetail.tsx:155` · `button` · type: button · 표시 텍스트: 다시 시도

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

### UI-ATOM-312 — a · ProtectReportDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportDetail.tsx:162` · `a` · href: url || undefined · target: _blank · disabled: !url · 표시 텍스트: {url && isImage(file_name) ? : isImage(file_name) ? : }
- **소스 추적:** `src/admin/pages/protect/ProtectReportDetail.tsx:162` · `a` · href: url || undefined · target: _blank · disabled: !url · 표시 텍스트: {url && isImage(file_name) ? : isImage(file_name) ? : }

#### 클릭·입력·확인 절차

1. /protect에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-313 — textarea · ProtectReportDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportDetail.tsx:198` · `textarea` · value: note · placeholder: 검토 내용과 후속 조치를 기록해 주세요.
- **소스 추적:** `src/admin/pages/protect/ProtectReportDetail.tsx:198` · `textarea` · value: note · placeholder: 검토 내용과 후속 조치를 기록해 주세요.

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

### UI-ATOM-314 — button · ProtectReportDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportDetail.tsx:201` · `button` · type: button · disabled: saving || note === (viewing.admin_note || "") · 표시 텍스트: 메모 저장
- **소스 추적:** `src/admin/pages/protect/ProtectReportDetail.tsx:201` · `button` · type: button · disabled: saving || note === (viewing.admin_note || "") · 표시 텍스트: 메모 저장

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

### UI-ATOM-315 — button · ProtectReportDetail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportDetail.tsx:209` · `button` · type: button · disabled: saving
- **소스 추적:** `src/admin/pages/protect/ProtectReportDetail.tsx:209` · `button` · type: button · disabled: saving

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

### UI-ATOM-316 — button · ProtectReportList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportList.tsx:111` · `button` · type: button · 표시 텍스트: 닫기
- **소스 추적:** `src/admin/pages/protect/ProtectReportList.tsx:111` · `button` · type: button · 표시 텍스트: 닫기

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

### UI-ATOM-317 — input · ProtectReportList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportList.tsx:132` · `input` · value: query · placeholder: 제목, 아티스트, 작성자 검색
- **소스 추적:** `src/admin/pages/protect/ProtectReportList.tsx:132` · `input` · value: query · placeholder: 제목, 아티스트, 작성자 검색

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

### UI-ATOM-318 — button · ProtectReportList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportList.tsx:163` · `button` · type: button · disabled: classifying · 표시 텍스트: {classifying ? "분류 중" : `전체 미분류 $ 건 분류`}
- **소스 추적:** `src/admin/pages/protect/ProtectReportList.tsx:163` · `button` · type: button · disabled: classifying · 표시 텍스트: {classifying ? "분류 중" : `전체 미분류 $ 건 분류`}

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

### UI-ATOM-319 — input · ProtectReportList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportList.tsx:182` · `input` · type: checkbox · disabled: deleting · aria-label: 현재 페이지 제보 전체 선택
- **소스 추적:** `src/admin/pages/protect/ProtectReportList.tsx:182` · `input` · type: checkbox · disabled: deleting · aria-label: 현재 페이지 제보 전체 선택

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

### UI-ATOM-320 — button · ProtectReportList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportList.tsx:196` · `button` · type: button · disabled: deleting
- **소스 추적:** `src/admin/pages/protect/ProtectReportList.tsx:196` · `button` · type: button · disabled: deleting

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

### UI-ATOM-321 — input · ProtectReportList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportList.tsx:224` · `input` · type: checkbox · disabled: deleting
- **소스 추적:** `src/admin/pages/protect/ProtectReportList.tsx:224` · `input` · type: checkbox · disabled: deleting

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

### UI-ATOM-322 — button · ProtectReportList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportList.tsx:232` · `button` · type: button · id: protect-open · 표시 텍스트: / {report.ai_classified_at ? ( <> ) : ( <> 분류 중 )}
- **소스 추적:** `src/admin/pages/protect/ProtectReportList.tsx:232` · `button` · type: button · id: protect-open · 표시 텍스트: / {report.ai_classified_at ? ( <> ) : ( <> 분류 중 )}

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

### UI-ATOM-323 — button · ProtectReportList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportList.tsx:310` · `button` · type: button · disabled: page === 1 · 표시 텍스트: 이전
- **소스 추적:** `src/admin/pages/protect/ProtectReportList.tsx:310` · `button` · type: button · disabled: page === 1 · 표시 텍스트: 이전

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

### UI-ATOM-324 — button · ProtectReportList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportList.tsx:320` · `button` · type: button · aria-current: item === page ? "page" : undefined
- **소스 추적:** `src/admin/pages/protect/ProtectReportList.tsx:320` · `button` · type: button · aria-current: item === page ? "page" : undefined

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

### UI-ATOM-325 — button · ProtectReportList.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/protect/ProtectReportList.tsx:340` · `button` · type: button · disabled: page === totalPages · 표시 텍스트: 다음
- **소스 추적:** `src/admin/pages/protect/ProtectReportList.tsx:340` · `button` · type: button · disabled: page === totalPages · 표시 텍스트: 다음

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

### UI-ATOM-326 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/retention/page.tsx:311` · `button` · type: button · 표시 텍스트: 다시 시도
- **소스 추적:** `src/admin/pages/retention/page.tsx:311` · `button` · type: button · 표시 텍스트: 다시 시도

#### 클릭·입력·확인 절차

1. /admin/retention에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-327 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/retention/page.tsx:350` · `button` · type: button · disabled: loading || refreshing || deleting · aria-label: 삭제 후보 새로고침
- **소스 추적:** `src/admin/pages/retention/page.tsx:350` · `button` · type: button · disabled: loading || refreshing || deleting · aria-label: 삭제 후보 새로고침

#### 클릭·입력·확인 절차

1. /admin/retention에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-328 — input · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/retention/page.tsx:364` · `input` · type: checkbox · disabled: loading || !candidates.length || deleting · aria-label: 삭제 후보 전체 선택
- **소스 추적:** `src/admin/pages/retention/page.tsx:364` · `input` · type: checkbox · disabled: loading || !candidates.length || deleting · aria-label: 삭제 후보 전체 선택

#### 클릭·입력·확인 절차

1. /admin/retention에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-329 — button · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/retention/page.tsx:377` · `button` · type: button · disabled: !selectedCount || deleting
- **소스 추적:** `src/admin/pages/retention/page.tsx:377` · `button` · type: button · disabled: !selectedCount || deleting

#### 클릭·입력·확인 절차

1. /admin/retention에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-330 — input · page.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/retention/page.tsx:399` · `input` · type: checkbox · disabled: deleting
- **소스 추적:** `src/admin/pages/retention/page.tsx:399` · `input` · type: checkbox · disabled: deleting

#### 클릭·입력·확인 절차

1. /admin/retention에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-331 — form · AdminAccountsPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AdminAccountsPanel.tsx:158` · `form` · 표시 텍스트: 이메일 setEmail(event.target.value)} placeholder="admin@example.com" required /> 역할 setRole(event.targe
- **소스 추적:** `src/admin/pages/settings/AdminAccountsPanel.tsx:158` · `form` · 표시 텍스트: 이메일 setEmail(event.target.value)} placeholder="admin@example.com" required /> 역할 setRole(event.targe

#### 클릭·입력·확인 절차

1. /admin/settings에서 해당 폼의 모든 필수 필드를 비운 채 제출한다.
2. 정상 QA 값을 입력해 Enter와 버튼 제출을 각각 시도한다.
3. 제출 중 다시 클릭·새로고침·뒤로가기를 시도한다.

#### 기대 결과

필수값과 형식 오류는 제출 전에 식별 가능하게 표시된다. 정상 제출은 한 번만 처리되며, 로딩·성공·실패·재시도 상태가 명확하다. 중복 레코드나 부분 저장이 생기지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-332 — input · AdminAccountsPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AdminAccountsPanel.tsx:161` · `input` · type: email · value: email · placeholder: admin@example.com
- **소스 추적:** `src/admin/pages/settings/AdminAccountsPanel.tsx:161` · `input` · type: email · value: email · placeholder: admin@example.com

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-333 — select · AdminAccountsPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AdminAccountsPanel.tsx:172` · `select` · value: role · 표시 텍스트: 편집자 슈퍼 관리자
- **소스 추적:** `src/admin/pages/settings/AdminAccountsPanel.tsx:172` · `select` · value: role · 표시 텍스트: 편집자 슈퍼 관리자

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-334 — button · AdminAccountsPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AdminAccountsPanel.tsx:181` · `button` · type: submit · disabled: inviting
- **소스 추적:** `src/admin/pages/settings/AdminAccountsPanel.tsx:181` · `button` · type: submit · disabled: inviting

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-335 — button · AdminAccountsPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AdminAccountsPanel.tsx:206` · `button` · type: button · disabled: loading · aria-label: 목록 새로고침
- **소스 추적:** `src/admin/pages/settings/AdminAccountsPanel.tsx:206` · `button` · type: button · disabled: loading · aria-label: 목록 새로고침

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-336 — select · AdminAccountsPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AdminAccountsPanel.tsx:245` · `select` · value: account.role · disabled: busy · 표시 텍스트: 편집자 슈퍼 관리자
- **소스 추적:** `src/admin/pages/settings/AdminAccountsPanel.tsx:245` · `select` · value: account.role · disabled: busy · 표시 텍스트: 편집자 슈퍼 관리자

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-337 — button · AdminAccountsPanel.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AdminAccountsPanel.tsx:257` · `button` · id: admin-account-remove · type: button · disabled: busy · title: 관리자 권한 해제
- **소스 추적:** `src/admin/pages/settings/AdminAccountsPanel.tsx:257` · `button` · id: admin-account-remove · type: button · disabled: busy · title: 관리자 권한 해제

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-338 — button · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:73` · `button` · type: button · 표시 텍스트: 삭제
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:73` · `button` · type: button · 표시 텍스트: 삭제

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-339 — button · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:76` · `button` · type: button · 표시 텍스트: 복구
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:76` · `button` · type: button · 표시 텍스트: 복구

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-340 — div · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:115` · `div` · id: avatar-upload · 표시 텍스트: JPG, PNG, WebP · 최대 10MB · 업로드 전 정사각형으로 자릅니다
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:115` · `div` · id: avatar-upload · 표시 텍스트: JPG, PNG, WebP · 최대 10MB · 업로드 전 정사각형으로 자릅니다

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-341 — button · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:140` · `button` · type: button · id: avatar-file · disabled: uploading || !artistId
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:140` · `button` · type: button · id: avatar-file · disabled: uploading || !artistId

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-342 — input · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:148` · `input` · type: file · accept: image/jpeg,image/png,image/webp
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:148` · `input` · type: file · accept: image/jpeg,image/png,image/webp

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-343 — input · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:185` · `input` · type: checkbox
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:185` · `input` · type: checkbox

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-344 — button · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:197` · `button` · type: button · id: avatar-up · disabled: index === 0 · aria-label: 앞으로 이동
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:197` · `button` · type: button · id: avatar-up · disabled: index === 0 · aria-label: 앞으로 이동

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-345 — button · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:206` · `button` · type: button · id: avatar-down · disabled: index === items.length - 1 · aria-label: 뒤로 이동
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:206` · `button` · type: button · id: avatar-down · disabled: index === items.length - 1 · aria-label: 뒤로 이동

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-346 — button · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:215` · `button` · type: button · id: avatar-delete · aria-label: 아바타 삭제
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:215` · `button` · type: button · id: avatar-delete · aria-label: 아바타 삭제

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-347 — div · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:242` · `div` · role: dialog · 표시 텍스트: 정사각형으로 자르기 {cropQueue.files.length > 1 ? `$ / $ · ` : ""} 확대와 위치를 조절해 사용할 영역을 맞춰 주세요.
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:242` · `div` · role: dialog · 표시 텍스트: 정사각형으로 자르기 {cropQueue.files.length > 1 ? `$ / $ · ` : ""} 확대와 위치를 조절해 사용할 영역을 맞춰 주세요.

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-348 — input · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:273` · `input` · type: range · value: cropZoom
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:273` · `input` · type: range · value: cropZoom

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-349 — input · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:284` · `input` · type: range · value: cropX
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:284` · `input` · type: range · value: cropX

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-350 — input · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:294` · `input` · type: range · value: cropY
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:294` · `input` · type: range · value: cropY

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-351 — button · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:304` · `button` · type: button · 표시 텍스트: 취소
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:304` · `button` · type: button · 표시 텍스트: 취소

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-352 — button · AvatarAssetManager.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/AvatarAssetManager.tsx:311` · `button` · type: button · id: avatar-crop · disabled: !cropReady
- **소스 추적:** `src/admin/pages/settings/AvatarAssetManager.tsx:311` · `button` · type: button · id: avatar-crop · disabled: !cropReady

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-353 — div · BusinessAssetField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/BusinessAssetField.tsx:37` · `div` · 표시 텍스트: {href && ( 보기 )} } />
- **소스 추적:** `src/admin/pages/settings/BusinessAssetField.tsx:37` · `div` · 표시 텍스트: {href && ( 보기 )} } />

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 div을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-354 — a · BusinessAssetField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/BusinessAssetField.tsx:69` · `a` · href: href · target: _blank · 표시 텍스트: 보기
- **소스 추적:** `src/admin/pages/settings/BusinessAssetField.tsx:69` · `a` · href: href · target: _blank · 표시 텍스트: 보기

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 링크를 화면에서 식별한다.
2. Tab으로 포커스를 옮겨 포커스 표시·접근 가능한 이름을 확인한다.
3. 링크를 클릭한다.

#### 기대 결과

내부 링크는 의도한 경로로 한 번만 이동한다. 외부 링크는 올바른 도메인으로 열리고, 새 탭 링크는 원래 화면을 덮어쓰지 않으며 원래 탭 상태가 보존된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-355 — input · BusinessAssetField.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/BusinessAssetField.tsx:74` · `input` · id: inputId · type: file · accept: accept · disabled: busy
- **소스 추적:** `src/admin/pages/settings/BusinessAssetField.tsx:74` · `input` · id: inputId · type: file · accept: accept · disabled: busy

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-356 — input · SettingsEditorContent.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/SettingsEditorContent.tsx:93` · `input` · type: email · value: company.email · placeholder: contact@example.com
- **소스 추적:** `src/admin/pages/settings/SettingsEditorContent.tsx:93` · `input` · type: email · value: company.email · placeholder: contact@example.com

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-357 — button · SettingsEditorContent.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/SettingsEditorContent.tsx:127` · `button` · type: button · 표시 텍스트: 최신순 정렬
- **소스 추적:** `src/admin/pages/settings/SettingsEditorContent.tsx:127` · `button` · type: button · 표시 텍스트: 최신순 정렬

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-358 — button · SettingsEditorContent.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/SettingsEditorContent.tsx:136` · `button` · type: button · id: history-add · 표시 텍스트: 연혁 추가
- **소스 추적:** `src/admin/pages/settings/SettingsEditorContent.tsx:136` · `button` · type: button · id: history-add · 표시 텍스트: 연혁 추가

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-359 — input · SettingsEditorContent.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/SettingsEditorContent.tsx:160` · `input` · value: item.date · placeholder: 2026. 07
- **소스 추적:** `src/admin/pages/settings/SettingsEditorContent.tsx:160` · `input` · value: item.date · placeholder: 2026. 07

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-360 — input · SettingsEditorContent.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/SettingsEditorContent.tsx:173` · `input` · value: item[historyEventKey]
- **소스 추적:** `src/admin/pages/settings/SettingsEditorContent.tsx:173` · `input` · value: item[historyEventKey]

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-361 — button · SettingsEditorContent.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/SettingsEditorContent.tsx:189` · `button` · type: button · id: history-delete · aria-label: 연혁 삭제
- **소스 추적:** `src/admin/pages/settings/SettingsEditorContent.tsx:189` · `button` · type: button · id: history-delete · aria-label: 연혁 삭제

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
2. 마우스 클릭으로 한 번 실행하고, Tab + Enter 및 Space로도 실행한다.
3. 토글·모달·목록 변경 계열이면 다시 실행해 원래 상태로 되돌리고, 빠른 연속 실행도 확인한다.

#### 기대 결과

클릭과 키보드 실행이 동일한 의도된 동작을 한 번만 수행한다. 로딩·활성/비활성·성공/오류·포커스 상태가 시각적으로 분명하고, 빠른 연속 실행으로 중복 작업이나 깨진 화면이 발생하지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-362 — input · SettingsEditorContent.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/SettingsEditorContent.tsx:228` · `input` · value: footer.copyright · placeholder: © THE MUZE ENTERTAINMENT. ALL RIGHTS RESERVED.
- **소스 추적:** `src/admin/pages/settings/SettingsEditorContent.tsx:228` · `input` · value: footer.copyright · placeholder: © THE MUZE ENTERTAINMENT. ALL RIGHTS RESERVED.

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 입력 요소를 화면에서 식별한다.
2. 마우스와 Tab으로 각각 포커스하고 라벨·placeholder·필수 표시를 확인한다.
3. 정상값, 빈 값, 경계값/잘못된 형식을 차례로 입력 또는 선택한 뒤 blur 또는 제출한다.

#### 기대 결과

값·선택 상태가 즉시 또는 정의된 debounce 후 정확히 반영된다. 정상값은 보존되고, 오류값은 같은 필드와 연결된 이해 가능한 오류로 안내된다. 비밀번호·민감값은 평문으로 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 동작 전후 스크린샷, focus 상태, 관련 Network/Console 오류가 있으면 캡처한다.
- **결함 ID / 메모:**

---

### UI-ATOM-363 — button · SettingsRail.tsx

- **구역:** UI 요소 전수 확인
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대상 화면 접근 가능. 소스 추적: `src/admin/pages/settings/SettingsRail.tsx:133` · `button` · type: button
- **소스 추적:** `src/admin/pages/settings/SettingsRail.tsx:133` · `button` · type: button

#### 클릭·입력·확인 절차

1. /admin/settings에서 대상 button을 화면의 라벨·위치로 식별한다.
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
