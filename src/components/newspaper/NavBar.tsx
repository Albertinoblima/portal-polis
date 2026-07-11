"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getEditorias } from "@/lib/content";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const editorias = getEditorias();

const INSTITUTIONAL_LINKS = [
  { href: "/contato", label: "Contato" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/politica-de-cookies", label: "Política de Cookies" },
  { href: "/lgpd", label: "LGPD" },
];

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInstitutionalOpen, setIsInstitutionalOpen] = useState(false);

  return (
    <div className="relative z-30 flex h-12 shrink-0 items-center justify-between gap-4 border-b border-polis-rule/20 bg-polis-paper px-4 text-polis-ink md:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/brand/LOGO_MARCA.png" alt="Portal Pólis" width={24} height={24} className="h-6 w-6" priority />
        <span className="hidden font-serif text-sm font-bold sm:inline">Portal Pólis</span>
      </Link>

      <nav className="hidden items-center gap-5 lg:flex">
        {editorias.map((editoria) => (
          <Link
            key={editoria.slug}
            href={`/editoria/${editoria.slug}`}
            className="text-xs font-medium uppercase tracking-wide text-polis-ink-soft transition-colors hover:text-polis-gold-ink"
          >
            {editoria.name}
          </Link>
        ))}
        <Link
          href="/colunistas"
          className="text-xs font-medium uppercase tracking-wide text-polis-ink-soft hover:text-polis-gold-ink"
        >
          Colunistas
        </Link>
        <Link
          href="/sobre"
          className="text-xs font-medium uppercase tracking-wide text-polis-ink-soft hover:text-polis-gold-ink"
        >
          Sobre
        </Link>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsInstitutionalOpen((open) => !open)}
            aria-expanded={isInstitutionalOpen}
            className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-polis-ink-soft hover:text-polis-gold-ink"
          >
            Institucional
            <ChevronIcon open={isInstitutionalOpen} />
          </button>
          {isInstitutionalOpen && (
            <ul className="absolute right-0 top-full z-10 mt-2 w-52 rounded-sm border border-polis-rule/20 bg-polis-paper py-2 shadow-md">
              {INSTITUTIONAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsInstitutionalOpen(false)}
                    className="block px-4 py-1.5 text-xs text-polis-ink-soft hover:text-polis-gold-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>

      <div className="flex items-center gap-1">
        <Link href="/busca" aria-label="Buscar" className="rounded-full p-2 text-polis-ink hover:bg-polis-ink/10">
          <SearchIcon />
        </Link>
        <FullscreenToggle />
        <ThemeToggle />
        <Link
          href="/admin/login"
          className="hidden rounded-sm border border-polis-ink/30 px-3 py-1 text-xs font-semibold sm:inline-block"
        >
          Entrar
        </Link>
        <button
          aria-label="Abrir menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="rounded-md p-2 text-polis-ink hover:bg-polis-ink/10 lg:hidden"
        >
          <MenuIcon />
        </button>
      </div>

      {isMenuOpen && (
        <nav className="absolute left-0 right-0 top-full border-b border-polis-rule/20 bg-polis-paper px-4 py-4 shadow-md lg:hidden">
          <ul className="flex flex-col gap-3">
            {editorias.map((editoria) => (
              <li key={editoria.slug}>
                <Link
                  href={`/editoria/${editoria.slug}`}
                  className="block py-1 text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {editoria.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/colunistas" className="block py-1 text-sm" onClick={() => setIsMenuOpen(false)}>
                Colunistas
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="block py-1 text-sm" onClick={() => setIsMenuOpen(false)}>
                Sobre
              </Link>
            </li>
            <li className="mt-2 border-t border-polis-rule/20 pt-2 text-[11px] font-semibold uppercase tracking-wide text-polis-ink-soft">
              Institucional
            </li>
            {INSTITUTIONAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block py-1 text-sm" onClick={() => setIsMenuOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/admin/login"
                className="block py-1 text-sm font-semibold"
                onClick={() => setIsMenuOpen(false)}
              >
                Entrar (Admin)
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? "Sair da tela cheia" : "Ver em tela cheia"}
      className="rounded-full p-2 text-polis-ink hover:bg-polis-ink/10"
    >
      {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
    </button>
  );
}

function FullscreenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FullscreenExitIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
