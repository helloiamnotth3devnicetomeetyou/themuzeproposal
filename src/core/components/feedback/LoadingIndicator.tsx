type LoadingIndicatorProps = {
  label?: string;
  className?: string;
  size?: number | string;
};

export default function LoadingIndicator({ label, className = "", size = 56 }: LoadingIndicatorProps) {
  const numericSize = typeof size === "number" ? `${size}px` : size;

  return (
    <div className={`muze-loading ${className}`.trim()} role="status" aria-live="polite" aria-atomic="true">
      <div className="muze-loading-logo-container" style={{ width: numericSize }}>
        <img src="/images/logo.svg" className="muze-loading-logo" alt="" />
      </div>
      {label && <span className="muze-loading-label">{label}</span>}
    </div>
  );
}

