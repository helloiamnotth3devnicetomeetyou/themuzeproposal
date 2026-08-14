"use client";

import { Check, CircleAlert } from "lucide-react";
import {
  CoverAssetField,
  HeroAssetField,
  TrackAssetField,
} from "@/admin/components/assets/MusicAssetFields";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import GalleryManager from "@/admin/components/assets/GalleryManager";
import FormField from "@/admin/components/content/FormField";
import CustomSelect from "@/core/components/form/CustomSelect";
import { spotifyAlbumId } from "@/core/http/spotify";
import {
  ALBUM_TYPES,
  type AlbumEditorDraft,
  type AlbumValidationResult,
  type EditorTab,
  type TrackDraft,
  type UploadedAsset,
} from "@/core/utils/music-editor";
import DiscographyTrackSection from "./DiscographyTrackSection";
import type { DiscographyLanguage } from "./useDiscographyEditor";

type PatchDraft = (
  patch:
    | Partial<AlbumEditorDraft>
    | ((current: AlbumEditorDraft) => AlbumEditorDraft),
) => void;

type Props = {
  artistId: string;
  albums: AlbumEditorDraft[];
  draft: AlbumEditorDraft;
  tab: EditorTab;
  language: DiscographyLanguage;
  expandedTrack: string | null;
  validation: AlbumValidationResult | null;
  patchDraft: PatchDraft;
  patchTrack: (trackId: string, patch: Partial<TrackDraft>) => void;
  registerUpload: (asset: UploadedAsset) => void;
  onError: (message: string) => void;
  onToast: (message: string) => void;
  onOpenBulk: () => void;
  onAddTrack: (track: TrackDraft) => void;
  onToggleTrack: (trackId: string) => void;
  onDragStart: (trackId: string) => void;
  onReorderTrack: (trackId: string) => void;
};

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

export default function DiscographyEditorSections({
  artistId,
  albums,
  draft,
  tab,
  language,
  expandedTrack,
  validation,
  patchDraft,
  patchTrack,
  registerUpload,
  onError,
  onToast,
  onOpenBulk,
  onAddTrack,
  onToggleTrack,
  onDragStart,
  onReorderTrack,
}: Props) {
  return (
    <div className="music-editor-body">
      {tab === "basic" && (
        <div className="music-section-stack music-basic-section">
          <div className="content-section-heading">
            <h3>앨범 기본 정보</h3>
            <span>
              공개 페이지에 표시되는 정보와 앨범 고유 ID를 설정합니다.
            </span>
          </div>
          <div className="music-field-grid two">
            <label className="music-field">
              <span>
                앨범 제목 <b>*</b>
              </span>
              <input
                className="admin-input"
                value={draft.title}
                onChange={(event) =>
                  patchDraft({
                    title: event.target.value,
                    title_ko: draft.title_ko || event.target.value,
                  })
                }
                autoFocus
              />
            </label>
            <div className="music-field">
              <span>
                앨범 종류 <b>*</b>
              </span>
              <CustomSelect
                ariaLabel="앨범 종류"
                value={draft.type}
                onChange={(type) => patchDraft({ type })}
                options={ALBUM_TYPES.map((type) => ({
                  value: type,
                  label: type,
                }))}
              />
            </div>
          </div>
          <FormField
            activeLang={language}
            label="표시 제목"
            valueKo={draft.title_ko}
            valueEn={draft.title_en}
            valueJa={draft.title_ja}
            onChangeKo={(value) => patchDraft({ title_ko: value })}
            onChangeEn={(value) => patchDraft({ title_en: value })}
            onChangeJa={(value) => patchDraft({ title_ja: value })}
          />
          <label className="music-field music-date-field">
            <span>발매일</span>
            <input
              type="date"
              className="admin-input"
              value={draft.release_date}
              onChange={(event) =>
                patchDraft({ release_date: event.target.value })
              }
            />
          </label>
          <div className="music-divider" />
          <CoverAssetField
            artistId={artistId}
            albumId={draft.id}
            value={draft.cover_url}
            onError={onError}
            onUploaded={(asset, color) => {
              registerUpload(asset);
              patchDraft({ cover_url: asset.url, color });
            }}
          />
          <HeroAssetField
            artistId={artistId}
            albumId={draft.id}
            value={draft.hero_image_url}
            onError={onError}
            onUploaded={(asset) => {
              registerUpload(asset);
              patchDraft({ hero_image_url: asset.url });
            }}
            onClear={() => patchDraft({ hero_image_url: "" })}
          />
          <TrackAssetField
            label="앨범 타이포 로고"
            hint="SVG 파일을 끌어놓거나 선택하세요 · 테마 색상 자동 적용 · 최대 10MB"
            accept="image/svg+xml,.svg"
            maxBytes={10 * 1024 * 1024}
            artistId={artistId}
            albumId={draft.id}
            trackId="album"
            kind="logo"
            secureSvg
            value={draft.typo_logo_url}
            onError={onError}
            onClear={() => patchDraft({ typo_logo_url: "" })}
            onUploaded={(asset) => {
              registerUpload(asset);
              patchDraft({ typo_logo_url: asset.url });
            }}
          />
          <label className="music-field music-color-field">
            <span>테마 컬러</span>
            <div>
              <input
                type="color"
                value={draft.color}
                onChange={(event) =>
                  patchDraft({ color: event.target.value.toUpperCase() })
                }
              />
              <input
                className="admin-input"
                value={draft.color}
                onChange={(event) =>
                  patchDraft({ color: event.target.value.toUpperCase() })
                }
              />
            </div>
            <small>커버 업로드 시 자동으로 추천되며 직접 조정할 수 있습니다.</small>
          </label>
        </div>
      )}

      {tab === "content" && (
        <div className="music-section-stack">
          <div className="content-section-heading">
            <h3>앨범 소개와 외부 링크</h3>
            <span>
              언어별 소개를 작성하고 앨범 단위 스트리밍 링크를 연결합니다.
            </span>
          </div>
          <label className="music-field">
            <span>
              {language === "ko"
                ? "한국어"
                : language === "en"
                  ? "영어"
                  : "일본어"} 앨범 소개
            </span>
            <textarea
              className="admin-input"
              rows={9}
              value={draft[`description_${language}`]}
              onChange={(event) =>
                patchDraft({
                  [`description_${language}`]: event.target.value,
                } as Partial<AlbumEditorDraft>)
              }
              placeholder="앨범의 콘셉트와 이야기를 입력하세요."
            />
          </label>
          <div className="music-field-grid two">
            <label className="music-field">
              <span>Spotify 앨범 ID 또는 URL</span>
              <input
                className="admin-input"
                value={draft.spotify_id}
                onChange={(event) =>
                  patchDraft({ spotify_id: event.target.value })
                }
                onBlur={() =>
                  patchDraft({
                    spotify_id: spotifyAlbumId(draft.spotify_id) || "",
                  })
                }
                placeholder="Spotify 앨범 ID 또는 URL"
              />
            </label>
            <label className="music-field">
              <span>YouTube Music URL</span>
              <input
                type="url"
                className="admin-input"
                value={draft.youtube_url}
                onChange={(event) =>
                  patchDraft({ youtube_url: event.target.value })
                }
                placeholder="https://music.youtube.com/…"
              />
            </label>
          </div>
        </div>
      )}

      {tab === "tracks" && (
        <DiscographyTrackSection
          artistId={artistId}
          draft={draft}
          language={language}
          expandedTrack={expandedTrack}
          onOpenBulk={onOpenBulk}
          onAddTrack={onAddTrack}
          onToggleTrack={onToggleTrack}
          onDragStart={onDragStart}
          onReorder={onReorderTrack}
          patchDraft={patchDraft}
          patchTrack={patchTrack}
          registerUpload={registerUpload}
          onError={onError}
        />
      )}

      {tab === "gallery" && (
        <div className="music-section-stack music-gallery-section">
          <div className="content-section-heading">
            <h3>앨범 갤러리</h3>
            <span>
              이 앨범의 이미지를 모으고, 이미지에 등장하는 멤버를 함께 지정합니다.
            </span>
          </div>
          <GalleryManager
            artistId={artistId || null}
            scope="album"
            albumId={
              albums.some((album) => album.id === draft.id) ? draft.id : null
            }
            onError={onError}
            onToast={onToast}
          />
        </div>
      )}

      {tab === "publish" && (
        <div className="music-section-stack">
          <div className="content-section-heading">
            <h3>공개 설정</h3>
            <span>
              공개 전 필수 정보를 확인하고,
              <br />
              연결된 미디어를 마지막으로 점검합니다.
            </span>
          </div>
          <div className="music-publish-summary">
            <div className="music-publish-cover">
              {draft.cover_url ? (
                <AdminAssetImage src={draft.cover_url} alt="" sizes="120px" />
              ) : (
                <span>커버 없음</span>
              )}
            </div>
            <div>
              <p>{draft.type}</p>
              <h4>{draft.title || "제목 없음"}</h4>
              <span>
                {draft.release_date || "발매일 미설정"} · {draft.tracks.length}곡
              </span>
              <div className="music-summary-badges">
                <AssetBadge
                  active={draft.tracks.some((track) => Boolean(track.audio_url))}
                >
                  MP3 {draft.tracks.filter((track) => track.audio_url).length}
                </AssetBadge>
                <AssetBadge
                  active={draft.tracks.some((track) => Boolean(track.youtube_url))}
                >
                  YouTube {draft.tracks.filter((track) => track.youtube_url).length}
                </AssetBadge>
                <AssetBadge active={Boolean(draft.typo_logo_url)}>Typo</AssetBadge>
              </div>
            </div>
          </div>
          <div
            className={`music-publish-check ${validation?.canPublish ? "is-ready" : ""}`}
          >
            <span>
              {validation?.canPublish ? (
                <Check aria-hidden="true" />
              ) : (
                <CircleAlert aria-hidden="true" />
              )}
            </span>
            <div>
              <b>
                {validation?.canPublish
                  ? "공개할 준비가 되었습니다."
                  : "공개 전 확인이 필요합니다."}
              </b>
              <p>
                {validation?.canPublish
                  ? "필수 정보가 모두 입력되었습니다."
                  : validation?.publishIssues.join(" · ")}
              </p>
            </div>
          </div>
          <label className="music-publish-toggle">
            <span>
              <b>웹사이트에 공개</b>
              <small>
                공개하면 디스코그래피에서 앨범과 업로드한 음원을 볼 수 있습니다.
              </small>
            </span>
            <input
              type="checkbox"
              checked={draft.is_published}
              onChange={(event) => {
                if (event.target.checked && !validation?.canPublish) {
                  onError(`공개 전 확인: ${validation?.publishIssues.join(", ")}`);
                  return;
                }
                patchDraft({ is_published: event.target.checked });
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
