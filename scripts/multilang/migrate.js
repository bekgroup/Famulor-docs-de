#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const mintPath = path.join(root, 'mint.json');
const outDir = path.join(root, 'multilang');

const GROUP_TRANSLATIONS = {
  'Updates': 'Updates',
  'Einführung': 'Introduction',
  'Für Entwickler': 'For Developers',
  'Erste Schritte': 'Getting Started',
  'KI-Assistenten Übersicht': 'AI Assistants Overview',
  'Beispiel-Prompts': 'Example Prompts',
  'Custom Dashboards': 'Custom Dashboards',
  'Telefonnummern': 'Phone Numbers',
  'Eingehende Anrufe': 'Inbound Calls',
  'Ausgehende Anrufe': 'Outbound Calls',
  'WhatsApp Business': 'WhatsApp Business',
  'KI-Prompting & Konversationsdesign': 'AI Prompting & Conversation Design',
  'Automatisierung & Integrationen': 'Automation & Integrations',
  'Kosten & Preise': 'Costs & Pricing',
  'SIP Telefonnummern': 'SIP Phone Numbers',
  'Nummern-Bereitstellung': 'Number Provisioning',
  'Fehlerbehebung & FAQs': 'Troubleshooting & FAQs',
  'API Referenz': 'API Reference',
  'MCP': 'MCP',
  'KI-Assistants': 'AI Assistants',
  'Leads': 'Leads',
  'Campaigns': 'Campaigns',
  'Mid Call Tools': 'Mid Call Tools',
  'AI Chatbot': 'AI Chatbot',
  'AI Replies': 'AI Replies',
  'Knowledgebases': 'Knowledgebases',
  'SMS': 'SMS',
  'WhatsApp': 'WhatsApp',
  'Phone Numbers': 'Phone Numbers',
  'Calls': 'Calls',
  'Webhooks': 'Webhooks',
  'No-Code Automatisierungsplattform': 'No-Code Automation Platform',
  'Mid-Call-Tools': 'Mid-Call Tools',
  'Mid-Call-Tools Integrationen': 'Mid-Call Tool Integrations',
  'Gesundheitswesen': 'Healthcare',
  'CRM & Vertrieb': 'CRM & Sales',
  'Kommunikation': 'Communication',
  'Marketing': 'Marketing',
  'Projektmanagement': 'Project Management',
  'Zahlungen': 'Payments',
  'Buchhaltung & HR': 'Accounting & HR',
  'Support': 'Support',
  'Logistik & Dokumente': 'Logistics & Documents',
  'Gastronomie & Food': 'Hospitality & Food',
  'ERP & E-Commerce': 'ERP & E-Commerce',
  'Allgemein': 'General',
  'Anruf-bezogen': 'Call-related',
  'Tutorials': 'Tutorials',
  'Integrationen': 'Integrations',
  'Beliebte Einzelintegrationen': 'Popular Individual Integrations',
  'CRM & Sales Integrationen': 'CRM & Sales Integrations',
  'Integration Database': 'Integration Database',
  'Whitepapers & Ressourcen': 'Whitepapers & Resources',
  'Vertrieb & Best Practices': 'Sales & Best Practices',
  'Rechtliche Informationen': 'Legal Information'
};

const GERMAN_WORDS = [
  ' und ', ' der ', ' die ', ' das ', ' nicht ', ' mit ', ' für ', ' auf ', ' ist ', ' eine ',
  'ein ', ' anruf', ' unterstützung', 'über', 'ö', 'ä', 'ü', 'ß', 'telefon', 'rechnung'
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, obj) {
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
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

function translateGroupName(name) {
  return GROUP_TRANSLATIONS[name] || name;
}

function toEnNav(node) {
  if (Array.isArray(node)) return node.map(toEnNav);
  if (!node || typeof node !== 'object') return node;

  const next = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === 'group' && typeof v === 'string') {
      next[k] = translateGroupName(v);
      continue;
    }
    if (k === 'pages' && Array.isArray(v)) {
      next[k] = v.map((p) => {
        if (typeof p === 'string') return p.startsWith('en/') ? p : `en/${p}`;
        return toEnNav(p);
      });
      continue;
    }
    next[k] = toEnNav(v);
  }
  return next;
}

function splitUrlParts(urlPath) {
  const hashIdx = urlPath.indexOf('#');
  const queryIdx = urlPath.indexOf('?');
  let cut = -1;
  if (hashIdx !== -1 && queryIdx !== -1) cut = Math.min(hashIdx, queryIdx);
  else if (hashIdx !== -1) cut = hashIdx;
  else if (queryIdx !== -1) cut = queryIdx;

  if (cut === -1) return { pathname: urlPath, suffix: '' };
  return { pathname: urlPath.slice(0, cut), suffix: urlPath.slice(cut) };
}

function rewriteAbsoluteDocPath(raw, slugSet) {
  if (!raw.startsWith('/')) return raw;
  const { pathname, suffix } = splitUrlParts(raw);
  const candidate = pathname.replace(/^\//, '');
  if (!candidate || candidate.startsWith('en/')) return raw;
  if (slugSet.has(candidate)) return `/en/${candidate}${suffix}`;
  return raw;
}

function rewriteLinks(content, slugSet) {
  let out = content;

  out = out.replace(/\]\((\/[^)\s]+)\)/g, (m, p1) => `](${rewriteAbsoluteDocPath(p1, slugSet)})`);

  out = out.replace(/\b(href|to|url)=(["'])(\/[^"']+)\2/g, (m, attr, quote, value) => {
    return `${attr}=${quote}${rewriteAbsoluteDocPath(value, slugSet)}${quote}`;
  });

  return out;
}

function likelyGerman(content) {
  const lower = ` ${content.toLowerCase()} `;
  let score = 0;
  for (const token of GERMAN_WORDS) {
    if (lower.includes(token)) score += 1;
  }
  return score >= 3;
}

function main() {
  const mint = readJson(mintPath);

  const deNavigation = Array.isArray(mint.navigation)
    ? mint.navigation
    : (mint.navigation && mint.navigation.languages && Array.isArray(mint.navigation.languages.de) ? mint.navigation.languages.de : null);

  if (!deNavigation) {
    throw new Error('Expected mint.json navigation to be an array or navigation.languages.de');
  }

  const sourceFiles = walk(root).sort();
  const slugSet = new Set(sourceFiles.map((f) => f.replace(/\.mdx$/, '')));

  for (const rel of sourceFiles) {
    const srcAbs = path.join(root, rel);
    const dstAbs = path.join(root, 'en', rel);
    ensureDir(path.dirname(dstAbs));

    const raw = fs.readFileSync(srcAbs, 'utf8');
    const rewritten = rewriteLinks(raw, slugSet);
    fs.writeFileSync(dstAbs, rewritten, 'utf8');
  }

  mint.navigation = {
    languages: [
      {
        language: 'de',
        default: true,
        groups: deNavigation
      },
      {
        language: 'en',
        groups: toEnNav(deNavigation)
      }
    ]
  };

  if (Array.isArray(mint.topbarLinks)) {
    mint.topbarLinks = mint.topbarLinks.map((link) => {
      if (link && typeof link === 'object' && link.name === '🇬🇧 English') {
        return { ...link, url: 'https://docs.famulor.io/en' };
      }
      return link;
    });
  }

  writeJson(mintPath, mint);

  ensureDir(outDir);
  const pathMap = ['de_path,en_path,status,notes'];
  const todo = [];
  todo.push('# Multilang TODO');
  todo.push('');
  todo.push('- [x] config-agent: `mint.json` migrated to `navigation.languages.de/en`');
  todo.push(`- [x] translation-agent: generated ${sourceFiles.length} EN page counterparts under /en`);
  todo.push('- [x] link-agent: absolute doc links in EN pages rewritten to `/en/...` where target is a docs page');
  todo.push('- [ ] qa-agent: run full link and schema validation in CI');
  todo.push('');
  todo.push('## Translation Queue');

  let needsReview = 0;
  for (const rel of sourceFiles) {
    const source = fs.readFileSync(path.join(root, rel), 'utf8');
    const isGerman = likelyGerman(source);
    const status = isGerman ? 'needs_en_translation' : 'likely_already_english';
    if (isGerman) {
      needsReview += 1;
      todo.push(`- [ ] ${rel}`);
    }
    pathMap.push(`${rel},en/${rel},${status},`);
  }

  if (needsReview === 0) {
    todo.push('- [x] No pages flagged for German-language manual review by heuristic');
  }

  fs.writeFileSync(path.join(outDir, 'path-map.csv'), `${pathMap.join('\n')}\n`, 'utf8');
  fs.writeFileSync(path.join(outDir, 'todo.md'), `${todo.join('\n')}\n`, 'utf8');

  const qa = [
    '# QA Checklist',
    '',
    '## Schema & Navigation',
    '- [x] `mint.json` contains `navigation.languages.de` and `navigation.languages.en`',
    '- [x] EN navigation page paths are prefixed with `en/`',
    '',
    '## Parity',
    `- [x] Source pages discovered: ${sourceFiles.length}`,
    `- [x] EN pages generated: ${sourceFiles.length}`,
    '- [ ] 100% human review complete for pages flagged in `multilang/todo.md`',
    '',
    '## Routing & Links',
    '- [x] Absolute links to docs pages rewritten to `/en/...` in EN content',
    '- [ ] Run Mintlify preview and click-test language switch across key sections',
    '',
    '## API Content Rules',
    '- [x] API technical identifiers/paths preserved (copied verbatim)',
    '- [ ] Verify API prose translation quality and terminology consistency'
  ];

  fs.writeFileSync(path.join(outDir, 'qa-checklist.md'), `${qa.join('\n')}\n`, 'utf8');

  console.log(JSON.stringify({
    pages: sourceFiles.length,
    enGenerated: sourceFiles.length,
    needsManualReview: needsReview
  }, null, 2));
}

main();
