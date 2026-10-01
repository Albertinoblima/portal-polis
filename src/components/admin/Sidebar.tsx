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

const navGroups: NavGroup[] = [
  {
    label: "Conteúdo",
    items: [
      { href: "/admin/dashboard/", label: "Dashboard", icon: GridIcon },
      { href: "/admin/materias/", label: "Matérias", icon: DocumentIcon },
      { href: "/admin/midia/", label: "Biblioteca de Mídia", icon: ImageIcon },
    ],
  },
  {
    label: "Administração",
    items: [
      { href: "/admin/categorias/", label: "Categorias", icon: TagIcon },
      { href: "/admin/banners/", label: "Publicidade", icon: MegaphoneIcon },
      { href: "/admin/aparencia/", label: "Aparência", icon: PaletteIcon },
      { href: "/admin/configuracoes/", label: "Configurações", icon: GearIcon },
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

function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12.59 2H6a2 2 0 0 0-2 2v6.59a2 2 0 0 0 .59 1.41l9 9a2 2 0 0 0 2.82 0l6.59-6.59a2 2 0 0 0 0-2.82l-9-9A2 2 0 0 0 12.59 2Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

function MegaphoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="m3 11 18-5v12L3 13v-2Z" />
      <path d="M11.6 16.8a3 3 0 0 1-5.8-1.6" />
    </svg>
  );
}

function PaletteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4c2 0 3.6-1.6 3.6-3.6C21 6.3 16.9 2 12 2Z" />
      <circle cx="7" cy="10" r="1.2" />
      <circle cx="11" cy="7" r="1.2" />
      <circle cx="16" cy="9" r="1.2" />
    </svg>
  );
}

function GearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}


