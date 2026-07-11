// Servidor estático mínimo (zero dependências) para servir o build exportado
// (out/) durante os testes E2E do Playwright — não faz sentido instalar um
// pacote externo só para isso.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
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

const server = http.createServer(async (req, res) => {
  const requested = req.url === "/" ? "/index.html" : req.url;
  const filePath = (await resolveFile(requested)) ?? path.join(ROOT, "404.html");

  try {
    const content = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(filePath.endsWith("404.html") ? 404 : 200, {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Servindo ./out em http://localhost:${PORT}`);
});
