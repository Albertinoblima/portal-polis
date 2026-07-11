import Image from "next/image";
import Link from "next/link";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/materias", label: "Matérias" },
  { href: "/admin/categorias", label: "Categorias e Editorias" },
  { href: "/admin/midia", label: "Biblioteca de Mídia" },
  { href: "/admin/banners", label: "Banners e Destaques" },
  { href: "/admin/usuarios", label: "Usuários" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export function AdminSidebar() {
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
            className="block rounded-sm px-3 py-2 text-sm font-medium text-polis-off-white/80 transition-colors hover:bg-white/5 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 px-6 py-4 text-xs text-polis-off-white/50">
        Painel Administrativo · Fase 1
      </div>
    </aside>
  );
}
