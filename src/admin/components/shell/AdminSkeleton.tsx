type AdminSkeletonProps = {
  className?: string;
  rows?: number;
  variant?: "lines" | "workbench" | "inbox" | "table" | "media" | "cards";
};

const Block = ({ className = "" }: { className?: string }) => (
  <span className={`admin-skeleton-block ${className}`.trim()} />
);
const repeat = (count: number, render: (index: number) => React.ReactNode) =>
  Array.from({ length: count }, (_, index) => render(index));

function SkeletonContent({
  variant,
  rows,
}: Required<Pick<AdminSkeletonProps, "variant" | "rows">>) {
  if (variant === "workbench")
    return (
      <div className="admin-skeleton-workbench">
        <aside>
          <Block className="is-avatar" />
          <Block className="is-title" />
          <Block className="is-copy" />
          <div className="admin-skeleton-rail-list">
            {repeat(5, (index) => (
              <Block key={index} />
            ))}
          </div>
        </aside>
        <section>
          <header>
            <div>
              <Block className="is-title" />
              <Block className="is-copy" />
            </div>
            <Block className="is-button" />
          </header>
          <nav>
            {repeat(4, (index) => (
              <Block key={index} />
            ))}
          </nav>
          <div className="admin-skeleton-form">
            {repeat(rows, (index) => (
              <div key={index}>
                <Block className="is-label" />
                <Block
                  className={
                    index === rows - 1 ? "is-field is-tall" : "is-field"
                  }
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    );

  if (variant === "inbox")
    return (
      <div className="admin-skeleton-inbox">
        <section className="admin-skeleton-summary">
          <Block className="is-icon" />
          <div>
            <Block className="is-copy" />
            <Block className="is-number" />
          </div>
          <Block className="is-stat" />
          <Block className="is-stat" />
          <Block className="is-copy is-wide" />
        </section>
        <section className="admin-skeleton-table-shell">
          <header>
            <div>
              <Block className="is-title" />
              <Block className="is-copy" />
            </div>
            <div>
              <Block className="is-search" />
              <Block className="is-select" />
            </div>
          </header>
          <div className="admin-skeleton-table-head">
            {repeat(5, (index) => (
              <Block key={index} />
            ))}
          </div>
          {repeat(rows, (row) => (
            <div className="admin-skeleton-table-row" key={row}>
              {repeat(5, (cell) => (
                <Block className={cell === 2 ? "is-wide" : ""} key={cell} />
              ))}
            </div>
          ))}
        </section>
      </div>
    );

  if (variant === "table")
    return (
      <div className="admin-skeleton-table-only">
        <div className="admin-skeleton-table-head">
          {repeat(5, (index) => (
            <Block key={index} />
          ))}
        </div>
        {repeat(rows, (row) => (
          <div className="admin-skeleton-table-row" key={row}>
            {repeat(5, (cell) => (
              <Block
                className={cell === 1 || cell === 3 ? "is-wide" : ""}
                key={cell}
              />
            ))}
          </div>
        ))}
      </div>
    );

  if (variant === "media")
    return (
      <div className="admin-skeleton-media">
        <header>
          <div>
            <Block className="is-title" />
            <Block className="is-copy" />
          </div>
          <Block className="is-button" />
        </header>
        <div>
          {repeat(Math.max(rows, 6), (index) => (
            <article key={index}>
              <Block className="is-media" />
              <Block className="is-copy" />
            </article>
          ))}
        </div>
      </div>
    );

  if (variant === "cards")
    return (
      <div className="admin-skeleton-cards">
        {repeat(Math.max(rows, 3), (index) => (
          <article key={index}>
            <Block className="is-badge" />
            <Block className="is-title" />
            <Block className="is-copy" />
            <Block className="is-copy is-short" />
            <footer>
              <Block className="is-button" />
              <Block className="is-button" />
            </footer>
          </article>
        ))}
      </div>
    );

  return (
    <>
      {repeat(rows, (index) => (
        <span className="admin-skeleton-line" key={index} />
      ))}
    </>
  );
}

export default function AdminSkeleton({
  className = "",
  rows = 4,
  variant = "lines",
}: AdminSkeletonProps) {
  return (
    <div
      className={`admin-skeleton admin-skeleton-${variant} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="불러오는 중"
      data-skeleton-variant={variant}
    >
      <div className="admin-skeleton-content" aria-hidden="true">
        <SkeletonContent variant={variant} rows={rows} />
      </div>
    </div>
  );
}
