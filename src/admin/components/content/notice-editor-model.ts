export type NoticeDraft = {
  id: string | null;
  titleKo: string;
  titleEn: string;
  titleJa: string;
  contentKo: string;
  contentEn: string;
  contentJa: string;
  categoryKo: string;
  categoryEn: string;
  categoryJa: string;
  date: string;
  published: boolean;
};

export const duplicateNoticeDraft = (draft: NoticeDraft): NoticeDraft => ({
  ...draft,
  id: null,
  published: false,
});

export function resolvePublishedAt(
  published: boolean,
  existingPublishedAt: string | null | undefined,
  now = new Date().toISOString(),
) {
  return published ? (existingPublishedAt ?? now) : null;
}
