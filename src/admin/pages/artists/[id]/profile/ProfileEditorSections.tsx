import ArtistSceneManager from "@/admin/components/scenes/ArtistSceneManager";
import FormField from "@/admin/components/content/FormField";
import GalleryManager from "@/admin/components/assets/GalleryManager";
import ImageAssetField, {
  type UploadedImageAsset,
} from "@/admin/components/assets/ImageAssetField";
import SocialLinksField from "@/admin/components/content/SocialLinksField";
import CustomSelect from "@/core/components/form/CustomSelect";
import {
  toArtistSlug,
  type ProfileDraft,
  type ProfileTab,
} from "./profile-editor-model";

interface ProfileEditorSectionsProps {
  artistId: string | null;
  isNew: boolean;
  draft: ProfileDraft;
  saveIssues: string[];
  tab: ProfileTab;
  patchDraft: (
    patch: Partial<ProfileDraft> | ((current: ProfileDraft) => ProfileDraft),
  ) => void;
  onAssetChange: (field: "imageUrl" | "logoUrl", value: string) => void;
  onUploaded: (asset: UploadedImageAsset) => void;
  onError: (message: string) => void;
  onToast: (message: string) => void;
}

export default function ProfileEditorSections({
  artistId,
  isNew,
  draft,
  saveIssues,
  tab,
  patchDraft,
  onAssetChange,
  onUploaded,
  onError,
  onToast,
}: ProfileEditorSectionsProps) {
  return (
    <div className="content-editor-stack">
      {tab === "basic" && (
        <>
          <div className="content-section-heading">
            <h3>아티스트 기본 정보</h3>
            <span>공개 페이지와 관리자 목록에서 사용하는 이름과 고유 ID입니다.</span>
          </div>
          <div className="music-field-grid two">
            <label className="music-field">
              <span>아티스트명 (한국어) <b>*</b></span>
              <input className="admin-input" value={draft.name} onChange={(event) => patchDraft({ name: event.target.value })} autoFocus />
            </label>
            <label className="music-field">
              <span>아티스트명 (영문) <b>*</b></span>
              <input className="admin-input" value={draft.engName} onChange={(event) => patchDraft({ engName: event.target.value })} />
            </label>
          </div>
          <label className="music-field content-field-short">
            <span>아티스트명 (일본어)</span>
            <input className="admin-input" value={draft.jaName} onChange={(event) => patchDraft({ jaName: event.target.value })} />
          </label>
          <div className="music-field-grid two">
            <label className="music-field">
              <span>공개 경로</span>
              <input className="admin-input" value={`/${toArtistSlug(draft.engName) || "english-name"}`} readOnly />
              <small>영문명을 기준으로 자동 생성됩니다.</small>
            </label>
            <div className="music-field">
              <span>유형</span>
              <CustomSelect
                ariaLabel="아티스트 유형"
                value={draft.type}
                onChange={(type) => patchDraft({ type })}
                options={[
                  { value: "group", label: "그룹" },
                  { value: "solo", label: "솔로" },
                ]}
              />
            </div>
          </div>
          <label className="music-field content-field-short">
            <span>데뷔일</span>
            <input type="date" className="admin-input" value={draft.debutDate} onChange={(event) => patchDraft({ debutDate: event.target.value })} />
          </label>
        </>
      )}

      {tab === "visual" && (
        <>
          <div className="content-section-heading">
            <h3>대표 비주얼</h3>
            <span>아티스트를 식별하는 이미지와 테마 컬러를 설정합니다.</span>
          </div>
          <div className="content-asset-grid">
            <ImageAssetField
              label="프로필 이미지"
              hint="드래그앤드롭하거나 파일을 선택하세요. 공개 프로필에서는 원본 비율을 유지해 표시됩니다."
              value={draft.imageUrl}
              artistKey={artistId || "new-artist"}
              entityKey={artistId || "new-artist"}
              kind="artist-profile"
              shape="portrait"
              onChange={(imageUrl) => onAssetChange("imageUrl", imageUrl)}
              onUploaded={onUploaded}
              onError={onError}
            />
            <ImageAssetField
              label="아티스트 로고"
              hint="SVG 또는 투명 배경 PNG·WebP를 권장합니다. SVG는 서버에서 안전성 검사 후 저장됩니다."
              value={draft.logoUrl}
              artistKey={artistId || "new-artist"}
              entityKey={artistId || "new-artist"}
              kind="artist-logo"
              shape="logo"
              onChange={(logoUrl) => onAssetChange("logoUrl", logoUrl)}
              onUploaded={onUploaded}
              onError={onError}
            />
          </div>
          <label className="music-field content-field-short">
            <span>테마 컬러 <b>*</b></span>
            <div className="content-color-row">
              <input type="color" value={draft.color} onChange={(event) => patchDraft({ color: event.target.value.toUpperCase() })} />
              <input className="admin-input" value={draft.color} onChange={(event) => patchDraft({ color: event.target.value.toUpperCase() })} />
            </div>
          </label>
        </>
      )}

      {tab === "content" && (
        <>
          <div className="content-section-heading">
            <h3>아티스트 소개</h3>
            <span>한국어 소개는 필수이며 영문과 일본어는 준비되었을 때 추가할 수 있습니다.</span>
          </div>
          <FormField
            label="아티스트 소개"
            type="richtext"
            required
            valueKo={draft.descKo}
            valueEn={draft.descEn}
            valueJa={draft.descJa}
            onChangeKo={(value) => patchDraft({ descKo: value })}
            onChangeEn={(value) => patchDraft({ descEn: value })}
            onChangeJa={(value) => patchDraft({ descJa: value })}
          />
        </>
      )}

      {tab === "social" && (
        <>
          <div className="content-section-heading">
            <h3>아티스트 공식 계정</h3>
            <span>공개 프로필에 연결할 공식 채널과 음악 플랫폼을 등록합니다. 필요한 만큼 자유롭게 추가할 수 있습니다.</span>
          </div>
          <SocialLinksField value={draft.socialLinks} onChange={(socialLinks) => patchDraft({ socialLinks })} />
        </>
      )}

      {tab === "scenes" && (
        <>
          <div className="content-section-heading">
            <h3>인터랙티브 멤버 장면</h3>
            <span>한 화면 안에서 전환할 콘셉트 이미지와 멤버별 정밀 실루엣을 편집합니다.</span>
          </div>
          <ArtistSceneManager artistId={isNew ? null : artistId} heroUrl={draft.imageUrl} onError={onError} onToast={onToast} />
        </>
      )}

      {tab === "gallery" && (
        <>
          <div className="content-section-heading">
            <h3>아티스트 통합 갤러리</h3>
            <span>앨범과 멤버에 등록된 이미지를 한곳에서 보고, 두 분류를 교차해 정리합니다.</span>
          </div>
          <GalleryManager artistId={isNew ? null : artistId} scope="artist" onError={onError} onToast={onToast} />
        </>
      )}

      {tab === "publish" && (
        <>
          <div className="content-section-heading">
            <h3>공개 설정</h3>
            <span>저장 후 사이트 메뉴와 아티스트 프로필에 표시할지 선택합니다.</span>
          </div>
          <div className="content-publish-summary">
            <div><span>아티스트</span><strong>{draft.name || "미입력"} / {draft.engName || "미입력"}</strong></div>
            <div><span>테마 컬러</span><strong>{draft.color}</strong></div>
            <div><span>유형 · 데뷔일</span><strong>{draft.type === "group" ? "그룹" : "솔로"} · {draft.debutDate || "미설정"}</strong></div>
            <div><span>필수 정보</span><strong>{saveIssues.length ? `${saveIssues.length}개 확인 필요` : "저장 준비 완료"}</strong></div>
          </div>
          <div className="content-choice-grid">
            <label className="content-choice">
              <input type="radio" checked={draft.isActive} onChange={() => patchDraft({ isActive: true })} />
              <span><b>바로 공개</b><small>사이트 메뉴와 프로필에 표시합니다.</small></span>
            </label>
            <label className="content-choice">
              <input type="radio" checked={!draft.isActive} onChange={() => patchDraft({ isActive: false })} />
              <span><b>비공개로 저장</b><small>준비가 끝난 뒤 공개할 수 있습니다.</small></span>
            </label>
          </div>
        </>
      )}
    </div>
  );
}
