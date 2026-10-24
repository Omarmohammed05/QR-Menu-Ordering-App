/**
 * The auth pages' visual half (D.CC reference: split-screen auth, the other
 * side a grid of dish photography). Static SVG illustrations — no external
 * assets, loads instantly, and stays crisp at any size. Hidden below `lg`
 * where the form takes the full viewport.
 */

/** One dish tile: a warm-toned SVG scene on a soft card. */
function Tile({children, tint}: {children: React.ReactNode; tint: string}) {
  return (
    <div
      className="grid place-items-center overflow-hidden rounded-2xl bg-white/95 shadow-card"
      style={{background: `linear-gradient(160deg, #ffffff 30%, ${tint})`}}
    >
      <svg viewBox="0 0 120 120" className="size-full p-4" aria-hidden>
        {children}
      </svg>
    </div>
  );
}

/** Shared plate under most dishes. */
const PLATE = <circle cx="60" cy="64" r="38" fill="#f6ede2" />;
const PLATE_RIM = <circle cx="60" cy="64" r="30" fill="#fffaf3" />;

const DISHES: {tint: string; art: React.ReactNode}[] = [
  // 1 — soup bowl with steam
  {
    tint: '#ffe8d9',
    art: (
      <>
        <path d="M24 58h72a36 36 0 0 1-72 0Z" fill="#ff6b36" />
        <ellipse cx="60" cy="58" rx="36" ry="7" fill="#ff8c5a" />
        <path d="M46 34c0-5 5-5 5-10M60 32c0-5 5-5 5-10M74 34c0-5 5-5 5-10" stroke="#ffb38a" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    )
  },
  // 2 — pizza slice
  {
    tint: '#fff1cc',
    art: (
      <>
        <path d="M60 24 26 88a6 6 0 0 0 8 8l26-12 26 12a6 6 0 0 0 8-8L60 24Z" fill="#ffc107" />
        <path d="M60 36 38 84l22-10 22 10L60 36Z" fill="#ff8f3f" />
        <circle cx="52" cy="62" r="5" fill="#e64a19" />
        <circle cx="70" cy="72" r="4" fill="#e64a19" />
        <circle cx="58" cy="80" r="3.5" fill="#e64a19" />
      </>
    )
  },
  // 3 — kebab skewer
  {
    tint: '#ffe3d0',
    art: (
      <>
        <path d="M30 90 90 30" stroke="#8d5524" strokeWidth="4" strokeLinecap="round" />
        <rect x="34" y="38" width="14" height="24" rx="7" fill="#e64a19" transform="rotate(45 41 50)" />
        <rect x="52" y="56" width="14" height="24" rx="7" fill="#ff8c5a" transform="rotate(45 59 68)" />
        <rect x="70" y="74" width="14" height="24" rx="7" fill="#e64a19" transform="rotate(45 77 86)" />
      </>
    )
  },
  // 4 — coffee cup
  {
    tint: '#f3ece5',
    art: (
      <>
        <path d="M34 48h44v18a22 22 0 0 1-44 0V48Z" fill="#fff" stroke="#e0d5cc" strokeWidth="3" />
        <path d="M78 52h8a8 8 0 0 1 0 16h-8" fill="none" stroke="#e0d5cc" strokeWidth="3" />
        <ellipse cx="56" cy="48" rx="22" ry="5" fill="#6f4e37" />
        <path d="M48 30c0-4 4-4 4-8M62 28c0-4 4-4 4-8" stroke="#c9a227" strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse cx="56" cy="94" rx="28" ry="5" fill="#e0d5cc" />
      </>
    )
  },
  // 5 — burger
  {
    tint: '#ffe9c9',
    art: (
      <>
        <path d="M30 40a30 16 0 0 1 60 0v4H30v-4Z" fill="#ffc107" />
        <rect x="30" y="48" width="60" height="8" rx="4" fill="#7cb342" />
        <rect x="28" y="58" width="64" height="14" rx="6" fill="#8d5524" />
        <rect x="30" y="74" width="60" height="7" rx="3.5" fill="#ff6b36" />
        <path d="M30 84h60a30 14 0 0 1-60 0Z" fill="#ffc107" />
        <circle cx="50" cy="36" r="1.8" fill="#fff" /><circle cx="64" cy="32" r="1.8" fill="#fff" />
      </>
    )
  },
  // 6 — fish
  {
    tint: '#e4f0f6',
    art: (
      <>
        <ellipse cx="56" cy="62" rx="28" ry="16" fill="#64b5f6" />
        <path d="M82 62l16-12v24L82 62Z" fill="#42a5f5" />
        <circle cx="40" cy="58" r="2.5" fill="#1c3d5a" />
        <path d="M54 46c4-8 12-8 16 0M54 78c4 8 12 8 16 0" fill="#90caf9" />
      </>
    )
  },
  // 7 — rice fattah mound
  {
    tint: '#fff3dc',
    art: (
      <>
        <path d="M28 84a32 26 0 0 1 64 0v4H28v-4Z" fill="#e64a19" />
        <path d="M38 78a22 20 0 0 1 44 0Z" fill="#fffaf3" />
        <path d="M46 74c2-6 8-8 14-6" stroke="#e0d5cc" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M58 52c2-6 8-6 8-12" stroke="#c9a227" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    )
  },
  // 8 — basbousa dessert
  {
    tint: '#ffdfba',
    art: (
      <>
        <rect x="36" y="44" width="48" height="36" rx="6" fill="#e8a84c" />
        <rect x="36" y="44" width="48" height="10" rx="5" fill="#f4c430" />
        <path d="M40 52c6 4 12 4 18 0s12-4 18 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="60" cy="90" r="5" fill="#c9a227" />
        <path d="M66 90h16a8 8 0 0 0-8-8" fill="#e64a19" />
      </>
    )
  },
  // 9 — mint tea glass
  {
    tint: '#e8f2e4',
    art: (
      <>
        <path d="M42 36h36l-4 52a14 8 0 0 1-28 0L42 36Z" fill="#fff" stroke="#e0d5cc" strokeWidth="3" />
        <path d="M44 58h32l-3 30a11 6 0 0 1-26 0l-3-30Z" fill="#c9a227" />
        <ellipse cx="60" cy="36" rx="18" ry="4" fill="#c9a227" />
        <path d="M74 30c6-2 8-8 6-12-4 2-6 6-6 12Z" fill="#7cb342" />
      </>
    )
  },
  // 10 — salad bowl
  {
    tint: '#e4f0dc',
    art: (
      <>
        <path d="M26 60h68a34 26 0 0 1-68 0Z" fill="#ff8c5a" />
        <ellipse cx="60" cy="60" rx="34" ry="6" fill="#fffaf3" />
        <path d="M42 54c-2-10 6-16 14-12 10-8 22 0 18 12" fill="#7cb342" />
        <circle cx="52" cy="52" r="4" fill="#e64a19" />
        <circle cx="68" cy="50" r="3" fill="#ffc107" />
      </>
    )
  },
  // 11 — hummus plate with olive-oil swirl
  {
    tint: '#f6ecd9',
    art: (
      <>
        {PLATE}
        {PLATE_RIM}
        <circle cx="60" cy="64" r="22" fill="#f0e2c8" />
        <path d="M52 62c4-6 12-6 16 0-4 6-12 6-16 0Z" fill="#e8c468" />
        <path d="M46 70c8 4 20 4 28 0" stroke="#c9a227" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="74" cy="56" r="3.4" fill="#6f4e37" />
        <path d="M44 46l4-8 4 8" fill="#7cb342" />
      </>
    )
  },
  // 12 — citrus slices
  {
    tint: '#ffe6cc',
    art: (
      <>
        <circle cx="48" cy="60" r="24" fill="#ffd166" />
        <circle cx="48" cy="60" r="19" fill="#fff3d6" />
        <circle cx="48" cy="60" r="5" fill="#ffd166" />
        <path d="M48 44v10M48 66v10M32 60h10M54 60h10M37 49l7 7M52 64l7 7M59 49l-7 7M44 64l-7 7" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="80" cy="80" r="12" fill="#ff6b36" />
        <circle cx="80" cy="80" r="8" fill="#ff9d6b" />
      </>
    )
  }
];

export function AuthVisual() {
  return (
    <div className="relative hidden overflow-hidden lg:block" aria-hidden>
      <div className="absolute inset-0 brand-gradient" />
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-3 p-6">
        {DISHES.map(({tint, art}, index) => (
          <Tile key={index} tint={tint}>
            {art}
          </Tile>
        ))}
      </div>
    </div>
  );
}
