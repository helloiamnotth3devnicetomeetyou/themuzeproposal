type LoadingIndicatorProps = {
  label?: string;
  className?: string;
};

export default function LoadingIndicator({ label, className = "" }: LoadingIndicatorProps) {
  return (
    <div className={`muze-loading ${className}`.trim()} role="status" aria-live="polite" aria-atomic="true">
      <span className="muze-loading-pulse" aria-hidden="true" />
      {label && <span className="muze-loading-label">{label}</span>}
    </div>
  );
}
