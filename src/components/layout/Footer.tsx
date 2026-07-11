import Image from "next/image";
import Link from "next/link";
import { getEditorias } from "@/lib/content";

const editorias = getEditorias();

export function Footer() {
  return (
    <footer className="mt-16 border-t border-polis-navy/10 bg-polis-navy text-polis-off-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 md:px-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Image
            src="/brand/LOGO_MARCA.png"
            alt="Pólis"
            width={44}
            height={44}
            className="h-11 w-11"
          />
          <p className="mt-3 max-w-xs text-sm text-polis-off-white/70">
            Onde a política faz sentido. Jornalismo político contextual, plural e confiável.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-polis-gold">
            Institucional
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-polis-off-white/80">
            <li><Link href="/sobre">Sobre o Pólis</Link></li>
            <li><Link href="/contato">Contato</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-polis-gold">
            Editorias
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-polis-off-white/80">
            {editorias.map((editoria) => (
              <li key={editoria.slug}>
                <Link href={`/editoria/${editoria.slug}`}>{editoria.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-polis-gold">
            Legal
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-polis-off-white/80">
            <li><Link href="/politica-de-privacidade">Política de Privacidade</Link></li>
            <li><Link href="/termos-de-uso">Termos de Uso</Link></li>
            <li><Link href="/lgpd">LGPD</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-polis-off-white/10 px-4 py-6 text-center text-xs text-polis-off-white/60 md:px-6">
        © {new Date().getFullYear()} Pólis — Onde a política faz sentido. Todos os direitos reservados.
      </div>
    </footer>
  );
}
