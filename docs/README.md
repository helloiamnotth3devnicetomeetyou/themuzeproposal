# THE MUZE 문서

이 폴더의 기준일은 2026-08-17입니다. 문서는 현재 코드와 설정을 설명하며, 실제 동작의 최종 기준은 `src/`, `supabase/migrations/`, `.github/workflows/`, `package.json`입니다.

## 빠른 시작

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

변경 전 확인:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

DB나 RLS를 바꿨다면 Docker가 실행된 상태에서 `npm run db:test`도 실행합니다.

## 문서 지도

| 문서 | 용도 |
| --- | --- |
| [technical/README.md](./technical/README.md) | 개발자 인수인계와 문서 읽는 순서 |
| [technical/01-project-overview.md](./technical/01-project-overview.md) | 제품 범위, URL, API, 저장소 구조 |
| [technical/02-architecture.md](./technical/02-architecture.md) | `src/app`·`src/public`·`src/admin`·`src/core` 구조 |
| [technical/03-data-and-supabase.md](./technical/03-data-and-supabase.md) | 테이블, RLS, Storage, migration |
| [technical/04-security.md](./technical/04-security.md) | 인증, 권한, 입력, 업로드, rate limit |
| [technical/05-frontend-and-design.md](./technical/05-frontend-and-design.md) | CSS, 디자인 토큰, 반응형, 접근성, 다국어 |
| [technical/06-code-style-and-workflows.md](./technical/06-code-style-and-workflows.md) | 코드 작성과 기능별 작업 절차 |
| [technical/07-testing-and-operations.md](./technical/07-testing-and-operations.md) | 테스트, CI, 배포, 장애 확인 |
| [technical/08-admin-analytics.md](./technical/08-admin-analytics.md) | 관리자 통계 설정, 권한, API, 장애 처리 |
| [technical/09-retention-operations.md](./technical/09-retention-operations.md) | 데이터 보존·정리 운영 절차 |
| [technical/10-incident-runbook.md](./technical/10-incident-runbook.md) | 장애 시 확인할 화면과 escalation 기준 |
| [qa/README.md](./qa/README.md) | 분리형 QA 케이스 인덱스와 실행 순서 |
| [qa/checksheet.md](./qa/checksheet.md) | QA 실행 요약표(누가 언제 어디까지 돌렸는지) |
| [reference/content-data-model.md](./reference/content-data-model.md) | 콘텐츠 도메인과 테이블 관계 참고 |
| [reference/database-schema.md](./reference/database-schema.md) | 실제 DB 스키마, 관계도, RLS, Storage, migration |
| [reference/environment-variables.md](./reference/environment-variables.md) | 환경 변수·외부 서비스 매트릭스(값 제외) |
| [reference/permissions-matrix.md](./reference/permissions-matrix.md) | 역할별 리소스 권한 매트릭스 |
| [reference/design-system.md](./reference/design-system.md) | 브랜드·컴포넌트 디자인 원칙 |
| [reference/design-system.html](./reference/design-system.html) | 브라우저에서 보는 인터랙티브 디자인 시스템 |
| [reference/design-tokens.json](./reference/design-tokens.json) | 디자인 토큰 참고값 |
| [archive/rebuild01-build-cost-estimate-2026-08-02.md](./archive/rebuild01-build-cost-estimate-2026-08-02.md) | 날짜가 있는 과거 산정 자료 |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | 변경 시 문서를 어디까지 갱신해야 하는지(DoD) |

## 기준 우선순위

1. 실행 코드와 테스트
2. `supabase/migrations/`의 timestamp migration
3. `package.json`, 환경 검증 스크립트, CI 설정
4. 이 문서와 나머지 참고 문서

`supabase/schema.remote.sql`은 `npm run db:dump`로 만드는 스냅샷입니다. 직접 편집하지 말고, 운영 적용 여부는 `npm run db:status`로 확인합니다.

문서를 바꿀 때는 기준일과 실제 검증 명령을 함께 갱신합니다. 비밀값, 사용자 데이터, `.env.local` 값은 문서와 커밋에 넣지 않습니다.
