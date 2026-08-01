"use client";

type AlertProps = { message?: string | null; onDismiss?: () => void; className?: string };

export function AdminAlert({ message, onDismiss, className = "" }: AlertProps) {
  if (!message) return null;
  return <div className={`admin-feedback-alert ${className}`.trim()} role="alert"><b>!</b><span>{message}</span>{onDismiss && <button type="button" onClick={onDismiss}>닫기</button>}</div>;
}

export function AdminToast({ message }: Pick<AlertProps, "message">) {
  return message ? <div className="admin-feedback-toast" role="status">{message}</div> : null;
}
