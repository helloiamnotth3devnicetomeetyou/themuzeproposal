"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/core/supabase/client";

export type ContactCategory = "general" | "business";
export type ContactStatus = "pending" | "reviewing" | "answered" | "closed";
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
};

export const PAGE_SIZE = 20;
const searchTerm = (value: string) => value.trim().replace(/[%,_()]/g, " ");

export function useContactInquiries(requestedFilter: ContactStatus | "all") {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ContactCategory>("general");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState(requestedFilter);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<
    Record<ContactCategory, number>
  >({ general: 0, business: 0 });
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);

  const fetchInquiries = useCallback(async () => {
    requestRef.current?.abort();
    setLoading(true);
    setError("");
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    let request = supabase
      .from("contact_inquiries")
      .select("*", { count: "exact" })
      .eq("category", category)
      .order("created_at", { ascending: false });
    if (filter !== "all") request = request.eq("status", filter);
    const keyword = searchTerm(debouncedQuery);
    if (keyword)
      request = request.or(
        `contact_name.ilike.%${keyword}%,email.ilike.%${keyword}%,phone.ilike.%${keyword}%,company_name.ilike.%${keyword}%,message.ilike.%${keyword}%`,
      );
    try {
      const [{ data, count, error: fetchError }, general, business] =
        await Promise.all([
          request
            .abortSignal(controller.signal)
            .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
            .overrideTypes<ContactInquiry[], { merge: false }>(),
          supabase
            .from("contact_inquiries")
            .select("id", { count: "exact", head: true })
            .eq("category", "general")
            .abortSignal(controller.signal),
          supabase
            .from("contact_inquiries")
            .select("id", { count: "exact", head: true })
            .eq("category", "business")
            .abortSignal(controller.signal),
      ]);
      const queryError = fetchError || general.error || business.error;
      if (queryError) throw queryError;
      if (requestRef.current !== controller) return;
      setInquiries(data ?? []);
      setTotal(count ?? 0);
      setCategoryCounts({
        general: general.count ?? 0,
        business: business.count ?? 0,
      });
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
        setLoading(false);
      }
    }
  }, [category, debouncedQuery, filter, page]);

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

  return {
    category,
    categoryCounts,
    error,
    fetchInquiries,
    filter,
    inquiries,
    loading,
    page,
    query,
    setCategory,
    setError,
    setFilter,
    setPage,
    setQuery,
    setInquiries,
    total,
  };
}
