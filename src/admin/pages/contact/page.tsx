"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminSkeleton from "@/admin/components/shell/AdminSkeleton";
import { useAdminConfirm } from "@/admin/components/shell/AdminDialogProvider";
import { fetchSignedFileUrl } from "@/admin/utils/signed-file-url";
import { supabase } from "@/core/supabase/client";
import ContactDetail, { type ContactUndo } from "./ContactDetail";
import ContactList from "./ContactList";
import { statuses } from "./contact-utils";
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
  const [readerName, setReaderName] = useState<string | null>(null);
  const [classifying, setClassifying] = useState(false);
  const requestedFilter = statuses.some((status) => status.value === searchParams.get("status"))
    ? (searchParams.get("status") as ContactStatus)
    : "all";
  const {
    category,
    categoryCounts,
    error: listError,
    fetchInquiries,
    filter,
    pendingAiCount,
    inquiries,
    loading,
    page,
    query,
    setCategory,
    setFilter,
    setPage,
    setQuery,
    setInquiries,
    setSpamFilter,
    setUrgencyFilter,
    spamFilter,
    total,
    urgencyFilter,
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
    setUrgencyFilter("all");
    setSpamFilter("all");
    setPage(1);
  };

  const changeFilter = (nextFilter: ContactStatus | "all") => {
    setFilter(nextFilter);
    setPage(1);
  };

  const openInquiry = (inquiry: ContactInquiry) => {
    setNote(inquiry.admin_note || "");
    setAttachmentUrl("");
    setReaderName(null);
    setViewing(inquiry);
    void markRead(inquiry);
  };

  const markRead = async (inquiry: ContactInquiry) => {
    const { data, error: readError } = await supabase.rpc("mark_contact_inquiry_read", {
      p_inquiry_id: inquiry.id,
    });
    if (readError) return;
    const patch = (Array.isArray(data) ? data[0] : data) as Partial<ContactInquiry> | null;
    const updated = {
      ...inquiry,
      ...(patch || {}),
      read_at: patch?.read_at || inquiry.read_at || new Date().toISOString(),
    };
    setViewing((current) => (current?.id === inquiry.id ? updated : current));
    setInquiries((current) => current.map((item) => (item.id === inquiry.id ? updated : item)));
    if (updated.read_by) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name,email")
        .eq("id", updated.read_by)
        .maybeSingle();
      setReaderName(profile?.name || profile?.email || "관리자가 열람함");
    }
    window.dispatchEvent(new Event("admin-inbox-changed"));
  };

  useEffect(() => {
    if (!viewing?.attachment_path) return;
    let active = true;
    void fetchSignedFileUrl("contact-attachments", viewing.attachment_path).then((url) => {
      if (active) setAttachmentUrl(url);
    });
    return () => {
      active = false;
    };
  }, [viewing]);

  const updateInquiry = async (
    changes: Partial<Pick<ContactInquiry, "status" | "admin_note">>,
  ) => {
    if (!viewing) return false;
    setSaving(true);
    setError("");
    const { data, error: updateError } = await supabase.rpc("update_contact_inquiry_workflow", {
      p_inquiry_id: viewing.id,
      p_status: changes.status ?? viewing.status,
      p_admin_note: changes.admin_note !== undefined ? changes.admin_note : viewing.admin_note,
      p_expected_updated_at: viewing.updated_at,
    });
    const patch = (Array.isArray(data) ? data[0] : data) as Partial<ContactInquiry> | null;
    if (updateError || !patch) {
      setError(updateError?.message || "문의를 저장하지 못했습니다.");
      if (updateError?.code === "P0003") {
        setViewing(null);
        void fetchInquiries();
      }
      setSaving(false);
      return false;
    }
    const updated = { ...viewing, ...patch };
    setViewing(updated);
    setInquiries((current) => current.map((item) => (item.id === viewing.id ? updated : item)));
    window.dispatchEvent(new Event("admin-inbox-changed"));
    setSaving(false);
    return true;
  };

  const changeStatus = async (status: ContactStatus) => {
    if (!viewing || status === viewing.status) return;
    if (["answered", "closed"].includes(status) && !(await confirm({
      title: status === "answered" ? "답변 완료로 기록할까요?" : "문의를 종료할까요?",
      description: "처리 상태가 즉시 반영됩니다.",
      confirmLabel: "상태 변경",
    }))) return;
    if (!(await updateInquiry({ status }))) return;
    setUndo({ id: viewing.id, previous: viewing.status });
    setToast("처리 상태를 변경했습니다.");
  };

  const undoStatus = async () => {
    if (!undo || !viewing || viewing.id !== undo.id) return;
    if (!(await updateInquiry({ status: undo.previous }))) return;
    setUndo(null);
    setToast("이전 처리 상태로 돌아갔습니다.");
  };

  const classifyPending = async () => {
    if (!pendingAiCount || classifying) return;
    setClassifying(true);
    setError("");
    try {
      const response = await fetch("/api/admin/contact-inquiries/classify-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("미분류 문의를 처리하지 못했습니다.");
      await fetchInquiries();
    } catch (classifyError) {
      setError(classifyError instanceof Error ? classifyError.message : "분류에 실패했습니다.");
    } finally {
      setClassifying(false);
    }
  };

  if (loading) return <AdminSkeleton variant="inbox" className="min-h-[320px]" rows={5} />;

  if (viewing) {
    return (
      <ContactDetail
        viewing={viewing}
        note={note}
        attachmentUrl={attachmentUrl}
        readerName={readerName}
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
      urgencyFilter={urgencyFilter}
      spamFilter={spamFilter}
      pendingAiCount={pendingAiCount}
      classifying={classifying}
      inquiries={inquiries}
      page={page}
      query={query}
      total={total}
      onCategoryChange={changeCategory}
      onClearError={() => setError("")}
      onFilterChange={changeFilter}
      onUrgencyFilterChange={(next) => {
        setUrgencyFilter(next);
        setPage(1);
      }}
      onSpamFilterChange={(next) => {
        setSpamFilter(next);
        setPage(1);
      }}
      onClassifyPending={() => void classifyPending()}
      onOpenInquiry={openInquiry}
      onPageChange={setPage}
      onQueryChange={setQuery}
    />
  );
}
