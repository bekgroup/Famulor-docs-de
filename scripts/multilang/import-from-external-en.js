#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const externalRoot = path.resolve('..', 'famulor-docs-en');
const repoRoot = process.cwd();
const csvPath = path.join(repoRoot, 'multilang', 'path-map.csv');

if (!fs.existsSync(externalRoot)) {
  throw new Error(`External folder not found: ${externalRoot}`);
}

function parseCsv(text) {
  const lines = text.trim().split('\n');
  const rows = lines.slice(1).map((line) => {
    const [de_path, en_path, status, ...rest] = line.split(',');
    return { de_path, en_path, status, notes: rest.join(',') || '' };
  });
  return rows;
}

function toCsv(rows) {
  const head = 'de_path,en_path,status,notes';
  return `${head}\n${rows.map((r) => [r.de_path, r.en_path, r.status, r.notes || ''].join(',')).join('\n')}\n`;
}

function listFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['.git', '.cursor', 'node_modules'].includes(entry.name)) continue;
      listFiles(abs, acc);
      continue;
    }
    if (entry.isFile()) acc.push(abs);
  }
  return acc;
}

const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
let copiedTranslations = 0;

for (const row of rows) {
  if (row.status !== 'needs_en_translation') continue;
  const externalMdx = path.join(externalRoot, row.de_path);
  if (!fs.existsSync(externalMdx)) continue;

  const target = path.join(repoRoot, row.en_path);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(externalMdx, target);
  row.status = 'translated_from_external_project';
  copiedTranslations += 1;
}

const imageExt = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']);
let copiedAssets = 0;
for (const abs of listFiles(externalRoot)) {
  const rel = path.relative(externalRoot, abs);
  const ext = path.extname(abs).toLowerCase();
  if (!imageExt.has(ext)) continue;

  const dest = path.join(repoRoot, rel);
  if (fs.existsSync(dest)) continue;

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(abs, dest);
  copiedAssets += 1;
}

fs.writeFileSync(csvPath, toCsv(rows), 'utf8');
console.log(JSON.stringify({ copiedTranslations, copiedAssets }, null, 2));
