export type ArtistNavigationItem = {
  id: string;
  slug: string;
  name: string;
  eng_name: string | null;
  name_ko: string | null;
  name_en: string | null;
  name_ja: string | null;
  logo_url: string | null;
};

export type NavigationAccount = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  avatarUrl: string | null;
  initial: string;
  name: string;
};

export type NavTranslations = {
  nav: { about: string; audition: string; notice: string };
  common: {
    openMenu: string;
    closeMenu: string;
    mainMenu: string;
    mobileMenu: string;
    lightMode: string;
    darkMode: string;
  };
};
