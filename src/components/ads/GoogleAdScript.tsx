import Script from "next/script";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export function GoogleAdScript() {
    if (!ADSENSE_CLIENT_ID) return null;

    return (
        <Script
            id="google-adsense-script"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
        />
    );
}
