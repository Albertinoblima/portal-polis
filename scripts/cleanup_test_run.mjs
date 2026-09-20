import { readFile, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "src", "content");
const ARTICLES_FILE = path.join(CONTENT_DIR, "articles.json");
const BACKUP_FILE = path.join(CONTENT_DIR, "articles.json.bak");
const MANIFEST_FILE = path.join(CONTENT_DIR, "video-manifest.json");

async function main() {
    if (existsSync(BACKUP_FILE)) {
        const bak = await readFile(BACKUP_FILE, "utf-8");
        await writeFile(ARTICLES_FILE, bak, "utf-8");
        await unlink(BACKUP_FILE);
        console.log("✓ Restored original articles.json from backup and removed backup file.");
    } else {
        console.log("⚠ No backup file found — leaving articles.json as-is.");
    }

    if (existsSync(MANIFEST_FILE)) {
        try {
            const manifestRaw = await readFile(MANIFEST_FILE, "utf-8");
            const manifest = JSON.parse(manifestRaw);
            for (const key of Object.keys(manifest)) {
                const entry = manifest[key];
                const videoPath = path.join(ROOT, entry.video.replace(/^\//, ""));
                const posterPath = path.join(ROOT, entry.poster.replace(/^\//, ""));
                try { if (existsSync(videoPath)) await unlink(videoPath); } catch { };
                try { if (existsSync(posterPath)) await unlink(posterPath); } catch { };
            }
        } catch (err) {
            console.warn("⚠ Could not parse manifest or remove files:", err.message);
        }
        try { await unlink(MANIFEST_FILE); console.log("✓ Removed test video-manifest.json"); } catch { };
    }
}

main().catch((err) => { console.error(err); process.exit(1); });
