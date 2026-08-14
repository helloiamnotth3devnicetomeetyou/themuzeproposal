import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import type { MemberDraft } from "./member-editor-model";

export default function MemberIdentity({
  draft,
  artistName,
}: {
  draft: MemberDraft | null;
  artistName: string;
}) {
  if (!draft) {
    return (
      <div className="content-identity-copy">
        <p>
          <span className="cms-status">선택 안 됨</span>
        </p>
        <h2>멤버를 선택하세요</h2>
        <small>{artistName}</small>
      </div>
    );
  }

  return (
    <>
      <span className="content-identity-art">
        {draft.imageUrl ? (
          <AdminAssetImage src={draft.imageUrl} alt="" sizes="56px" />
        ) : (
          <i style={{ background: draft.color }} />
        )}
      </span>
      <div className="content-identity-copy">
        <p>
          <span className={`cms-status ${draft.id ? "is-live" : ""}`}>
            {draft.id ? "등록됨" : "신규"}
          </span>
        </p>
        <h2>{draft.name || "이름 없는 멤버"}</h2>
        <small>{artistName}</small>
      </div>
    </>
  );
}
