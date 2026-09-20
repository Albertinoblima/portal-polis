import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";
import { createHash } from "node:crypto";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "src", "content");
const ARTICLES_FILE = path.join(CONTENT_DIR, "articles.json");
const MANIFEST_FILE = path.join(CONTENT_DIR, "video-manifest.json");

function hashUrl(url) {
    return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

function isSupabaseGif(src) {
    return typeof src === "string" && src.includes("/storage/v1/object/public/") && src.toLowerCase().endsWith(".gif");
}

function buildVideoSnippet(entry, alt) {
    const altAttr = alt ? ` aria-label="${alt.replace(/&/g, "&amp;").replace(/\"/g, "&quot;")}"` : "";
    return `<video class="w-full h-auto" muted loop playsinline preload="none" poster="${entry.poster}" data-inline-video data-video-src="${entry.video}"${altAttr}></video>`;
}

async function main() {
    const articlesRaw = await readFile(ARTICLES_FILE, "utf-8");
    const manifestRaw = await readFile(MANIFEST_FILE, "utf-8");
    const articles = JSON.parse(articlesRaw);
    const manifest = JSON.parse(manifestRaw);

    const rewritten = articles.map((article) => {
        let content = article.content;
        if (content) {
            const dom = new JSDOM(`<!doctype html><body>${content}</body>`);
            let replacedAny = false;
            for (const img of Array.from(dom.window.document.querySelectorAll("img"))) {
                const src = img.getAttribute("src");
                if (!isSupabaseGif(src)) continue;
                const entry = manifest[hashUrl(src)];
                if (!entry) continue;
                const videoHtml = buildVideoSnippet(entry, img.getAttribute("alt") ?? "");
                const wrapper = dom.window.document.createElement("div");
                wrapper.innerHTML = videoHtml;
                const videoNode = wrapper.firstElementChild;
                if (videoNode) {
                    img.replaceWith(videoNode);
                    replacedAny = true;
                }
            }
            if (replacedAny) content = dom.window.document.body.innerHTML;
        }
        return { ...article, content };
    });

    await writeFile(ARTICLES_FILE, `${JSON.stringify(rewritten, null, 2)}\n`, "utf-8");
    console.log(`✓ Rewrote ${rewritten.length} article(s) with manifest entries.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
