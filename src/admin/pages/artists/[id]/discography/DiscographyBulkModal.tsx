"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onApply: () => void;
};

export default function DiscographyBulkModal({
  value,
  onChange,
  onClose,
  onApply,
}: Props) {
  return (
    <div
      className="music-crop-modal"
      role="dialog"
      aria-modal="true"
      aria-label="여러 트랙 붙여넣기"
    >
      <div className="music-bulk-card">
        <h3>여러 곡 붙여넣기</h3>
        <p>
          한 줄에 한 곡씩 입력하세요. 앞의 트랙 번호는 자동으로 제거합니다.
        </p>
        <pre>{"01. Lucky You\n02. Glow Up"}</pre>
        <textarea
          className="admin-input"
          rows={10}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoFocus
          placeholder="한 줄에 한 곡씩 입력"
        />
        <div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={onApply}
          >
            트랙 추가
          </button>
        </div>
      </div>
    </div>
  );
}
