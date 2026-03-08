#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const externalRoot = path.resolve('..', 'famulor-docs-en');
const csvPath = path.join(root, 'multilang', 'path-map.csv');

function read(file) { return fs.readFileSync(file, 'utf8'); }

function walkMdx(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['.git', '.cursor', 'node_modules'].includes(e.name)) continue;
      walkMdx(abs, out);
    } else if (e.isFile() && e.name.endsWith('.mdx')) {
      out.push(abs);
    }
  }
  return out;
}

function parseCsv(text) {
  const lines = text.trim().split('\n');
  return lines.slice(1).map((line) => {
    const [de_path, en_path, status, ...rest] = line.split(',');
    return { de_path, en_path, status, notes: rest.join(',') || '' };
  });
}

function toCsv(rows) {
  return 'de_path,en_path,status,notes\n' + rows.map((r) => [r.de_path, r.en_path, r.status, r.notes || ''].join(',')).join('\n') + '\n';
}

function extractTokens(content) {
  const tokens = new Set();

  const add = (arr) => arr.forEach((x) => { if (x && x.length >= 3) tokens.add(x.toLowerCase()); });

  // URLs and paths are language-agnostic and highly useful
  add(content.match(/https?:\/\/[^\s)"']+/g) || []);
  add(content.match(/\/[A-Za-z0-9_\-./]+/g) || []);

  // Component tags and technical identifiers
  add(content.match(/<[A-Z][A-Za-z0-9]*/g) || []);
  add(content.match(/[A-Za-z0-9_.:-]{5,}/g) || []);

  // Keep only technical-ish tokens, remove obvious prose words
  const filtered = new Set();
  for (const t of tokens) {
    if (/^[a-z]+$/.test(t) && t.length < 8) continue;
    if (/^(title|description|language|english|deutsch|famulor|documentation)$/.test(t)) continue;
    filtered.add(t);
  }
  return filtered;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

const rows = parseCsv(read(csvPath));
const pending = rows.filter((r) => r.status === 'needs_en_translation');

const externalFiles = walkMdx(externalRoot);
const alreadyUsed = new Set(
  rows
    .filter((r) => r.status.startsWith('translated_from_external'))
    .map((r) => {
      const maybe = path.join(externalRoot, r.de_path);
      return fs.existsSync(maybe) ? path.normalize(maybe) : null;
    })
    .filter(Boolean)
);

const extData = externalFiles.map((abs) => ({
  abs,
  rel: path.relative(externalRoot, abs),
  tokens: extractTokens(read(abs))
}));

let copied = 0;
let considered = 0;

for (const row of pending) {
  const deAbs = path.join(root, row.de_path);
  if (!fs.existsSync(deAbs)) continue;

  const deTokens = extractTokens(read(deAbs));
  if (deTokens.size < 25) continue;

  considered++;
  let best = null;
  let second = null;

  for (const cand of extData) {
    if (alreadyUsed.has(path.normalize(cand.abs))) continue;
    const score = jaccard(deTokens, cand.tokens);
    if (!best || score > best.score) {
      second = best;
      best = { cand, score };
    } else if (!second || score > second.score) {
      second = { cand, score };
    }
  }

  if (!best) continue;
  const gap = best.score - (second ? second.score : 0);

  // strict confidence gates
  if (best.score < 0.34) continue;
  if (gap < 0.08) continue;

  const dst = path.join(root, row.en_path);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(best.cand.abs, dst);
  row.status = 'translated_from_external_structure';
  row.notes = best.cand.rel;
  alreadyUsed.add(path.normalize(best.cand.abs));
  copied++;
}

fs.writeFileSync(csvPath, toCsv(rows), 'utf8');
console.log(JSON.stringify({ pending: pending.length, considered, copied }, null, 2));
