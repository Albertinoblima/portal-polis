import { getPublishedArticles } from "@/lib/content";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

const XML_ESCAPES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => XML_ESCAPES[char]);
}

export function GET() {
  const items = getPublishedArticles()
    .slice(0, 30)
    .map((article) => {
      const url = `${SITE_URL}/materia/${article.slug}/`;
      return `<item>
  <title>${escapeXml(article.title)}</title>
  <link>${url}</link>
  <guid>${url}</guid>
  <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
  <description>${escapeXml(article.subtitle)}</description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(SITE_NAME)}</title>
  <link>${SITE_URL}</link>
  <description>${escapeXml(SITE_DESCRIPTION)}</description>
  <language>pt-BR</language>
${items}
</channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
