# 프로젝트 개요

## 제품 범위

THE MUZE 엔터테인먼트의 공식 웹사이트와 콘텐츠 관리 스튜디오를 한 Next.js 애플리케이션으로 제공한다.

- 공개 사이트: 홈 히어로, 소속 아티스트, 멤버 scene, 디스코그래피와 오디오 재생, 일정, 공지, 회사 소개, 문의, 오디션
- 계정: 이메일/비밀번호 및 Google OAuth 로그인, 프로필·아바타, 본인 제보 및 오디션 지원 조회
- Protect: 로그인 사용자의 권리침해 제보와 증빙 파일 제출
- 관리자: 아티스트·멤버·앨범·트랙·scene·일정·공지·히어로·사이트 설정 편집, 문의·제보·오디션 심사, 관리자 계정, 감사 로그
- 운영 보조: 관리자 미리보기, 편집 초안 복구, 온보딩 가이드 sandbox, 캐시 무효화

## 기술 스택

| 영역 | 현재 선택 |
| --- | --- |
| 런타임 | Node.js 22 |
| 웹 | Next.js 16 App Router, React 19, TypeScript strict |
| 스타일 | Tailwind CSS 4 + 전역 CSS + CSS Modules |
| 데이터·인증·파일 | Supabase Postgres/Auth/Storage, `@supabase/ssr` |
| 검증 | Zod 4, 수동 trust-boundary 검증 |
| 이미지 | Next Image, Sharp |
| HTML/SVG 정화 | isomorphic-dompurify, Sharp |
| 아이콘·드래그 | lucide-react, react-icons, dnd-kit |
| 단위/컴포넌트 테스트 | Vitest, Testing Library, jsdom |
| E2E | Playwright Chromium |
| 관측 | Vercel Analytics, Speed Insights |
| CI | GitHub Actions, npm audit, Supabase SQL tests |

패키지 버전의 기준은 `package.json`과 `package-lock.json`이다. 새 dependency는 기존 dependency나 Web API로 해결되지 않을 때만 추가한다.

## URL 지도

Route Group `(public)`, `(admin)`, `(core)`는 URL에 나타나지 않는다.

### 공개·계정

| URL | 기능 |
| --- | --- |
| `/` | 홈 앨범 히어로 |
| `/about`, `/contact`, `/notice`, `/notice/[id]` | 회사·문의·회사 공지 |
| `/artists`, `/artists/[id]` | 아티스트 목록·상세의 호환 경로 |
| `/[artistid]` | 아티스트 랜딩 |
| `/[artistid]/artist`, `/[artistid]/artist/[id]` | scene와 멤버 상세 |
| `/[artistid]/discography` | 앨범·트랙 플레이어 |
| `/[artistid]/schedule` | 일정 |
| `/[artistid]/notice`, `/[artistid]/notice/[id]` | 아티스트 공지 |
| `/discography` | 전역 디스코그래피 진입점 |
| `/audition`, `/audition/[campaignId]` | 활성 캠페인과 동적 지원서 |
| `/login`, `/auth/callback` | 로그인과 OAuth callback |
| `/account` | 사용자 프로필·지원 내역 |
| `/protect` | 권리침해 제보 |

### 관리자

모든 `/admin/**` 페이지는 layout과 proxy 양쪽에서 인증·관리자 역할을 확인하며 검색엔진 비공개 메타데이터를 사용한다.

| URL 묶음 | 기능 |
| --- | --- |
| `/admin` | 대시보드 |
| `/admin/artists/[id]/{profile,members,discography,tracks,schedule,notices}` | 아티스트 콘텐츠 편집 |
| `/admin/hero`, `/admin/notices`, `/admin/settings` | 전역 콘텐츠·설정 |
| `/admin/contact`, `/admin/protect` | 민감 접수함 |
| `/admin/auditions/**` | 오디션 목록·캠페인 builder·지원 심사 |
| `/admin/audit-logs` | append-only 변경 이력 |

### 서버 API

| 경로 | 핵심 경계 |
| --- | --- |
| `/api/auth/login`, `/api/auth/verify-password` | same-origin, body limit, DB rate limit |
| `/api/contact-inquiries` | 공개 제출, body/file 검증, rate limit |
| `/api/protect-reports` | 로그인 필수, 증빙 업로드와 실패 시 정리 |
| `/api/audition/submit` | 로그인·확정 이메일·동적 schema·중복·파일 검증 |
| `/api/uploads/admin-asset`, `/api/uploads/artist-logo` | 관리자, allowlist bucket/path/type |
| `/api/admin/accounts` | super_admin 전용 역할 관리 |
| `/api/admin/revalidate` | 관리자, 허용된 cache tag만 무효화 |
| `/api/admin/preview`, `/api/admin/preview/exit` | 관리자 draft mode 진입·종료 |

## 핵심 사용자 흐름

### 공개 콘텐츠 조회

`page.tsx`가 서버에서 repository/cache 함수를 호출하고 DTO를 화면 컴포넌트에 넘긴다. DB의 RLS가 비공개·비활성·미발행 row를 막고 repository도 명시적으로 상태 조건을 건다. 둘 중 하나를 제거하지 않는다.

### 관리자 편집

관리자 layout이 세션과 role을 확인한다. 편집 UI는 Supabase browser client로 RLS 범위 안에서 읽고 쓰며, `useAdminEntityEditor`가 dirty state·오류·저장 상태·localStorage 복구를 맡는다. 여러 편집기 저장은 현재 클라이언트에서 순차 처리하며 원자적 트랜잭션이 아니다.

### 민감 제출

브라우저는 multipart 또는 JSON을 같은 origin API에 전송한다. Route Handler가 크기 제한, 서버 세션, rate limit, 값과 파일의 실제 형식을 확인한다. Storage와 다중 테이블 작업이 중간 실패하면 업로드 파일과 생성 row를 명시적으로 정리한다.

## 저장소 최상위

| 경로 | 책임 |
| --- | --- |
| `src/` | 애플리케이션 코드와 스타일 |
| `supabase/migrations/` | 순서가 있는 DB 변경의 정본 |
| `supabase/tests/` | pgTAP/RLS 보안 경계 테스트 |
| `supabase/schema.remote.sql` | 원격 public schema 생성 스냅샷; 직접 수정 금지 |
| `e2e/` | 브라우저 사용자 흐름 |
| `test/` | Vitest 공통 설정·server-only shim |
| `scripts/` | env 검증과 일회성 asset 변환 |
| `public/` | 정적 이미지·폰트 |
| `.github/workflows/` | CI와 보안 검사 |
| `patches/` | `patch-package`가 install 후 적용하는 dependency patch |
| `docs/tech/` | 현재 기술 인수인계 문서 |

`.next`, `coverage`, `test-results`, `output`, `.env.local`은 생성물 또는 비밀정보이며 커밋하지 않는다.
