"use client";

interface GoogleSignInButtonProps {
  loading: boolean;
  label: string;
  onClick: () => void;
}

export default function GoogleSignInButton({
  loading,
  label,
  onClick,
}: GoogleSignInButtonProps) {
  return (
    <>
      <div className="my-6 flex w-full items-center gap-4" aria-hidden="true">
        <span
          className="h-px flex-1"
          style={{ backgroundColor: "var(--border-default)" }}
        />
        <span
          className="text-[10px] font-bold"
          style={{ color: "var(--text-muted)" }}
        >
          OR
        </span>
        <span
          className="h-px flex-1"
          style={{ backgroundColor: "var(--border-default)" }}
        />
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={onClick}
        className="flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-4 text-xs font-bold tracking-wider transition-all duration-slow hover:border-brand-pink disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          backgroundColor: "var(--bg-subtle)",
          borderColor: "var(--border-default)",
          color: "var(--text-primary)",
        }}
      >
        {/* Google "G" logo */}
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
          <path
            fill="#4285F4"
            d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.715v2.258h2.909c1.703-1.568 2.684-3.878 2.684-6.614Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.181l-2.909-2.258c-.806.54-1.836.859-3.047.859-2.344 0-4.328-1.584-5.037-3.711H.955v2.332A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.963 10.709A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.281-1.709V4.959H.955A9 9 0 0 0 0 9c0 1.452.347 2.827.955 4.041l3.008-2.332Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.507.454 3.441 1.346l2.581-2.582C13.463.892 11.426 0 9 0A9 9 0 0 0 .955 4.959l3.008 2.332C4.672 5.164 6.656 3.58 9 3.58Z"
          />
        </svg>
        {label}
      </button>
    </>
  );
}
