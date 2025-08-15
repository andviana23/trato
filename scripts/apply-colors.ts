/* scripts/apply-colors.ts */
import fg from "fast-glob";
import fs from "node:fs/promises";
import pc from "picocolors";

// Heurística de mapeamento -> tokens semânticos
function pickToken(match: string, line: string): string | null {
  const m = match.toLowerCase();
  if (/(#2157e6|#3f72fe|#1744b4|#123591)/i.test(m) || /brand/i.test(line)) return "var(--chakra-colors-brand-solid)";
  if (/(#f59e0b|#ffbf4d|#ffb227|gold)/i.test(m) || /accent/i.test(line)) return "var(--chakra-colors-accent-solid)";
  if (/(^#fff(f{0,5})?$|white\b)/i.test(m)) {
    if (/bg|background|surface|card|container/i.test(line)) return "var(--chakra-colors-bg-surface)";
    return "var(--chakra-colors-bg-surface)";
  }
  if (/^#000000$|^#000$|\bblack\b/i.test(m)) return "var(--chakra-colors-text-primary)";
  if (/#f[0-9a-f]{5}|#e[0-9a-f]{5}|gray|grey|#d[0-9a-f]{5}/i.test(m)) {
    if (/border|outline/i.test(line)) return "var(--chakra-colors-border-default)";
    if (/bg|background/i.test(line)) return "var(--chakra-colors-bg-subtle)";
    return "var(--chakra-colors-text-muted)";
  }
  if (/red/i.test(m)) return "var(--chakra-colors-danger)";
  if (/yellow/i.test(m)) return "var(--chakra-colors-warning)";
  if (/green/i.test(m)) return "var(--chakra-colors-success)";
  return null;
}

const COLOR_PATTERNS = [
  { label: "hex", re: /#[0-9a-fA-F]{3,8}\b/g },
  { label: "rgb", re: /\brgba?\([^)]+\)/g },
  { label: "hsl", re: /\bhsla?\([^)]+\)/g },
  { label: "named", re: /\b(black|white|red|green|blue|yellow|orange|gold|silver|gray|grey|purple|pink|teal|cyan)\b/gi },
];

async function applyOnFile(pathFile: string): Promise<{ changed: boolean }> {
  let content = await fs.readFile(pathFile, "utf8");
  const lines = content.split(/\r?\n/);
  let changed = false;

  const transformValue = (value: string, line: string): string => {
    let newVal = value;
    for (const { re } of COLOR_PATTERNS) {
      newVal = newVal.replace(re, (m) => pickToken(m, line) ?? m);
    }
    if (/gradient/i.test(value) && /linear|radial/i.test(value)) {
      let replaced = value;
      for (const { re } of COLOR_PATTERNS) replaced = replaced.replace(re, (m) => pickToken(m, line) ?? m);
      return replaced;
    }
    return newVal;
  };

  for (let i = 0; i < lines.length; i++) {
    let L = lines[i];

    // Chakra props
    L = L.replace(/\b(bg|color|borderColor|fill|stroke|boxShadow)\s*=\s*["'`]([^"'`]+)["'`]/g,
      (m, prop, val) => {
        if (prop === "boxShadow" && /rgba?|#/.test(val)) { changed = true; return `${prop}={"elevation"}`; }
        const n = transformValue(val, L); if (n !== val) { changed = true; return `${prop}="${n}"`; } return m;
      });

    // style inline
    L = L.replace(/style=\{\{([^}]+)\}\}/g, (m, inner) => {
      let newInner = inner;
      newInner = newInner.replace(/\b(background|backgroundColor|color|borderColor|boxShadow|fill|stroke)\s*:\s*["'`]([^"'`]+)["'`]/g,
        (m2: string, p: string, v: string) => {
          if (p === "boxShadow" && /rgba?|#/.test(v)) { changed = true; return `${p}: "elevation"`; }
          const t = transformValue(v, L); if (t !== v) { changed = true; return `${p}: "${t}"`; } return m2;
        });
      return `style={{${newInner}}}`;
    });

    // Tailwind arbitrary cores -> comenta migração
    L = L.replace(/\b(bg|text|border|from|via|to)-\[\s*#[0-9a-fA-F]{3,8}\s*\]/g, (m, cls) => {
      const token = pickToken(m, L);
      if (token) { changed = true; return `${cls}-[${token}]/*TODO: migrar para prop Chakra*/`; }
      return m;
    });

    if (L !== lines[i]) lines[i] = L;
  }

  const newContent = lines.join("\n");
  if (newContent !== content) { changed = true; await fs.writeFile(pathFile, newContent, "utf8"); }
  return { changed };
}

async function main() {
  const files = await fg([
    "app/**/*.{ts,tsx,js,jsx,css,scss}",
    "src/**/*.{ts,tsx,js,jsx,css,scss}",
    "components/**/*.{ts,tsx,js,jsx,css,scss}",
    "pages/**/*.{ts,tsx,js,jsx,css,scss}",
    "!**/node_modules/**",
    "!**/.next/**",
    "!public/**",
    "!src/theme/**",
  ]);

  let changedCount = 0;
  for (const f of files) {
    const { changed } = await applyOnFile(f);
    if (changed) { changedCount++; console.log(pc.green(`✔ Alterado: ${f}`)); }
  }
  console.log(pc.bold(pc.cyan(`\nArquivos alterados: ${changedCount}\n`)));
}

main().catch((e) => { console.error(e); process.exit(1); });


