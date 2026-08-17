# The Muze 분리형 QA 파일 인덱스

> **케이스 기준 코드 커밋:** `0d79efb18de637d02ce210464a1d340ba9294def` (이 커밋 시점의 동작을 기준으로 케이스를 작성했다. 이후 문서 정리·링크 수정 커밋은 케이스 내용에 영향을 주지 않는다 — 코드가 이 커밋 이후 바뀐 부분이 있으면 케이스를 갱신해야 한다는 뜻이다.)  
> 원본 통합 마스터 문서 `THEMUZE_MASTER_UI_FUNCTION_SECURITY_QA.md`의 772건을 실행 목적과 화면 영역 기준으로 분리했다.

| 파일 | 케이스 수 | 언제 실행하는가 |
| --- | ---: | --- |
| [01_SECURITY_ACCESS_FILE_QA.md](01_SECURITY_ACCESS_FILE_QA.md) | 45 | 릴리스 전 보안 게이트 |
| [02_PUBLIC_ACCOUNT_QA.md](02_PUBLIC_ACCOUNT_QA.md) | 93 | 공개 UI·계정 회귀 |
| [03_INTAKE_PROTECT_AUDITION_QA.md](03_INTAKE_PROTECT_AUDITION_QA.md) | 30 | 접수/지원 흐름 회귀 |
| [04_ADMIN_CMS_QA.md](04_ADMIN_CMS_QA.md) | 53 | CMS 기능 회귀 |
| [05_OPERATIONS_PRODUCTION_QA.md](05_OPERATIONS_PRODUCTION_QA.md) | 19 | 배포 직후 Production 스모크 |
| [06_UI_ATOMS_PUBLIC_ACCOUNT.md](06_UI_ATOMS_PUBLIC_ACCOUNT.md) | 120 | 공개·계정 UI 완전 점검 |
| [07_UI_ATOMS_INTAKE.md](07_UI_ATOMS_INTAKE.md) | 49 | 접수·오디션 UI 완전 점검 |
| [08_UI_ATOMS_ADMIN_COMMON.md](08_UI_ATOMS_ADMIN_COMMON.md) | 236 | 관리자 공통 UI 완전 점검 |
| [09_UI_ATOMS_ADMIN_ARTIST_AUDITION.md](09_UI_ATOMS_ADMIN_ARTIST_AUDITION.md) | 127 | 아티스트·오디션 관리 UI 완전 점검 |
| **합계** | **772** | 원본 마스터 문서와 동일한 전체 범위 |

## 권장 실행 순서

1. `01_SECURITY_ACCESS_FILE_QA.md`를 먼저 Staging에서 실행한다.
2. 일반 회귀는 `02` → `03` → `04` 순서로 진행한다.
3. 배포 직후에는 `05_OPERATIONS_PRODUCTION_QA.md`를 실행한다.
4. UI를 전수 확인할 때만 `06` → `07` → `08` → `09`를 실행한다.

> 각 파일의 `FAIL`/`BLOCKED`는 같은 결함 ID를 써서 추적한다. 원본 마스터 파일은 전체 추적용으로 그대로 보관한다.
