"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode, SVGProps } from "react";
import { useAdminSession } from "@/components/admin/AuthProvider";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// As demais seções (categorias, tags, banners, aparência, comentários,
// newsletter, mensagens, usuários, auditoria, configurações) ainda dependem
// do Supabase Auth (RLS) e ficam fora da navegação até serem migradas para
// o novo modelo baseado em GitHub.
const navGroups: NavGroup[] = [
  {
    label: "Conteúdo",
    items: [
      { href: "/admin/dashboard/", label: "Dashboard", icon: GridIcon },
      { href: "/admin/materias/", label: "Matérias", icon: DocumentIcon },
      { href: "/admin/midia/", label: "Biblioteca de Mídia", icon: ImageIcon },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAdminSession();

  function handleSignOut() {
    signOut();
    router.replace("/admin/login/");
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-polis-navy/10 bg-polis-navy text-polis-off-white md:flex md:flex-col">
      <div className="flex items-center gap-2 px-6 py-5">
        <Image src="/brand/LOGO_MARCA.png" alt="Pólis" width={32} height={32} className="h-8 w-8" />
        <span className="font-sans text-lg font-bold">Pólis Admin</span>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-polis-off-white/40">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname?.startsWith(item.href.replace(/\/$/, ""));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-sm border-l-2 px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-polis-gold bg-white/10 text-white"
                        : "border-transparent text-polis-off-white/80 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
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

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ImageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}


