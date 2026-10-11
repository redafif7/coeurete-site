// `npm run dev` — builds, serves dist/ on http://localhost:5173 and rebuilds when src/ changes.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { watch } from "node:fs";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSite } from "./build.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.PORT) || 5173;
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".glb": "model/gltf-binary" };

await buildSite();
let timer;
for (const dir of ["src", "src3d"]) watch(join(ROOT, dir), { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(() => buildSite({ quiet: true }).then(() => console.log("↻ rebuilt — refresh the page")).catch(e => console.error(e.message)), 150);
});

createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  if (path.endsWith("/")) path += "index.html";
  let file = join(DIST, path);
  try { if ((await stat(file)).isDirectory()) file = join(file, "index.html"); }
  catch { res.writeHead(404, { "Content-Type": TYPES[".html"] }); return res.end(await readFile(join(DIST, "404.html"))); }
  if (req.method === "POST") { res.writeHead(200); return res.end("ok (dev server: form not stored)"); }
  res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  res.end(await readFile(file));
}).listen(PORT, () => console.log(`→ http://localhost:${PORT}`));
