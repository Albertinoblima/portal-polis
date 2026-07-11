"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getEditorias } from "@/lib/content";

const editorias = getEditorias();

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-polis-navy/10 bg-polis-off-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/LOGO_MARCA.png"
            alt="Pólis"
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <span className="hidden font-sans text-xl font-bold text-polis-navy sm:inline">
            Pólis
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {editorias.map((editoria) => (
            <Link
              key={editoria.slug}
              href={`/editoria/${editoria.slug}`}
              className="text-sm font-medium text-polis-navy transition-colors hover:text-polis-gold"
            >
              {editoria.name}
            </Link>
          ))}
          <Link
            href="/colunistas"
            className="text-sm font-medium text-polis-navy transition-colors hover:text-polis-gold"
          >
            Colunistas
          </Link>
          <Link
            href="/sobre"
            className="text-sm font-medium text-polis-navy transition-colors hover:text-polis-gold"
          >
            Sobre
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/busca"
            aria-label="Buscar"
            className="rounded-full p-2 text-polis-navy hover:bg-polis-navy/5"
          >
            <SearchIcon />
          </Link>
          <Link
            href="/admin/login"
            className="hidden rounded-sm border border-polis-navy px-4 py-1.5 text-sm font-semibold text-polis-navy transition-colors hover:bg-polis-navy hover:text-white sm:inline-block"
          >
            Entrar
          </Link>
          <button
            aria-label="Abrir menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-md p-2 text-polis-navy hover:bg-polis-navy/5 lg:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="border-t border-polis-navy/10 bg-polis-off-white px-4 py-4 lg:hidden">
          <ul className="flex flex-col gap-3">
            {editorias.map((editoria) => (
              <li key={editoria.slug}>
                <Link
                  href={`/editoria/${editoria.slug}`}
                  className="block py-1 text-polis-navy"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {editoria.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/colunistas" className="block py-1 text-polis-navy" onClick={() => setIsMenuOpen(false)}>
                Colunistas
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="block py-1 text-polis-navy" onClick={() => setIsMenuOpen(false)}>
                Sobre
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="block py-1 font-semibold text-polis-navy" onClick={() => setIsMenuOpen(false)}>
                Entrar (Admin)
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
