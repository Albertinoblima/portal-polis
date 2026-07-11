import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAuthors } from "@/lib/content";

export const metadata: Metadata = {
  title: "Colunistas",
  description: "Conheça os colunistas e editores do Pólis.",
};

export default function ColunistasPage() {
  const authors = getAuthors();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="font-sans text-4xl font-bold text-polis-navy">Colunistas</h1>
      <p className="mt-2 max-w-2xl text-polis-slate">
        Vozes plurais para um debate político qualificado.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((author) => (
          <Link
            key={author.id}
            href={`/colunista/${author.id}`}
            className="flex flex-col items-center gap-3 rounded-sm border border-polis-navy/10 p-6 text-center transition-colors hover:border-polis-gold"
          >
            <Image
              src={author.avatarUrl ?? "/brand/LOGO_MARCA.png"}
              alt={author.name}
              width={72}
              height={72}
              className="h-18 w-18 rounded-full object-cover"
            />
            <h2 className="font-sans font-bold text-polis-navy">{author.name}</h2>
            <p className="line-clamp-2 text-sm text-polis-slate">{author.bio}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
