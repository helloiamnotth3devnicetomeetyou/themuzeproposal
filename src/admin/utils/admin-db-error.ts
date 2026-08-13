type DbError = { code?: string; message?: string } | null | undefined;

export function adminDbError(
  error: DbError,
  fallback = "변경사항을 반영하지 못했습니다. 잠시 후 다시 시도해 주세요.",
) {
  if (error?.code === "23505")
    return "같은 값으로 등록된 항목이 이미 있습니다.";
  if (error?.code === "23503")
    return "연결된 항목이 있어 이 작업을 완료할 수 없습니다.";
  if (error?.code === "42501") return "이 작업을 수행할 권한이 없습니다.";
  if (
    error?.message?.includes("schema cache") ||
    error?.message?.includes("does not exist")
  )
    return "관리자 데이터 구조가 최신 상태가 아닙니다. 배포된 DB 마이그레이션을 확인해 주세요.";
  return fallback;
}
