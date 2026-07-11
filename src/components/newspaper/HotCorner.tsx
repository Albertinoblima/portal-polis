"use client";

interface HotCornerProps {
  onFlip: () => void;
  label?: string;
}

export function HotCorner({ onFlip, label = "Virar página" }: HotCornerProps) {
  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={label}
      className="group absolute bottom-10 right-0 z-20 h-16 w-16 cursor-pointer overflow-hidden [perspective:400px]"
    >
      <span
        className="absolute bottom-0 right-0 h-full w-full origin-bottom-right bg-gradient-to-tl from-polis-ink/15 via-transparent to-transparent shadow-sm transition-transform duration-300 ease-out group-hover:[transform:rotateY(-25deg)_rotateX(10deg)_translate(-4px,-4px)]"
        style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
      />
      <span className="pointer-events-none absolute bottom-2 right-2 animate-pulse text-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        👉
      </span>
    </button>
  );
}
