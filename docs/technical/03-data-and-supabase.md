# 데이터와 Supabase

전체 관계도와 도메인별 설명은 [reference/database-schema.md](../reference/database-schema.md)를 함께 본다. 이 문서는 코드를 바꿀 때 필요한 구현 세부사항을 우선한다.

## client 선택

| 함수/객체 | 자격 | 사용처 |
| --- | --- | --- |
| `supabase` (`core/supabase/client.ts`) | anon + browser session | Client Component, 일반 사용자·관리자 RLS 작업 |
| `createSupabaseServerClient()` | anon + request cookie | Server Component/Route Handler의 사용자 세션·RLS 작업 |
| 공개 server/repository client | anon, session 비저장 | 공개 캐시 가능한 조회 |
| `createServiceRoleClient()` | service role, RLS 우회 | 검증된 서버 route의 제한된 DB 관리·제출 작업 |

Service role client가 `null`일 수 있으므로 route는 `503 SERVICE_UNAVAILABLE`로 실패해야 한다. 클라이언트 bundle에 service key가 들어가는 import 구조는 금지한다.

## 외부 운영 데이터

관리자 페이지 통계는 Supabase 테이블이나 R2에 원본 방문 데이터를 복제하지 않는다. 인증된 관리자가 `/api/admin/page-stats`를 요청할 때만 Vercel Web Analytics API를 조회해 화면용 집계 DTO로 변환한다.

- 방문자 식별자, 원본 IP, 개별 이벤트는 이 저장소의 DB에 저장하지 않는다.
- API token과 Vercel project ID는 서버 환경 변수로만 읽고, 브라우저나 Supabase 설정에 저장하지 않는다.
- 콘텐츠·사용자·감사 로그의 RLS와 별개로, endpoint 자체가 Supabase session과 `profiles.role`을 확인한다.
- 방문 데이터 보존 기간과 세부 차원은 Vercel의 제품·요금제 정책을 따른다. DB migration으로 기간을 바꾸는 기능이 아니다.

## 핵심 데이터 모델

### 콘텐츠 그래프

```text
artists
 ├─ artist_members
 ├─ artist_gallery ──────── optional album/member
 ├─ artist_scenes ───────── artist_scene_members ── artist_members
 ├─ artist_schedules
 ├─ notices
 ├─ avatar_assets ───────── profiles.avatar_asset_id
 └─ albums ──────────────── tracks
       └─────────────────── home_hero_slides

site_settings (key/value JSON)
```

- `artists.slug`, member slug가 공개 URL을 구성한다. 활성 상태와 slug 변경은 기존 링크·SEO에 영향이 있다.
- 발행 콘텐츠는 보통 `is_published`와 `published_at`을 함께 사용한다. 미래 발행 row가 anon에게 보이지 않도록 RLS와 query 조건을 유지한다.
- `home_hero_slides`는 album을 참조하고 최대 7개를 sort order로 노출한다.
- `tracks.is_title`이 유일한 타이틀곡 flag다. 폐기된 `is_title_track`을 되살리지 않는다.
- 다국어 필드는 `_ko`, `_en`, `_ja` 또는 `*_i18n` JSON을 사용한다. canonical legacy 필드가 남아 있는 entity는 repository에서 fallback한다.
- `site_settings`는 `key text → value jsonb` 구조이며 `normalizeSiteSettings`가 런타임 형태를 만든다.

### 사용자와 민감 데이터

```text
auth.users ── profiles(role, avatar_asset_id)
     ├────── protect_reports ── protect_report_attachments
     ├────── contact_inquiries (user_id optional)
     ├────── audition_submissions
     └────── admin_onboarding_progress

admin_audit_logs (append-only 운영 변경 이력)
private.login_rate_limits
private.submission_rate_limits
```

- auth user 생성 trigger가 `profiles` row를 만든다. role 기본값은 `null`이다.
- `contact_inquiries`는 비로그인 제출을 허용하지만 서버 route와 RLS가 consent·user_id 형태를 제한한다.
- `protect_reports`는 로그인 사용자 소유이며 attachments는 private R2 object path를 참조한다.
- `admin_audit_logs`는 일반 콘텐츠는 변경값을, 문의·제보·지원서는 안전한 운영 필드만 기록한다.
- rate-limit identifier는 원문 이메일/IP/user id가 아니라 HMAC hash로 저장한다.

### 오디션

현재 두 세대의 구조가 공존한다.

- `auditions`: session/category-form 기반의 이전 동적 구조
- `audition_campaigns` + `audition_form_fields`: 현재 공개 builder/지원 흐름
- `audition_submissions`: legacy column과 현재 `campaign_id`, `answers`, `form_snapshot`, review field를 함께 보유

새 기능은 `audition_campaigns` 모델을 우선한다. `form_snapshot`은 지원 당시 질문을 보존하며, `answers`는 field key별 값 또는 파일 metadata다. 지원 이메일은 계정의 확인된 이메일과 일치해야 하며 DB에는 캠페인별 HMAC hash를 저장해 중복을 막는다. 사용자 자신의 조회는 제한된 RPC `get_my_audition_submissions()`를 사용해 심사 메모 등 관리자 전용 열 노출을 피한다.

### 실제 FK와 삭제 동작

| 자식 | FK | 삭제 동작 | 구현상 주의 |
| --- | --- | --- | --- |
| `albums` | `artist_id → artists.id` | CASCADE | 아티스트 삭제 시 앨범·곡·홈 슬라이드까지 연쇄 삭제 |
| `artist_members`, `artist_scenes`, `artist_schedules`, `avatar_assets` | `artist_id → artists.id` | CASCADE | 운영에서는 삭제보다 `is_active`/공개 상태 변경 우선 |
| `artist_gallery` | `artist_id` CASCADE, `member_id`/`album_id` SET NULL | 혼합 | gallery row 자체는 아티스트에 종속 |
| `artist_scene_members` | `scene_id`, `member_id` | CASCADE | scene 또는 멤버 삭제 시 배치 row 제거 |
| `tracks`, `home_hero_slides` | `album_id → albums.id` | CASCADE | 앨범 저장 RPC와 정렬 index를 함께 고려 |
| `notices` | `artist_id → artists.id` | CASCADE | null이면 전역 공지 |
| `profiles` | `id → auth.users.id` | CASCADE | auth user 삭제가 profile을 제거 |
| `profiles` | `avatar_asset_id → avatar_assets.id` | SET NULL | avatar 비활성화 trigger도 profile 참조를 정리 |
| `audition_form_fields` | `campaign_id → audition_campaigns.id` | CASCADE | 캠페인 삭제 시 동적 질문 제거 |
| `audition_submissions` | `campaign_id` RESTRICT, `audition_id`/user/reviewer SET NULL | 혼합 | 제출 이력이 있으므로 campaign 삭제 제한 |
| `protect_report_attachments` | `report_id → protect_reports.id` | CASCADE | 신고 삭제 시 metadata도 제거 |
| `protect_reports` | `artist_id` RESTRICT, `user_id` CASCADE | 혼합 | 신고 대상 아티스트 삭제를 DB가 차단 |
| `contact_inquiries` | user/answered_by SET NULL | SET NULL | 비로그인 문의와 담당자 삭제를 허용 |

### 테이블 핵심 column 계약

| 영역 | 필수 계약 |
| --- | --- |
| 공개 entity | `id uuid`, `created_at`, `updated_at`, 활성/발행 상태와 정렬 값 |
| 다국어 콘텐츠 | 기존 canonical `name`/`title`을 호환 유지하고 `*_ko`, `*_en`, `*_ja` fallback 사용 |
| URL | 외부 URL은 HTTP(S) check를 통과해야 하며, 내부 이동은 별도 relative path 규칙을 사용 |
| JSONB | `social_links`/options/form schema/answers는 `jsonb_typeof` check로 배열·객체 shape 고정 |
| 파일 metadata | path·name·size가 모두 있거나 모두 없어야 하며 route의 signature 검증 결과와 일치해야 함 |
| 상태값 | DB check constraint의 enum을 먼저 확인하고 UI에 임의 상태를 추가하지 않음 |

주요 상태값은 다음과 같다.

- `auditions.status`: `tba`, `open`, `closed`, `reviewing`, `done`
- `audition_submissions.status`: `pending`, `reviewing`, `accepted`, `rejected`
- `contact_inquiries.status`: `pending`, `reviewing`, `answered`, `closed`
- `protect_reports.status`: `pending`, `reviewing`, `resolved`, `rejected`
- `profiles.role`: `null`, `editor`, `super_admin`

### private schema: rate limit

`private.login_rate_limits`와 `private.submission_rate_limits`는 PostgREST 공개 대상이 아니다. `public` 함수가 HMAC으로 만든 identifier를 받아 원자적으로 window/count를 갱신한다.

| 테이블 | key | 용도 | 노출 규칙 |
| --- | --- | --- | --- |
| `private.login_rate_limits` | identifier hash, IP hash | 비밀번호 로그인 실패 제한 | public/anon/authenticated 직접 grant 금지 |
| `private.submission_rate_limits` | scope, key hash | 문의·Protect·오디션 제출 제한 | public/anon/authenticated 직접 grant 금지 |

비밀값이나 원문 이메일·IP를 저장하지 않는다. rate-limit table, RPC, secret 중 하나라도 없으면 route는 fail-open하지 않고 `503`을 반환한다.

### 서버가 호출하는 주요 RPC

| 함수 | 호출 경계 | 목적 |
| --- | --- | --- |
| `is_admin()`, `is_super_admin()`, `has_admin_role()` | RLS/policy와 서버 | 현재 auth user role 판정 |
| `consume_login_rate_limit()`, `reset_login_rate_limit()` | auth route | 로그인 실패 window 소비·성공 reset |
| `consume_submission_rate_limit()` | 공개 제출 route | scope별 제출 quota 원자 처리 |
| `get_my_audition_submissions()` | authenticated 사용자 | 관리자 전용 column을 제외한 본인 조회 |
| `get_admin_audition_submissions()` | admin | 캠페인 지원자 심사 projection |
| `save_album_with_tracks()` | admin editor | 앨범과 곡을 한 DB 작업으로 저장 |
| `save_avatar_assets()` | admin editor | avatar asset 정렬·삭제 저장 |
| `reorder_albums()` | admin editor | 아티스트 앨범 순서 변경 |

## Cloudflare R2 객체 저장소

논리 bucket은 R2의 두 물리 bucket 안에서 prefix로 분리된다. 공개 객체는 `R2_PUBLIC_BUCKET/<logical-bucket>/<path>`, 비공개 객체는 `R2_PRIVATE_BUCKET/<logical-bucket>/<path>`에 저장된다. DB는 URL 또는 object path만 보관하고, R2 접근 키는 서버에만 둔다.

코드에서 확인되는 논리 bucket 책임:

| bucket | 공개 여부/용도 | route 제한 |
| --- | --- | --- |
| `artist-assets` | 공개 아티스트 이미지·로고 | 관리자, 이미지 magic bytes |
| `album-covers` | 공개 앨범 이미지 | 관리자, 이미지 magic bytes |
| `track-assets` | 공개 커버/MP3 | 관리자, 서버 검증 업로드 |
| `business-assets` | 공개 press-kit.zip, profile.pdf만 | 관리자, 고정 path allowlist |
| `contact-attachments` | 비공개 문의 첨부 | PDF/PPT/PPTX |
| `protect-evidence` | 비공개 제보 증빙 | 이미지/GIF/PDF |
| `audition-attachments` | 비공개 지원 첨부 | 로그인 제출 API, 관리자 읽기 |

Supabase Storage policy는 R2 객체 접근에 적용되지 않는다. browser에서 임의 path로 직접 업로드하지 않고 서버 route가 bucket, path, 크기, signature, extension을 검증한다. 저장 파일명은 사용자 입력 대신 UUID와 검증된 extension을 사용하고 원래 이름은 metadata/DB에만 제한 길이로 저장한다. 예외인 hero video는 서버가 발급한 60초 서명 PUT URL로만 직접 업로드하며, 완료 후 서버가 크기·MIME·파일 시그니처를 다시 검증하고 `pending/` 객체를 공개 `clips/` 경로로 복사한다.

공개 URL은 `NEXT_PUBLIC_R2_PUBLIC_URL/<logical-bucket>/<path>` 형식이다. CSS `mask-image`처럼 R2 CDN CORS에 민감한 SVG는 `/api/asset-proxy?url=...`를 통해 같은 origin에서 읽는다. private object는 관리자 인증 후에만 짧은 만료의 서명 GET URL을 발급한다.

## RLS 원칙

- 모든 public business table은 RLS가 켜져 있다.
- anon은 활성·발행·공개 row만 읽는다.
- authenticated 일반 사용자는 자기 profile·제보·지원서의 제한된 projection만 읽거나 수정한다.
- `editor`와 `super_admin`은 `public.is_admin()`을 통해 콘텐츠를 관리한다.
- 관리자 계정 역할 변경은 `super_admin` 전용 서버 route와 policy를 통과한다.
- service role grant는 서버 작업에만 사용하며, route에서 사용자 권한을 먼저 확인한다.

새 테이블 migration에는 최소한 다음이 같이 있어야 한다.

1. PK/FK/check/unique/index
2. `updated_at` trigger가 필요한지 판단
3. RLS enable
4. 역할별 policy
5. 기본 grant/revoke
6. 민감 변경이면 audit trigger
7. `supabase/tests`의 허용/거부 테스트

## 마이그레이션 작업법

원격 linked project가 운영 스키마의 출처이고, 저장소에서는 migration 파일이 재현 가능한 변경 이력이다.

```powershell
npm run db:status
npx supabase migration new meaningful_name
npm run db:push
npm run db:dump
npm run db:test
```

규칙:

- 적용된 migration은 수정하지 않는다. 수정 migration을 새로 추가한다.
- 파일명은 UTC timestamp + snake_case 설명을 사용한다.
- 여러 DDL이 하나의 논리 변경이면 `begin; ... commit;`으로 묶는다.
- security definer 함수는 고정 `search_path`, 최소 grant, 입력·소유권 검사를 둔다.
- 위험한 backfill은 먼저 nullable 추가 → backfill 검증 → constraint 추가 순서로 한다.
- destructive migration은 데이터 백업/복구 SQL과 배포 순서를 PR에 남긴다.
- `schema.remote.sql`은 `npm run db:dump` 생성물이다. 직접 수정하지 않는다.
- `seed.sql`은 local `supabase db reset`에서만 쓰는 idempotent 개발 seed다.

현재 `schema.remote.sql`은 2026-08의 최근 migration 일부보다 뒤처져 있다. 원격에 migration이 모두 적용됐는지 `db:status`로 먼저 판단하고, 적용 후 dump를 새로 만든다. 스냅샷을 최신 migration보다 높은 우선순위로 보지 않는다.

## 캐시와 데이터 정합성

공개 server query는 5분 캐시되는 곳이 있다. 관리자 저장 성공은 DB 성공과 공개 반영 완료가 같은 뜻이 아니다.

- notices 변경: `public-notices`
- artist navigation 변경: `public-navigation-artists`
- settings 변경: `public-site-settings`
- scene 변경: `artist-scene-data`

새 캐시 tag를 만들면 선언, revalidate API enum, 관리자 호출, 테스트를 한 변경으로 묶는다. `revalidateTag(tag, "max")`의 stale-while-revalidate 성격을 고려해 즉시 강한 일관성이 필요한 화면은 캐시 전략을 별도로 정한다.
