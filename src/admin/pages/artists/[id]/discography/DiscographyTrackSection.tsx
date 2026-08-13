import { GripVertical, Music } from "lucide-react";
import FormField from "@/admin/components/content/FormField";
import { TrackAssetField } from "@/admin/components/assets/MusicAssetFields";
import type {
  AlbumEditorDraft,
  TrackDraft,
  UploadedAsset,
} from "@/core/utils/music-editor";
import type { DiscographyLanguage } from "./useDiscographyEditor";
import { createTrackDraft } from "./discography-editor-model";

function AssetBadge({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className={`music-asset-badge ${active ? "is-ready" : ""}`}>
      {children}
    </span>
  );
}

type Props = {
  artistId: string;
  draft: AlbumEditorDraft;
  language: DiscographyLanguage;
  expandedTrack: string | null;
  onOpenBulk: () => void;
  onAddTrack: (track: TrackDraft) => void;
  onToggleTrack: (trackId: string) => void;
  onDragStart: (trackId: string) => void;
  onReorder: (trackId: string) => void;
  patchDraft: (patch: Partial<AlbumEditorDraft>) => void;
  patchTrack: (trackId: string, patch: Partial<TrackDraft>) => void;
  registerUpload: (asset: UploadedAsset) => void;
  onError: (message: string) => void;
};

export default function DiscographyTrackSection({
  artistId,
  draft,
  language,
  expandedTrack,
  onOpenBulk,
  onAddTrack,
  onToggleTrack,
  onDragStart,
  onReorder,
  patchDraft,
  patchTrack,
  registerUpload,
  onError,
}: Props) {
  return (
    <div className="music-section-stack music-track-section">
      <div className="music-section-title" data-tour-id="track-add">
        <div>
          <h3>수록곡과 미디어</h3>
          <span>곡명, MP3, Spotify, YouTube 음원을 한곳에서 관리합니다.</span>
        </div>
        <div>
          <button
            type="button"
            data-tour-id="track-bulk"
            className="admin-btn admin-btn-secondary"
            onClick={onOpenBulk}
          >
            여러 곡 붙여넣기
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => onAddTrack(createTrackDraft())}
          >
            + 트랙 추가
          </button>
        </div>
      </div>
      <div className="music-track-table">
        <div className="music-track-head">
          <span>순서</span>
          <span>곡 정보</span>
          <span>미디어 상태</span>
          <span />
        </div>
        {draft.tracks.map((track, index) => (
          <div
            key={track.id}
            className={`music-track-wrap ${expandedTrack === track.id ? "is-open" : ""}`}
            draggable
            onDragStart={() => onDragStart(track.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onReorder(track.id)}
          >
            <div className="music-track-row">
              <button
                type="button"
                className="music-track-grip"
                aria-label={`${track.title || "트랙"} 순서 변경`}
              >
                <GripVertical aria-hidden="true" />
                <i>{String(index + 1).padStart(2, "0")}</i>
              </button>
              <div className="music-track-title">
                <input
                  value={track.title}
                  onChange={(event) =>
                    patchTrack(track.id, { title: event.target.value })
                  }
                  placeholder="곡명"
                />
                <label>
                  <input
                    type="checkbox"
                    checked={track.is_title}
                    onChange={(event) =>
                      patchTrack(track.id, { is_title: event.target.checked })
                    }
                  />{" "}
                  타이틀곡
                </label>
              </div>
              <div className="music-track-badges">
                <AssetBadge active={Boolean(track.audio_url)}>MP3</AssetBadge>
                <AssetBadge active={Boolean(track.spotify_url)}>
                  Spotify
                </AssetBadge>
                <AssetBadge active={Boolean(track.youtube_url)}>
                  YouTube
                </AssetBadge>
              </div>
              <div className="music-track-actions" data-tour-id="track-actions">
                <button
                  type="button"
                  data-tour-id="track-media"
                  onClick={() => onToggleTrack(track.id)}
                >
                  {expandedTrack === track.id ? "접기" : "미디어"}
                </button>
                <button
                  type="button"
                  data-tour-id="track-delete"
                  className="is-danger"
                  onClick={() =>
                    patchDraft({
                      tracks: draft.tracks.filter(
                        (item) => item.id !== track.id,
                      ),
                    })
                  }
                >
                  삭제
                </button>
              </div>
            </div>
            {expandedTrack === track.id && (
              <div className="music-track-assets">
                <div className="music-track-link-grid">
                  <FormField
                    activeLang={language}
                    label="곡명"
                    valueKo={track.title_ko}
                    valueEn={track.title_en}
                    valueJa={track.title_ja}
                    onChangeKo={(value) =>
                      patchTrack(track.id, { title_ko: value })
                    }
                    onChangeEn={(value) =>
                      patchTrack(track.id, { title_en: value })
                    }
                    onChangeJa={(value) =>
                      patchTrack(track.id, { title_ja: value })
                    }
                  />
                </div>
                <div className="music-track-link-grid">
                  <label className="music-field">
                    <span>곡별 Spotify 링크</span>
                    <input
                      type="url"
                      className="admin-input"
                      value={track.spotify_url}
                      onChange={(event) =>
                        patchTrack(track.id, {
                          spotify_url: event.target.value,
                        })
                      }
                      placeholder="https://open.spotify.com/track/…"
                    />
                  </label>
                  <label className="music-field">
                    <span>곡별 YouTube 링크</span>
                    <input
                      type="url"
                      className="admin-input"
                      value={track.youtube_url}
                      onChange={(event) =>
                        patchTrack(track.id, {
                          youtube_url: event.target.value,
                        })
                      }
                      placeholder="https://youtube.com/watch?v=…"
                    />
                  </label>
                </div>
                <div className="music-track-asset-grid is-single">
                  <TrackAssetField
                    label="음원 MP3"
                    hint="파일을 끌어놓거나 선택하세요 · 최대 100MB"
                    accept="audio/mpeg,audio/mp3,.mp3"
                    maxBytes={100 * 1024 * 1024}
                    artistId={artistId}
                    albumId={draft.id}
                    trackId={track.id}
                    kind="audio"
                    value={track.audio_url}
                    onError={onError}
                    onClear={() => patchTrack(track.id, { audio_url: "" })}
                    onUploaded={(asset) => {
                      registerUpload(asset);
                      patchTrack(track.id, { audio_url: asset.url });
                    }}
                  />
                </div>
                {track.audio_url && (
                  <audio
                    className="music-audio-preview"
                    controls
                    preload="metadata"
                    src={track.audio_url}
                  >
                    브라우저가 오디오 재생을 지원하지 않습니다.
                  </audio>
                )}
              </div>
            )}
          </div>
        ))}
        {!draft.tracks.length && (
          <div className="music-track-empty">
            <span>
              <Music aria-hidden="true" />
            </span>
            <b>아직 수록곡이 없습니다.</b>
            <p>한 곡씩 추가하거나 트랙리스트를 한 번에 붙여넣으세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
