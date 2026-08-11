import Image from "next/image";

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
        <Image src="/images/logo.svg" className="muze-loading-logo" alt="" width={56} height={56} style={{ width: numericSize, height: "auto" }} />
      </div>
      {label && <span className="muze-loading-label">{label}</span>}
    </div>
  );
}

