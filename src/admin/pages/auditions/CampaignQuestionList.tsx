import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { AuditionFormField } from "@/core/auditions/types";

type Props = {
  fields: AuditionFormField[];
  selectedFieldId: string;
  dragging: string | null;
  onDragStart: (id: string) => void;
  onMoveTo: (id: string) => void;
  onSelectField: (id: string) => void;
  onRemoveField: (id: string) => void;
  onAddField: () => void;
};

export default function CampaignQuestionList({
  fields,
  selectedFieldId,
  onDragStart,
  onMoveTo,
  onSelectField,
  onRemoveField,
  onAddField,
}: Props) {
  return (
    <aside className="audition-question-list">
      <header>
        <b>질문 목록</b>
        <span>{fields.length}</span>
      </header>
      {fields.map((field, index) => (
        <div
          key={field.id}
          data-tour-id="audition-question-sort"
          className={`audition-question-item ${selectedFieldId === field.id ? "is-active" : ""}`}
          draggable
          onDragStart={() => onDragStart(field.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => onMoveTo(field.id)}
        >
          <GripVertical aria-hidden="true" />
          <button type="button" onClick={() => onSelectField(field.id)}>
            <span>{index + 1}</span>
            <b>
              {field.label_i18n.ko ||
                field.label_i18n.en ||
                field.label_i18n.ja ||
                field.field_key}
            </b>
          </button>
          <button
            type="button"
            data-tour-id="audition-question-delete"
            onClick={() => onRemoveField(field.id)}
            aria-label="질문 삭제"
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      ))}
      <button
        className="audition-add-field-btn"
        data-tour-id="audition-question-add"
        type="button"
        onClick={onAddField}
      >
        <Plus aria-hidden="true" />{" "}
        <span data-tour-id="audition-builder-prerequisite">질문 추가</span>
      </button>
    </aside>
  );
}
