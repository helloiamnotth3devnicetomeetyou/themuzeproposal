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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingSelected, setDeletingSelected] = useState(false);
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
    refreshing,
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
  const [attachmentStatus, setAttachmentStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
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
    setSelectedIds([]);
    setCategory(nextCategory);
    setQuery("");
    setFilter("all");
    setUrgencyFilter("all");
    setSpamFilter("all");
    setPage(1);
  };

  const changeFilter = (nextFilter: ContactStatus | "all") => {
    setSelectedIds([]);
    setFilter(nextFilter);
    setPage(1);
  };

  const openInquiry = (inquiry: ContactInquiry) => {
    setSelectedIds([]);
    setNote(inquiry.admin_note || "");
    setAttachmentUrl("");
    setAttachmentStatus(inquiry.attachment_path ? "loading" : "idle");
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

  const loadAttachment = async (path: string) => {
    setAttachmentStatus("loading");
    const url = await fetchSignedFileUrl("contact-attachments", path);
    setAttachmentUrl(url);
    setAttachmentStatus(url ? "ready" : "error");
  };

  useEffect(() => {
    if (!viewing?.attachment_path) return;
    let active = true;
    void fetchSignedFileUrl("contact-attachments", viewing.attachment_path).then((url) => {
      if (!active) return;
      setAttachmentUrl(url);
      setAttachmentStatus(url ? "ready" : "error");
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

  const toggleSelected = (id: string, selected: boolean) => {
    setSelectedIds((current) =>
      selected
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((selectedId) => selectedId !== id),
    );
  };

  const toggleAllSelected = (selected: boolean) => {
    setSelectedIds((current) => {
      if (!selected) {
        const visibleIds = new Set(inquiries.map((inquiry) => inquiry.id));
        return current.filter((id) => !visibleIds.has(id));
      }
      return Array.from(new Set([...current, ...inquiries.map((inquiry) => inquiry.id)]));
    });
  };

  const deleteSelected = async () => {
    if (!selectedIds.length || deletingSelected) return;
    const ids = [...selectedIds];
    if (!(await confirm({
      title: `선택한 문의 ${ids.length}건을 휴지통으로 옮길까요?`,
      description:
        "문의 내용과 첨부 파일은 보존 관리 화면의 휴지통에 남고, 거기에서 되돌리거나 영구 삭제할 수 있습니다.",
      confirmLabel: "휴지통으로 이동",
    }))) return;

    setDeletingSelected(true);
    setError("");
    try {
      const response = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          items: ids.map((id) => ({ kind: "contact_inquiry", id })),
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        deleted?: Array<{ kind?: string; id?: string }>;
        failed?: Array<{ kind?: string; id?: string; code?: string }>;
        error?: string;
      } | null;
      const deletedIds = Array.isArray(body?.deleted)
        ? body.deleted
            .filter((item) => item.kind === "contact_inquiry" && typeof item.id === "string")
            .map((item) => item.id as string)
        : !body?.failed?.length && response.ok
          ? ids
          : [];
      const failedCount = body?.failed?.length ?? 0;
      if (!response.ok && !deletedIds.length) {
        throw new Error(body?.error || "선택한 문의를 휴지통으로 옮기지 못했습니다.");
      }
      if (deletedIds.length) {
        setInquiries((current) => current.filter((inquiry) => !deletedIds.includes(inquiry.id)));
        setSelectedIds((current) => current.filter((id) => !deletedIds.includes(id)));
        await fetchInquiries();
      }
      if (failedCount) {
        setError(`${deletedIds.length}건 휴지통으로 이동, ${failedCount}건은 남아 있습니다.`);
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "선택한 문의를 휴지통으로 옮기지 못했습니다.",
      );
    } finally {
      setDeletingSelected(false);
    }
  };

  if (loading) return <AdminSkeleton variant="inbox" className="min-h-[320px]" rows={5} />;

  if (viewing) {
    return (
      <ContactDetail
        viewing={viewing}
        note={note}
        attachmentUrl={attachmentUrl}
        attachmentStatus={attachmentStatus}
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
        onRetryAttachment={() => {
          if (viewing.attachment_path)
            void loadAttachment(viewing.attachment_path);
        }}
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
      refreshing={refreshing}
      inquiries={inquiries}
      page={page}
      query={query}
      total={total}
      onCategoryChange={changeCategory}
      onClearError={() => setError("")}
      onFilterChange={changeFilter}
      onUrgencyFilterChange={(next) => {
        setSelectedIds([]);
        setUrgencyFilter(next);
        setPage(1);
      }}
      onSpamFilterChange={(next) => {
        setSelectedIds([]);
        setSpamFilter(next);
        setPage(1);
      }}
      onClassifyPending={() => void classifyPending()}
      selectedIds={selectedIds}
      deleting={deletingSelected}
      onToggleSelection={toggleSelected}
      onToggleAll={toggleAllSelected}
      onDeleteSelected={() => void deleteSelected()}
      onOpenInquiry={openInquiry}
      onPageChange={(nextPage) => {
        setSelectedIds([]);
        setPage(nextPage);
      }}
      onQueryChange={(nextQuery) => {
        setSelectedIds([]);
        setQuery(nextQuery);
      }}
    />
  );
}
