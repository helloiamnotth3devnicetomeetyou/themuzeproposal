# 데이터 보존 운영

애플리케이션은 문의(`contact_inquiries`)와 Protect 신고(`protect_reports`)를 `created_at` 기준 30일간 보존한다. Vercel cron이 `vercel.json` 설정에 따라 매일 UTC 03:00에 `/api/admin/retention/cron`을 호출한다.

Vercel production과 preview 환경 모두에 서로 다른, 32자 이상의 무작위 `CRON_SECRET`을 설정한다. Vercel은 이를 `Authorization: Bearer <secret>` 헤더로 보내며, 이 route는 브라우저 세션이나 cross-origin 요청을 허용하지 않는다. 이 secret이 없으면 production/preview Vercel 환경 검증이 실패한다.

작업은 실행당 최대 25건을 처리한다. DB row를 예약(reserve)하고, 연결된 비공개 R2 객체를 삭제한 뒤, DB 삭제를 확정(finalize)한다. R2나 DB 실패는 다음 실행에서 재시도 가능한 상태로 기록된다. 응답에는 안전한 개수와 candidate ID만 담기며, 요청/응답 로그에 문의 본문, 신고 증빙, secret 값이 절대 남지 않아야 한다.

2단계 삭제 상태는 `retention_deletion_jobs` 테이블(`kind`, `record_id`가 PK)에 기록된다. 실패한 job의 재시도(`retry_retention_deletion`)와 최종 확정(`finalize_retention_deletion`) RPC는 `super_admin`으로 검증된 actor만 사람이 직접 호출할 수 있고, 평소에는 cron이 service role로 실행한다. 테이블 자체는 `public`/`anon`/`authenticated`에 아무 권한도 없다. 자세한 권한은 [permissions-matrix.md](../reference/permissions-matrix.md), 장애 시 확인할 화면은 [10-incident-runbook.md](./10-incident-runbook.md#1-증상--확인할-화면)를 참고한다.
