# 관리자 페이지 통계

## 목적과 범위

관리자 페이지 통계는 Vercel Web Analytics의 집계를 관리자 화면에서 확인하는 읽기 전용 기능이다. 콘텐츠 DB나 사용자 행동 로그를 새로 저장하지 않으며, Vercel이 제공하는 집계 결과를 현재 요청에 한해 화면 DTO로 변환한다.

제공 위치:

- `/admin`: 최근 7일 페이지뷰·방문자·최고 일별 페이지뷰 요약
- `/admin/analytics`: 방문 추이와 경로·국가·기기·운영체제·브라우저·배포 환경·유입 경로 분석
- `GET /api/admin/page-stats`: 두 화면이 공유하는 서버 경계

## 설정

다음 값은 Vercel Analytics 조회에만 쓰는 서버 전용 환경 변수다. 앱의 필수 build 검증 항목은 아니므로, 값이 없다고 공개 사이트나 관리자 콘텐츠 기능이 실패하지 않는다.

| 변수 | 필수 여부 | 역할 |
| --- | --- | --- |
| `VERCEL_TOKEN` | 통계 조회 시 필수 | Vercel API bearer token |
| `VERCEL_PROJECT_ID` | 통계 조회 시 필수 | 대상 프로젝트 ID (`prj_…`) |
| `VERCEL_TEAM_ID` | 선택 | 팀 소속 프로젝트의 team ID (`team_…`) |

설정 절차:

1. Vercel에서 대상 프로젝트와 Web Analytics 수집 상태를 확인한다.
2. 해당 프로젝트를 조회할 수 있는 최소 권한 token을 발급한다.
3. 운영과 preview 환경에 각각 필요한 값을 서버 환경 변수로 설정한다.
4. 관리자 계정으로 `/admin/analytics`를 열어 최근 7일 수치가 표시되는지 확인한다.
5. token 값은 `.env.example`, client bundle, issue, 문서, 브라우저 console에 넣지 않는다.

`VERCEL_TOKEN` 또는 `VERCEL_PROJECT_ID`가 빠진 경우 endpoint는 오류가 아니라 `configured: false`인 빈 결과를 반환한다. 화면은 “Vercel API 연결 후 통계가 표시됩니다”라는 빈 상태를 보여 준다.

## 접근 제어와 요청 흐름

endpoint는 공개 API가 아니다. 요청마다 Supabase server client로 현재 사용자를 읽고 `profiles.role`이 `editor` 또는 `super_admin`인지 확인한다. 세션이 없거나 일반 사용자는 `403 { error: "forbidden" }`을 받는다.

```text
관리자 브라우저
  → GET /api/admin/page-stats?range=7d
  → Supabase 세션 사용자 확인
  → profiles.role 관리자 여부 확인
  → Vercel 환경 변수 확인
  → Vercel aggregate API 요청 (Bearer token, 7초 timeout)
  → 화면 전용 집계 JSON
```

요청은 `cache: "no-store"`로 Vercel에 전달한다. 방문 통계는 최신성이 중요하고 사용자별 캐시 공유가 필요 없으므로 Next cache tag나 Supabase cache 테이블을 사용하지 않는다.

## API 계약

### 요청

`GET /api/admin/page-stats`는 선택적인 query parameter를 받는다.

| parameter | 값 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `range` | `7d`, `30d`, `12w`, `12m` | `7d` | 조회 기간과 추이 granularity를 결정 |
| `summary` | `1` | 없음 | dashboard용 요약; 차원별 추가 조회를 생략 |

다른 `range` 값은 `400 { error: "invalid range" }`으로 거부한다.

| range | 기간 | 추이 단위 |
| --- | --- | --- |
| `7d` | 최근 7일 | 일 |
| `30d` | 최근 30일 | 일 |
| `12w` | 최근 84일 | 주 |
| `12m` | 최근 365일 | 월 |

기간의 기준일은 한국 표준시(UTC+09:00) 날짜다. endpoint는 서울 날짜 키를 만든 뒤 시작일과 종료일을 Vercel query parameter로 보낸다.

### 정상 응답

성공 시 응답은 다음 필드를 포함한다.

| 필드 | 의미 |
| --- | --- |
| `configured` | Vercel 조회 환경 변수가 준비됐는지 여부 |
| `range`, `granularity` | 실제 적용된 기간과 차트 단위 |
| `pageviews`, `visitors`, `peakPageviews` | 해당 기간의 합계와 단위별 최대 페이지뷰 |
| `points` | `{ timestamp, pageviews, visitors }` 형식의 추이 |
| `routes`, `countries`, `devices` | 경로·국가·기기별 집계 |
| `operatingSystems`, `browsers`, `environments`, `referrers` | 나머지 분석 차원 |
| `rangeUnavailable` | 요금제 또는 provider 기간 제한으로 조회할 수 없는지 여부 |
| `error` | 사용자에게 표시 가능한 한국어 오류/제한 설명 |

`summary=1`에서는 추이와 합계만 필요하므로 차원별 provider query를 생략하고 각 분석 배열은 비어 있다.

## 화면 동작

대시보드는 `/api/admin/page-stats?range=7d&summary=1`을 요청한다. 상세 화면은 기간을 바꿀 때 `summary` 없이 다시 요청해 분석 차원을 함께 표시한다.

상세 화면은 7일·30일·12주·12개월 탭을 제공한다. 12주와 12개월은 화면 구현에서 현재 “후속 구현 대상” 안내 상태로 남아 있어 브라우저 요청을 보내지 않는다. 반면 endpoint와 route test는 네 기간 전체를 지원한다. UI에서 장기 기간을 활성화할 때는 endpoint를 바꾸지 말고, 이 임시 화면 분기를 제거하고 실제 데이터·요금제 제한 상태를 검증한다.

데이터가 있어도 특정 분석 차원이 비어 있을 수 있다. 이는 Vercel이 해당 차원을 수집하지 않았거나 해당 기간에 값이 없다는 뜻이며, 빈 배열은 오류로 처리하지 않는다.

## 실패와 운영 대응

| 증상 | endpoint 결과 | 확인 순서 |
| --- | --- | --- |
| 설정 안내 빈 상태 | `200`, `configured: false` | `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` 존재 여부 |
| 일반 사용자가 호출 | `403` | 세션과 `profiles.role` 확인 |
| 잘못된 기간 | `400` | `range` allowlist 확인 |
| 기간/요금제 제한 | `200`, `rangeUnavailable: true` | Vercel 플랜의 Analytics 조회 가능 기간 확인 |
| Vercel API 실패·timeout·응답 형식 오류 | `502` + 안전한 `error` | token 권한, project/team ID, Vercel 상태 확인 |

Vercel API에서 402가 오면 provider의 조회 가능 기간 제한으로 취급한다. 다른 provider 오류는 서버 로그에만 기록하고 브라우저에는 “페이지 통계를 불러오지 못했습니다”만 반환한다. `Authorization` header, token, provider 원문 response는 로그나 응답에 포함하지 않는다.

## 변경과 검증

통계 화면 또는 API를 바꿀 때 다음을 확인한다.

```powershell
npx vitest run 'src/app/(admin)/api/admin/page-stats/route.test.ts'
npm run lint
npm run typecheck
```

- route test에 관리자 허용/거부, 기간별 granularity, provider 402 제한 상태를 유지한다.
- provider에 새 차원을 추가하면 응답 DTO, parser, UI의 빈 상태와 더보기 동작을 함께 갱신한다.
- 새 환경 변수는 `.env.example`, 보안 문서, 배포 secret store를 함께 갱신한다. 실제 값은 넣지 않는다.
- Vercel API의 query/권한 모델 변경 여부는 Vercel 공식 문서로 확인한 뒤 반영한다.
