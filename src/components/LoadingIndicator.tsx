type LoadingIndicatorProps = {
  label?: string;
  className?: string;
};

export default function LoadingIndicator({ label, className = "" }: LoadingIndicatorProps) {
  return (
    <div className={`muze-loading ${className}`.trim()} role="status" aria-live="polite">
      <span className="muze-loading-track" aria-hidden="true" />
      {label && <span className="muze-loading-label">{label}</span>}
    </div>
  );
}
