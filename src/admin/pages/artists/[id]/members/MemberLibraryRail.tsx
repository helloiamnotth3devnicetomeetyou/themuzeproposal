import { LuPlus } from "react-icons/lu";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import type { Member, MemberDraft } from "./member-editor-model";

interface MemberLibraryRailProps {
  draft: MemberDraft | null;
  members: Member[];
  saving: boolean;
  sorting: boolean;
  sortDirty: boolean;
  onAdd: () => void;
  onSelect: (member: Member) => void;
  onDrop: (memberId: string) => void;
  onDragStart: (memberId: string) => void;
  onToggleSorting: () => void;
  onSaveOrder: () => void;
}

export default function MemberLibraryRail({
  draft,
  members,
  saving,
  sorting,
  sortDirty,
  onAdd,
  onSelect,
  onDrop,
  onDragStart,
  onToggleSorting,
  onSaveOrder,
}: MemberLibraryRailProps) {
  return (
    <>
      <div className="content-rail-heading">
        <div><h2>멤버 라이브러리</h2></div>
        <button type="button" onClick={onAdd} aria-label="멤버 추가"><LuPlus aria-hidden="true" /></button>
      </div>
      <div className="content-rail-sort">
        <span>{members.length}명</span>
        {members.length > 1 && <button type="button" onClick={onToggleSorting}>{sorting ? "정렬 취소" : "순서 변경"}</button>}
      </div>
      <div className="content-library-list member-library-list">
        {draft && !draft.id && (
          <button type="button" className="content-library-item is-selected">
            <span className="content-library-index">NEW</span>
            <span className="content-library-thumb"><i style={{ background: draft.color }} /></span>
            <span className="content-library-copy"><b>{draft.name || "새 멤버"}</b><small>{draft.roleKo || "기본 정보를 입력하세요"}</small></span>
          </button>
        )}
        {members.map((member, index) => (
          <button
            key={member.id}
            type="button"
            draggable={sorting}
            onDragStart={() => onDragStart(member.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onDrop(member.id)}
            onClick={() => onSelect(member)}
            className={`content-library-item ${draft?.id === member.id ? "is-selected" : ""} ${sorting ? "is-sorting" : ""}`}
          >
            <span className="content-library-index">{sorting ? "↕" : String(index + 1).padStart(2, "0")}</span>
            <span className="content-library-thumb">{member.image_url ? <AdminAssetImage src={member.image_url} alt="" sizes="48px" /> : <i style={{ background: member.color || BRAND_PINK_HEX }} />}</span>
            <span className="content-library-copy"><b>{member.name}</b><small>{member.role_ko || member.eng_name || "역할 미설정"}</small></span>
          </button>
        ))}
        {!members.length && !draft && <div className="content-library-empty"><b>등록된 멤버가 없습니다.</b><span>첫 멤버를 추가해 아티스트 라인업을 구성하세요.</span></div>}
      </div>
      {sorting && (
        <div className="content-rail-footer">
          <button type="button" className="admin-btn admin-btn-primary" disabled={!sortDirty || saving} onClick={onSaveOrder}>{saving ? "저장 중…" : "순서 저장"}</button>
        </div>
      )}
    </>
  );
}
