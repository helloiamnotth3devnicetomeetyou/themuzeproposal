# 권한 매트릭스

> 기준: `profiles.role` 정의와 RLS policy(`supabase/migrations/`), [technical/04-security.md](../technical/04-security.md), [database-schema.md](./database-schema.md)

역할은 코드/DB 전체에서 세 가지뿐이다: `null`(일반 사용자), `editor`, `super_admin`. "staff" 같은 중간 역할은 존재하지 않는다. `service_role`은 사람이 아니라 서버 route가 RLS를 우회할 때만 쓰는 DB 레벨 키다.

이 표는 방향을 빠르게 확인하는 참고용이다. 실제 강제 지점은 항상 Postgres RLS/constraint/function이며, 정책이 바뀌면 이 표도 같은 커밋에서 갱신한다([CONTRIBUTING.md](../../CONTRIBUTING.md) 참고).

기호: R=read, C=create, U=update, D=delete, P=publish(공개 상태 전환), — =해당 없음/불가능.

## 공개 콘텐츠 (artists, albums, tracks, artist_gallery/scenes/schedules, notices, home_hero_slides, avatar_assets, site_settings)

| 리소스 | 익명/공개 (anon) | 일반 사용자 (`null`) | `editor` | `super_admin` |
| --- | --- | --- | --- | --- |
| 공개 콘텐츠 조회 | R (활성·공개 조건 충족 시만) | R (anon과 동일) | R | R |
| 콘텐츠 생성/수정 | — | — | C, U | C, U |
| 콘텐츠 삭제 | — | — | D (일부는 비활성화 우선 권장) | D |
| 공개 상태 전환(publish) | — | — | P | P |
| `site_settings` 조회/수정 | R (공개 허용 key만) | R | R, U | R, U |

## 계정 (profiles, admin_onboarding_progress, admin_audit_logs)

| 리소스 | 일반 사용자 | `editor` | `super_admin` |
| --- | --- | --- | --- |
| 자기 profile 조회/수정 | R, U (role 필드 제외) | R, U (role 필드 제외) | R, U |
| 타인 profile 조회 | — | — | R |
| 관리자 role 부여/해제 | — | — | U (단, 자기 자신과 마지막 super_admin 강등 금지) |
| `admin_onboarding_progress` | — | 자기 것만 R, U | R, U |
| `admin_audit_logs` 조회 | — | — | R (append-only, D 없음) |

`/api/admin/accounts`는 자기 역할 변경, 마지막 super_admin 강등, 존재하지 않는 대상 변경, editor의 계정 관리 접근을 서버에서 추가로 막는다([04-security.md](../technical/04-security.md#권한) 참고).

## 오디션 (audition_campaigns, audition_form_fields, audition_submissions, auditions)

| 리소스 | 일반 사용자 | `editor` | `super_admin` |
| --- | --- | --- | --- |
| 캠페인 조회(공개 기간) | R | R | R |
| 캠페인 생성/수정/삭제 | — | C, U, D | C, U, D |
| 본인 제출 생성 | C | C | C |
| 본인 제출 조회 | R (`get_my_audition_submissions()`만) | R | R |
| 전체 제출 조회/심사 | — | R, U (`get_admin_audition_submissions()`) | R, U |
| 제출 삭제 | — | — | D |

## 문의와 Protect (contact_inquiries, protect_reports, protect_report_attachments)

| 리소스 | 일반 사용자 | 로그인 사용자(Protect) | `editor` | `super_admin` |
| --- | --- | --- | --- | --- |
| 문의(`contact_inquiries`) 생성 | C (서버 route 경유) | C | C | C |
| 문의 조회/답변 | — | — | R, U | R, U |
| Protect 신고 생성 | — | C (로그인 필수) | C | C |
| 본인 Protect 신고 조회 | — | R (본인 것만) | R (전체) | R (전체) |
| Protect 신고 처리/답변 | — | — | R, U | R, U |
| 첨부파일(contact/protect) 조회 | — | R (본인 소유 신고에 한함) | R | R |
| 문의/신고 삭제(수동) | — | — | — | D (`retention` 관련 RPC 경유) |

## Retention 삭제 (retention_deletion_jobs, contact_inquiries/protect_reports의 30일 자동 삭제)

| 작업 | 일반 사용자/editor | `super_admin` | 시스템(Vercel cron + service role) |
| --- | --- | --- | --- |
| 자동 30일 retention 삭제 실행 | — | — | 실행(사람 개입 없음, `CRON_SECRET` 인증) |
| retention 실패 job 재시도(`retry_retention_deletion`) | — | 실행 (`p_actor_id`가 super_admin이어야 함) | 실행 가능(내부 job) |
| retention 최종 삭제(`finalize_retention_deletion`) | — | 실행 (super_admin 검증) | 실행 가능(내부 job) |
| 수동 개별 삭제(manual submission deletion) | — | 실행 | — |

`retention_deletion_jobs` 테이블 자체는 `public`/`anon`/`authenticated`에 권한이 전혀 없다(`revoke all`) — 오직 `service_role`만 접근한다. 사람은 이 테이블을 직접 건드리지 않고 RPC를 통해서만 상태를 바꾼다.

## Storage bucket

| Bucket | anon | 로그인 사용자 | `editor`/`super_admin` |
| --- | --- | --- | --- |
| `artist-assets`, `album-covers`, `track-assets`, `business-assets` (공개) | R | R | R, C, U, D |
| `contact-attachments`, `protect-evidence` (비공개) | — | R (본인 소유 신고 첨부만, route 경유) | R, C, D |
| `audition-attachments` (비공개) | — | C (본인 제출 시), R (본인 것만, route 경유) | R, D |

브라우저는 어떤 bucket에서도 path를 직접 정하지 않는다. 서버가 매 요청마다 bucket, path, 크기, signature, 확장자를 검증한다([04-security.md](../technical/04-security.md#파일-업로드)).

## AI 기능 (classify-inquiry, translate-admin-content)

| 기능 | 트리거 주체 | 사람이 직접 호출 가능한가 |
| --- | --- | --- |
| 문의/신고 분류 | 제출 성공 후 서버가 자동 실행 | 아니오 — 사용자/관리자 액션이 아님 |
| 관리자 콘텐츠 번역 보조 | `editor`/`super_admin`이 관리자 UI에서 트리거 | 예 — 관리자 role 확인 후 |

두 기능 모두 `OPENROUTER_API_KEY` 부재/실패 시 `null`을 반환하며 호출부가 이를 실패로 처리하고 기존 흐름(제출, 저장)은 계속 성공한다. 이 매트릭스에서 "권한"은 실행 트리거 주체를 뜻하며, 실패해도 데이터 접근 권한 자체에는 영향이 없다.

## 표 갱신 규칙

RLS policy, `is_admin()`/`is_super_admin()`/`has_admin_role()` 함수, 또는 role 관련 API 검증을 바꾸는 migration에는 이 표의 해당 행을 같은 PR에서 갱신한다. 이 표와 실제 policy가 어긋나면 이 표가 아니라 migration/policy가 정본이다.
