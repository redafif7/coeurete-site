// `npm run check` — quick sanity checks on dist/ before pushing: every local link, image and script exists.
import { readdir, readFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
let bad = 0;
for (const f of (await readdir(DIST)).filter(f => f.endsWith(".html"))) {
  const html = await readFile(join(DIST, f), "utf8");
  for (const [, url] of html.matchAll(/(?:src|href)="([^"#?:]+\.[a-z0-9]+)(?:[#?][^"]*)?"/gi)) {
    try { await access(join(DIST, url)); } catch { console.error(`✗ ${f} → ${url} not found`); bad++; }
  }
}
const css = await readFile(join(DIST, "css/site.css"), "utf8");
for (const [, url] of css.matchAll(/url\("\.\.\/([^"]+)"\)/g)) { try { await access(join(DIST, url)); } catch { console.error(`✗ site.css → ${url} not found`); bad++; } }
if (bad) { console.error(`${bad} broken reference(s)`); process.exit(1); }
console.log("✓ All local links, images, fonts and scripts resolve");
