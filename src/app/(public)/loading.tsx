import LoadingIndicator from "@/core/components/feedback/LoadingIndicator";

export default function PublicLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg-base)]">
      <LoadingIndicator label="Loading" />
    </main>
  );
}
