export type HistoryEntry = {
  id: string;
  date: string;
  event_ko: string;
  event_en: string;
  event_ja: string;
};

export const DEFAULT_HISTORY: HistoryEntry[] = [
  { id: "history-2026-investment", date: "2026. 07", event_ko: "이넷투자파트너스 등으로부터 20억 신규 투자 유치 및 신사동 신사옥 이전", event_en: "Secured 2B KRW investment & moved to the Sinsa-dong headquarters", event_ja: "20億ウォンの新規投資誘致および新沙洞の新社屋へ移転" },
  { id: "history-2026-pretty-girl", date: "2026. 07", event_ko: "RESCENE 스페셜 싱글 《Pretty Girl》 발매", event_en: "Released RESCENE Special Single 《Pretty Girl》", event_ja: "RESCENE スペシャルシングル 《Pretty Girl》 リリース" },
  { id: "history-2025-lip-bomb", date: "2025. 11", event_ko: "RESCENE 미니 3집 《lip bomb》 발매", event_en: "Released RESCENE 3rd Mini Album 《lip bomb》", event_ja: "RESCENE 3rdミニアルバム 《lip bomb》 リリース" },
  { id: "history-2025-glow-up", date: "2025. 02", event_ko: "RESCENE 미니 2집 《Glow Up》 발매", event_en: "Released RESCENE 2nd Mini Album 《Glow Up》", event_ja: "RESCENE 2ndミニアルバム 《Glow Up》 リリース" },
  { id: "history-2024-scenedrome", date: "2024. 08", event_ko: "RESCENE 미니 1집 《SCENEDROME》 발매", event_en: "Released RESCENE 1st Mini Album 《SCENEDROME》", event_ja: "RESCENE 1stミニアルバム 《SCENEDROME》 リリース" },
  { id: "history-2024-debut", date: "2024. 03", event_ko: "더뮤즈 첫 5인조 걸그룹 리센느(RESCENE) 공식 데뷔 (싱글 1집 《Re:Scene》)", event_en: "RESCENE officially debuted with the 1st Single Album 《Re:Scene》", event_ja: "初の5人組ガールズグループRESCENEが正式デビュー (1stシングル 《Re:Scene》)" },
  { id: "history-2020-founded", date: "2020. 12", event_ko: "더뮤즈엔터테인먼트 법인 설립", event_en: "THE MUZE Entertainment Co., Ltd. founded", event_ja: "THE MUZE Entertainment 法人設立" },
];

const historyDateValue = (date: string) => {
  const [year = 0, month = 0, day = 0] = date.match(/\d+/g)?.map(Number) ?? [];
  return year * 10_000 + month * 100 + day;
};

export const sortHistoryNewestFirst = (entries: HistoryEntry[]) =>
  [...entries].sort((a, b) => historyDateValue(b.date) - historyDateValue(a.date));

export const normalizeHistory = (value: unknown): HistoryEntry[] => {
  if (!Array.isArray(value)) return DEFAULT_HISTORY;

  const entries = value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Partial<HistoryEntry>;
    return [{
      id: typeof entry.id === "string" && entry.id ? entry.id : `history-${index}`,
      date: typeof entry.date === "string" ? entry.date : "",
      event_ko: typeof entry.event_ko === "string" ? entry.event_ko : "",
      event_en: typeof entry.event_en === "string" ? entry.event_en : "",
      event_ja: typeof entry.event_ja === "string" ? entry.event_ja : "",
    }];
  });

  return sortHistoryNewestFirst(entries);
};
