"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase/auth";
import { useAdminSession } from "@/components/admin/AuthProvider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard/", label: "Dashboard" },
  { href: "/admin/materias/", label: "Matérias" },
  { href: "/admin/categorias/", label: "Categorias e Editorias" },
  { href: "/admin/tags/", label: "Tags" },
  { href: "/admin/midia/", label: "Biblioteca de Mídia" },
  { href: "/admin/banners/", label: "Banners e Destaques" },
  { href: "/admin/comentarios/", label: "Comentários" },
  { href: "/admin/newsletter/", label: "Newsletter" },
  { href: "/admin/mensagens/", label: "Mensagens de Contato" },
  { href: "/admin/usuarios/", label: "Usuários" },
  { href: "/admin/auditoria/", label: "Auditoria" },
  { href: "/admin/configuracoes/", label: "Configurações" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAdminSession();

  async function handleSignOut() {
    await signOut();
    router.replace("/admin/login/");
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-polis-navy/10 bg-polis-navy text-polis-off-white md:flex md:flex-col">
      <div className="flex items-center gap-2 px-6 py-5">
        <Image src="/brand/LOGO_MARCA.png" alt="Pólis" width={32} height={32} className="h-8 w-8" />
        <span className="font-sans text-lg font-bold">Pólis Admin</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-sm px-3 py-2 text-sm font-medium transition-colors hover:bg-white/5 hover:text-white",
              pathname?.startsWith(item.href.replace(/\/$/, ""))
                ? "bg-white/10 text-white"
                : "text-polis-off-white/80"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 px-6 py-4">
        <p className="truncate text-sm font-semibold text-white">{profile.name}</p>
        <p className="text-xs text-polis-off-white/50">{profile.email}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-3 text-xs font-semibold text-polis-gold hover:underline"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
