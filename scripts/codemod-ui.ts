/* scripts/codemod-ui.ts */
import fg from "fast-glob";
import fs from "node:fs/promises";
import pc from "picocolors";

type Change = { file: string; description: string };
const report: { changes: Change[]; suggestions: Change[] } = { changes: [], suggestions: [] };

async function processFile(pathFile: string) {
  let src = await fs.readFile(pathFile, "utf8");
  let changed = false;

  // 1) Badges com colorScheme -> StatBadge
  src = src.replace(/<Badge\s+([^>]*?)colorScheme=\"green\"([^>]*)>([\s\S]*?)<\/Badge>/g, (_m, a, b, inner) => {
    changed = true; report.changes.push({ file: pathFile, description: "Badge green -> StatBadge success" });
    return `<StatBadge kind="success" ${a}${b}>${inner}</StatBadge>`;
  });
  src = src.replace(/<Badge\s+([^>]*?)colorScheme=\"red\"([^>]*)>([\s\S]*?)<\/Badge>/g, (_m, a, b, inner) => {
    changed = true; report.changes.push({ file: pathFile, description: "Badge red -> StatBadge danger" });
    return `<StatBadge kind="danger" ${a}${b}>${inner}</StatBadge>`;
  });
  src = src.replace(/<Badge\s+([^>]*?)colorScheme=\"yellow\"([^>]*)>([\s\S]*?)<\/Badge>/g, (_m, a, b, inner) => {
    changed = true; report.changes.push({ file: pathFile, description: "Badge yellow -> StatBadge warning" });
    return `<StatBadge kind="warning" ${a}${b}>${inner}</StatBadge>`;
  });
  src = src.replace(/<Badge\s+([^>]*?)colorScheme=\"(brand|blue)\"([^>]*)>([\s\S]*?)<\/Badge>/g, (_m, a, _cs, b, inner) => {
    changed = true; report.changes.push({ file: pathFile, description: "Badge brand/blue -> StatBadge brand" });
    return `<StatBadge kind="brand" ${a}${b}>${inner}</StatBadge>`;
  });
  src = src.replace(/<Badge\s+([^>]*?)colorScheme=\"(orange|amber)\"([^>]*)>([\s\S]*?)<\/Badge>/g, (_m, a, _cs, b, inner) => {
    changed = true; report.changes.push({ file: pathFile, description: "Badge orange/amber -> StatBadge accent" });
    return `<StatBadge kind="accent" ${a}${b}>${inner}</StatBadge>`;
  });

  // 2) Tabs simples -> sugerir AppTabs (não aplicar automaticamente pois é estrutural)
  if (/<Tabs[\s>][\s\S]*?<TabList>[\s\S]*?<TabPanels>[\s\S]*?<\/Tabs>/m.test(src)) {
    report.suggestions.push({ file: pathFile, description: "Tabs detectado: considere migrar para <AppTabs tabs={[...]} />" });
  }

  // 3) Grids KPI ad-hoc -> sugerir KpiGrid
  if (/SimpleGrid[\s\S]*columns=\{\s*\{?\s*base:\s*1[\s\S]*lg:\s*4[\s\S]*\}?\s*}/m.test(src)) {
    report.suggestions.push({ file: pathFile, description: "Grid KPI detectado: considere usar <KpiGrid>" });
  }

  if (changed) await fs.writeFile(pathFile, src, "utf8");
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
  await fs.writeFile("var/codemod-ui-report.json", JSON.stringify(report, null, 2), "utf8");
  console.log(pc.green("Relatório salvo em var/codemod-ui-report.json"));
  console.log(pc.cyan(`Mudanças aplicadas: ${report.changes.length} | Sugestões: ${report.suggestions.length}`));
}

main().catch((e) => { console.error(e); process.exit(1); });


