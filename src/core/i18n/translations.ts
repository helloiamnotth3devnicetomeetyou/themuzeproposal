import { publicMessages } from "./public-messages";

export type { Locale } from "./localized";

export const translations = {
  ko: {
    ...publicMessages.ko,
    nav: {
      about: "ABOUT",
      artists: "ARTISTS",
      discography: "DISCOGRAPHY",
      audition: "AUDITION",
      notice: "NOTICE"
    },
    hero: {
      slogan: "YOU ARE MY MUZE",
      exploreBtn: "자세히 보기",
      listenBtn: "음원 감상하기"
    },
    sections: {
      latestRelease: "최신 릴리즈",
      featuredArtist: "대표 아티스트",
      auditionTitle: "오디션 안내",
      auditionDesc: "더뮤즈엔터테인먼트와 함께 글로벌 무대를 빛낼 차세대 아티스트를 찾습니다.",
      applyBtn: "지원하기"
    },
    footer: {
      companyName: "(주)더뮤즈엔터테인먼트",
      address: "서울특별시 강남구 신사동 논현로 사옥",
      copyright: "© 2026 THE MUZE Entertainment. All Rights Reserved."
    }
  },
  en: {
    ...publicMessages.en,
    nav: {
      about: "ABOUT",
      artists: "ARTISTS",
      discography: "DISCOGRAPHY",
      audition: "AUDITION",
      notice: "NOTICE"
    },
    hero: {
      slogan: "YOU ARE MY MUZE",
      exploreBtn: "EXPLORE DETAILS",
      listenBtn: "STREAM NOW"
    },
    sections: {
      latestRelease: "LATEST RELEASE",
      featuredArtist: "FEATURED ARTIST",
      auditionTitle: "AUDITION",
      auditionDesc: "We are looking for the next generation of global artists to shine with THE MUZE Entertainment.",
      applyBtn: "APPLY NOW"
    },
    footer: {
      companyName: "THE MUZE Entertainment Co., Ltd.",
      address: "Nonhyeon-ro, Sinsa-dong, Gangnam-gu, Seoul, Republic of Korea",
      copyright: "© 2026 THE MUZE Entertainment. All Rights Reserved."
    }
  },
  ja: {
    ...publicMessages.ja,
    nav: {
      about: "ABOUT",
      artists: "ARTISTS",
      discography: "DISCOGRAPHY",
      audition: "AUDITION",
      notice: "NOTICE"
    },
    hero: {
      slogan: "YOU ARE MY MUZE",
      exploreBtn: "詳細を見る",
      listenBtn: "今すぐ聴く"
    },
    sections: {
      latestRelease: "最新リリース",
      featuredArtist: "所属アーティスト",
      auditionTitle: "オーディション",
      auditionDesc: "THE MUZE Entertainmentと共にグローバルな舞台で輝く次世代のアーティストを募集しています。",
      applyBtn: "応募する"
    },
    footer: {
      companyName: "THE MUZE Entertainment 株式会社",
      address: "大韓民国ソウル特別市江南区新沙洞ノンヒョン路",
      copyright: "© 2026 THE MUZE Entertainment. All Rights Reserved."
    }
  }
};
