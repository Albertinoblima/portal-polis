// Servidor estático mínimo (zero dependências) para servir o build exportado
// (out/) durante os testes E2E do Playwright — não faz sentido instalar um
// pacote externo só para isso.
import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(process.cwd(), "out");
const PORT = process.env.PORT || 4300;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function resolveFile(urlPath) {
  const filePath = path.join(ROOT, decodeURIComponent(urlPath.split("?")[0]));
  try {
    const stats = await stat(filePath);
    return stats.isDirectory() ? path.join(filePath, "index.html") : filePath;
  } catch {
    return null;
  }
}

/**
 * "bytes=START-END" (RFC 7233), incluindo início/fim abertos ("100-", "-500").
 * Sem isso, o <video preload="metadata"> de FeaturedMedia.tsx não tem como
 * pedir só o cabeçalho do arquivo — o pedido de range cai num 200 de corpo
 * inteiro de qualquer forma, o que anula a economia que preload="metadata"
 * existe para dar. Em produção (GitHub Pages) isso nunca foi um problema,
 * porque Pages já responde range de verdade; só este servidor local (usado
 * só no E2E) não respondia. Como a Home concatena TODAS as edições já
 * publicadas (getAllEditions(), sem limite) e cada matéria com GIF convertido
 * carrega um <video>, isso ia inevitavelmente estourar o timeout de
 * carregamento assim que o nº de vídeos acumulados crescesse o bastante —
 * e foi exatamente o que aconteceu (ver histórico do e2e/smoke.spec.ts).
 */
function parseRange(rangeHeader, fileSize) {
  const match = typeof rangeHeader === "string" ? /^bytes=(\d*)-(\d*)$/.exec(rangeHeader) : null;
  if (!match || (match[1] === "" && match[2] === "")) return null;

  const start = match[1] === "" ? Math.max(fileSize - Number(match[2]), 0) : Number(match[1]);
  const end = match[1] === "" || match[2] === "" ? fileSize - 1 : Number(match[2]);

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= fileSize) return null;
  return { start, end: Math.min(end, fileSize - 1) };
}

const server = http.createServer(async (req, res) => {
  const requested = req.url === "/" ? "/index.html" : req.url;
  const resolved = await resolveFile(requested);
  const isMissing = resolved === null;
  const filePath = resolved ?? path.join(ROOT, "404.html");

  try {
    const stats = await stat(filePath);
    const contentType = MIME[path.extname(filePath)] ?? "application/octet-stream";
    const range = isMissing ? null : parseRange(req.headers.range, stats.size);

    if (range) {
      res.writeHead(206, {
        "Content-Type": contentType,
        "Content-Range": `bytes ${range.start}-${range.end}/${stats.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": range.end - range.start + 1,
      });
      createReadStream(filePath, range).pipe(res);
      return;
    }

    res.writeHead(isMissing ? 404 : 200, {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Content-Length": stats.size,
    });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Servindo ./out em http://localhost:${PORT}`);
});
