import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";
import { getAuthors } from "@/lib/content";

export const metadata: Metadata = {
  title: "Colunistas",
  description: "Conheça os colunistas e editores do Portal Pólis.",
};

export default function ColunistasPage() {
  const authors = getAuthors();

  const blocks: NewspaperBlock[] = [
    {
      type: "node",
      node: (
        <header className="flex h-full flex-col justify-center">
          <h1 className="font-serif text-4xl font-bold text-polis-ink">Colunistas</h1>
          <p className="mt-2 max-w-2xl text-polis-ink-soft">
            Vozes plurais para um debate político qualificado.
          </p>
        </header>
      ),
    },
    {
      type: "grid",
      items: authors.map((author) => (
        <Link
          key={author.id}
          href={`/colunista/${author.id}`}
          className="flex flex-col items-center gap-3 rounded-sm border border-polis-ink/10 p-6 text-center transition-colors hover:border-polis-gold-muted"
        >
          <Image
            src={author.avatarUrl ?? "/brand/LOGO_MARCA.png"}
            alt={author.name}
            width={72}
            height={72}
            className="h-18 w-18 rounded-full object-cover grayscale"
          />
          <h2 className="font-sans font-bold text-polis-ink">{author.name}</h2>
          <p className="line-clamp-2 text-sm text-polis-ink-soft">{author.bio}</p>
        </Link>
      )),
      itemsPerPage: { mobile: 2, desktop: 6 },
      gridClassName: "grid h-full grid-cols-1 content-center gap-6 sm:grid-cols-2 lg:grid-cols-3",
    },
  ];

  return <Newspaper sectionLabel="Colunistas" showMasthead blocks={blocks} />;
}
