"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import { fetchSignedFileUrl } from "@/admin/utils/signed-file-url";
import { supabase } from "@/core/supabase/client";

import ContactDetail, { type ContactUndo } from "./ContactDetail";
import ContactList from "./ContactList";
import {
  statuses,
} from "./contact-utils";
import {
  type ContactCategory,
  type ContactInquiry,
  type ContactStatus,
  useContactInquiries,
} from "./useContactInquiries";

export default function ContactAdminPage() {
  const confirm = useAdminConfirm();
  const searchParams = useSearchParams();
  const [viewing, setViewing] = useState<ContactInquiry | null>(null);
  const requestedFilter =
    statuses.find((status) => status.value === searchParams.get("status"))
      ?.value ?? "all";
  const {
    category,
    categoryCounts,
    error: listError,
    fetchInquiries,
    filter,
    inquiries,
    loading,
    page,
    query,
    setCategory,
    setFilter,
    setPage,
    setQuery,
    setInquiries,
    total,
  } = useContactInquiries(requestedFilter);
  const [note, setNote] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [undo, setUndo] = useState<ContactUndo | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => {
      setUndo(null);
      setToast("");
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [undo]);

  const changeCategory = (nextCategory: ContactCategory) => {
    setCategory(nextCategory);
    setQuery("");
    setFilter("all");
    setPage(1);
  };

  const changeFilter = (nextFilter: ContactStatus | "all") => {
    setFilter(nextFilter);
    setPage(1);
  };

  const openInquiry = (inquiry: ContactInquiry) => {
    setNote(inquiry.admin_note || "");
    setAttachmentUrl("");
    setViewing(inquiry);
  };

  useEffect(() => {
    if (!viewing?.attachment_path) return;
    let active = true;
    const signAttachment = async () => {
      const url = await fetchSignedFileUrl(
        "contact-attachments",
        viewing.attachment_path!,
      );
      if (active) setAttachmentUrl(url);
    };
    void signAttachment();
    return () => {
      active = false;
    };
  }, [viewing]);

  const updateInquiry = async (
    changes: Partial<Pick<ContactInquiry, "status" | "admin_note">>,
  ) => {
    if (!viewing) return;
    setSaving(true);
    setError("");
    const { data, error: updateError } = await supabase.rpc(
      "update_contact_inquiry_workflow",
      {
        p_inquiry_id: viewing.id,
        p_status: changes.status ?? viewing.status,
        p_admin_note:
          changes.admin_note !== undefined
            ? changes.admin_note
            : viewing.admin_note,
        p_expected_updated_at: viewing.updated_at,
      },
    );
    const patch = Array.isArray(data) ? data[0] : data;
    if (updateError || !patch) {
      if (updateError?.code === "P0003") {
        setError(
          "다른 관리자가 먼저 수정했습니다. 최신 내용을 불러온 뒤 다시 저장해 주세요.",
        );
        setViewing(null);
        void fetchInquiries();
      } else {
        setError(updateError?.message || "문의를 저장하지 못했습니다.");
      }
    } else {
      const updated = { ...viewing, ...patch };
      setViewing(updated);
      setInquiries((current) =>
        current.map((item) => (item.id === viewing.id ? updated : item)),
      );
      window.dispatchEvent(new Event("admin-inbox-changed"));
    }
    setSaving(false);
    return !updateError && Boolean(patch);
  };

  const changeStatus = async (status: ContactStatus) => {
    if (!viewing || status === viewing.status) return;
    if (
      ["answered", "closed"].includes(status) &&
      !(await confirm({
        title:
          status === "answered"
            ? "답변 완료로 기록할까요?"
            : "문의를 종결할까요?",
        description: "처리 상태는 해당 기록에 즉시 반영됩니다.",
        confirmLabel: "상태 변경",
      }))
    )
      return;
    if (!(await updateInquiry({ status }))) return;
    setUndo({ id: viewing.id, previous: viewing.status });
    setToast("처리 상태를 변경했습니다.");
  };

  const undoStatus = async () => {
    if (!undo || !viewing || viewing.id !== undo.id) return;
    if (!(await updateInquiry({ status: undo.previous }))) return;
    setUndo(null);
    setToast("이전 처리 상태로 돌아왔습니다.");
  };

  if (loading) {
    return <AdminSkeleton variant="inbox" className="min-h-[320px]" rows={5} />;
  }

  if (viewing) {
    return (
      <ContactDetail
        viewing={viewing}
        note={note}
        attachmentUrl={attachmentUrl}
        saving={saving}
        error={error}
        toast={toast}
        undo={undo}
        onBack={() => setViewing(null)}
        onClearError={() => setError("")}
        onUndo={() => void undoStatus()}
        onChangeStatus={(status) => void changeStatus(status)}
        onNoteChange={setNote}
        onSaveNote={() => void updateInquiry({ admin_note: note.trim() || null })}
      />
    );
  }

  return (
    <ContactList
      category={category}
      categoryCounts={categoryCounts}
      error={error}
      listError={listError}
      fetchInquiries={fetchInquiries}
      filter={filter}
      inquiries={inquiries}
      page={page}
      query={query}
      total={total}
      onCategoryChange={changeCategory}
      onClearError={() => setError("")}
      onFilterChange={changeFilter}
      onOpenInquiry={openInquiry}
      onPageChange={setPage}
      onQueryChange={setQuery}
    />
  );
}
