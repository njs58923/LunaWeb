import { stat } from "node:fs/promises";
import { join, normalize } from "node:path";

// Config
const PORT = Number(process.env.PORT ?? 8080);
const PUBLIC_DIR = join(import.meta.dir, "..", "public");

// Helpers
function safePath(urlPath: string) {
  // Elimina query/hash, normaliza y evita path traversal
  const clean = normalize(urlPath.split("?")[0].split("#")[0]);
  const rel = clean.startsWith("/") ? clean.slice(1) : clean;
  const full = join(PUBLIC_DIR, rel);
  if (!full.startsWith(PUBLIC_DIR)) return null; // intento de salir de /public
  return full;
}

function contentType(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html": return "text/html; charset=utf-8";
    case "js":   return "text/javascript; charset=utf-8";
    case "mjs":  return "text/javascript; charset=utf-8";
    case "css":  return "text/css; charset=utf-8";
    case "json": return "application/json; charset=utf-8";
    case "svg":  return "image/svg+xml";
    case "png":  return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "gif":  return "image/gif";
    case "webp": return "image/webp";
    case "ico":  return "image/x-icon";
    case "txt":  return "text/plain; charset=utf-8";
    case "wasm": return "application/wasm";
    default:     return "application/octet-stream";
  }
}

function etag(size: number, mtimeMs: number) {
  // ETag simple y estable por tamaño+mtime
  return `"W/${size.toString(16)}-${Math.floor(mtimeMs).toString(16)}"`;
}

async function tryFile(pathname: string) {
  try {
    const s = await stat(pathname);
    if (s.isFile()) return s;
    return null;
  } catch {
    return null;
  }
}

async function serveFile(pathname: string): Promise<Response> {
  const s = await tryFile(pathname);
  if (!s) {
    // si la ruta es un directorio, intentamos index.html
    const idx = await tryFile(join(pathname, "index.html"));
    if (!idx) return new Response("404 Not Found", { status: 404 });
    const file = Bun.file(join(pathname, "index.html"));
    const headers = {
      "Content-Type": "text/html; charset=utf-8",
      "ETag": etag(idx.size, idx.mtimeMs),
      "Cache-Control": "public, max-age=0, must-revalidate",
    };
    return new Response(file, { headers });
  }
  const file = Bun.file(pathname);
  const headers = {
    "Content-Type": contentType(pathname),
    "ETag": etag(s.size, s.mtimeMs),
    // Ajusta el cacheo según tu gusto:
    "Cache-Control": pathname.endsWith(".html")
      ? "public, max-age=0, must-revalidate"
      : "public, max-age=31536000, immutable",
  };
  return new Response(file, { headers });
}

// Server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let reqPath = url.pathname;

    // redirige / a /index.html (opcional)
    if (reqPath === "/") reqPath = "/index.html";

    const fsPath = safePath(reqPath);
    if (!fsPath) return new Response("400 Bad Request", { status: 400 });

    const res = await serveFile(fsPath);

    // Soporte ETag: 304 Not Modified
    const inm = req.headers.get("if-none-match");
    const tag = res.headers.get("ETag");
    if (inm && tag && inm === tag) {
      return new Response(null, { status: 304, headers: res.headers });
    }
    return res;
  },
});

console.log(`🟢 Static server on http://localhost:${server.port} (public: ${PUBLIC_DIR})`);
