#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const externalRoot = path.resolve('..', 'famulor-docs-en');
const csvPath = path.join(process.cwd(), 'multilang', 'path-map.csv');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['.git', '.cursor', 'node_modules'].includes(entry.name)) continue;
      walk(abs, out);
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      out.push(abs);
    }
  }
  return out;
}

function parseCsv(content) {
  const lines = content.trim().split('\n');
  return lines.slice(1).map((line) => {
    const [de_path, en_path, status, ...rest] = line.split(',');
    return { de_path, en_path, status, notes: rest.join(',') || '' };
  });
}

function toCsv(rows) {
  return 'de_path,en_path,status,notes\n' + rows.map((r) => [r.de_path, r.en_path, r.status, r.notes || ''].join(',')).join('\n') + '\n';
}

const externalFiles = walk(externalRoot);
const byBase = new Map();
for (const abs of externalFiles) {
  const base = path.basename(abs);
  if (!byBase.has(base)) byBase.set(base, []);
  byBase.get(base).push(abs);
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
let copied = 0;

for (const row of rows) {
  if (row.status !== 'needs_en_translation') continue;

  const targetBase = path.basename(row.de_path);
  const candidates = byBase.get(targetBase) || [];
  if (candidates.length !== 1) continue;

  const src = candidates[0];
  const dst = path.join(process.cwd(), row.en_path);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  row.status = 'translated_from_external_fuzzy';
  copied += 1;
}

fs.writeFileSync(csvPath, toCsv(rows), 'utf8');
console.log(JSON.stringify({ copied }, null, 2));
