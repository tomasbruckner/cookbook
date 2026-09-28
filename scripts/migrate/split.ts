import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { renderRaw, splitDocument } from './split-doc';

const { values } = parseArgs({
  options: {
    level: { type: 'string', default: '2' },
    source: { type: 'string', default: 'migration/source.md' },
    out: { type: 'string', default: 'migration/raw' },
  },
});

const source = values.source!;
const out = values.out!;
if (!existsSync(source)) {
  console.error(`Soubor ${source} neexistuje. Stáhni Google Docs jako Markdown a ulož ho tam.`);
  process.exit(1);
}

const result = splitDocument(readFileSync(source, 'utf8'), Number(values.level));

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const r of result.recipes) {
  writeFileSync(join(out, `${r.slug}.md`), renderRaw(r), 'utf8');
}

if (result.discarded) {
  console.log(`Zahozený text mimo recepty (${result.discarded.split('\n').length} řádků):`);
  console.log(result.discarded.split('\n').slice(0, 15).join('\n'));
  console.log('…\n');
}
for (const w of result.warnings) console.warn(`VAROVÁNÍ: ${w}`);
for (const e of result.errors) console.error(`CHYBA: ${e}`);

console.log(`Nalezeno receptů: ${result.recipes.length} → ${out}/`);
result.recipes.forEach((r, i) => {
  console.log(`${String(i + 1).padStart(3)}. ${r.title} → ${r.slug}.md${r.chapter ? `  [${r.chapter}]` : ''}`);
});

if (result.errors.length > 0) process.exitCode = 1;
