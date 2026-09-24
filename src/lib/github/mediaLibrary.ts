// Biblioteca de Mídia do painel administrativo, gravada 100% via GitHub
// Contents API — sem Supabase Storage. Cada upload/remoção é um commit
// direto na branch de produção, o que já dispara o workflow de deploy
// existente (.github/workflows/deploy.yml roda em todo push em main), então
// não precisa de nenhum gatilho de rebuild separado.
//
// Os arquivos ficam em `public/biblioteca-midias/` (viram assets estáticos
// normais do site após o próximo deploy, servidos em `/biblioteca-midias/`).
// Os metadados (texto alternativo, quem enviou, quando) ficam num manifesto
// versionado em `src/content/media.json`, lido/gravado a cada operação.
import { deleteFile, getFile, putFile } from "./client";

export interface MediaItem {
    id: string;
    filename: string;
    path: string;
    mimeType: string;
    size: number;
    altText: string;
    uploadedBy: string;
    uploadedAt: string;
}

const MANIFEST_PATH = "src/content/media.json";
const MEDIA_DIR = "public/biblioteca-midias";

// Limite conservador para o commit via API do GitHub (bem menor que o
// antigo bucket do Supabase) — arquivos maiores devem ser otimizados antes
// do envio.
export const MAX_MEDIA_UPLOAD_BYTES = 20 * 1024 * 1024;

async function readManifest(token: string): Promise<{ items: MediaItem[]; sha: string | null }> {
    const file = await getFile(token, MANIFEST_PATH);
    if (!file) return { items: [], sha: null };
    try {
        const items = JSON.parse(file.text) as MediaItem[];
        return { items, sha: file.sha };
    } catch {
        return { items: [], sha: file.sha };
    }
}

async function writeManifest(
    token: string,
    items: MediaItem[],
    sha: string | null,
    message: string
): Promise<void> {
    const text = `${JSON.stringify(items, null, 2)}\n`;
    await putFile(token, MANIFEST_PATH, text, message, sha ?? undefined);
}

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function listMedia(token: string): Promise<MediaItem[]> {
    const { items } = await readManifest(token);
    return [...items].sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export async function uploadMedia(
    token: string,
    file: File,
    altText: string,
    uploadedBy: string
): Promise<MediaItem> {
    if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
        const maxMb = Math.round(MAX_MEDIA_UPLOAD_BYTES / (1024 * 1024));
        throw new Error(`Arquivo muito grande (máximo ${maxMb}MB).`);
    }

    const filename = `${Date.now()}-${sanitizeFilename(file.name)}`;
    const buffer = await file.arrayBuffer();
    await putFile(token, `${MEDIA_DIR}/${filename}`, buffer, `chore(media): adiciona ${filename}`);

    const { items, sha } = await readManifest(token);
    const item: MediaItem = {
        id: crypto.randomUUID(),
        filename,
        path: `/biblioteca-midias/${filename}`,
        mimeType: file.type,
        size: file.size,
        altText,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
    };
    await writeManifest(token, [item, ...items], sha, `chore(media): registra ${filename}`);
    return item;
}

export async function deleteMedia(token: string, item: MediaItem): Promise<void> {
    const filePath = `${MEDIA_DIR}/${item.filename}`;
    const existingFile = await getFile(token, filePath);
    if (existingFile) {
        await deleteFile(token, filePath, `chore(media): remove ${item.filename}`, existingFile.sha);
    }

    const { items, sha } = await readManifest(token);
    const next = items.filter((existing) => existing.id !== item.id);
    await writeManifest(token, next, sha, `chore(media): remove registro de ${item.filename}`);
}

export async function updateMediaAltText(token: string, item: MediaItem, altText: string): Promise<void> {
    const { items, sha } = await readManifest(token);
    const next = items.map((existing) => (existing.id === item.id ? { ...existing, altText } : existing));
    await writeManifest(token, next, sha, `chore(media): atualiza texto alternativo de ${item.filename}`);
}
