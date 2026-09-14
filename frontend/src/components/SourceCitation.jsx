export default function SourceCitation({ sources }) {
  if (!sources || sources.length === 0) return null

  return (
    <details className="group mt-2 text-xs">
      <summary className="flex cursor-pointer select-none items-center gap-1 text-neutral-500 hover:text-neutral-800">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3 transition-transform group-open:rotate-90"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        {sources.length} source{sources.length > 1 ? 's' : ''}
      </summary>
      <ul className="mt-1.5 space-y-1.5">
        {sources.map((source, i) => (
          <li
            key={i}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5"
          >
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium text-neutral-800">
              p. {source.page}
            </span>{' '}
            <span className="italic text-neutral-500">
              &ldquo;{source.snippet}&rdquo;
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}
