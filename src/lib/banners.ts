// Módulo separado de content.ts de propósito: Newspaper.tsx (client component,
// usado em toda página pública) importa só este arquivo para os banners da
// margem publicitária. Se importasse de content.ts, o bundle do cliente
// arrastaria junto articles.json inteiro (corpo de todas as matérias) — só
// por causa de uma função que lê banners.json.
import type { Banner } from "@/types";
import bannersData from "@/content/banners.json";

const banners = bannersData as Banner[];

export function getActiveBanners(position: Banner["position"]): Banner[] {
  return banners.filter((b) => b.position === position);
}
