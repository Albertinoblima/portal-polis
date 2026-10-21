"use client";

import { useEffect, useRef } from "react";

declare global {
    interface Window {
        adsbygoogle?: unknown[];
    }
}

type PrintAdVariant = "display" | "in-article";

interface PrintAdUnitProps {
    adSlot: string;
    variant?: PrintAdVariant;
    className?: string;
    minHeightPx?: number;
    label?: string;
}

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export function PrintAdUnit({
    adSlot,
    variant = "display",
    className,
    minHeightPx,
    label = "Publicidade",
}: PrintAdUnitProps) {
    const adRef = useRef<HTMLModElement | null>(null);

    useEffect(() => {
        if (!ADSENSE_CLIENT_ID || !adSlot || !adRef.current) return;

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
            // O AdSense pode lançar quando o slot já foi inicializado no mesmo nó.
            // Ignoramos para não quebrar a renderização da página.
        }
    }, [adSlot]);

    if (!ADSENSE_CLIENT_ID || !adSlot) return null;

    const isInArticle = variant === "in-article";

    return (
        <div className={["print-ad-container", className].filter(Boolean).join(" ")}>
            <span className="ad-label">{label}</span>
            <div className="ad-slot" style={minHeightPx ? { minHeight: `${minHeightPx}px` } : undefined}>
                <ins
                    ref={adRef}
                    className="adsbygoogle"
                    style={{ display: "block" }}
                    data-ad-client={ADSENSE_CLIENT_ID}
                    data-ad-slot={adSlot}
                    data-ad-format={isInArticle ? "fluid" : "auto"}
                    data-ad-layout={isInArticle ? "in-article" : undefined}
                    data-full-width-responsive="true"
                />
            </div>
        </div>
    );
}
