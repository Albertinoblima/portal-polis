import type { Metadata } from "next";
import { AdminTopbar } from "@/components/admin/Topbar";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Banners e Destaques",
};

export default function AdminBannersPage() {
  return (
    <>
      <AdminTopbar
        title="Banners e Destaques"
        description="Gerencie os destaques exibidos na Home. Arraste para reordenar."
      />

      <div className="p-6">
        <div className="mb-4 flex justify-end">
          <ButtonLink href="#">+ Novo Banner</ButtonLink>
        </div>

        <div className="rounded-sm border-2 border-dashed border-polis-navy/20 bg-white p-10 text-center text-sm text-polis-gray">
          Nenhum banner cadastrado ainda.
        </div>
      </div>
    </>
  );
}
