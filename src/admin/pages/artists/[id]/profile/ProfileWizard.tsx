"use client";

import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import ContentWorkbench from "@/admin/components/content/ContentWorkbench";
import AdminLanguageTabs, {
  type AdminLanguage,
} from "@/admin/components/content/AdminLanguageTabs";
import AdminTranslationButton from "@/admin/components/content/AdminTranslationButton";
import DraftSaveButton from "@/admin/components/content/DraftSaveButton";
import type { UploadedImageAsset } from "@/admin/components/assets/ImageAssetField";
import ProfileContextRail from "./ProfileContextRail";
import ProfileEditorSections from "./ProfileEditorSections";
import { type ProfileDraft, type ProfileTab } from "./profile-editor-model";
import { newArtistSteps, type NewArtistStep } from "./artist-profile-steps";

type ProfileCompletion = { label: string; ready: boolean };
type CreationReady = { name: boolean; visual: boolean; content: boolean };
type Recovery = {
  updatedAt: number;
  onRestore: () => void;
  onDiscard: () => void;
};

type ProfileWizardProps = {
  identity: ReactNode;
  draft: ProfileDraft;
  artistId: string | null;
  completion: ProfileCompletion[];
  creationReady: CreationReady;
  saveIssues: string[];
  previewSlug: string;
  newStep: NewArtistStep;
  setNewStep: Dispatch<SetStateAction<NewArtistStep>>;
  snapshot: string;
  dirty: boolean;
  saving: boolean;
  error: string;
  toast: string;
  recovery: Recovery | null;
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;
  setError: (message: string) => void;
  patchDraft: (
    patch: Partial<ProfileDraft> | ((current: ProfileDraft) => ProfileDraft),
  ) => void;
  onAssetChange: (field: "imageUrl" | "logoUrl", value: string) => void;
  onUploaded: (asset: UploadedImageAsset) => void;
  onToast: (message: string) => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
};

export default function ProfileWizard({
  identity,
  draft,
  artistId,
  completion,
  creationReady,
  saveIssues,
  previewSlug,
  newStep,
  setNewStep,
  snapshot,
  dirty,
  saving,
  error,
  toast,
  recovery,
  language,
  setLanguage,
  setError,
  patchDraft,
  onAssetChange,
  onUploaded,
  onToast,
  onCancel,
  onSave,
}: ProfileWizardProps) {
  const stepIndex = newArtistSteps.findIndex((item) => item.id === newStep);
  const currentReady =
    newStep === "name"
      ? creationReady.name
      : newStep === "visual"
        ? creationReady.visual
        : newStep === "content"
          ? creationReady.content
          : true;
  const creationComplete =
    creationReady.name &&
    creationReady.visual &&
    creationReady.content &&
    !saveIssues.length;
  const wizardTab: ProfileTab =
    newStep === "name" ? "basic" : newStep === "visual" ? "visual" : "content";
  const wizardActions = (
    <>
      {stepIndex > 0 && (
        <button
          type="button"
          data-tour-id="profile-wizard-back"
          className="admin-btn admin-btn-secondary"
          onClick={() => setNewStep(newArtistSteps[stepIndex - 1].id)}
        >
          <ArrowLeft aria-hidden="true" />
          이전
        </button>
      )}
      {stepIndex < newArtistSteps.length - 1 ? (
        <button
          type="button"
          data-tour-id="profile-wizard-next"
          className="admin-btn admin-btn-primary"
          disabled={!currentReady}
          onClick={() => setNewStep(newArtistSteps[stepIndex + 1].id)}
        >
          다음
          <ArrowRight aria-hidden="true" />
        </button>
      ) : (
        <DraftSaveButton
          snapshot={snapshot}
          draft={draft}
          dirty={dirty}
          saving={saving}
          onSave={onSave}
          disabled={!creationComplete}
          label="아티스트 만들기"
        />
      )}
    </>
  );

  return (
    <ContentWorkbench
      rail={
        <ProfileContextRail
          completion={completion.slice(0, 3)}
          draft={draft}
          isNew
          onCancel={onCancel}
        />
      }
      identity={identity}
      actions={wizardActions}
      toolbar={
        <>
          <AdminLanguageTabs
            activeLang={language}
            onChange={setLanguage}
            values={{ ko: draft.name, en: draft.engName, ja: draft.jaName }}
          />
          <AdminTranslationButton
            documentKind="artist"
            fields={[
              {
                key: "description",
                label: "아티스트 소개",
                format: "richtext",
                ko: draft.descKo,
                en: draft.descEn,
                ja: draft.descJa,
              },
            ]}
            onApply={(translations) =>
              patchDraft({
                ...(translations.description?.en
                  ? { descEn: translations.description.en }
                  : {}),
                ...(translations.description?.ja
                  ? { descJa: translations.description.ja }
                  : {}),
              })
            }
            onError={setError}
            onSuccess={onToast}
          />
        </>
      }
      tabs={newArtistSteps.map((item) => ({
        ...item,
        complete:
          item.id === "name"
            ? creationReady.name
            : item.id === "visual"
              ? creationReady.visual
              : item.id === "content"
                ? creationReady.content
                : creationComplete,
        missing:
          item.id === "name"
            ? creationReady.name
              ? 0
              : 1
            : item.id === "visual"
              ? creationReady.visual
                ? 0
                : 1
              : item.id === "content"
                ? creationReady.content
                  ? 0
                  : 1
                : creationComplete
                  ? 0
                  : 1,
      }))}
      activeTab={newStep}
      onTabChange={(next) => {
        if (newArtistSteps.findIndex((item) => item.id === next) <= stepIndex)
          setNewStep(next);
      }}
      error={error}
      onDismissError={() => setError("")}
      toast={toast}
      recovery={recovery}
      className="profile-workbench artist-create-wizard"
    >
      {newStep === "done" ? (
        <div className="content-editor-stack artist-create-review">
          <div className="content-section-heading">
            <h3>생성 준비가 끝났습니다</h3>
            <span>
              아티스트를 만든 뒤 멤버, 음악, 일정과 나머지 프로필 탭을 이어서
              편집할 수 있습니다.
            </span>
          </div>
          <div className="content-publish-summary">
            <div>
              <span>아티스트</span>
              <strong>
                {draft.name} / {draft.engName}
              </strong>
            </div>
            <div>
              <span>공개 경로</span>
              <strong>/{previewSlug}</strong>
            </div>
            <div>
              <span>대표 비주얼</span>
              <strong>{draft.imageUrl ? "설정 완료" : "확인 필요"}</strong>
            </div>
            <div>
              <span>소개</span>
              <strong>{draft.descKo ? "설정 완료" : "확인 필요"}</strong>
            </div>
          </div>
          <p className="artist-create-ready">
            <CheckCircle2 aria-hidden="true" />
            상단의 ‘아티스트 만들기’를 누르면 전체 탭 에디터로 이동합니다.
          </p>
        </div>
      ) : (
        <ProfileEditorSections
          artistId={artistId}
          isNew
          draft={draft}
          saveIssues={saveIssues}
          tab={wizardTab}
          patchDraft={patchDraft}
          language={language}
          onAssetChange={onAssetChange}
          onUploaded={onUploaded}
          onError={setError}
          onToast={onToast}
        />
      )}
    </ContentWorkbench>
  );
}
