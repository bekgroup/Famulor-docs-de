#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(root, abs);
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', '.cursor', '.qoder', 'scripts', 'multilang', 'en', 'de'].includes(entry.name)) continue;
      walk(abs, out);
    } else if (entry.isFile() && rel.endsWith('.mdx')) {
      out.push(rel);
    }
  }
  return out;
}

function prefixPages(node, prefix) {
  if (Array.isArray(node)) return node.map((n) => prefixPages(n, prefix));
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === 'pages' && Array.isArray(v)) {
      out[k] = v.map((p) => {
        if (typeof p !== 'string') return prefixPages(p, prefix);
        const clean = p.startsWith('en/') || p.startsWith('de/') ? p.replace(/^(en|de)\//, '') : p;
        return `${prefix}/${clean}`;
      });
    } else {
      out[k] = prefixPages(v, prefix);
    }
  }
  return out;
}

// 1) Ensure full /de tree exists from root German source-of-truth
const sourceMdx = walk(root);
let deCopied = 0;
for (const rel of sourceMdx) {
  const src = path.join(root, rel);
  const dst = path.join(root, 'de', rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  deCopied += 1;
}

// 2) Update docs.json navigation.languages to /de and /en prefixes
const docsPath = path.join(root, 'docs.json');
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
if (!docs.navigation || !Array.isArray(docs.navigation.languages)) {
  throw new Error('docs.json navigation.languages is missing');
}

const deLang = docs.navigation.languages.find((l) => l.language === 'de');
const enLang = docs.navigation.languages.find((l) => l.language === 'en');
if (!deLang || !enLang) throw new Error('Both de and en language configs are required');

const { language: _deLangCode, default: _deDefault, ...deBody } = deLang;
const { language: _enLangCode, default: _enDefault, ...enBody } = enLang;

const newDe = { language: 'de', ...prefixPages(deBody, 'de') };
const newEn = { language: 'en', default: true, ...prefixPages(enBody, 'en') };

docs.navigation.languages = [newDe, newEn];

fs.writeFileSync(docsPath, JSON.stringify(docs, null, 2) + '\n');
console.log(JSON.stringify({ deCopied, sourceMdxCount: sourceMdx.length }, null, 2));
