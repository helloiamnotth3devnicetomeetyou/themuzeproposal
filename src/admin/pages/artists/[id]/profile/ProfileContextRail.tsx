import { type CSSProperties } from "react";
import { Check, Minus } from "lucide-react";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import type { ProfileDraft } from "./profile-editor-model";

interface ProfileContextRailProps {
  completion: Array<{ label: string; ready: boolean }>;
  draft: ProfileDraft;
  isNew: boolean;
  onCancel: () => void;
}

export default function ProfileContextRail({
  completion,
  draft,
  isNew,
  onCancel,
}: ProfileContextRailProps) {
  return (
    <div className="profile-context-rail" data-tour-id="artist-profile-context">
      <div className="profile-context-portrait" style={{ "--artist-color": draft.color } as CSSProperties}>
        {draft.imageUrl ? <AdminAssetImage src={draft.imageUrl} alt="" sizes="280px" /> : <div><span>프로필 이미지</span>{draft.engName && <b>{draft.engName.slice(0, 2)}</b>}</div>}
      </div>
      <div className="profile-context-copy">
        <p>{draft.name || "아티스트 이름"}</p>
        <strong>{draft.engName || "ENGLISH NAME"}</strong>
      </div>
      <div className="profile-completion">
        <p>프로필 준비 상태</p>
        {completion.map((item) => (
          <div key={item.label} className={item.ready ? "is-ready" : ""}>
            <i>{item.ready ? <Check aria-hidden="true" /> : <Minus aria-hidden="true" />}</i>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      {isNew && <button type="button" className="content-rail-quiet-action" onClick={onCancel}>작성 취소</button>}
    </div>
  );
}
