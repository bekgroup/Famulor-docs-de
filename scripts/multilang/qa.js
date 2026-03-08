#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(root, abs);
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'en', 'de', 'multilang', 'scripts'].includes(entry.name)) continue;
      walk(abs, out);
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      out.push(rel);
    }
  }
  return out;
}

function collectPages(nav, out = []) {
  if (Array.isArray(nav)) {
    nav.forEach((item) => collectPages(item, out));
    return out;
  }
  if (!nav || typeof nav !== 'object') return out;
  if (Array.isArray(nav.pages)) {
    nav.pages.forEach((p) => {
      if (typeof p === 'string') out.push(p);
      else collectPages(p, out);
    });
  }
  return out;
}

const mint = readJson(path.join(root, 'mint.json'));
if (!mint.navigation || !Array.isArray(mint.navigation.languages)) {
  throw new Error('navigation.languages array missing in mint.json');
}

const deLang = mint.navigation.languages.find((l) => l.language === 'de');
const enLang = mint.navigation.languages.find((l) => l.language === 'en');
if (!deLang || !enLang) {
  throw new Error('Both de and en languages must exist in navigation.languages');
}

const deNav = collectPages(deLang.groups || []);
const enNav = collectPages(enLang.groups || []);
const sourceFiles = walk(root).sort();
const missingEnFiles = [];

for (const rel of sourceFiles) {
  const enRel = path.join('en', rel);
  if (!fs.existsSync(path.join(root, enRel))) missingEnFiles.push(enRel);
}

const deNavSet = new Set(deNav);
const enNavExpected = new Set([...deNavSet].map((p) => `en/${p}`));
const enNavSet = new Set(enNav);
const missingEnNav = [...enNavExpected].filter((p) => !enNavSet.has(p));
const invalidEnNavPrefix = enNav.filter((p) => !p.startsWith('en/'));

console.log(JSON.stringify({
  sourcePages: sourceFiles.length,
  enFilesExpected: sourceFiles.length,
  enFilesMissing: missingEnFiles.length,
  deNavPages: deNav.length,
  enNavPages: enNav.length,
  missingEnNavEntries: missingEnNav.length,
  invalidEnNavPrefix: invalidEnNavPrefix.length
}, null, 2));

if (missingEnFiles.length || missingEnNav.length || invalidEnNavPrefix.length) {
  process.exitCode = 1;
}
