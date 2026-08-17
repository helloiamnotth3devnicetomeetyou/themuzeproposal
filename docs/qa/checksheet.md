# QA 실행 요약표

각 QA 파일을 실행할 때마다 아래 표에 한 행을 추가한다(파일별 최신 실행만 유지, 이전 실행은 git history로 추적). 개별 케이스 결과는 각 QA 파일 안에 기록하고, 여기는 "언제 누가 어디까지 돌렸는지"만 요약한다.

| 파일 | 최근 실행일 | 실행자 | 대상 환경 | 결과 | 미해결 결함 ID |
| --- | --- | --- | --- | --- | --- |
| [01_SECURITY_ACCESS_FILE_QA.md](01_SECURITY_ACCESS_FILE_QA.md) | — | — | — | — | — |
| [02_PUBLIC_ACCOUNT_QA.md](02_PUBLIC_ACCOUNT_QA.md) | — | — | — | — | — |
| [03_INTAKE_PROTECT_AUDITION_QA.md](03_INTAKE_PROTECT_AUDITION_QA.md) | — | — | — | — | — |
| [04_ADMIN_CMS_QA.md](04_ADMIN_CMS_QA.md) | — | — | — | — | — |
| [05_OPERATIONS_PRODUCTION_QA.md](05_OPERATIONS_PRODUCTION_QA.md) | — | — | — | — | — |
| [06_UI_ATOMS_PUBLIC_ACCOUNT.md](06_UI_ATOMS_PUBLIC_ACCOUNT.md) | — | — | — | — | — |
| [07_UI_ATOMS_INTAKE.md](07_UI_ATOMS_INTAKE.md) | — | — | — | — | — |
| [08_UI_ATOMS_ADMIN_COMMON.md](08_UI_ATOMS_ADMIN_COMMON.md) | — | — | — | — | — |
| [09_UI_ATOMS_ADMIN_ARTIST_AUDITION.md](09_UI_ATOMS_ADMIN_ARTIST_AUDITION.md) | — | — | — | — | — |

값이 없는 행은 아직 이 분리형 QA 세트로 실행한 적이 없다는 뜻이다(공란을 "통과"로 해석하지 않는다). 실행 후 결과는 `PASS` / `FAIL` / `BLOCKED` / `PARTIAL(n/총)` 중 하나로 남기고, `FAIL`/`BLOCKED`가 있으면 결함 ID를 [README.md](README.md)의 추적 규칙대로 적는다.

release 전 최소 기준은 `01`을 Staging에서 `PASS`로 만드는 것이다([README.md](README.md#권장-실행-순서) 참고).
