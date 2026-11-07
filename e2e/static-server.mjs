// Serves website 2 exactly as GitHub Pages does: prototype/ at /saakh/, tutorial videos beside it, 404 for the rest.
// Usage: node e2e/static-server.mjs [port]
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(root, "prototype");
const TUTORIAL = join(root, "apps", "web", "public", "tutorial");
const PORT = Number(process.argv[2] || 4174);
const TYPES = { ".html": "text/html; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".mp4": "video/mp4", ".jpg": "image/jpeg" };

function locate(pathname) {
  if (!pathname.startsWith("/saakh/")) return null;
  const rel = normalize(decodeURIComponent(pathname.slice("/saakh/".length)) || "index.html");
  const [base, tail] = rel.startsWith(`tutorial${sep}`) ? [TUTORIAL, rel.slice(9)] : [SITE, rel];
  const file = resolve(base, tail);
  if (!file.startsWith(base + sep)) return null; // path traversal
  // Only what scripts/deploy_gh_pages.py publishes: nothing else in prototype/ is live.
  if (base === SITE && !/^(index\.html|favicon\.(svg|png|ico))$/.test(tail)) return null;
  return existsSync(file) && statSync(file).isFile() ? file : null;
}

createServer((req, res) => {
  const { pathname } = new URL(req.url, "http://x");
  if (pathname === "/saakh") {
    res.writeHead(301, { Location: "/saakh/" }).end();
    return;
  }
  let file = null;
  try { file = locate(pathname); } catch { /* malformed escape: treated as not found */ }
  if (!file) {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    return;
  }
  const type = TYPES[extname(file)] || "application/octet-stream";
  const size = statSync(file).size;
  if (type.startsWith("text/html")) {
    createReadStream(file).toArray().then((chunks) => {
      const body = gzipSync(Buffer.concat(chunks));
      res.writeHead(200, { "Content-Type": type, "Content-Encoding": "gzip", "Content-Length": body.length, "Cache-Control": "max-age=600" }).end(body);
    });
    return;
  }
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (m && (m[1] || m[2])) {
    const start = m[1] ? +m[1] : Math.max(0, size - +m[2]);
    const end = m[1] && m[2] ? Math.min(+m[2], size - 1) : size - 1;
    if (start > end) {
      res.writeHead(416, { "Content-Range": `bytes */${size}` }).end();
      return;
    }
    res.writeHead(206, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": end - start + 1 });
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size, "Cache-Control": "max-age=600" });
  if (req.method === "HEAD") res.end();
  else createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Website 2: http://localhost:${PORT}/saakh/`));
