// Banners de publicidade do painel administrativo, gravados 100% via GitHub
// Contents API — sem Supabase. Mesmo padrão de src/lib/github/articles.ts.
import type { Banner } from "@/types";
import { getFile, putFile } from "./client";

const MANIFEST_PATH = "src/content/banners.json";

export interface BannerInput {
    title: string;
    imageUrl: string;
    linkUrl: string;
}

async function readManifest(token: string): Promise<{ items: Banner[]; sha: string | null }> {
    const file = await getFile(token, MANIFEST_PATH);
    if (!file) return { items: [], sha: null };
    try {
        return { items: JSON.parse(file.text) as Banner[], sha: file.sha };
    } catch {
        return { items: [], sha: file.sha };
    }
}

async function writeManifest(
    token: string,
    items: Banner[],
    sha: string | null,
    message: string
): Promise<void> {
    const text = `${JSON.stringify(items, null, 2)}\n`;
    await putFile(token, MANIFEST_PATH, text, message, sha ?? undefined);
}

export async function listBanners(token: string): Promise<Banner[]> {
    const { items } = await readManifest(token);
    return [...items].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
}

export async function createBanner(token: string, input: BannerInput): Promise<Banner> {
    const { items, sha } = await readManifest(token);
    const banner: Banner = {
        id: crypto.randomUUID(),
        title: input.title,
        imageUrl: input.imageUrl,
        linkUrl: input.linkUrl,
        position: "sidebar",
        startDate: new Date().toISOString(),
        isActive: true,
    };
    await writeManifest(token, [banner, ...items], sha, `content(banner): cria "${input.title}"`);
    return banner;
}

export async function updateBanner(token: string, id: string, input: BannerInput): Promise<Banner> {
    const { items, sha } = await readManifest(token);
    const existing = items.find((banner) => banner.id === id);
    if (!existing) throw new Error("Banner não encontrado.");

    const updated: Banner = {
        ...existing,
        title: input.title,
        imageUrl: input.imageUrl,
        linkUrl: input.linkUrl,
    };
    const next = items.map((banner) => (banner.id === id ? updated : banner));
    await writeManifest(token, next, sha, `content(banner): atualiza "${input.title}"`);
    return updated;
}

export async function toggleBanner(token: string, id: string, isActive: boolean): Promise<void> {
    const { items, sha } = await readManifest(token);
    const next = items.map((banner) => (banner.id === id ? { ...banner, isActive } : banner));
    await writeManifest(
        token,
        next,
        sha,
        `content(banner): ${isActive ? "ativa" : "desativa"} banner`
    );
}

export async function deleteBanner(token: string, id: string): Promise<void> {
    const { items, sha } = await readManifest(token);
    const next = items.filter((banner) => banner.id !== id);
    await writeManifest(token, next, sha, "content(banner): remove banner");
}
