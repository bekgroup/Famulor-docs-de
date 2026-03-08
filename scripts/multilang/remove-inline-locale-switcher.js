#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function listMdx(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(root, abs);

    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'scripts', 'multilang', '.cursor', '.qoder'].includes(entry.name)) continue;
      listMdx(abs, out);
      continue;
    }

    if (entry.isFile() && rel.endsWith('.mdx')) out.push(abs);
  }
  return out;
}

const blockRegex = /\n?<div style=\{\{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' \}\}>[\s\S]*?<select[\s\S]*?aria-label="Switch documentation language"[\s\S]*?<\/select>[\s\S]*?<\/label>\s*<\/div>\n?/g;

let changed = 0;
for (const file of listMdx(root)) {
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(blockRegex, '\n');
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed += 1;
  }
}

console.log(JSON.stringify({ updated: changed }, null, 2));
