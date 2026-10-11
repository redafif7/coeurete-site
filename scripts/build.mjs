// Cœurete build — one command for everyone: `npm run build`  →  dist/
//  1. copies src/ to dist/ (except partials)
//  2. inlines the shared partials ({{> head}}, {{> header}}, {{> footer}})
//  3. pre-renders the 16 product cards into index.html ({{grid}}) for SEO and fast first paint
//  4. bundles the 3D mascot (three.js) into one file with esbuild
//  5. writes Netlify security headers (_headers) — ignored by GitHub Pages, harmless there
import { build } from "esbuild";
import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src"), DIST = join(ROOT, "dist");

export async function buildSite({ quiet = false } = {}) {
  await rm(DIST, { recursive: true, force: true });
  await cp(SRC, DIST, { recursive: true, filter: p => !p.includes(`${join("src", "partials")}`) });

  // partials
  const parts = {};
  for (const f of await readdir(join(SRC, "partials"))) parts[f.replace(/\.html$/, "")] = (await readFile(join(SRC, "partials", f), "utf8")).replace(/\n+$/, "");

  // product grid, rendered with the same code the browser uses (src/js/data.js + cards.js)
  const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx.window);
  for (const f of ["js/data.js", "js/cards.js"]) vm.runInContext(await readFile(join(SRC, f), "utf8"), ctx.window, { filename: f });
  const CQ = ctx.window.CQ;
  const grid = CQ.products.map((p, i) => CQ.cardHTML(p, { lazy: i >= 4 })).join("\n");

  // 3D mascot bundle
  await build({ entryPoints: [join(ROOT, "src3d/mascot3d.src.js")], bundle: true, minify: true, format: "esm",
                target: "es2020", outfile: join(DIST, "js/mascot3d.js"), logLevel: "warning" });

  const hashes = new Set();
  for (const f of (await readdir(DIST)).filter(f => f.endsWith(".html"))) {
    let html = await readFile(join(DIST, f), "utf8");
    html = html.replace(/\{\{> (\w+)\}\}/g, (_, n) => { if (!(n in parts)) throw new Error(`Unknown partial ${n} in ${f}`); return parts[n]; });
    html = html.replace("{{grid}}", grid);
    if (html.includes("{{")) throw new Error(`Unrendered token left in ${f}`);
    for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) hashes.add(`'sha256-${createHash("sha256").update(m[1]).digest("base64")}'`);
    await writeFile(join(DIST, f), html);
  }

  const csp = ["default-src 'self'", `script-src 'self' ${[...hashes].sort().join(" ")}`, "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:", "img-src 'self' data:", "connect-src 'self'", "form-action 'self'", "base-uri 'self'",
    "frame-ancestors 'none'", "object-src 'none'"].join("; ");
  await writeFile(join(DIST, "_headers"), `/*\n  Content-Security-Policy: ${csp}\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n/img/*\n  Cache-Control: public, max-age=604800\n/models/*\n  Cache-Control: public, max-age=604800\n`);
  await writeFile(join(DIST, ".nojekyll"), "");   // GitHub Pages: serve files as-is
  if (!quiet) console.log("✓ Built dist/");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) buildSite().catch(e => { console.error(e); process.exit(1); });
