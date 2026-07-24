"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode, SVGProps } from "react";
import { signOut } from "@/lib/supabase/auth";
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
      { href: "/admin/categorias/", label: "Categorias e Editorias", icon: FolderIcon },
      { href: "/admin/tags/", label: "Tags", icon: TagIcon },
      { href: "/admin/midia/", label: "Biblioteca de Mídia", icon: ImageIcon },
      { href: "/admin/banners/", label: "Banners e Destaques", icon: MegaphoneIcon },
    ],
  },
  {
    label: "Aparência",
    items: [{ href: "/admin/aparencia/", label: "Aparência", icon: PaletteIcon }],
  },
  {
    label: "Comunidade",
    items: [
      { href: "/admin/comentarios/", label: "Comentários", icon: MessageCircleIcon },
      { href: "/admin/newsletter/", label: "Newsletter", icon: MailIcon },
      { href: "/admin/mensagens/", label: "Mensagens de Contato", icon: MessageSquareIcon },
      { href: "/admin/usuarios/", label: "Usuários", icon: UsersIcon },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/admin/auditoria/", label: "Auditoria", icon: ShieldIcon },
      { href: "/admin/configuracoes/", label: "Configurações", icon: SettingsIcon },
    ],
  },
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

function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M9 8h2M9 12h6M9 16h6" />
    </svg>
  );
}

function FolderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.58 3H4a1 1 0 0 0-1 1v5.58a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l5.58-5.58a2 2 0 0 0 0-2.83Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
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

function MegaphoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M3 11v3a1 1 0 0 0 1 1h3l4 4V6l-4 4H4a1 1 0 0 0-1 1z" />
      <path d="M16 9a4 4 0 0 1 0 6" />
      <path d="M19 6a8 8 0 0 1 0 12" />
    </svg>
  );
}

function PaletteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="15" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MessageCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function MessageSquareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
