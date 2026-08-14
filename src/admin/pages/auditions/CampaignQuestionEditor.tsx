import FormField from "@/admin/components/content/FormField";
import type { AdminLanguage } from "@/admin/components/content/AdminLanguageTabs";
import type { AuditionFormField } from "@/core/auditions/types";
import { FIELD_TYPES, FILE_PRESETS } from "./CampaignAdminShared";

type Props = {
  selectedField: AuditionFormField | null;
  language: AdminLanguage;
  onPatchField: (
    id: string,
    patch: Partial<AuditionFormField>,
  ) => void;
  onSetPrimaryLabel: (id: string, checked: boolean) => void;
  onToggleFilePreset: (types: readonly string[], checked: boolean) => void;
};

export default function CampaignQuestionEditor({
  selectedField,
  language,
  onPatchField,
  onSetPrimaryLabel,
  onToggleFilePreset,
}: Props) {
  return (
    <div className="audition-question-form">
      {selectedField ? (
        <>
          <header>
            <div>
              <h2>{selectedField.label_i18n.ko || "질문 설정"}</h2>
              <p>
                언어 탭을 바꿔 각 언어의 질문을 입력하세요.
              </p>
            </div>
          </header>
          <div className="audition-question-form-grid">
            <div
              className="audition-question-wide"
              data-tour-id="audition-question-type"
            >
              <span className="audition-control-label">질문 유형</span>
              <div className="audition-type-picker">
                {FIELD_TYPES.map((type) => (
                  <button
                    type="button"
                    className={
                      selectedField.field_type === type.value
                        ? "is-active"
                        : ""
                    }
                    key={type.value}
                    onClick={() =>
                      onPatchField(selectedField.id, {
                        field_type: type.value,
                      })
                    }
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="audition-question-label">
              <FormField
                activeLang={language}
                label="질문"
                valueKo={selectedField.label_i18n.ko ?? ""}
                valueEn={selectedField.label_i18n.en ?? ""}
                valueJa={selectedField.label_i18n.ja ?? ""}
                onChangeKo={(value) =>
                  onPatchField(selectedField.id, {
                    label_i18n: {
                      ...selectedField.label_i18n,
                      ko: value,
                    },
                  })
                }
                onChangeEn={(value) =>
                  onPatchField(selectedField.id, {
                    label_i18n: {
                      ...selectedField.label_i18n,
                      en: value,
                    },
                  })
                }
                onChangeJa={(value) =>
                  onPatchField(selectedField.id, {
                    label_i18n: {
                      ...selectedField.label_i18n,
                      ja: value,
                    },
                  })
                }
              />
            </div>
            <label className="audition-question-wide">
              {selectedField.field_type === "consent"
                ? "동의 문구 또는 약관 링크"
                : "도움말"}
              <input
                className="admin-input"
                value={selectedField.help_text ?? ""}
                onChange={(event) =>
                  onPatchField(selectedField.id, {
                    help_text: event.target.value || null,
                  })
                }
              />
            </label>
            {["select", "radio", "checkbox"].includes(
              selectedField.field_type,
            ) && (
              <label className="audition-question-wide">
                선택지 (줄바꿈)
                <textarea
                  className="admin-input"
                  value={selectedField.options.join("\n")}
                  onChange={(event) =>
                    onPatchField(selectedField.id, {
                      options: event.target.value
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
            )}
            {(selectedField.field_type === "short_text" ||
              selectedField.field_type === "long_text") && (
              <label>
                최대 글자 수
                <input
                  className="admin-input"
                  type="number"
                  min="1"
                  max="10000"
                  value={selectedField.max_length ?? ""}
                  onChange={(event) =>
                    onPatchField(selectedField.id, {
                      max_length: Number(event.target.value) || null,
                    })
                  }
                />
              </label>
            )}
            {selectedField.field_type === "file" && (
              <>
                <label>
                  파일당 최대 용량
                  <input
                    className="admin-input"
                    type="number"
                    min="1"
                    max="30"
                    value={selectedField.max_file_size_mb ?? 20}
                    onChange={(event) =>
                      onPatchField(selectedField.id, {
                        max_file_size_mb: Math.min(
                          30,
                          Number(event.target.value) || 20,
                        ),
                      })
                    }
                  />
                  <span>1~30MB 사이로 설정할 수 있습니다.</span>
                </label>
                <div className="audition-question-wide">
                  <span className="audition-control-label">
                    허용 파일 종류
                  </span>
                  <div className="audition-file-preset-chips">
                    {FILE_PRESETS.map((preset) => {
                      const checked = preset.types.every(
                        (type) =>
                          !selectedField.accepted_file_types.length ||
                          selectedField.accepted_file_types.includes(type),
                      );
                      return (
                        <label
                          className={`audition-file-preset-chip ${checked ? "is-active" : ""}`}
                          key={preset.label}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              onToggleFilePreset(
                                preset.types,
                                event.target.checked,
                              )
                            }
                          />
                          <b>{preset.label}</b>
                          <span>{preset.hint}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            <label className="audition-builder-check">
              <input
                type="checkbox"
                checked={selectedField.required}
                onChange={(event) =>
                  onPatchField(selectedField.id, {
                    required: event.target.checked,
                  })
                }
              />{" "}
              필수
            </label>
            <label className="audition-builder-check">
              <input
                type="checkbox"
                checked={selectedField.is_primary_label}
                onChange={(event) =>
                  onSetPrimaryLabel(selectedField.id, event.target.checked)
                }
              />{" "}
              대표 라벨
            </label>
          </div>
        </>
      ) : (
        <p>질문을 추가해 주세요.</p>
      )}
    </div>
  );
}
