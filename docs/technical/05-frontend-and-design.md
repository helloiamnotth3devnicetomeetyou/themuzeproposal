# 프론트엔드와 디자인

## 시각 방향

제품은 하나의 공통 토큰 위에 세 가지 밀도를 가진다.

| 모드      | 화면                                     | 특징                                                    |
| --------- | ---------------------------------------- | ------------------------------------------------------- |
| Cinematic | 홈, artist scene, discography            | 검정 전시장, 이미지·앨범 중심, 큰 제목, 적은 chrome     |
| Editorial | about, notice, account, protect, contact | 강한 타이포 계층, hairline, 읽기 폭 제한                |
| Control   | admin                                    | 높은 정보 밀도, rail/workbench, 명시적 상태와 저장 동작 |

브랜드 pink는 배경 장식이 아니라 primary action, focus, active, selection 신호다. 앨범/아티스트 색상은 ambient/progress 같은 콘텐츠 맥락에만 쓰고 success/error 의미를 대체하지 않는다.

## 런타임 토큰의 정본

`docs/reference/design-system.md`보다 실제 런타임 파일을 우선한다.

1. `src/styles/(core)/foundations/color-primitives.css`: literal palette/alpha
2. `src/styles/(core)/foundations/base.css`: semantic theme, font, layout, focus
3. `src/styles/(core)/foundations/animations.css`: motion
4. `src/core/utils/design-tokens.ts`: JS에서 계산·저장하는 제한된 색상
5. page/component stylesheet: semantic variable 소비

새 HEX/RGB literal을 component CSS/TSX에 추가하지 않는다. 기존 의미 토큰이 없을 때 foundations에 한 번 추가한다.

핵심 runtime 값:

| 역할                          | 값/변수                                  |
| ----------------------------- | ---------------------------------------- |
| Brand pink                    | `--color-brand-pink`, `#FC6FCF`          |
| Dark canvas/surface/elevated  | `#0A0A0A` / `#121212` / `#1A1A1A`        |
| Light canvas/surface/elevated | `#F7F8FA` / `#F0F2F5` / `#FFFFFF`        |
| Page gutter                   | `clamp(20px, 4vw, 68px)`; mobile 18–24px |
| Header                        | 64px, hero 72px                          |
| Admin mobile bar              | 56px                                     |
| Breakpoints                   | 30rem, 48rem, 64rem, 80rem               |
| Motion                        | fast 150ms, base 200ms, slow 300ms       |

## 타이포그래피

현재 코드 기준:

- 본문/UI/한글·일본어: 로컬 Pretendard Subset → Full → system sans
- 영문 display/wordmark: Next Google Font Montserrat
- hero: 로컬 Clash Display → Montserrat

`MonumentExtended-Bold.woff2` 파일이 public에 남아 있고 과거 문서가 Monument를 언급하지만 현재 `base.css`의 hero token은 Clash Display다. 새 화면은 런타임 token을 따른다.

규칙:

- 긴 본문은 Pretendard, sentence case, 충분한 line-height를 사용한다.
- display는 짧은 제목에만 tight tracking/line-height를 허용한다.
- 핵심 정보는 최소 12px, 모바일 입력은 최소 16px를 유지한다.
- 영어 uppercase tracked label을 한글 장문에 그대로 적용하지 않는다.
- 폰트를 추가하면 preload 필요성, subset, license, `font-display: swap`을 확인한다.

## CSS 구조

`globals.css`가 Tailwind 4와 core foundations, 공통 loading, home style을 import한다. Admin layout은 필요한 `(admin)` stylesheet를 명시적으로 import한다. Public page는 전역 page CSS와 CSS Module이 혼재한다.

선택 기준:

- 재사용 utility와 간단한 layout/state: Tailwind class
- theme/layout token과 여러 화면 공통 기반: core foundation CSS
- admin 전체 shell/workbench 계약: admin global CSS
- 한 컴포넌트에 국한된 복잡한 selector: CSS Module
- 한 public experience 전체가 공유하는 scene/animation: page stylesheet

같은 요소를 Tailwind와 CSS Module 양쪽에서 중복 지정하지 않는다. `!important`는 이미 전역 form theme처럼 의도된 기반 규칙 외에는 피한다.

## 레이아웃 패턴

### Cinematic

- full viewport artwork와 overlay
- 제목/설명은 artwork를 가리지 않는 한 지점에 집중
- 최대 한 개의 주요 staged motion
- contextual accent는 body text보다 background/progress에 사용

### Editorial

- `--page-gutter`, `--page-top-space`, `--page-bottom-space` 사용
- 긴 prose는 약 760px 이내
- 넓은 화면 split rail은 작은 화면에서 한 열로 변경
- shadow보다 surface step과 1px border로 구조 표현

### Admin workbench

- sidebar/library rail + minmax stage
- 좁은 폭에서 rail을 상단/단일 열로 전환
- 저장·삭제·dirty state를 숨기지 않음
- modal/dialog는 focus와 destructive confirmation을 명확히 함

### Admin analytics

- 대시보드는 최근 7일의 페이지뷰·방문자·최고 일별 페이지뷰만 요약해 보여 주고, 상세 분석은 `/admin/analytics`에서 제공한다.
- 상세 화면의 기간 탭은 7일·30일·12주·12개월이며, API가 반환한 granularity에 맞춰 일/주/월 차트를 표기한다.
- 차트 점은 키보드로 접근 가능한 button이며 날짜·페이지뷰·방문자 값을 `aria-label`과 tooltip으로 제공한다. 데이터가 없거나 설정되지 않았을 때도 빈 차트 대신 이유를 문장으로 표시한다.
- 국가 코드에는 `Intl.DisplayNames`, 숫자에는 `Intl.NumberFormat("ko-KR")`를 사용한다. 제공되지 않은 국가·기기명은 원값을 보존한다.
- 분석 패널은 처음 네 항목만 보여 주며, 더보기/접기 버튼으로 나머지를 노출한다. 값이 없는 차원은 빈 패널로 유지해 데이터가 없다는 사실을 숨기지 않는다.

## 컴포넌트 계약

### 버튼과 링크

- 기본 hit target은 최소 한 변 44px, 주요 icon action은 44×44px
- `button`은 동작, `a`/Link는 이동에 사용
- icon-only에는 `aria-label`
- disabled는 label을 유지하고 pointer/hover 동작을 제거
- destructive action은 최종 확인 전 solid danger emphasis를 남발하지 않음

### 폼

- label은 항상 표시하고 placeholder로 대체하지 않음
- error는 필드와 연결하고 해결 방법을 말함
- native input (`date`, file, select)이 요구를 충족하면 우선 사용
- browser validation만 믿지 않고 서버 계약과 최대 길이/파일 타입을 맞춤
- 제출 중 중복 요청을 막고 성공/실패 상태를 screen reader에도 전달

### 이미지·오디오

- remote image host는 `next.config.ts`의 Supabase derived pattern만 허용
- `next/image` dimensions 또는 fill container 비율을 명확히 지정
- 첫 hero만 필요 시 preload/high priority; 아래 콘텐츠를 모두 preload하지 않음
- 이미지 최적화는 AVIF/WebP, 최소 cache TTL 7일
- audio controller는 `useAudioPlayback`과 playback memory를 재사용
- object URL, interval, audio event listener는 cleanup

### loading/empty/error

- branded `YOU ARE MY MUZE` loading은 제품상 pause가 맞는 곳에만 사용
- empty state는 무엇이 없고 다음 행동이 무엇인지 표시
- error boundary는 root `src/app/error.tsx`, 페이지별 load failure는 feature에서 구분
- skeleton이 클릭 불가능한 control처럼 보이지 않게 함

## 반응형과 접근성

접근성은 후속 polish가 아니라 component 계약이다.

- `:focus-visible`: 2px pink outline + 3px offset 유지
- 키보드 tab order, Escape close, focus trap/restoration 확인
- active/error/success를 색만으로 전달하지 않음
- critical text는 muted/faint color를 피하고 WCAG AA 대비 목표
- `prefers-reduced-motion`에서는 animation/transition을 사실상 제거하고 smooth scroll을 끔
- auto-advance UI는 hover/focus/document hidden에서 pause
- `html lang`은 locale 변경 시 갱신
- semantic heading 순서와 landmark 유지
- modal/open mobile nav 시 배경 상호작용을 막음

현재 전역 CSS는 scrollbar를 숨긴다. cinematic 경험에는 의도적이지만 긴 admin/editor surface에서는 발견 가능성을 낮춘다. 새 스크롤 영역은 scrollbar를 무조건 숨기지 말고 별도 affordance를 제공한다.

## 다국어

지원 locale은 `ko`, `en`, `ja`다. `muze-locale` cookie와 localStorage를 함께 사용하고 기본은 한국어다.

콘텐츠 fallback 순서:

```text
요청 locale → ko → en → ja → canonical legacy value
```

UI message는 `core/i18n/translations.ts` 또는 feature messages에 둔다. DB 다국어 콘텐츠와 UI chrome 번역을 섞지 않는다. 새 필드가 사용자 콘텐츠라면 세 locale 저장 형태, 관리자 입력, repository fallback, preview payload를 함께 변경한다.

날짜/숫자 표시는 `localeTags`와 `Intl`을 사용한다. locale별 직접 분기 문자열 포맷을 만들지 않는다.

## 디자인 변경 체크리스트

- semantic token을 사용하고 raw color를 추가하지 않았는가
- dark/light 양쪽에서 읽히는가
- 320px 수준의 작은 폭과 1280px 이상에서 깨지지 않는가
- keyboard와 focus-visible로 전 흐름을 완료할 수 있는가
- reduced motion에서 정보가 사라지지 않는가
- ko/en/ja 길이 변화와 fallback을 확인했는가
- hero/LCP 이미지 외에 불필요한 preload가 없는가
- 기존 `SiteLayout`, form, loading, editor shell을 재사용했는가
