/* scripts/codemod-toasts-confirm-drawer.ts */
import fg from "fast-glob";
import fs from "node:fs/promises";
import pc from "picocolors";

type Entry = { file: string; before?: string; after?: string; note?: string };
const report: { changed: Entry[]; pending: Entry[] } = { changed: [], pending: [] };

function replaceWindowConfirm(src: string, file: string): { out: string; changed: boolean } {
  let changed = false;
  let out = src.replace(/if\s*\(\s*window\.confirm\(([^)]+)\)\s*\)\s*\{/g, (m, msg) => {
    changed = true;
    report.changed.push({ file, before: m, after: `const ok = await confirm({ title: ${msg} }); if (ok) {` });
    return `const ok = await confirm({ title: ${msg} }); if (ok) {`;
  });

  // report usos não triviais
  if (/window\.confirm\(/.test(out) && !changed) {
    report.pending.push({ file, note: "window.confirm encontrado: revisão manual para useConfirm()" });
  }
  return { out, changed };
}

function replaceToastSimple(src: string, file: string): { out: string; changed: boolean } {
  let changed = false;
  // altera import/uso trivial de useToast
  if (/useToast\(\)/.test(src)) {
    report.pending.push({ file, note: "useToast() detectado: migrar para useAppToast() manualmente (casos complexos)" });
  }
  // troca chamadas toast({ title:"...", status:"success" }) por useAppToast().success
  let out = src.replace(/toast\(\{\s*title:\s*(["'`].+?["'`])\s*,\s*status:\s*"success"[^}]*\}\)/g, (m, title) => {
    changed = true;
    const rep = `success({ title: ${title} })`;
    report.changed.push({ file, before: m, after: rep });
    return rep;
  });
  out = out.replace(/toast\(\{\s*title:\s*(["'`].+?["'`])\s*,\s*status:\s*"error"[^}]*\}\)/g, (m, title) => {
    changed = true;
    const rep = `error({ title: ${title} })`;
    report.changed.push({ file, before: m, after: rep });
    return rep;
  });
  return { out, changed };
}

function detectDrawerDIY(src: string, file: string) {
  if (/(position:\s*fixed|className=\"fixed)\s*[\s\S]*?(right:|left:)\s*0[;\"]/.test(src)) {
    report.pending.push({ file, note: "Drawer DIY detectado: considere migrar para <AppDrawer>." });
  }
}

async function processFile(pathFile: string) {
  const before = await fs.readFile(pathFile, "utf8");
  let src = before;
  let changed = false;

  // window.confirm -> useConfirm
  const r1 = replaceWindowConfirm(src, pathFile); src = r1.out; changed = changed || r1.changed;

  // toast({title, status}) -> useAppToast
  const r2 = replaceToastSimple(src, pathFile); src = r2.out; changed = changed || r2.changed;

  // drawer DIY
  detectDrawerDIY(src, pathFile);

  if (changed) {
    await fs.writeFile(pathFile, src, "utf8");
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
  await fs.writeFile("var/codemod-toasts-confirm-drawer.json", JSON.stringify(report, null, 2), "utf8");
  console.log(pc.green("Relatório salvo em var/codemod-toasts-confirm-drawer.json"));
  console.log(pc.cyan(`Mudanças automáticas: ${report.changed.length} | Pendências: ${report.pending.length}`));
}

main().catch((e) => { console.error(e); process.exit(1); });


