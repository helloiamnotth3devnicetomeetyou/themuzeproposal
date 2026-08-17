# Contributing

코드 스타일, 아키텍처, 보안 규칙은 [docs/technical/README.md](./docs/technical/README.md)를 따른다. 이 문서는 변경 시 문서를 어디까지 같이 갱신해야 완료로 보는지(Definition of Done)만 다룬다.

## 문서 갱신 Definition of Done

아래 변경을 했다면, 코드/migration PR과 **같은 PR**에서 관련 문서도 갱신한다. 별도 후속 PR로 미루지 않는다.

| 바꾼 것 | 같이 갱신할 문서 |
| --- | --- |
| DB 테이블/컬럼/관계 추가·변경 | [docs/reference/database-schema.md](./docs/reference/database-schema.md), 관련 있으면 [docs/reference/content-data-model.md](./docs/reference/content-data-model.md) |
| RLS policy, `is_admin()`/`is_super_admin()`/역할 관련 함수·grant | [docs/reference/permissions-matrix.md](./docs/reference/permissions-matrix.md), [docs/technical/04-security.md](./docs/technical/04-security.md), 관련 [docs/qa/](./docs/qa/) 파일 |
| 새 환경 변수 추가/제거, 필수 여부 변경 | `.env.example`, [docs/reference/environment-variables.md](./docs/reference/environment-variables.md), 필요하면 [docs/technical/04-security.md](./docs/technical/04-security.md)의 환경/secret 표 |
| 새 보호 URL, 인증/CSRF/rate-limit 로직 변경 | [docs/technical/04-security.md](./docs/technical/04-security.md), 관련 [docs/qa/01_SECURITY_ACCESS_FILE_QA.md](./docs/qa/01_SECURITY_ACCESS_FILE_QA.md) |
| `src/core`에 새 공유 모듈 추가 | [docs/technical/02-architecture.md](./docs/technical/02-architecture.md)의 모듈 표 |
| 새 외부 서비스 연동(현재: Supabase, R2, Turnstile, OpenRouter, Vercel Analytics, Sentry) | [docs/technical/README.md](./docs/technical/README.md)의 권한/소유자 확인 표, [docs/reference/environment-variables.md](./docs/reference/environment-variables.md), 장애 시 확인할 화면이면 [docs/technical/10-incident-runbook.md](./docs/technical/10-incident-runbook.md) |
| 사용자 흐름(제출, 업로드, 관리자 화면) 변경 | 해당 [docs/qa/](./docs/qa/) 파일의 케이스, 필요하면 새 케이스 추가 |
| 새 UI 컴포넌트/디자인 토큰 | [docs/reference/design-system.md](./docs/reference/design-system.md) 또는 `design-tokens.json`, 관련 [docs/qa/](./docs/qa/) UI 파일 |

## 원칙

- 문서를 바꾼 파일에는 기준일(있는 경우)과 실제 검증 명령을 함께 갱신한다.
- secret 값, 실제 도메인, 사용자 데이터, 개인 연락처는 문서에 넣지 않는다 — 참조(어디서 확인하는지)만 남긴다.
- 문서와 실제 코드/migration이 어긋나면 코드/migration이 정본이다. 문서는 그쪽에 맞춰 고친다.
- 새 문서를 추가하면 [docs/README.md](./docs/README.md)의 문서 지도 표에 링크를 추가한다. 링크 없는 문서는 없는 것과 같다.

## PR 전 최소 확인

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

DB나 RLS를 바꿨다면 Docker 실행 후 `npm run db:test`도 실행한다. 자세한 절차는 [docs/technical/README.md](./docs/technical/README.md#변경배포-인수-절차)를 따른다.
