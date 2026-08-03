import { useState } from "react";
import { Plus } from "lucide-react";
import { BRAND_PINK_HEX } from "@/core/utils/design-tokens";
import AdminAssetImage from "@/admin/components/assets/AdminAssetImage";
import type { Member, MemberDraft } from "./member-editor-model";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MemberLibraryRailProps {
  draft: MemberDraft | null;
  members: Member[];
  saving: boolean;
  sorting: boolean;
  sortDirty: boolean;
  onAdd: () => void;
  onSelect: (member: Member) => void;
  onReorder: (activeId: string, overId: string) => void;
  onToggleSorting: () => void;
  onSaveOrder: () => void;
}

function SortableMemberItem({
  member,
  index,
  isSelected,
  sorting,
  onClick,
}: {
  member: Member;
  index: number;
  isSelected: boolean;
  sorting: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: member.id,
    disabled: !sorting,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      onClick={sorting ? undefined : onClick}
      className={`content-library-item ${isSelected ? "is-selected" : ""} ${
        sorting ? "is-sorting" : ""
      } ${isDragging ? "is-dragging" : ""}`}
      {...(sorting ? { ...attributes, ...listeners } : {})}
    >
      <span className="content-library-index">
        {sorting ? "↕" : String(index + 1).padStart(2, "0")}
      </span>
      <span className="content-library-thumb">
        {member.image_url ? (
          <AdminAssetImage src={member.image_url} alt="" sizes="48px" />
        ) : (
          <i style={{ background: member.color || BRAND_PINK_HEX }} />
        )}
      </span>
      <span className="content-library-copy">
        <b>{member.name}</b>
        <small>{member.role_ko || member.eng_name || "역할 미설정"}</small>
      </span>
    </button>
  );
}

export default function MemberLibraryRail({
  draft,
  members,
  saving,
  sorting,
  sortDirty,
  onAdd,
  onSelect,
  onReorder,
  onToggleSorting,
  onSaveOrder,
}: MemberLibraryRailProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  const draggingMember = draggingId
    ? members.find((member) => member.id === draggingId)
    : null;

  return (
    <>
      <div className="content-rail-heading">
        <div>
          <h2>멤버 라이브러리</h2>
        </div>
        <button type="button" onClick={onAdd} aria-label="멤버 추가">
          <Plus aria-hidden="true" />
        </button>
      </div>
      <div className="content-rail-sort">
        <span>{members.length}명</span>
        {members.length > 1 && (
          <button type="button" onClick={onToggleSorting}>
            {sorting ? "정렬 취소" : "순서 변경"}
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragCancel={() => setDraggingId(null)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={members.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="content-library-list member-library-list">
            {draft && !draft.id && (
              <button type="button" className="content-library-item is-selected">
                <span className="content-library-index">NEW</span>
                <span className="content-library-thumb">
                  <i style={{ background: draft.color }} />
                </span>
                <span className="content-library-copy">
                  <b>{draft.name || "새 멤버"}</b>
                  <small>{draft.roleKo || "기본 정보를 입력하세요"}</small>
                </span>
              </button>
            )}

            {members.map((member, index) => (
              <SortableMemberItem
                key={member.id}
                member={member}
                index={index}
                isSelected={draft?.id === member.id}
                sorting={sorting}
                onClick={() => onSelect(member)}
              />
            ))}

            {!members.length && !draft && (
              <div className="content-library-empty">
                <b>등록된 멤버가 없습니다.</b>
                <span>첫 멤버를 추가해 아티스트 라인업을 구성하세요.</span>
              </div>
            )}
          </div>
        </SortableContext>

        <DragOverlay>
          {draggingMember ? (
            <div className="content-library-item is-selected is-dragging-overlay" style={{ cursor: "grabbing" }}>
              <span className="content-library-index">↕</span>
              <span className="content-library-thumb">
                {draggingMember.image_url ? (
                  <AdminAssetImage src={draggingMember.image_url} alt="" sizes="48px" />
                ) : (
                  <i style={{ background: draggingMember.color || BRAND_PINK_HEX }} />
                )}
              </span>
              <span className="content-library-copy">
                <b>{draggingMember.name}</b>
                <small>
                  {draggingMember.role_ko || draggingMember.eng_name || "역할 미설정"}
                </small>
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {sorting && (
        <div className="content-rail-footer">
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            disabled={!sortDirty || saving}
            onClick={onSaveOrder}
          >
            {saving ? "저장 중…" : "순서 저장"}
          </button>
        </div>
      )}
    </>
  );
}
