import FormField from "@/admin/components/content/FormField";
import GalleryManager from "@/admin/components/assets/GalleryManager";
import ImageAssetField, {
  type UploadedImageAsset,
} from "@/admin/components/assets/ImageAssetField";
import SocialLinksField from "@/admin/components/content/SocialLinksField";
import {
  toMemberSlug,
  type MemberDraft,
  type MemberTab,
} from "./member-editor-model";

interface MemberEditorSectionsProps {
  artistId: string;
  draft: MemberDraft;
  newMemberId: string | null;
  tab: MemberTab;
  patchDraft: (
    patch: Partial<MemberDraft> | ((current: MemberDraft) => MemberDraft),
  ) => void;
  onImageChange: (imageUrl: string) => void;
  onUploaded: (asset: UploadedImageAsset) => void;
  onError: (message: string) => void;
  onToast: (message: string) => void;
}

export default function MemberEditorSections({
  artistId,
  draft,
  newMemberId,
  tab,
  patchDraft,
  onImageChange,
  onUploaded,
  onError,
  onToast,
}: MemberEditorSectionsProps) {
  return (
    <div className="content-editor-stack">
      {tab === "basic" && (
        <>
          <div className="content-section-heading">
            <h3>멤버 기본 정보</h3>
            <span>프로필과 멤버 목록에서 사용하는 이름과 역할입니다.</span>
          </div>
          <div className="music-field-grid two">
            <label className="music-field">
              <span>이름 (한국어) <b>*</b></span>
              <input className="admin-input" value={draft.name} onChange={(event) => patchDraft({ name: event.target.value })} autoFocus />
            </label>
            <label className="music-field">
              <span>이름 (영문) <b>*</b></span>
              <input className="admin-input" value={draft.engName} onChange={(event) => patchDraft({ engName: event.target.value })} />
            </label>
          </div>
          <label className="music-field content-field-short">
            <span>공개 경로</span>
            <input className="admin-input" value={`/${toMemberSlug(draft.engName) || "english-name"}`} readOnly />
            <small>영문명을 기준으로 자동 생성됩니다.</small>
          </label>
          <label className="music-field content-field-short">
            <span>이름 (일본어)</span>
            <input className="admin-input" value={draft.jaName} onChange={(event) => patchDraft({ jaName: event.target.value })} />
          </label>
          <div className="music-divider" />
          <FormField
            label="역할 / 포지션"
            valueKo={draft.roleKo}
            valueEn={draft.roleEn}
            valueJa={draft.roleJa}
            onChangeKo={(value) => patchDraft({ roleKo: value })}
            onChangeEn={(value) => patchDraft({ roleEn: value })}
            onChangeJa={(value) => patchDraft({ roleJa: value })}
            required
          />
        </>
      )}

      {tab === "profile" && (
        <>
          <div className="content-section-heading">
            <h3>프로필 비주얼</h3>
            <span>멤버를 식별하는 이미지와 기본 프로필 정보를 설정합니다.</span>
          </div>
          <ImageAssetField
            label="멤버 프로필 이미지"
            hint="선택 사항입니다. 드래그앤드롭하거나 파일을 선택하세요."
            value={draft.imageUrl}
            artistKey={artistId}
            entityKey={draft.id || newMemberId || "new-member"}
            kind="member-profile"
            shape="portrait"
            onChange={onImageChange}
            onUploaded={onUploaded}
            onError={onError}
          />
          <div className="music-field-grid two">
            <label className="music-field">
              <span>생년월일</span>
              <input className="admin-input" value={draft.birth} onChange={(event) => patchDraft({ birth: event.target.value })} placeholder="2004. 05. 25" />
            </label>
            <label className="music-field">
              <span>MBTI</span>
              <input className="admin-input" value={draft.mbti} onChange={(event) => patchDraft({ mbti: event.target.value.toUpperCase() })} placeholder="ESFP" />
            </label>
          </div>
          <label className="music-field content-field-short">
            <span>테마 컬러</span>
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
            <h3>멤버 소개</h3>
            <span>멤버 페이지에서 보여줄 소개를 언어별로 입력합니다.</span>
          </div>
          <FormField
            label="멤버 소개"
            type="textarea"
            valueKo={draft.bioKo}
            valueEn={draft.bioEn}
            valueJa={draft.bioJa}
            onChangeKo={(value) => patchDraft({ bioKo: value })}
            onChangeEn={(value) => patchDraft({ bioEn: value })}
            onChangeJa={(value) => patchDraft({ bioJa: value })}
          />
          <div className="content-publish-summary">
            <div><span>멤버</span><strong>{draft.name || "미입력"} / {draft.engName || "미입력"}</strong></div>
            <div><span>역할</span><strong>{draft.roleKo || "미입력"}</strong></div>
            <div><span>공개 경로</span><strong>{toMemberSlug(draft.engName) ? `/${toMemberSlug(draft.engName)}` : "영문명 입력 필요"}</strong></div>
            <div><span>프로필</span><strong>{draft.birth || "생년월일 미설정"} · {draft.mbti || "MBTI 미설정"}</strong></div>
          </div>
        </>
      )}

      {tab === "social" && (
        <>
          <div className="content-section-heading">
            <h3>멤버 공식 계정</h3>
            <span>멤버 개인의 공식 채널과 음악 플랫폼 계정을 등록합니다. 필요한 만큼 자유롭게 추가할 수 있습니다.</span>
          </div>
          <SocialLinksField value={draft.socialLinks} onChange={(socialLinks) => patchDraft({ socialLinks })} />
        </>
      )}

      {tab === "gallery" && (
        <>
          <div className="content-section-heading">
            <h3>멤버 갤러리</h3>
            <span>이 멤버의 이미지를 모으고, 관련 앨범을 함께 지정합니다.</span>
          </div>
          <GalleryManager artistId={artistId || null} scope="member" memberId={draft.id} onError={onError} onToast={onToast} />
        </>
      )}
    </div>
  );
}
