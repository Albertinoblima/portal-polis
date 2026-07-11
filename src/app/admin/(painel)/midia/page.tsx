import Image from "next/image";
import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/Topbar";
import { getPublishedArticles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Biblioteca de Mídia",
};

export default function AdminMidiaPage() {
  const images = getPublishedArticles().map((article) => ({
    url: article.featuredImage,
    alt: article.featuredImageAlt,
  }));

  return (
    <>
      <AdminTopbar title="Biblioteca de Mídia" description="Imagens e documentos disponíveis para uso nas matérias." />

      <div className="p-6">
        <div className="mb-4 flex h-32 items-center justify-center rounded-sm border-2 border-dashed border-polis-navy/20 text-sm text-polis-gray">
          Arraste arquivos aqui ou clique para enviar
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {images.map((image, index) => (
            <div key={index} className="relative aspect-square overflow-hidden rounded-sm border border-polis-navy/10 bg-white">
              <Image src={image.url} alt={image.alt} fill sizes="150px" className="object-contain p-3" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
