import type { Metadata } from "next";
import {
  Inter,
  EB_Garamond,
  JetBrains_Mono,
  Playfair_Display,
  Merriweather,
  Source_Sans_3,
  IBM_Plex_Sans,
} from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";
import "./globals.css";

// Lista curada de fontes selecionáveis em /admin/aparencia. `next/font` exige
// que toda fonte candidata seja importada em build-time — não dá pra carregar
// uma fonte arbitrária escolhida em runtime num site 100% estático.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const ebGaramond = EB_Garamond({ variable: "--font-eb-garamond", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});
const playfairDisplay = Playfair_Display({ variable: "--font-playfair-display", subsets: ["latin"] });
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const sourceSans3 = Source_Sans_3({ variable: "--font-source-sans-3", subsets: ["latin"] });
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
        url: "/brand/LOGO_COMPLETA.png",
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
        {children}
      </body>
    </html>
  );
}
