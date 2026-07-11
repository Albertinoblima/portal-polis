import Link from "next/link";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getEditoriaById, getEditorias, getPublishedArticles } from "@/lib/content";

export default function HomePage() {
  const articles = getPublishedArticles();
  const [hero, ...rest] = articles;
  const highlights = rest.slice(0, 3);
  const latest = rest.slice(3, 7);
  const editorias = getEditorias();

  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-8 md:px-6">
      {hero && (
        <section>
          <ArticleCard article={hero} editoria={getEditoriaById(hero.editoriaId)} size="large" />
        </section>
      )}

      {highlights.length > 0 && (
        <section>
          <SectionTitle title="Destaques do Dia" />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                editoria={getEditoriaById(article.editoriaId)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle title="Editorias" />
        <div className="flex flex-wrap gap-3">
          {editorias.map((editoria) => (
            <Link
              key={editoria.slug}
              href={`/editoria/${editoria.slug}`}
              className="rounded-sm border border-polis-navy/10 px-4 py-2 text-sm font-semibold text-polis-navy transition-colors hover:border-polis-gold hover:text-polis-gold"
            >
              {editoria.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_1fr]">
        <div>
          <SectionTitle title="Últimas Notícias" />
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {latest.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                editoria={getEditoriaById(article.editoriaId)}
              />
            ))}
          </div>
        </div>

        <aside className="space-y-8">
          <div className="rounded-sm border border-polis-navy/10 p-5">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wide text-polis-gold">
              Radar Político
            </h3>
            <ul className="mt-4 space-y-3">
              {articles.slice(0, 5).map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/materia/${article.slug}`}
                    className="text-sm font-medium text-polis-navy hover:text-polis-gold"
                  >
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-sm bg-polis-navy p-5 text-polis-off-white">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wide text-polis-gold">
              Newsletter
            </h3>
            <p className="mt-2 text-sm text-polis-off-white/80">
              Receba as principais análises políticas direto no seu e-mail.
            </p>
            <Link
              href="/newsletter"
              className="mt-4 inline-block rounded-sm bg-polis-gold px-4 py-2 text-sm font-semibold text-polis-navy"
            >
              Inscrever-se
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="mb-6 border-b-2 border-polis-gold pb-2 font-sans text-xl font-bold text-polis-navy">
      {title}
    </h2>
  );
}
