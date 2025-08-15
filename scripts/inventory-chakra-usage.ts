import fs from "fs";
import path from "path";

type Usage = {
  file: string;
  importSource: string;
  components: string[];
  propsDetected: string[];
};

const ROOT = process.cwd();
const SRC_DIRS = ["app", "src", "components"];
const IMPORT_SOURCES = [
  "@chakra-ui/react",
  "@chakra-ui/icons",
  "@chakra-ui/next-js",
  "@emotion/react",
  "@emotion/styled",
];

const JSX_PROP_REGEX = /(variant|size|colorScheme|bg|backgroundColor|color|px|py|pl|pr|pt|pb|w|h|rounded|borderColor|boxShadow)\s*=/g;

function walk(dir: string, acc: string[] = []): string[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return acc;
  for (const entry of fs.readdirSync(abs)) {
    const full = path.join(abs, entry);
    const rel = path.relative(ROOT, full);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(rel, acc);
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      acc.push(rel);
    }
  }
  return acc;
}

function scanFile(file: string): Usage[] {
  const content = fs.readFileSync(path.join(ROOT, file), "utf8");
  const usages: Usage[] = [];
  for (const source of IMPORT_SOURCES) {
    const importRegex = new RegExp(`import\\s+\\{([^}]+)\\}\\s+from\\s+["']${source}["']`, "g");
    let m: RegExpExecArray | null;
    while ((m = importRegex.exec(content))) {
      const named = m[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const props = new Set<string>();
      let pm: RegExpExecArray | null;
      JSX_PROP_REGEX.lastIndex = 0;
      while ((pm = JSX_PROP_REGEX.exec(content))) props.add(pm[1]);
      usages.push({ file, importSource: source, components: named, propsDetected: Array.from(props) });
    }
  }
  return usages;
}

function main() {
  const files = SRC_DIRS.flatMap((d) => walk(d));
  const all: Usage[] = [];
  for (const f of files) all.push(...scanFile(f));
  const outDir = path.join(ROOT, "var");
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, "chakra-usage.json");
  fs.writeFileSync(out, JSON.stringify(all, null, 2));
  // eslint-disable-next-line no-console
  console.log(`Inventário salvo em ${path.relative(ROOT, out)} (${all.length} entradas)`);
}

main();


