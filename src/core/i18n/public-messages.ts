import type { Locale } from "./localized";

import { enPublicMessages } from "./public-messages-en";
import { jaPublicMessages } from "./public-messages-ja";
import { koPublicMessages } from "./public-messages-ko";

type OptionMessage = { value: string; label: string };

export interface PublicMessages {
  common: {
    language: string;
    openMenu: string;
    closeMenu: string;
    mainMenu: string;
    mobileMenu: string;
    lightMode: string;
    darkMode: string;
    loading: string;
    skipToContent: string;
  };
  about: {
    companyDescription: string;
    vision: Array<{ title: string; description: string }>;
    valueLabel: string;
    valueConclusion: string;
    historyLabel: string;
    historyConclusion: string;
    noticesLabel: string;
    noticesConclusion: string;
    noticesLoading: string;
    noticesEmpty: string;
    locationLabel: string;
    locationConclusion: string;
    addressFallback: string;
    headquartersDescription: string;
  };
  protect: {
    description: string;
    myReports: string;
    report: string;
    privateReport: string;
    closeError: string;
    loadError: string;
    receivedEyebrow: string;
    receivedTitle: string;
    receivedDescription: string;
    receiptNumber: string;
    processingStatus: string;
    receivedStatus: string;
    viewReports: string;
    reportTypes: OptionMessage[];
    status: Record<"pending" | "reviewing" | "resolved" | "rejected", string>;
    platforms: OptionMessage[];
    listDescription: string;
    total: (count: number) => string;
    emptyTitle: string;
    emptyDescription: string;
    artistFallback: string;
    receipt: string;
    fields: {
      artist: string;
      reportType: string;
      title: string;
      content: string;
      platform: string;
      postUrl: string;
      postedAt: string;
      authorName: string;
      postIp: string;
      evidence: string;
      confirmation: string;
      captcha: string;
    };
    placeholders: {
      artist: string;
      reportType: string;
      title: string;
      content: string;
      platform: string;
      postUrl: string;
      authorName: string;
      postIp: string;
    };
    upload: string;
    uploadHint: string;
    evidenceGuide: string;
    confirmation: string;
    missingTitle: string;
    missingCount: (count: number) => string;
    holdHint: string;
    submit: string;
    keepHolding: string;
    submitting: string;
    removeFile: (name: string) => string;
    errors: {
      maxFiles: string;
      fileType: (name: string) => string;
      fileSize: (name: string) => string;
      duplicate: (name: string) => string;
      evidenceRequired: string;
      confirmationRequired: string;
      submitFailed: string;
      INVALID_REQUEST: string;
      UNAUTHORIZED: string;
      RATE_LIMITED: string;
      FILE_TOO_LARGE: string;
      INVALID_FILE_TYPE: string;
      UPLOAD_FAILED: string;
      SERVICE_UNAVAILABLE: string;
      SUBMISSION_FAILED: string;
      CAPTCHA_FAILED: string;
    };
  };
  schedule: {
    categories: Record<
      "show" | "release" | "anniversary" | "event" | "etc",
      string
    >;
    loading: string;
    artistNotFound: string;
    tableMissing: string;
    loadError: string;
    empty: string;
    previous: string;
    next: string;
    previousYear: string;
    nextYear: string;
    today: string;
    monthSelect: string;
    eventTypes: string;
    pageLabel: string;
    calendarLabel: (year: number, month: number) => string;
    dayLabel: (month: number, day: number, count: number) => string;
  };
  artistScene: {
    select: string;
    scene: string;
    close: string;
    previous: string;
    next: string;
    discography: string;
    openLink: string;
    profile: string;
    groupProfile: string;
    expand: string;
    collapse: string;
    loading: string;
    notFound: string;
    back: string;
    clickHint: string;
  };
  discography: {
    loading: string;
    empty: string;
    loadError: string;
    tabs: { concept: string; intro: string; members: string };
    noDescription: string;
    noMembers: string;
    allMembers: string;
    noPhotos: string;
    photoCount: string;
    nowPlaying: string;
    progress: string;
    previousTrack: string;
    nextTrack: string;
    play: string;
    pause: string;
    noAudio: string;
    musicVideo: string;
    newest: string;
    oldest: string;
    sortAscending: string;
    sortDescending: string;
    previousAlbum: string;
    nextAlbum: string;
  };
}

export const publicMessages: Record<Locale, PublicMessages> = {
  ko: koPublicMessages,
  en: enPublicMessages,
  ja: jaPublicMessages,
};
