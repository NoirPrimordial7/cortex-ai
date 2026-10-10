export function RecordPager({
  page,
  total,
  size,
  onPage,
  noun = "records",
}: {
  page: number;
  total: number;
  size: number;
  onPage: (page: number) => void;
  noun?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <nav className="record-pager" aria-label="Record pages">
      <p role="status">
        {total ? page * size + 1 : 0}–{Math.min((page + 1) * size, total)} of{" "}
        {total} {noun}
      </p>
      <div>
        <button
          className="button"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <button
          className="button"
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
