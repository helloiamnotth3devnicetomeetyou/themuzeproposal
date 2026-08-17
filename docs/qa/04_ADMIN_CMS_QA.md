# 04. 관리자 CMS 기능 QA

> **기준 커밋:** `0d79efb18de637d02ce210464a1d340ba9294def`  
> 모든 항목은 **클릭·입력·확인 절차 → 기대 결과 → 결과 기록** 순서로 실행한다.

| 표기 | 의미 |
| --- | --- |
| **L** | Local에서만 안전하게 재현하는 검증 |
| **S** | Staging/Preview의 QA 데이터·계정으로 수행하는 검증 |
| **P** | Production에서만 확정 가능한 도메인·보안 헤더·외부 연동 검증 |
| **B** | Local과 Staging/Production 양쪽에서 수행하는 검증 |

> Production에서는 **QA 전용 계정·콘텐츠·파일만** 사용한다. 실제 접수·지원·신고·운영 데이터를 생성·수정·삭제하지 않는다.

> **이 파일의 범위:** 관리자 쉘, 검색, 초안, Hero, 콘텐츠/공지, 아티스트, 캠페인, 접수함, 감사, 보존, 설정 시나리오와 기존 CMS 기능 케이스  
> **케이스 수:** 53건

> 수정·게시·삭제는 반드시 Staging의 QA 콘텐츠에서 실행한다. Production에서는 승인된 역할과 테스트 콘텐츠만 사용한다.

### ADM-001 — 관리자 로그인/대시보드

- **구역:** Admin
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. /admin을 연다.
2. 2. login 후 dashboard를 확인한다.

#### 기대 결과

authorized admin만 접근하고 dashboard 카드·최근 활동·sidebar가 정상 표시된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-002 — 역할별 메뉴 차이

- **구역:** Admin
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR, QA-SUPER
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. editor와 super_admin으로 각각 로그인한다.
2. 2. sidebar와 direct URLs를 비교한다.

#### 기대 결과

역할별 노출 메뉴와 API 권한이 일치하며 숨긴 메뉴 URL 직접 접근도 서버에서 차단된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-003 — 관리자 mobile/keyboard

- **구역:** Admin
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 작은 viewport에서 sidebar, table, modal, form을 조작한다.
2. 2. Tab/Escape를 사용한다.

#### 기대 결과

sidebar·table horizontal scroll·modal·focus가 정상이며 admin 작업이 불가능해지지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-004 — 공지 생성→preview→publish

- **구역:** Content
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. Notices에서 새 공지를 만든다.
2. 2. title/rich text/locale/pin/publish 값을 입력한다.
3. 3. preview 후 publish한다.
4. 4. public notice를 연다.

#### 기대 결과

preview와 public render가 일치하고 publish 뒤 list/detail/sitemap/cache가 갱신된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-005 — 공지 수정/unpublish/delete

- **구역:** Content
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. test notice를 수정한다.
2. 2. unpublish하고 public URL을 연다.
3. 3. 삭제를 시도한다.

#### 기대 결과

수정 반영·unpublish 차단·삭제 confirmation·audit log가 정책대로 동작한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-006 — Rich text 보안

- **구역:** Content
- **실행 환경:** L/B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. editor에 script/event handler, javascript/data/mailto/ftp link, 정상 HTTPS link를 넣고 저장/preview한다.

#### 기대 결과

위험 markup/URI는 제거되고 HTTPS link만 안전한 target/rel로 표시된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-007 — 번역 요청/실패

- **구역:** Content
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. translation 기능으로 테스트 문장을 번역한다.
2. 2. provider failure/긴 text/특수문자를 시도한다.

#### 기대 결과

성공 시 대상 locale만 갱신되고 원문은 보존된다. 실패는 안전한 오류로 표시되고 prompt injection 텍스트가 system action을 바꾸지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-008 — Hero asset CRUD

- **구역:** Hero
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. Hero에서 test image/video를 upload한다.
2. 2. 순서를 바꾸고 public home을 연다.
3. 3. 제거한다.

#### 기대 결과

upload/preview/order/public render/cache/old object cleanup이 정상이다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-009 — Artist profile 생성/수정

- **구역:** Artist
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. test artist를 생성 또는 수정한다.
2. 2. slug, locale, biography, links, status를 저장한다.
3. 3. public list/detail을 연다.

#### 기대 결과

validation·slug uniqueness·public exposure·translation·external links가 일치한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-010 — Artist 비활성/삭제 방어

- **구역:** Artist
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 참조 중 artist를 inactive/delete한다.
2. 2. public URL, albums, schedules를 확인한다.

#### 기대 결과

참조 무결성·경고·차단/cascade 정책이 적용되고 orphan public link가 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-011 — 멤버 CRUD/정렬

- **구역:** Member
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. member를 추가한다.
2. 2. image/소개/순서를 변경하고 저장한다.
3. 3. public artist page를 연다.

#### 기대 결과

admin 순서·public 순서·thumbnail/detail·locale가 일치한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-012 — 갤러리 동시 저장

- **구역:** Gallery
- **실행 환경:** L/B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. gallery asset을 추가/순서 변경한다.
2. 2. 두 탭에서 서로 다른 변경을 저장한다.

#### 기대 결과

atomic save/충돌 처리/asset reference가 의도한 정책대로 동작하며 사용 중 asset이 유실되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-013 — 앨범 CRUD

- **구역:** Discography
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. album을 만들거나 수정한다.
2. 2. cover/logo/release type/date/locale을 저장한다.
3. 3. public list/detail을 확인한다.

#### 기대 결과

metadata·cover·sorting·public exposure·cache가 정확하다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-014 — 트랙 관리/정렬

- **구역:** Discography
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. track을 추가/수정/재정렬한다.
2. 2. public album/player를 확인한다.

#### 기대 결과

track order·title flag·credit·external/audio link가 UI/player queue에 정확히 반영된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-015 — 일정 CRUD

- **구역:** Schedule
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. schedule을 생성/수정/삭제한다.
2. 2. 날짜/timezone/artist/external CTA를 설정한다.

#### 기대 결과

public calendar/list/locale/정렬/revalidate 결과가 admin 값과 일치한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-016 — 문의 inbox 처리

- **구역:** Contact Admin
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. Contact list에서 QA 문의를 filter/search/open한다.
2. 2. attachment를 열고 answered 상태를 변경한다.

#### 기대 결과

목록·detail·attachment authorization·상태·audit가 정상이다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-017 — 제보 triage

- **구역:** Protect Admin
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. QA Protect report를 열고 status/severity/reviewer note를 바꾼다.
2. 2. attachment를 연다.

#### 기대 결과

권한 있는 관리자만 내용/파일을 보고 변경할 수 있으며 history/audit가 남는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-018 — 캠페인 생성/상태

- **구역:** Audition Admin
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. campaign을 draft로 만든다.
2. 2. title/open-close time/capacity를 입력한다.
3. 3. publish/unpublish한다.

#### 기대 결과

상태에 따라 public list/CTA/form 접근이 정확히 달라진다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-019 — Question builder

- **구역:** Audition Admin
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. text/select/file/section 질문을 추가한다.
2. 2. required/options/order/locale을 변경한다.
3. 3. builder preview를 연다.

#### 기대 결과

실제 public form과 preview의 field·정렬·validation·locale가 일치한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-020 — 지원서 심사

- **구역:** Audition Admin
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. QA submission을 열고 answer/file/reviewer note/status를 확인·변경한다.

#### 기대 결과

정확한 submission만 표시되고 private attachment 접근/decision/audit/pagination/filter가 정상이다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-021 — 감사 로그

- **구역:** Audit Logs
- **실행 환경:** B
- **테스터 역할:** QA-SUPER
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 직전 admin create/update/delete를 수행한다.
2. 2. Audit logs에서 actor/action/target/filter/page를 확인한다.

#### 기대 결과

기대 action이 1회 기록되고 권한 없는 사용자는 audit data를 볼 수 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-022 — 관리자 계정/권한

- **구역:** Admin Accounts
- **실행 환경:** B
- **테스터 역할:** QA-SUPER
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. test admin을 생성/role 변경/deactivate한다.
2. 2. 해당 계정으로 로그인한다.

#### 기대 결과

역할 변경이 즉시 적용되고 deactivated account는 접근 불가하다. 마지막 super_admin 보호 정책이 작동한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-023 — retention 대상 확인

- **구역:** Retention
- **실행 환경:** B
- **테스터 역할:** QA-SUPER
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. Retention 화면에서 만료 QA record를 찾는다.
2. 2. preview/filter를 조작한다.

#### 기대 결과

대상·보유기간·file count·상태가 DB 실제 값과 일치하고 일반 editor는 접근할 수 없다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-024 — 수동 삭제/복구

- **구역:** Retention
- **실행 환경:** L/S
- **테스터 역할:** QA-SUPER
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. 전용 expired QA record를 선택한다.
2. 2. confirmation 후 삭제한다.
3. 3. R2/DB/audit/retry 상태를 확인한다.

#### 기대 결과

authorized deletion만 수행되고 R2+DB가 일관되며 partial failure는 retry/recovery 상태로 남는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### ADM-025 — Preview enter/exit

- **구역:** Preview
- **실행 환경:** B
- **테스터 역할:** QA-EDITOR
- **사전 조건:** 없음

#### 클릭·입력·확인 절차

1. 1. preview mode에 진입한다.
2. 2. draft content를 확인한다.
3. 3. exit 후 direct preview URL을 연다.

#### 기대 결과

authorized session에서만 preview가 보이고 exit/expiry 뒤 draft가 public에 노출되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 스크린샷/영상 URL, API 응답, Sentry event ID, DB/R2 확인값 중 해당 증거 기록
- **결함 ID / 메모:**

---

### UI-FLOW-130 — 사이드바 접기·펴기와 현재 메뉴

- **구역:** 관리자 공통
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 관리자 로그인

#### 클릭·입력·확인 절차

1. 사이드바 접기/펴기를 누른다.
2. 각 주요 메뉴로 이동한다.

#### 기대 결과

사이드바 폭·툴팁·아이콘·현재 메뉴 표시가 정확하고, 접힌 상태에서도 키보드와 화면 판독기로 메뉴를 식별할 수 있다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-131 — 사이드바 그룹 아코디언

- **구역:** 관리자 공통
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 관리자 로그인

#### 클릭·입력·확인 절차

1. 운영 현황, 접수함, 서비스 관리, 시스템, 아티스트 그룹을 차례로 열고 닫는다.

#### 기대 결과

각 그룹의 aria-expanded와 하위 메뉴가 동기화되고, 현재 화면을 포함한 그룹은 탐색 가능하다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-132 — 관리자 검색 열기·결과·키보드·닫기

- **구역:** 관리자 공통
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 검색 결과가 있는 데이터

#### 클릭·입력·확인 절차

1. 검색창에 페이지·아티스트·콘텐츠 키워드를 입력한다.
2. 화살표·Enter로 결과를 선택하고 Escape/닫기 버튼을 누른다.

#### 기대 결과

관련 결과가 그룹화되어 나타나고 선택한 결과로 이동한다. 빈 검색·0건·닫기 상태가 정상이며 결과 overlay에 포커스가 갇히지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-133 — 관리자 로그아웃

- **구역:** 관리자 공통
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 관리자 로그인

#### 클릭·입력·확인 절차

1. 사이드바 로그아웃을 누른다.
2. 뒤로가기와 직접 /admin URL 접근을 시도한다.

#### 기대 결과

로그아웃 뒤 관리자 쉘·검색·데이터가 남지 않고 다시 인증이 요구된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-134 — 삭제 확인 모달

- **구역:** 관리자 공통
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN / QA-SUPERADMIN
- **사전 조건:** 삭제 가능한 QA 객체

#### 클릭·입력·확인 절차

1. 삭제 버튼을 눌러 모달을 연다.
2. 취소·배경/Escape·확인을 각각 수행한다.

#### 기대 결과

대상명·되돌릴 수 없음·권한 안내가 명확하다. 취소는 변경하지 않고, 확인은 한 번만 실행되며 포커스가 원래 트리거로 돌아온다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-135 — 초안 자동저장·수동 저장·새로고침 복구

- **구역:** 관리자 공통
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 편집 가능한 QA 객체

#### 클릭·입력·확인 절차

1. 필드를 수정한 뒤 자동저장을 기다린다.
2. 수동 저장 버튼을 누르고 새로고침한다.
3. 저장 중 네트워크 실패도 재현한다.

#### 기대 결과

저장 상태·시간·오류·재시도 안내가 분명하며, 성공 데이터만 복구된다. 실패 시 사용자가 입력한 값은 잃지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-136 — 관리자 온보딩 시작·목차·이전/다음·종료

- **구역:** 관리자 공통
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 온보딩 노출 상태

#### 클릭·입력·확인 절차

1. 온보딩 실행 버튼을 누른다.
2. 전체 둘러보기·목차·챕터·이전/다음·건너뛰기·나중에 이어보기를 수행한다.

#### 기대 결과

가이드 overlay가 현재 대상과 일치하고, 안전 모드·완료 상태·재개 위치가 정확하다. 종료 후 원래 작업 흐름이 손상되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-140 — 대시보드 카드·최근 항목·바로가기

- **구역:** 관리자 대시보드/분석
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 대시보드 데이터 존재

#### 클릭·입력·확인 절차

1. 대시보드 카드와 최근 항목의 모든 링크를 클릭한다.

#### 기대 결과

각 카드 수치·상태와 대상 목록이 일치하고, 바로가기가 정확한 관리 화면·필터로 이동한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-141 — 분석 기간 필터·접기/펼치기·지표 전환

- **구역:** 관리자 분석
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 분석 데이터 존재

#### 클릭·입력·확인 절차

1. 기간 옵션을 각각 누른다.
2. 설명/세부 영역을 접고 펴며 페이지뷰·방문자 지표를 전환한다.

#### 기대 결과

선택 기간·지표에 맞게 차트·표·링크가 갱신되고 0값/로딩/오류도 깨지지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-142 — Hero 앨범 카탈로그 선택·슬라이드 추가

- **구역:** 관리자 Hero
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 앨범 2개 이상

#### 클릭·입력·확인 절차

1. 카탈로그에서 앨범을 고르고 Hero 슬라이드 추가를 누른다.
2. 같은 앨범을 반복 추가한다.

#### 기대 결과

추가된 slide card의 메타·순서·기본값이 명확하고, 중복 정책이 정의대로 적용된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-143 — Hero slide 편집: 텍스트·색·이미지·타이포 로고

- **구역:** 관리자 Hero
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** Hero 슬라이드 1개 이상

#### 클릭·입력·확인 절차

1. 각 필드를 수정하고 이미지/로고를 바꾸며 저장·미리보기를 한다.

#### 기대 결과

입력 검증, 업로드 상태, 미리보기 배경·텍스트·색이 저장값과 일치한다. 잘못된 URL/파일은 저장되지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-144 — Hero 영상 clip 추가·편집·삭제

- **구역:** 관리자 Hero
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 영상 사용 가능한 QA 파일/URL

#### 클릭·입력·확인 절차

1. 영상 clip을 추가하고 시작 시각을 바꾼다.
2. 미리보기 후 삭제·취소를 각각 수행한다.

#### 기대 결과

영상·poster·시작 시각이 공개 홈에서 정책대로 재생되고, 삭제/취소가 남은 참조 없이 반영된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-145 — 콘텐츠 workbench 언어 탭·번역·미리보기

- **구역:** 관리자 콘텐츠/공지
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 편집 가능한 QA 콘텐츠

#### 클릭·입력·확인 절차

1. KO/EN/JA 탭을 전환한다.
2. 번역 버튼과 미리보기 버튼을 누른다.

#### 기대 결과

언어별 값이 섞이지 않고 번역 결과는 검토 가능한 초안으로 들어간다. 미리보기는 실제 공개 렌더와 일치한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-146 — Rich text 서식·링크·붙여넣기·저장

- **구역:** 관리자 콘텐츠/공지
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 편집 가능한 QA 공지

#### 클릭·입력·확인 절차

1. 굵게·목록·링크·문단을 적용하고 서식 있는 텍스트를 붙여넣는다.
2. 저장 후 공개 상세로 확인한다.

#### 기대 결과

툴바 상태와 편집 결과가 일치하고, 불허 마크업/URI는 무해화된다. 저장 후 형식이 의도대로 유지된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-147 — 공지 생성·카테고리·게시·목록 필터·삭제

- **구역:** 관리자 공지
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 공지 관리 권한

#### 클릭·입력·확인 절차

1. 새 공지를 만들고 카테고리를 입력/선택한다.
2. draft/published 상태를 바꾸고 목록 필터·정렬에서 찾는다.
3. 삭제는 취소 후 다시 확정한다.

#### 기대 결과

상태·카테고리·게시일·공개 노출이 일관되고, 목록과 상세가 즉시/정의된 갱신 주기로 반영된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-148 — 프로필 wizard·context rail·섹션 저장

- **구역:** 관리자 아티스트 프로필
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 아티스트 1명 이상

#### 클릭·입력·확인 절차

1. context rail에서 섹션을 바꾼다.
2. wizard 다음/이전·필수값·저장을 수행한다.

#### 기대 결과

현재 섹션·진행도·검증이 일치하고, 저장값이 공개 artist 화면에 반영된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-149 — 멤버 library·신규/수정·정렬·삭제

- **구역:** 관리자 아티스트 멤버
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 멤버 2명 이상

#### 클릭·입력·확인 절차

1. 멤버를 선택해 수정한다.
2. 신규 생성·정렬 변경·삭제 취소/확정을 수행한다.

#### 기대 결과

library/identity/editor 값이 동기화되고 공개 멤버 scene 순서·내용과 일치한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-150 — 앨범 context rail·bulk modal·트랙 섹션

- **구역:** 관리자 아티스트 디스코그래피
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 앨범/트랙 QA 데이터

#### 클릭·입력·확인 절차

1. 앨범을 선택한다.
2. bulk modal을 열어 추가/수정/취소한다.
3. 트랙을 추가·정렬·삭제하고 저장한다.

#### 기대 결과

앨범·트랙 수·순서·메타·외부 링크·공개 player가 일치한다. 모달 취소는 변경을 남기지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-151 — 스케줄 library·calendar·이벤트 생성/수정/삭제

- **구역:** 관리자 아티스트 스케줄
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 스케줄 QA 데이터

#### 클릭·입력·확인 절차

1. calendar에서 날짜를 고른다.
2. 이벤트의 제목·기간·카테고리·외부 링크를 저장한다.
3. 수정·삭제·취소를 수행한다.

#### 기대 결과

calendar marker·library·공개 달력/목록이 동일한 이벤트를 보여주고, 기간 경계·timezone이 어긋나지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-152 — scene canvas 포인트와 트랙 관리

- **구역:** 관리자 아티스트 Scene/Tracks
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** scene와 트랙 데이터

#### 클릭·입력·확인 절차

1. scene 배경에서 멤버 포인트를 생성·이동·선택·삭제한다.
2. tracks 페이지에서 트랙 메타·오디오·링크를 수정한다.

#### 기대 결과

canvas 좌표·선택·공개 hotspot이 일치하며 트랙 편집 내용이 공개 player/외부 링크에 정확히 반영된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-153 — 캠페인 목록 생성·상태·필터

- **구역:** 관리자 오디션
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 오디션 관리 권한

#### 클릭·입력·확인 절차

1. 캠페인을 생성하고 draft/open/closed 상태를 전환한다.
2. 목록에서 검색·필터·편집·삭제를 수행한다.

#### 기대 결과

캠페인 상태가 공개 목록·지원 가능 여부와 일치하고, 삭제/상태 변경은 감사된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-154 — 캠페인 builder 질문 추가·유형·순서·필수

- **구역:** 관리자 오디션
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 편집 가능한 QA 캠페인

#### 클릭·입력·확인 절차

1. 질문을 추가하고 텍스트·선택·체크·파일 타입을 바꾼다.
2. 옵션, 필수 여부, 순서를 수정한 뒤 preview한다.

#### 기대 결과

builder 목록·settings·preview가 동일한 질문 순서·라벨·필수 규칙을 보여 주며 공개 폼과 일치한다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-155 — 지원서 review 상세·상태 변경·첨부 접근

- **구역:** 관리자 오디션
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** QA 지원서 1건 이상

#### 클릭·입력·확인 절차

1. 지원서를 열어 답변·첨부·상태 action을 확인한다.
2. 상태를 바꾸고 목록으로 돌아간다.

#### 기대 결과

개인정보와 파일은 권한 있는 관리자에게만 보이고, 상태 변경·메모·감사 로그가 정확히 반영된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-156 — 문의·신고 목록 필터·상세·상태 처리

- **구역:** 관리자 문의/보호
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN
- **사전 조건:** QA 문의·신고 데이터

#### 클릭·입력·확인 절차

1. 목록 검색/필터를 적용한다.
2. 행을 열어 상세·첨부·상태 변경·뒤로가기를 수행한다.

#### 기대 결과

목록 집계와 상세 데이터가 일치하며, 처리 상태 변경이 중복 없이 반영되고 민감정보는 최소로 표시된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-157 — 감사 로그 필터·행 상세·페이지 이동

- **구역:** 관리자 감사 로그
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN / QA-SUPERADMIN
- **사전 조건:** 감사 로그 데이터

#### 클릭·입력·확인 절차

1. 행위자·대상·기간 필터를 적용한다.
2. 행을 열고 상세·이전/다음 페이지를 확인한다.

#### 기대 결과

필터 결과·페이지 수·상세 payload가 일치하고, 역할에 따라 필요한 최소 로그만 표시된다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-158 — 보존 현황·수동 삭제·권한별 UI

- **구역:** 관리자 보존기간
- **실행 환경:** S/P
- **테스터 역할:** QA-ADMIN / QA-SUPERADMIN
- **사전 조건:** 만료/비만료 QA 데이터

#### 클릭·입력·확인 절차

1. 각 역할로 retention 화면을 연다.
2. super_admin으로만 수동 삭제 확인 절차를 진행한다.

#### 기대 결과

일반 admin은 삭제 제어를 보거나 실행할 수 없고, super_admin의 대상·카운트·확인 결과가 정확하다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-159 — 사업자/브랜드 자산 필드와 이미지 관리

- **구역:** 관리자 설정
- **실행 환경:** S
- **테스터 역할:** QA-ADMIN
- **사전 조건:** 설정 편집 권한

#### 클릭·입력·확인 절차

1. 회사 정보·로고·아바타/브랜드 이미지를 수정·업로드·제거·저장한다.

#### 기대 결과

필수값·파일 검증·미리보기·공개 header/footer 반영이 정확하고, 제거한 자산 링크가 남지 않는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

### UI-FLOW-160 — 관리자 계정 목록·역할 변경·초대/비활성화

- **구역:** 관리자 설정
- **실행 환경:** S/P
- **테스터 역할:** QA-SUPERADMIN
- **사전 조건:** 관리자 계정 QA 데이터

#### 클릭·입력·확인 절차

1. 계정 목록을 열고 역할 변경·비활성화 또는 초대 동작을 수행한다.
2. 변경 대상 계정으로 다시 로그인해 메뉴·권한을 확인한다.

#### 기대 결과

권한 변경은 승인된 역할만 실행하며, 변경 뒤 접근 범위가 즉시/정의된 갱신 시점에 정확히 바뀌고 감사 로그가 남는다.

#### 결과 기록

- **결과:** [ ] PASS  [ ] FAIL  [ ] BLOCKED  [ ] NOT RUN  [ ] N/A
- **증거:** 전체 화면, 동작 전후 화면, 오류 메시지 또는 Network 응답을 캡처한다.
- **결함 ID / 메모:**

---

## 완료 기준

각 케이스에 `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`, `N/A` 중 하나를 표시하고, `FAIL` 또는 `BLOCKED`는 반드시 증거와 결함 ID/차단 사유를 연결한다.
