#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const SWITCHER_MARKER = '<!-- locale-switcher -->';

const SWITCHER_BLOCK = `${SWITCHER_MARKER}
<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
    <span>Language</span>
    <select
      aria-label="Switch documentation language"
      defaultValue=""
      onChange={(e) => {
        const selected = e.target.value;
        if (!selected || typeof window === 'undefined') return;

        const pathname = window.location.pathname;
        const search = window.location.search || '';
        const hash = window.location.hash || '';
        const isEnglishPath = pathname === '/en' || pathname.startsWith('/en/');

        let targetPath = pathname;
        if (selected === 'en') {
          targetPath = isEnglishPath ? pathname : pathname === '/' ? '/en' : '/en' + pathname;
        } else {
          targetPath = isEnglishPath ? (pathname === '/en' ? '/' : pathname.replace(/^\\/en/, '')) : pathname;
        }

        window.location.assign(targetPath + search + hash);
      }}
      style={{
        minWidth: '130px',
        padding: '0.3rem 0.55rem',
        borderRadius: '0.5rem',
        border: '1px solid var(--border)',
        background: 'var(--background)',
        color: 'var(--text-primary)',
        fontSize: '0.9rem'
      }}
    >
      <option value="">Select</option>
      <option value="de">Deutsch</option>
      <option value="en">English</option>
    </select>
  </label>
</div>
`;

function listMdx(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(root, abs);

    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'multilang', 'scripts', '.cursor', '.qoder'].includes(entry.name)) continue;
      listMdx(abs, out);
      continue;
    }

    if (entry.isFile() && rel.endsWith('.mdx')) out.push(abs);
  }
  return out;
}

function inject(content) {
  if (content.includes(SWITCHER_MARKER)) return content;

  if (content.startsWith('---\n')) {
    const endIdx = content.indexOf('\n---\n', 4);
    if (endIdx !== -1) {
      const frontmatterEnd = endIdx + '\n---\n'.length;
      return `${content.slice(0, frontmatterEnd)}\n${SWITCHER_BLOCK}${content.slice(frontmatterEnd)}`;
    }
  }

  return `${SWITCHER_BLOCK}\n${content}`;
}

const files = listMdx(root);
let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const after = inject(before);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed += 1;
  }
}

console.log(JSON.stringify({ mdxFiles: files.length, updated: changed }, null, 2));
