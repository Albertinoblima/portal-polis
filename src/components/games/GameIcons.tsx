export function TicTacToeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M18 5v38M30 5v38M5 18h38M5 30h38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M10.5 10.5l7 7m0-7l-7 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="37.5" cy="14" r="4" stroke="currentColor" strokeWidth="2.5" opacity="0.7" />
      <path
        d="M10.5 30.5l7 7m0-7l-7 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function SnakeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 14h8v8h8v8h16"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="30" r="3" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
