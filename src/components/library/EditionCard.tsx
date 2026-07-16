import Link from "next/link";
import type { Edition } from "@/types";
import { formatDateOnly } from "@/lib/utils";

interface EditionCardProps {
  edition: Edition;
}

function NewspaperIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-10 w-10 shrink-0 text-polis-gold-ink"
      aria-hidden="true"
    >
      <path
        d="M4 5h12a1 1 0 0 1 1 1v13a1 1 0 0 1-1.447.894L14 19H5a1 1 0 0 1-1-1V5Z"
        strokeLinejoin="round"
      />
      <path d="M17 8h2a1 1 0 0 1 1 1v9.5a1.5 1.5 0 0 1-3 0V8Z" strokeLinejoin="round" />
      <path d="M7 9h6M7 12h6M7 15h4" strokeLinecap="round" />
    </svg>
  );
}

export function EditionCard({ edition }: EditionCardProps) {
  return (
    <div className="flex h-full flex-col rounded-sm border border-polis-ink/15 p-5">
      <Link
        href={`/edicao/${edition.number}`}
        className="group flex items-center gap-3"
        aria-label={`Ler a edição nº ${edition.number} completa`}
      >
        <div className="pointer-events-none">
          <NewspaperIcon />
        </div>
        <div className="pointer-events-none">
          <p className="font-serif text-xl font-bold text-polis-ink group-hover:text-polis-gold-ink">
            Edição nº {edition.number}
          </p>
          <p className="text-xs text-polis-ink-soft">{formatDateOnly(edition.date)}</p>
        </div>
      </Link>

      <ol className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto border-t border-polis-rule/20 pt-4 text-sm">
        {edition.articles.map((article) => (
          <li key={article.id} className="list-decimal marker:text-polis-ink-soft" style={{ marginLeft: "1.25rem" }}>
            <Link href={`/materia/${article.slug}`} className="hover:text-polis-gold-ink">
              <span className="pointer-events-none text-polis-ink">{article.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
