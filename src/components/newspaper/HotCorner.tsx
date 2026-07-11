/**
 * Puramente decorativo (pointer-events: none) — a dobra e o clique de
 * verdade são tratados nativamente pelo motor page-flip (showPageCorners),
 * que já ignora cliques em botões/links. Um <button> por cima do canto
 * bloquearia essa detecção nativa, então este componente só sinaliza
 * visualmente "há uma página para virar aqui".
 */
export function HotCorner() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-10 right-0 z-20 h-20 w-20 overflow-hidden"
    >
      <span
        className="absolute bottom-0 right-0 h-full w-full bg-gradient-to-tl from-polis-ink/20 via-polis-ink/5 to-transparent"
        style={{ clipPath: "polygon(100% 15%, 100% 100%, 15% 100%)" }}
      />
      <span className="absolute bottom-2 right-2 animate-pulse text-xl opacity-70">👉</span>
    </div>
  );
}
