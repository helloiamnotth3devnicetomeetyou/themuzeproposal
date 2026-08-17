"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/core/supabase/client";

export type ContactCategory = "general" | "business";
export type ContactStatus = "pending" | "reviewing" | "answered" | "closed";
export type ContactUrgency = "low" | "normal" | "high" | "urgent";
export type ContactUrgencyFilter = "all" | ContactUrgency;
export type ContactSpamFilter = "all" | "normal" | "spam";
export type ContactInquiry = {
  id: string;
  user_id: string | null;
  category: ContactCategory;
  inquiry_type: string;
  company_name: string | null;
  contact_name: string;
  phone: string | null;
  email: string;
  message: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  status: ContactStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  answered_at: string | null;
  answered_by: string | null;
  urgency: ContactUrgency | null;
  urgency_rank: number | null;
  is_likely_spam: boolean | null;
  ai_reasoning: string | null;
  ai_classified_at: string | null;
  read_at: string | null;
  read_by: string | null;
  deleted_at: string | null;
};

export const PAGE_SIZE = 20;
const searchTerm = (value: string) => value.trim().replace(/[%,_()]/g, " ");

export function useContactInquiries(requestedFilter: ContactStatus | "all") {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState<ContactCategory>("general");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState(requestedFilter);
  const [urgencyFilter, setUrgencyFilter] =
    useState<ContactUrgencyFilter>("all");
  const [spamFilter, setSpamFilter] = useState<ContactSpamFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<
    Record<ContactCategory, number>
  >({ general: 0, business: 0 });
  const [pendingAiCount, setPendingAiCount] = useState(0);
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const loadedRef = useRef(false);

  const fetchInquiries = useCallback(async () => {
    requestRef.current?.abort();
    if (loadedRef.current) setRefreshing(true);
    else setLoading(true);
    setError("");
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    let request = supabase
      .from("contact_inquiries")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .eq("category", category);
    if (filter !== "all") request = request.eq("status", filter);
    if (urgencyFilter === "urgent") request = request.in("urgency", ["high", "urgent"]);
    if (urgencyFilter === "normal") request = request.in("urgency", ["low", "normal"]);
    if (spamFilter === "normal") request = request.eq("is_likely_spam", false);
    if (spamFilter === "spam") request = request.eq("is_likely_spam", true);
    const keyword = searchTerm(debouncedQuery);
    if (keyword)
      request = request.or(
        `contact_name.ilike.%${keyword}%,email.ilike.%${keyword}%,phone.ilike.%${keyword}%,company_name.ilike.%${keyword}%,message.ilike.%${keyword}%`,
      );
    try {
      const [{ data, count, error: fetchError }, general, business, pending] =
        await Promise.all([
          request
            .abortSignal(controller.signal)
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
            .overrideTypes<ContactInquiry[], { merge: false }>(),
          supabase
            .from("contact_inquiries")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("category", "general")
            .abortSignal(controller.signal),
          supabase
            .from("contact_inquiries")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .eq("category", "business")
            .abortSignal(controller.signal),
          supabase
            .from("contact_inquiries")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .is("ai_classified_at", null)
            .abortSignal(controller.signal),
        ]);
      const queryError =
        fetchError || general.error || business.error || pending.error;
      if (queryError) throw queryError;
      if (requestRef.current !== controller) return;
      setInquiries(data ?? []);
      setTotal(count ?? 0);
      setCategoryCounts({
        general: general.count ?? 0,
        business: business.count ?? 0,
      });
      setPendingAiCount(pending.count ?? 0);
    } catch (fetchError) {
      if (requestRef.current !== controller) return;
      setError(
        fetchError instanceof Error && fetchError.name === "AbortError"
          ? "문의 목록을 불러오는 데 시간이 너무 오래 걸립니다."
          : fetchError instanceof Error
            ? fetchError.message
            : "문의 목록을 불러오지 못했습니다.",
      );
    } finally {
      window.clearTimeout(timeout);
      if (requestRef.current === controller) {
        requestRef.current = null;
        loadedRef.current = true;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [category, debouncedQuery, filter, page, spamFilter, urgencyFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchInquiries();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      requestRef.current?.abort();
    };
  }, [fetchInquiries]);

  const pollPending = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible")
      return;
    const ids = inquiries
      .filter((inquiry) => !inquiry.ai_classified_at)
      .map((inquiry) => inquiry.id);
    if (!ids.length) return;
    const [{ data, error: fetchError }, countResult] = await Promise.all([
      supabase
        .from("contact_inquiries")
        .select("*")
        .in("id", ids)
        .abortSignal(AbortSignal.timeout(10_000)),
      supabase
        .from("contact_inquiries")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .is("ai_classified_at", null),
    ]);
    if (fetchError || countResult.error) return;
    setPendingAiCount(countResult.count ?? 0);
    if (!data) return;
    setInquiries((current) =>
      current.map((inquiry) =>
        data.find((next) => next.id === inquiry.id) ?? inquiry,
      ),
    );
  }, [inquiries]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!inquiries.some((inquiry) => !inquiry.ai_classified_at)) return;
    const timer = window.setInterval(() => void pollPending(), 5000);
    return () => window.clearInterval(timer);
  }, [inquiries, pollPending]);

  return {
    category,
    categoryCounts,
    error,
    fetchInquiries,
    filter,
    pendingAiCount,
    pollPending,
    inquiries,
    loading,
    refreshing,
    page,
    query,
    setCategory,
    setError,
    setFilter,
    setSpamFilter,
    setUrgencyFilter,
    setPage,
    setQuery,
    setInquiries,
    total,
    spamFilter,
    urgencyFilter,
  };
}
