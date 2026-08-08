# 데이터와 Supabase

## client 선택

| 함수/객체 | 자격 | 사용처 |
| --- | --- | --- |
| `supabase` (`core/supabase/client.ts`) | anon + browser session | Client Component, 일반 사용자·관리자 RLS 작업 |
| `createSupabaseServerClient()` | anon + request cookie | Server Component/Route Handler의 사용자 세션·RLS 작업 |
| 공개 server/repository client | anon, session 비저장 | 공개 캐시 가능한 조회 |
| `createServiceRoleClient()` | service role, RLS 우회 | 검증된 서버 route의 제한된 관리·제출·Storage 작업 |

Service role client가 `null`일 수 있으므로 route는 `503 SERVICE_UNAVAILABLE`로 실패해야 한다. 클라이언트 bundle에 service key가 들어가는 import 구조는 금지한다.

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
- `protect_reports`는 로그인 사용자 소유이며 attachments는 private Storage path를 참조한다.
- `admin_audit_logs`는 일반 콘텐츠는 변경값을, 문의·제보·지원서는 안전한 운영 필드만 기록한다.
- rate-limit identifier는 원문 이메일/IP/user id가 아니라 HMAC hash로 저장한다.

### 오디션

현재 두 세대의 구조가 공존한다.

- `auditions`: session/category-form 기반의 이전 동적 구조
- `audition_campaigns` + `audition_form_fields`: 현재 공개 builder/지원 흐름
- `audition_submissions`: legacy column과 현재 `campaign_id`, `answers`, `form_snapshot`, review field를 함께 보유

새 기능은 `audition_campaigns` 모델을 우선한다. `form_snapshot`은 지원 당시 질문을 보존하며, `answers`는 field key별 값 또는 파일 metadata다. 지원 이메일은 계정의 확인된 이메일과 일치해야 하며 DB에는 캠페인별 HMAC hash를 저장해 중복을 막는다. 사용자 자신의 조회는 제한된 RPC `get_my_audition_submissions()`를 사용해 심사 메모 등 관리자 전용 열 노출을 피한다.

## Storage

코드에서 확인되는 bucket 책임:

| bucket | 공개 여부/용도 | route 제한 |
| --- | --- | --- |
| `artist-assets` | 공개 아티스트 이미지·로고 | 관리자, 이미지 magic bytes |
| `album-covers` | 공개 앨범 이미지 | 관리자, 이미지 magic bytes |
| `track-assets` | 공개 커버/MP3 | 관리자, MP3 대용량은 signed direct upload |
| `business-assets` | 공개 press-kit.zip, profile.pdf만 | 관리자, 고정 path allowlist |
| `contact-attachments` | 비공개 문의 첨부 | PDF/PPT/PPTX |
| `protect-evidence` | 비공개 제보 증빙 | 이미지/GIF/PDF |
| `audition-attachments` | 비공개 지원 첨부 | 로그인 제출 API, 관리자 읽기 |

DB Storage policy만 믿고 browser에서 직접 임의 path를 업로드하지 않는다. 서버 route가 bucket, path, 크기, signature, extension을 검증한다. 저장 파일명은 사용자 입력 대신 UUID와 검증된 extension을 사용하고 원래 이름은 metadata/DB에만 제한 길이로 저장한다.

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
