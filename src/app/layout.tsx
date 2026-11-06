import type { Metadata } from "next";
import localFont from "next/font/local";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";
import { GoogleAdScript } from "@/components/ads/GoogleAdScript";
import "./globals.css";

// ─── Fontes auto-hospedadas ────────────────────────────────────────────────
// Todas as fontes são servidas localmente (public/fonts/) para evitar a falha
// intermitente do next/font/google no CI: o Google Fonts às vezes retorna um
// formato CSS alternativo que o regex interno do Next.js não reconhece,
// causando "TypeError: Cannot read properties of null (reading '1')".
// Arquivos obtidos via: https://fonts.googleapis.com/css2?family=...&display=swap

// Lista curada de fontes selecionáveis em /admin/aparencia. `next/font` exige
// que toda fonte candidata seja importada em build-time — não dá pra carregar
// uma fonte arbitrária escolhida em runtime num site 100% estático.
const inter = localFont({
  src: "../../public/fonts/inter/inter-normal-100-900.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});
const ebGaramond = localFont({
  src: [
    { path: "../../public/fonts/eb-garamond/eb-garamond-normal-400-800.woff2", style: "normal", weight: "400 800" },
    { path: "../../public/fonts/eb-garamond/eb-garamond-italic-400-800.woff2", style: "italic", weight: "400 800" },
  ],
  variable: "--font-eb-garamond",
  display: "swap",
});
const jetbrainsMono = localFont({
  src: "../../public/fonts/jetbrains-mono/jetbrains-mono-normal-100-800.woff2",
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: "100 800",
});
const playfairDisplay = localFont({
  src: [
    { path: "../../public/fonts/playfair-display/playfair-display-normal-400-900.woff2", style: "normal", weight: "400 900" },
    { path: "../../public/fonts/playfair-display/playfair-display-italic-400-900.woff2", style: "italic", weight: "400 900" },
  ],
  variable: "--font-playfair-display",
  display: "swap",
});
const merriweather = localFont({
  src: [
    { path: "../../public/fonts/merriweather/merriweather-normal-300.woff2", style: "normal", weight: "300" },
    { path: "../../public/fonts/merriweather/merriweather-normal-400.woff2", style: "normal", weight: "400" },
    { path: "../../public/fonts/merriweather/merriweather-normal-700.woff2", style: "normal", weight: "700" },
    { path: "../../public/fonts/merriweather/merriweather-normal-900.woff2", style: "normal", weight: "900" },
    { path: "../../public/fonts/merriweather/merriweather-italic-300.woff2", style: "italic", weight: "300" },
    { path: "../../public/fonts/merriweather/merriweather-italic-400.woff2", style: "italic", weight: "400" },
    { path: "../../public/fonts/merriweather/merriweather-italic-700.woff2", style: "italic", weight: "700" },
    { path: "../../public/fonts/merriweather/merriweather-italic-900.woff2", style: "italic", weight: "900" },
  ],
  variable: "--font-merriweather",
  display: "swap",
});
const sourceSans3 = localFont({
  src: "../../public/fonts/source-sans-3/source-sans-3-normal-200-900.woff2",
  variable: "--font-source-sans-3",
  display: "swap",
  weight: "200 900",
});
// IBM Plex Sans: auto-hospedada para evitar falha intermitente do next/font/google no CI.
const ibmPlexSans = localFont({
  src: [
    { path: "../../public/fonts/ibm-plex-sans/ibm-plex-sans-latin-ext.woff2", style: "normal", weight: "100 900" },
    { path: "../../public/fonts/ibm-plex-sans/ibm-plex-sans-latin.woff2", style: "normal", weight: "100 900" },
  ],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const HEADING_FONT_VAR: Record<string, string> = {
  "eb-garamond": "var(--font-eb-garamond)",
  "playfair-display": "var(--font-playfair-display)",
  merriweather: "var(--font-merriweather)",
};

const BODY_FONT_VAR: Record<string, string> = {
  inter: "var(--font-inter)",
  "source-sans-3": "var(--font-source-sans-3)",
  "ibm-plex-sans": "var(--font-ibm-plex-sans)",
};

const siteSettings = getSiteSettings();
const fullTitle = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: fullTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: siteSettings.faviconUrl
    ? { icon: siteSettings.faviconUrl, apple: siteSettings.faviconUrl }
    : {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: fullTitle,
    description: SITE_DESCRIPTION,
    // Fallback para páginas sem imagem própria (Home, Sobre, Contato, etc.) —
    // sem isso, compartilhar essas páginas no WhatsApp/redes não mostra
    // nenhuma prévia de imagem. Páginas com imagem específica (matérias)
    // sobrescrevem este array no próprio generateMetadata.
    images: [
      {
        url: `${SITE_URL}/brand/LOGO_COMPLETA.png`,
        width: 1254,
        height: 1254,
        alt: SITE_NAME,
      },
    ],
  },
  alternates: {
    types: {
      "application/rss+xml": `${SITE_URL}/rss.xml`,
    },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: siteSettings.logoUrl ?? `${SITE_URL}/brand/LOGO_MARCA.png`,
  description: SITE_DESCRIPTION,
};

const gaId = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeStyle = `:root{--color-navy:${siteSettings.colorPrimary};--color-gold:${siteSettings.colorAccent};--color-paper:${siteSettings.colorPaper};--font-sans:${BODY_FONT_VAR[siteSettings.fontBody] ?? "var(--font-inter)"};--font-serif:${HEADING_FONT_VAR[siteSettings.fontHeading] ?? "var(--font-eb-garamond)"};}`;

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${ebGaramond.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} ${merriweather.variable} ${sourceSans3.variable} ${ibmPlexSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-polis-off-white text-polis-navy">
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`,
              }}
            />
          </>
        )}
        <GoogleAdScript />
        {children}
      </body>
    </html>
  );
}
