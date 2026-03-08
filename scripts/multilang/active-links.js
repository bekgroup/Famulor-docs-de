#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const docsPath = path.join(root, 'docs.json');
const reportPath = path.join(root, 'multilang', 'link-audit-report.json');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function collectPages(node, out = []) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectPages(item, out));
    return out;
  }
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node.pages)) {
    for (const p of node.pages) {
      if (typeof p === 'string') out.push(p);
      else collectPages(p, out);
    }
  }
  if (Array.isArray(node.groups)) collectPages(node.groups, out);
  if (Array.isArray(node.tabs)) collectPages(node.tabs, out);
  return out;
}

function getActivePages(docs) {
  const langs = docs.navigation?.languages || [];
  const all = [];
  for (const l of langs) all.push(...collectPages(l, []));
  const unique = [...new Set(all)];
  return unique.filter((p) => p.startsWith('de/') || p.startsWith('en/'));
}

function isExternal(href) {
  return (
    !href ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#') ||
    href.startsWith('data:') ||
    href.startsWith('{')
  );
}

function isAssetPath(p) {
  return /\.(png|jpg|jpeg|gif|svg|webp|ico|mp4|pdf|avif)$/i.test(p);
}

function splitSuffix(href) {
  const m = href.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  if (!m) return { main: href, suffix: '' };
  return { main: m[1] || '', suffix: `${m[2] || ''}${m[3] || ''}` };
}

function withoutLocalePrefix(p) {
  return p.replace(/^\/(de|en)(?=\/)/, '');
}

function stripExt(p) {
  return p.replace(/\.mdx?$/i, '');
}

function mapLegacyPath(rawPath) {
  let p = rawPath;
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.replace(/\\/g, '/');
  p = path.posix.normalize(p);
  while (p.startsWith('/../')) p = p.replace('/../', '/');
  p = stripExt(p);

  const direct = {
    '/terminology': '/introduction/key-terminology',
    '/automation-platform/sms-capabilities': '/automation-platform/calls-related/sms-capabilities',
    '/ai-assistants/what-is-an-ai-assistant': '/ai-assistants/what-is-ai-assistant',
    '/ai-assistants/settings/prompt-and-tools': '/ai-assistants/prompt-and-tools',
    '/provisioning/sip-ai/overview': '/provisioning/sip-ai/sip-integration',
    '/platform-guide/tools': '/ai-assistants/tools-and-functions',
    '/costs-and-pricing/cost-overview': '/pricing/overview',
    '/ai-assistants-overview/what-is-an-ai-assistant': '/ai-assistants/what-is-ai-assistant',
    '/phone-numbers/types-of-phone-numbers': '/phone-numbers/types',
    '/api-reference/assistants/create-assistant': '/api-reference/assistants/create',
    '/api-reference/assistants/update-assistant': '/api-reference/assistants/update',
    '/api-reference/assistants/get-languages': '/api-reference/assistants/languages',
    '/api-reference/assistants/get-voices': '/api-reference/assistants/voices',
    '/api-reference/assistants/get-models': '/api-reference/assistants/models',
    '/automation': '/automation/overview',
    '/automation-platform/integrations/einzelintegrations/claude':
      '/automation-platform/integrations/einzelintegrations/anthropic-claude'
  };
  if (direct[p]) return direct[p];

  if (p.startsWith('/automation-platform/mid-call-actions/')) {
    p = p.replace('/automation-platform/mid-call-actions/', '/automation-platform/mid-call-tools/');
  }
  if (p.startsWith('/api-reference/integrations/')) {
    const name = p.split('/').pop();
    p = `/automation-platform/integrations/einzelintegrations/${name}`;
  }
  return p;
}

function resolveDocPath(filePath, linkMain) {
  if (linkMain.startsWith('/')) return linkMain;
  const localNoLocale = filePath.replace(/^(de|en)\//, '');
  const baseDir = path.posix.dirname(localNoLocale);
  return `/${path.posix.normalize(path.posix.join(baseDir, linkMain)).replace(/^\/+/, '')}`;
}

function normalizeDocLink(filePath, locale, href) {
  const { main, suffix } = splitSuffix(href.trim());
  if (isExternal(main)) return { kind: 'external', href };
  if (!main) return { kind: 'external', href };

  if (isAssetPath(main)) {
    return { kind: 'asset', href };
  }

  const rawDocPath = resolveDocPath(filePath, main);
  const canonical = mapLegacyPath(withoutLocalePrefix(rawDocPath));
  const localized = `/${locale}${canonical}`.replace(/\/+/g, '/');
  return { kind: 'doc', href: `${localized}${suffix}`, canonical };
}

function extractAndRewrite(content, filePath, locale) {
  const links = [];
  let updated = content;

  updated = updated.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) => {
    const n = normalizeDocLink(filePath, locale, href);
    links.push({ href, normalized: n.href, kind: n.kind, canonical: n.canonical, syntax: 'md' });
    if (n.kind === 'external' || n.kind === 'asset') return m;
    return `[${label}](${n.href})`;
  });

  updated = updated.replace(/\b(href|to)=("([^"]+)")/g, (m, attr, quoted, href) => {
    const n = normalizeDocLink(filePath, locale, href);
    links.push({ href, normalized: n.href, kind: n.kind, canonical: n.canonical, syntax: 'jsx' });
    if (n.kind === 'external' || n.kind === 'asset') return m;
    return `${attr}="${n.href}"`;
  });

  return { updated, links };
}

function existsDocTarget(locale, canonical) {
  const rel = `${locale}${canonical}`.replace(/\/+/g, '/');
  const candidates = [
    `${rel}.mdx`,
    `${rel}/overview.mdx`,
    `${rel}/introduction.mdx`,
    `${rel}/index.mdx`
  ];
  return candidates.some((c) => fs.existsSync(path.join(root, c)));
}

function titleFromSlug(slug) {
  const token = slug.split('/').pop() || slug;
  return token
    .split('-')
    .filter(Boolean)
    .map((w) => {
      if (w.toUpperCase() === 'API') return 'API';
      if (w.toUpperCase() === 'ROI') return 'ROI';
      if (w.toUpperCase() === 'AI') return 'AI';
      if (w.toUpperCase() === 'CRM') return 'CRM';
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

function buildEnDoc(canonical) {
  const slug = canonical.replace(/^\//, '');
  const title = titleFromSlug(slug);
  const description = `Documentation for ${title} in the Famulor platform`;

  if (canonical === '/api-reference/assistants/enable-conversation-ended-webhook') {
    return `---
title: "Enable Conversation Ended Webhook"
api: "POST https://app.famulor.de/api/user/assistants/enable-conversation-ended-webhook"
description: "Enable conversation-ended webhook notifications for chat conversations"
---

Enable webhook notifications that are sent whenever a chat conversation (Web Widget or WhatsApp) ends.

### Request Body

<ParamField body="assistant_id" type="integer" required>
  The assistant ID for which the webhook should be enabled
</ParamField>

<ParamField body="webhook_url" type="string" required>
  HTTPS URL that will receive conversation-ended webhook payloads
</ParamField>

### Response

<ResponseField name="message" type="string">
  Confirmation that the webhook has been enabled
</ResponseField>

<ResponseField name="data" type="array">
  Empty array (reserved for future extensions)
</ResponseField>

<ResponseExample>
\`\`\`json 200 Success
{
  "message": "Conversation ended webhook enabled successfully",
  "data": []
}
\`\`\`
</ResponseExample>

## See Also

- [Conversation Ended Webhook](/en/api-reference/webhooks/conversation-ended)
- [Disable assistant webhook](/en/api-reference/assistants/disable-webhook)
`;
  }

  return `---
title: "${title}"
description: "${description}"
---

This page documents **${title}** for the Famulor documentation set.

## Overview

Use this page as the canonical reference for ${title} in automation and assistant workflows.

## Typical Use Cases

- Standardized implementation in production workflows
- Reusable setup across multiple assistants or integrations
- Faster onboarding for operations and engineering teams

## Setup Guide

1. Open the related section in the automation or integration area.
2. Configure required inputs and dependencies.
3. Validate behavior in a staging environment before production rollout.

## Example Flow

\`\`\`json Example
{
  "name": "${title}",
  "environment": "production",
  "status": "enabled"
}
\`\`\`

## Best Practices

- Keep naming and mapping conventions consistent.
- Document assumptions next to implementation details.
- Re-test dependent flows after changes.

## See Also

- [No-Code Automation Overview](/en/automation-platform/introduction)
- [Integrations Overview](/en/automation-platform/integrations/overview)
- [Mid-Call Tools](/en/automation-platform/mid-call-tools/was-sind-mid-call-tools)
`;
}

function buildDeDoc(canonical) {
  const slug = canonical.replace(/^\//, '');
  const title = titleFromSlug(slug);
  const description = `Dokumentation für ${title} in der Famulor Plattform`;

  if (canonical === '/api-reference/assistants/enable-conversation-ended-webhook') {
    return `---
title: "Conversation Ended Webhook aktivieren"
api: "POST https://app.famulor.de/api/user/assistants/enable-conversation-ended-webhook"
description: "Aktiviert Conversation-Ended-Webhook-Benachrichtigungen für Chat-Konversationen"
---

Aktivieren Sie Webhook-Benachrichtigungen, die gesendet werden, sobald eine Chat-Konversation (Web Widget oder WhatsApp) endet.

### Request Body

<ParamField body="assistant_id" type="integer" required>
  Die Assistenten-ID, für die der Webhook aktiviert werden soll
</ParamField>

<ParamField body="webhook_url" type="string" required>
  HTTPS-URL, die Conversation-Ended-Webhook-Payloads empfangen soll
</ParamField>

### Response

<ResponseField name="message" type="string">
  Bestätigung, dass der Webhook aktiviert wurde
</ResponseField>

<ResponseField name="data" type="array">
  Leeres Array (für zukünftige Erweiterungen reserviert)
</ResponseField>

<ResponseExample>
\`\`\`json 200 Success
{
  "message": "Conversation ended webhook enabled successfully",
  "data": []
}
\`\`\`
</ResponseExample>

## Siehe auch

- [Conversation Ended Webhook](/de/api-reference/webhooks/conversation-ended)
- [Assistenten-Webhook deaktivieren](/de/api-reference/assistants/disable-webhook)
`;
  }

  return `---
title: "${title}"
description: "${description}"
---

Diese Seite dokumentiert **${title}** für die Famulor-Dokumentation.

## Überblick

Nutzen Sie diese Seite als kanonische Referenz für ${title} in Automatisierungs- und Assistenten-Workflows.

## Typische Anwendungsfälle

- Standardisierte Implementierung in Produktiv-Workflows
- Wiederverwendbare Konfiguration für mehrere Assistenten oder Integrationen
- Schnellere Einarbeitung für Operations- und Engineering-Teams

## Einrichtungsleitfaden

1. Öffnen Sie den zugehörigen Bereich in Automation oder Integrationen.
2. Konfigurieren Sie erforderliche Eingaben und Abhängigkeiten.
3. Validieren Sie das Verhalten zuerst in einer Staging-Umgebung.

## Beispiel-Flow

\`\`\`json Beispiel
{
  "name": "${title}",
  "environment": "production",
  "status": "enabled"
}
\`\`\`

## Best Practices

- Halten Sie Benennungen und Mapping-Konventionen konsistent.
- Dokumentieren Sie Annahmen direkt neben Implementierungsdetails.
- Testen Sie abhängige Flows nach Änderungen erneut.

## Siehe auch

- [No-Code Automation Übersicht](/de/automation-platform/introduction)
- [Integrationen Übersicht](/de/automation-platform/integrations/overview)
- [Mid-Call-Tools](/de/automation-platform/mid-call-tools/was-sind-mid-call-tools)
`;
}

function ensureDocFiles(missingCanonicals) {
  const created = [];
  for (const canonical of missingCanonicals) {
    const enFile = path.join(root, `en${canonical}.mdx`);
    const deFile = path.join(root, `de${canonical}.mdx`);
    if (!fs.existsSync(enFile)) {
      fs.mkdirSync(path.dirname(enFile), { recursive: true });
      fs.writeFileSync(enFile, buildEnDoc(canonical), 'utf8');
      created.push(`en${canonical}`);
    }
    if (!fs.existsSync(deFile)) {
      fs.mkdirSync(path.dirname(deFile), { recursive: true });
      fs.writeFileSync(deFile, buildDeDoc(canonical), 'utf8');
      created.push(`de${canonical}`);
    }
  }
  return created;
}

function findTab(lang, names) {
  return (lang.tabs || []).find((t) => names.includes(t.tab));
}

function findGroup(tab, names) {
  return (tab?.groups || []).find((g) => names.includes(g.group));
}

function sortedPushUnique(arr, value) {
  if (!arr.includes(value)) arr.push(value);
  arr.sort();
}

function addToNavigation(docs, missingCanonicals) {
  const changes = [];
  const langs = docs.navigation?.languages || [];
  for (const lang of langs) {
    const locale = lang.language;
    const isEn = locale === 'en';
    const localizedPages = missingCanonicals.map((c) => `${locale}${c}`);

    const tabApi = findTab(lang, ['API Reference', 'API Referenz']);
    const tabNoCode = findTab(lang, ['No-Code Automation', 'No-Code Automatisierung']);
    const tabMid = findTab(lang, ['Mid-Call']);

    const grpAssistants = findGroup(tabApi, ['AI Assistants', 'KI-Assistants']);
    const grpIntegrations = findGroup(tabNoCode, ['Integrations', 'Integrationen']);
    const grpPopular = findGroup(tabNoCode, ['Popular Individual Integrations', 'Beliebte Einzelintegrationen']);
    const grpCrmSales = findGroup(tabNoCode, ['CRM & Sales Integrations', 'CRM & Sales Integrationen']);
    const grpMidTools = findGroup(tabMid, ['Mid-Call Tools', 'Mid-Call-Tools']);
    const grpMidIntegrations = findGroup(tabMid, ['Mid-Call Tool Integrations', 'Mid-Call-Tools Integrationen']);

    for (const p of localizedPages) {
      const noLocale = p.replace(/^(en|de)/, '');
      if (noLocale.startsWith('/api-reference/assistants/')) {
        if (grpAssistants && Array.isArray(grpAssistants.pages)) {
          sortedPushUnique(grpAssistants.pages, p.replace(/^\//, ''));
          changes.push(p);
        }
        continue;
      }
      if (noLocale.startsWith('/automation-platform/mid-call-tools/integration-templates/')) {
        if (grpMidIntegrations && Array.isArray(grpMidIntegrations.pages)) {
          // Prefer "General"/"Allgemein" subgroup for new compatibility pages
          const subName = isEn ? 'General' : 'Allgemein';
          const sub = grpMidIntegrations.pages.find((x) => x && typeof x === 'object' && x.group === subName);
          if (sub && Array.isArray(sub.pages)) {
            sortedPushUnique(sub.pages, p.replace(/^\//, ''));
            changes.push(p);
          } else if (Array.isArray(grpMidIntegrations.pages)) {
            grpMidIntegrations.pages.push({ group: subName, pages: [p.replace(/^\//, '')] });
            changes.push(p);
          }
        }
        continue;
      }
      if (noLocale.startsWith('/automation-platform/mid-call-tools/')) {
        if (grpMidTools && Array.isArray(grpMidTools.pages)) {
          sortedPushUnique(grpMidTools.pages, p.replace(/^\//, ''));
          changes.push(p);
        }
        continue;
      }
      if (noLocale.startsWith('/automation-platform/integrations/einzelintegrations/')) {
        const leaf = noLocale.split('/')[4] || '';
        const crmNames = new Set(['pipedrive', 'activecampaign', 'airtable', 'asana', 'dynamics', 'sap']);
        const target = crmNames.has(leaf) ? grpCrmSales : grpPopular;
        if (target && Array.isArray(target.pages)) {
          sortedPushUnique(target.pages, p.replace(/^\//, ''));
          changes.push(p);
        }
        continue;
      }
      if (noLocale.startsWith('/automation-platform/integrations/')) {
        if (grpIntegrations && Array.isArray(grpIntegrations.pages)) {
          sortedPushUnique(grpIntegrations.pages, p.replace(/^\//, ''));
          changes.push(p);
        }
      }
    }
  }
  return [...new Set(changes)];
}

function buildActiveSet(pages) {
  const set = new Set();
  for (const p of pages) {
    set.add(p);
    set.add(`${p}.mdx`);
  }
  return set;
}

function runAudit(docs, activePages) {
  const activeSet = buildActiveSet(activePages);
  const results = [];
  const byMissing = new Map();

  for (const page of activePages) {
    const locale = page.startsWith('de/') ? 'de' : 'en';
    const file = `${page}.mdx`;
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, 'utf8');
    const { links } = extractAndRewrite(content, page, locale);

    for (const l of links) {
      if (l.kind !== 'doc') continue;
      const target = l.canonical || l.normalized.replace(/^\/(de|en)/, '');
      const localized = `${locale}${target}`;
      const exists =
        activeSet.has(localized) ||
        activeSet.has(`${localized}.mdx`) ||
        existsDocTarget(locale, target);
      if (!exists) {
        const key = `${locale}|${target}`;
        byMissing.set(key, {
          missing_target: target,
          locale,
          count: 0,
          sources: new Set()
        });
        const row = byMissing.get(key);
        row.count += 1;
        row.sources.add(file);
      }
    }
  }

  for (const v of byMissing.values()) {
    results.push({
      missing_target: v.missing_target,
      locale: v.locale,
      count: v.count,
      category: 'doc_link',
      source_files: [...v.sources].sort()
    });
  }

  results.sort((a, b) => b.count - a.count || a.missing_target.localeCompare(b.missing_target));

  return {
    generated_at: new Date().toISOString(),
    active_pages: activePages.length,
    missing_targets: results.length,
    entries: results
  };
}

function runFix(docs, activePages) {
  let rewritten = 0;
  const touched = [];
  for (const page of activePages) {
    const locale = page.startsWith('de/') ? 'de' : 'en';
    const file = `${page}.mdx`;
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    const before = fs.readFileSync(full, 'utf8');
    const { updated } = extractAndRewrite(before, page, locale);
    if (updated !== before) {
      fs.writeFileSync(full, updated, 'utf8');
      rewritten += 1;
      touched.push(file);
    }
  }
  return { rewritten, touched };
}

function summarize(report) {
  const byLocale = report.entries.reduce((acc, e) => {
    acc[e.locale] = (acc[e.locale] || 0) + e.count;
    return acc;
  }, {});
  return {
    active_pages: report.active_pages,
    missing_targets: report.missing_targets,
    missing_refs_by_locale: byLocale
  };
}

function main() {
  const mode = (process.argv[2] || 'audit').trim();
  const docs = readJson(docsPath);
  const activePages = getActivePages(docs);

  if (mode === 'audit') {
    const report = runAudit(docs, activePages);
    writeJson(reportPath, report);
    process.stdout.write(`${JSON.stringify(summarize(report), null, 2)}\n`);
    return;
  }

  if (mode !== 'fix') {
    throw new Error('Usage: node scripts/multilang/active-links.js [audit|fix]');
  }

  const firstPass = runFix(docs, activePages);
  const reportAfterRewrite = runAudit(docs, activePages);
  writeJson(reportPath, reportAfterRewrite);

  const missingCanonicals = [...new Set(reportAfterRewrite.entries.map((e) => e.missing_target))].sort();
  const created = ensureDocFiles(missingCanonicals);

  const docsUpdated = readJson(docsPath);
  const navChanges = addToNavigation(docsUpdated, missingCanonicals);
  fs.writeFileSync(docsPath, JSON.stringify(docsUpdated, null, 2) + '\n', 'utf8');

  // Normalize links one more time after creating pages
  const activePagesFinal = getActivePages(docsUpdated);
  const secondPass = runFix(docsUpdated, activePagesFinal);
  const finalReport = runAudit(docsUpdated, activePagesFinal);
  writeJson(reportPath, finalReport);

  process.stdout.write(
    JSON.stringify(
      {
        rewritten_first_pass: firstPass.rewritten,
        created_pages: created.length,
        nav_changes: navChanges.length,
        rewritten_second_pass: secondPass.rewritten,
        final_missing_targets: finalReport.missing_targets,
        report: path.relative(root, reportPath)
      },
      null,
      2
    ) + '\n'
  );
}

main();
