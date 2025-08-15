/* scripts/codemod-forms-tables-modals.ts */
import fg from "fast-glob";
import fs from "node:fs/promises";
import pc from "picocolors";

type Entry = { file: string; before?: string; after?: string; note?: string };
const report: { changed: Entry[]; pending: Entry[] } = { changed: [], pending: [] };

async function processFile(pathFile: string) {
  let src = await fs.readFile(pathFile, "utf8");
  let changed = false;
  const before = src;

  // 1) Modal DIY -> AppModal (heurística simples)
  if (/<Box\s+[^>]*position=\"fixed\"[^>]*inset=\{0\}[^>]*bg=\"blackAlpha\.\d+\"/m.test(src)) {
    report.pending.push({ file: pathFile, note: "Modal DIY detectado: migrar manualmente para <AppModal>." });
  }

  // 2) Table.Root ou APIs não Chakra
  if (/Table\.Root|Table\.Header|Table\.Body|Table\.Row|Table\.ColumnHeader|Table\.Cell/m.test(src)) {
    report.pending.push({ file: pathFile, note: "Tabela não-Chakra detectada: migrar para <DataTable> ou Table oficial." });
  }

  // 3) FormControl + FormLabel + Input/Select + FormErrorMessage (padrão RHF provável)
  const formBlock = /(FormControl[\s\S]*FormLabel[\s\S]*(Input|Select|Textarea)[\s\S]*FormErrorMessage)/m;
  if (formBlock.test(src)) {
    report.pending.push({ file: pathFile, note: "Bloco de formulário detectado: considerar uso de <FormField>." });
  }

  if (changed) {
    await fs.writeFile(pathFile, src, "utf8");
    report.changed.push({ file: pathFile, before: before.slice(0, 5000), after: src.slice(0, 5000) });
  }
}

async function main() {
  const files = await fg([
    "app/**/*.{ts,tsx,js,jsx}",
    "src/**/*.{ts,tsx,js,jsx}",
    "components/**/*.{ts,tsx,js,jsx}",
    "pages/**/*.{ts,tsx,js,jsx}",
    "!**/node_modules/**",
    "!**/.next/**",
  ]);

  for (const f of files) await processFile(f);

  await fs.mkdir("var", { recursive: true }).catch(() => {});
  await fs.writeFile("var/codemod-forms-tables-modals.json", JSON.stringify(report, null, 2), "utf8");
  console.log(pc.green("Relatório salvo em var/codemod-forms-tables-modals.json"));
  console.log(pc.cyan(`Mudanças automáticas: ${report.changed.length} | Pendências: ${report.pending.length}`));
}

main().catch((e) => { console.error(e); process.exit(1); });


