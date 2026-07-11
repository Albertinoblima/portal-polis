import Link from "next/link";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Newspaper, type NewspaperBlock } from "@/components/newspaper/Newspaper";
import { getEditoriaById, getEditorias, getPublishedArticles } from "@/lib/content";

export default function HomePage() {
  const articles = getPublishedArticles();
  const [hero, ...rest] = articles;
  const highlights = rest.slice(0, 3);
  const latest = rest.slice(3, 7);
  const editorias = getEditorias();

  const blocks: NewspaperBlock[] = [];

  if (hero) {
    blocks.push({
      type: "node",
      node: (
        <div className="flex h-full flex-col justify-center">
          <ArticleCard article={hero} editoria={getEditoriaById(hero.editoriaId)} size="large" />
        </div>
      ),
    });
  }

  if (highlights.length > 0) {
    blocks.push({
      type: "node",
      node: (
        <div className="flex h-full flex-col">
          <SectionTitle title="Destaques do Dia" />
          <div className="grid flex-1 grid-cols-1 content-center gap-8 sm:grid-cols-2">
            {highlights.map((article) => (
              <ArticleCard key={article.id} article={article} editoria={getEditoriaById(article.editoriaId)} />
            ))}
          </div>
        </div>
      ),
    });
  }

  blocks.push({
    type: "node",
    node: (
      <div className="flex h-full flex-col">
        <SectionTitle title="Editorias" />
        <div className="flex flex-wrap gap-3">
          {editorias.map((editoria) => (
            <Link
              key={editoria.slug}
              href={`/editoria/${editoria.slug}`}
              className="rounded-sm border border-polis-ink/15 px-4 py-2 text-sm font-semibold text-polis-ink transition-colors hover:border-polis-gold-muted hover:text-polis-gold-muted"
            >
              {editoria.name}
            </Link>
          ))}
        </div>
      </div>
    ),
  });

  if (latest.length > 0) {
    blocks.push({
      type: "grid",
      items: latest.map((article) => (
        <ArticleCard key={article.id} article={article} editoria={getEditoriaById(article.editoriaId)} />
      )),
      itemsPerPage: { mobile: 2, desktop: 4 },
      gridClassName: "grid h-full grid-cols-1 content-center gap-6 sm:grid-cols-2",
    });
  }

  blocks.push({
    type: "node",
    node: (
      <div className="flex h-full flex-col justify-center gap-6">
        <div className="rounded-sm border border-polis-ink/15 p-5">
          <h3 className="font-sans text-sm font-bold uppercase tracking-wide text-polis-gold-muted">
            Radar Político
          </h3>
          <ul className="mt-4 space-y-3">
            {articles.slice(0, 5).map((article) => (
              <li key={article.id}>
                <Link
                  href={`/materia/${article.slug}`}
                  className="text-sm font-medium text-polis-ink hover:text-polis-gold-muted"
                >
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-sm bg-polis-ink p-5 text-polis-paper">
          <h3 className="font-sans text-sm font-bold uppercase tracking-wide text-polis-gold-muted">Newsletter</h3>
          <p className="mt-2 text-sm text-polis-paper/80">
            Receba as principais análises políticas direto no seu e-mail.
          </p>
          <Link
            href="/newsletter"
            className="mt-4 inline-block rounded-sm bg-polis-gold-muted px-4 py-2 text-sm font-semibold text-polis-ink"
          >
            Inscrever-se
          </Link>
        </div>
      </div>
    ),
  });

  return <Newspaper sectionLabel="Capa" showMasthead blocks={blocks} />;
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="mb-6 border-b-2 border-polis-gold-muted pb-2 font-sans text-xl font-bold text-polis-ink">
      {title}
    </h2>
  );
}
