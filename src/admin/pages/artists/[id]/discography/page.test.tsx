import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AlbumEditorDraft } from "@/core/utils/music-editor";

const draft: AlbumEditorDraft = {
  id: "album-1", artist_id: "artist-1", title: "Existing album", title_ko: "Existing album", title_en: "", title_ja: "", type: "Mini Album", release_date: "2026-01-01",
  cover_url: "cover.jpg", hero_image_url: "", typo_logo_url: "", color: "#FFFFFF", spotify_id: "", youtube_url: "",
  description_ko: "", description_en: "", description_ja: "", is_published: false, published_at: null, sort_order: 1,
  tracks: [{ id: "track-1", title: "Opening", title_ko: "Opening", title_en: "", title_ja: "", is_title: true, spotify_url: "", youtube_url: "", audio_url: "", music_video_url: "" }],
};

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), patchDraft: vi.fn(), setDraft: vi.fn(), setLoading: vi.fn(), setError: vi.fn() }));

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "artist-1" }) }));
vi.mock("@/admin/components/shell/AdminDialogProvider", () => ({ useAdminConfirm: () => vi.fn().mockResolvedValue(true) }));
vi.mock("@/admin/components/shell/DeleteConfirmDialog", () => ({ default: () => null }));
vi.mock("@/admin/components/assets/MusicAssetFields", () => ({ CoverAssetField: () => null, HeroAssetField: () => null, TrackAssetField: () => null }));
vi.mock("@/admin/components/assets/GalleryManager", () => ({ default: () => null }));
vi.mock("@/admin/components/content/PreviewButton", () => ({ default: () => null }));
vi.mock("@/core/components/feedback/LoadingIndicator", () => ({ default: () => null }));
vi.mock("@/core/components/form/CustomSelect", () => ({ default: () => <select aria-label="album type" /> }));
vi.mock("@/admin/hooks/useAdminPreview", () => ({ useAdminPreview: () => ({ openPreview: vi.fn(), canPreview: true }) }));
vi.mock("@/admin/hooks/useAdminEntityEditor", () => ({
  useAdminEntityEditor: () => ({
    draft, setDraft: mocks.setDraft, setSnapshot: vi.fn(), dirty: true, loading: false, setLoading: mocks.setLoading,
    saving: false, setSaving: vi.fn(), deleting: false, setDeleting: vi.fn(), deleteOpen: false, setDeleteOpen: vi.fn(),
    error: "", setError: mocks.setError, toast: "", setToast: vi.fn(), patchDraft: mocks.patchDraft,
  }),
}));
vi.mock("@/core/supabase/client", () => ({
  supabase: {
    rpc: mocks.rpc,
    from: vi.fn((table: string) => table === "artists"
      ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "artist-1", name: "Artist", slug: "artist" }, error: null }) }) }) }
      : {
        select: () => ({ eq: () => ({ order: () => ({ overrideTypes: async () => ({ data: [], error: null }) }) }) }),
        update: () => ({ eq: async () => ({ error: null }) }),
      }),
    storage: { from: () => ({ remove: vi.fn() }) },
  },
}));

import DiscographyAdmin from "./page";

describe("DiscographyAdmin", () => {
  it("renders the loaded draft and sends a save request", async () => {
    mocks.rpc.mockResolvedValue({ data: "album-1", error: null });
    const { container } = render(<DiscographyAdmin />);
    const title = container.querySelector("input[value='Existing album']")!;
    fireEvent.change(title, { target: { value: "Updated album" } });
    expect(mocks.patchDraft).toHaveBeenCalledWith({ title: "Updated album", title_ko: "Existing album" });

    const save = container.querySelector(".music-header-actions .admin-btn-primary")!;
    fireEvent.click(save);
    await vi.waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith("save_album_with_tracks", expect.any(Object)));
  });
});
