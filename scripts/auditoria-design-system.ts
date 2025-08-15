/*
  Auditoria e padronização de cores/props visuais conforme DESIGN_SYSTEM.md
  - Varre páginas-alvo
  - Detecta cores hardcoded (hex/rgb/hsl/nomes comuns)
  - Sinaliza props do Chakra relacionadas a cor/sombra/borda
  - (Modo seguro) Apenas gera relatório JSON com sugestões; não altera código
*/
import fs from "fs";
import path from "path";

type Finding = {
  file: string;
  line: number;
  column: number;
  snippet: string;
  reason: string;
  suggestion?: string;
};

const ROOT = process.cwd();
const TARGETS = [
  "app/dashboard/distribuicao/comissao/page.tsx",
  "app/assinaturas/assinantes/page.tsx",
  "app/assinaturas/planos/page.tsx",
  "app/assinaturas/dashboard/page.tsx",
  "app/cadastros/metas-trato/page.tsx",
];

const COLOR_REGEX = /(#([0-9a-fA-F]{3,8})\b)|(\brgb\s*\()|(\brgba\s*\()|(\bhsl\s*\()|\b(black|white|red|blue|green|gray|silver|maroon|olive|navy|purple|teal|fuchsia)\b/g;
const PROP_REGEX = /(bg|backgroundColor|color|borderColor|boxShadow|fill|stroke|outlineColor)\s*=|className=|style=/;

const SUGGESTION = `Use tokens/variants: ex. colorScheme=\"brand\", bg=\"whiteAlpha.100\", borderColor=\"whiteAlpha.200\", text=\"gray.*\".`;

function scanFile(absPath: string): Finding[] {
  const findings: Finding[] = [];
  const content = fs.readFileSync(absPath, "utf8");
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!PROP_REGEX.test(line) && !COLOR_REGEX.test(line)) continue;
    let match: RegExpExecArray | null;
    COLOR_REGEX.lastIndex = 0;
    while ((match = COLOR_REGEX.exec(line))) {
      findings.push({
        file: path.relative(ROOT, absPath),
        line: i + 1,
        column: match.index + 1,
        snippet: line.trim().slice(0, 300),
        reason: `Cor hardcoded detectada: \"${match[0]}\"`,
        suggestion: SUGGESTION,
      });
    }
  }
  return findings;
}

function main() {
  const all: Finding[] = [];
  for (const rel of TARGETS) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    all.push(...scanFile(abs));
  }
  const outDir = path.join(ROOT, "scripts", "output");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "auditoria-report.json");
  fs.writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), findings: all }, null, 2));
  // eslint-disable-next-line no-console
  console.log(`Relatório gerado: ${path.relative(ROOT, outFile)} (${all.length} ocorrências)`);
}

main();


