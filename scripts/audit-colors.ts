/* scripts/audit-colors.ts */
import fg from "fast-glob";
import fs from "node:fs/promises";
import pc from "picocolors";

type Finding = {
  file: string;
  line: number;
  column: number;
  match: string;
  context: string;
};

const SRC_GLOBS = [
  "app/**/*.{ts,tsx,js,jsx,css,scss}",
  "src/**/*.{ts,tsx,js,jsx,css,scss}",
  "components/**/*.{ts,tsx,js,jsx,css,scss}",
  "pages/**/*.{ts,tsx,js,jsx,css,scss}",
  // ignore
  "!**/node_modules/**",
  "!**/.next/**",
  "!public/**",
  "!src/theme/**",
];

const COLOR_REGEXPS = [
  /#[0-9a-fA-F]{3,8}\b/g,                             // hex
  /\brgba?\([^)]+\)/g,                                // rgb/rgba
  /\b(hsla?)\([^)]+\)/g,                              // hsl/hsla
  /\b(black|white|red|green|blue|yellow|orange|gold|silver|gray|grey|purple|pink|teal|cyan)\b/gi, // named
  /\b(bg|text|border|from|via|to)-\[\s*#[0-9a-fA-F]{3,8}\s*\]/g, // tailwind arbitrary color
  /linear-gradient\([^)]+\)/gi,
  /radial-gradient\([^)]+\)/gi,
];

function getLines(content: string) { return content.split(/\r?\n/); }

function scanFile(content: string, file: string): Finding[] {
  const findings: Finding[] = [];
  const lines = getLines(content);

  lines.forEach((lineText, i) => {
    COLOR_REGEXPS.forEach((re) => {
      let m: RegExpExecArray | null;
      const regex = new RegExp(re.source, re.flags);
      while ((m = regex.exec(lineText)) !== null) {
        findings.push({
          file,
          line: i + 1,
          column: (m.index ?? 0) + 1,
          match: m[0],
          context: lineText.trim().slice(0, 300),
        });
      }
    });
  });

  return findings;
}

async function main() {
  const files = await fg(SRC_GLOBS, { dot: false });
  const all: Finding[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const f = scanFile(content, file);
    all.push(...f);
  }

  const byFile = new Map<string, Finding[]>();
  for (const f of all) {
    if (!byFile.has(f.file)) byFile.set(f.file, []);
    byFile.get(f.file)!.push(f);
  }

  console.log(pc.bold(pc.cyan(`\n=== AUDITORIA DE CORES (DRY-RUN) ===\n`)));
  let total = 0;
  for (const [file, list] of byFile) {
    console.log(pc.bold(pc.yellow(`\n${file}`)));
    list.forEach((f) => {
      total++;
      console.log(
        `  L${f.line}:${f.column}  ${pc.gray(f.context)}\n    -> ${pc.magenta(f.match)}`
      );
    });
  }
  console.log(pc.bold(pc.cyan(`\nTotal de ocorrências: ${total}\n`)));

  await fs.mkdir("var", { recursive: true }).catch(() => {});
  await fs.writeFile("var/audit-colors.json", JSON.stringify(all, null, 2), "utf8");
  console.log(pc.green(`\nRelatório salvo em var/audit-colors.json`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


