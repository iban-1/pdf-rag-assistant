const LABELS = {
  idle: 'Standing by',
  thinking: 'Reading the doc…',
  speaking: 'Answering',
}

export default function Character({ state }) {
  return (
    <div className="flex flex-col items-center gap-3 px-2">
      <svg
        viewBox="0 0 100 100"
        className={`h-20 w-20 ${state === 'idle' ? 'char-idle' : ''}`}
      >
        {/* antenna */}
        <line x1="50" y1="8" x2="50" y2="18" stroke="#0a0a0a" strokeWidth="2" />
        <circle
          cx="50"
          cy="6"
          r="3.5"
          fill="var(--accent)"
          className={state === 'thinking' ? 'char-pulse' : ''}
        />

        {/* head */}
        <rect x="15" y="18" width="70" height="62" rx="18" fill="#0a0a0a" />

        {/* eyes */}
        {state === 'thinking' ? (
          <g className="char-thinking-eyes">
            <circle cx="38" cy="48" r="5" fill="#fafafa" />
            <circle cx="62" cy="48" r="5" fill="#fafafa" />
          </g>
        ) : (
          <g>
            <rect
              x="33"
              y="43"
              width="10"
              height="10"
              rx="5"
              fill="#fafafa"
              className="char-eye"
            />
            <rect
              x="57"
              y="43"
              width="10"
              height="10"
              rx="5"
              fill="#fafafa"
              className="char-eye char-eye-delay"
            />
          </g>
        )}

        {/* mouth */}
        {state === 'speaking' ? (
          <g>
            <rect x="38" y="62" width="4" height="10" rx="2" fill="var(--accent)" className="char-bar char-bar-1" />
            <rect x="48" y="62" width="4" height="10" rx="2" fill="var(--accent)" className="char-bar char-bar-2" />
            <rect x="58" y="62" width="4" height="10" rx="2" fill="var(--accent)" className="char-bar char-bar-3" />
          </g>
        ) : (
          <rect x="38" y="65" width="24" height="4" rx="2" fill="#fafafa" opacity="0.7" />
        )}
      </svg>

      <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
        {LABELS[state]}
      </p>
    </div>
  )
}
