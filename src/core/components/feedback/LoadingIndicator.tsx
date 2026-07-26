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
        <svg
          viewBox="0 0 360 270"
          className="muze-loading-logo"
          aria-hidden="true"
        >
          {/* Base / Ghost Layer */}
          <g className="muze-logo-base">
            <path d="M 70 10 L 190 10 L 60 260 L 0 260 L 65 135 L 5 135 Z" />
            <path d="M 215 10 L 275 10 L 145 260 L 85 260 Z" />
            <path d="M 300 10 L 360 10 L 295 135 L 355 135 L 290 260 L 170 260 Z" />
          </g>

          {/* Animated Fill Layer */}
          <g className="muze-logo-fill">
            <path d="M 70 10 L 190 10 L 60 260 L 0 260 L 65 135 L 5 135 Z" />
            <path d="M 215 10 L 275 10 L 145 260 L 85 260 Z" />
            <path d="M 300 10 L 360 10 L 295 135 L 355 135 L 290 260 L 170 260 Z" />
          </g>
        </svg>
      </div>
      {label && <span className="muze-loading-label">{label}</span>}
    </div>
  );
}

