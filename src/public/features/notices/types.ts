export type LocalizedTextDTO = {
  ko: string;
  en: string;
  ja: string;
};

export type NoticeDTO = {
  id: string;
  date: string;
  title: LocalizedTextDTO;
  content: LocalizedTextDTO;
  category: LocalizedTextDTO;
};

type NoticeScopeDTO = {
  name: string;
};

export type NoticeListDTO = NoticeScopeDTO & {
  notices: NoticeDTO[];
};

export type NoticeDetailDTO = NoticeScopeDTO & {
  notice: NoticeDTO | null;
};
