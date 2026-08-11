export type LocalizedTextDTO = {
  ko: string;
  en: string;
  ja: string;
};

export type NoticeListItemDTO = {
  id: string;
  date: string;
  title: LocalizedTextDTO;
  category: LocalizedTextDTO;
};

export type NoticeDTO = NoticeListItemDTO & {
  content: LocalizedTextDTO;
};

type NoticeScopeDTO = {
  name: string;
};

export type NoticeListDTO = NoticeScopeDTO & {
  notices: NoticeListItemDTO[];
};

export type NoticeDetailDTO = NoticeScopeDTO & {
  notice: NoticeDTO | null;
};

export type NoticeNavigationDTO = {
  previous: { id: string; title: LocalizedTextDTO } | null;
  next: { id: string; title: LocalizedTextDTO } | null;
};
