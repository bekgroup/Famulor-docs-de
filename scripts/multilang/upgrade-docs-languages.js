#!/usr/bin/env node
const fs = require('fs');

const GROUP_TRANSLATIONS = {
  'Einführung': 'Introduction',
  'Für Entwickler': 'For Developers',
  'Erste Schritte': 'Getting Started',
  'KI-Assistenten Übersicht': 'AI Assistants Overview',
  'Beispiel-Prompts': 'Example Prompts',
  'Telefonnummern': 'Phone Numbers',
  'Eingehende Anrufe': 'Inbound Calls',
  'Ausgehende Anrufe': 'Outbound Calls',
  'KI-Prompting & Konversationsdesign': 'AI Prompting & Conversation Design',
  'Automatisierung & Integrationen': 'Automation & Integrations',
  'Kosten & Preise': 'Costs & Pricing',
  'SIP Telefonnummern': 'SIP Phone Numbers',
  'Nummern-Bereitstellung': 'Number Provisioning',
  'Fehlerbehebung & FAQs': 'Troubleshooting & FAQs',
  'API Referenz': 'API Reference',
  'KI-Assistants': 'AI Assistants',
  'No-Code Automatisierungsplattform': 'No-Code Automation Platform',
  'Mid-Call-Tools': 'Mid-Call Tools',
  'Mid-Call-Tools Integrationen': 'Mid-Call Tool Integrations',
  'Gesundheitswesen': 'Healthcare',
  'CRM & Vertrieb': 'CRM & Sales',
  'Kommunikation': 'Communication',
  'Projektmanagement': 'Project Management',
  'Zahlungen': 'Payments',
  'Buchhaltung & HR': 'Accounting & HR',
  'Logistik & Dokumente': 'Logistics & Documents',
  'Gastronomie & Food': 'Hospitality & Food',
  'Allgemein': 'General',
  'Anruf-bezogen': 'Call-related',
  'Integrationen': 'Integrations',
  'Beliebte Einzelintegrationen': 'Popular Individual Integrations',
  'CRM & Sales Integrationen': 'CRM & Sales Integrations',
  'Whitepapers & Ressourcen': 'Whitepapers & Resources',
  'Vertrieb & Best Practices': 'Sales & Best Practices',
  'Rechtliche Informationen': 'Legal Information',
  'Plattform-Anleitung': 'Platform Guide',
  'Updates': 'Updates'
};

function toEn(node) {
  if (Array.isArray(node)) return node.map(toEn);
  if (!node || typeof node !== 'object') return node;

  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if ((k === 'group' || k === 'anchor' || k === 'tab' || k === 'dropdown' || k === 'product') && typeof v === 'string') {
      out[k] = GROUP_TRANSLATIONS[v] || v;
      continue;
    }

    if (k === 'pages' && Array.isArray(v)) {
      out[k] = v.map((p) => (typeof p === 'string' ? (p.startsWith('en/') ? p : `en/${p}`) : toEn(p)));
      continue;
    }

    out[k] = toEn(v);
  }

  return out;
}

const p = 'docs.json';
const j = JSON.parse(fs.readFileSync(p, 'utf8'));

const nav = j.navigation;
if (!nav || typeof nav !== 'object') throw new Error('docs.json navigation missing');

let deNav;
if (Array.isArray(nav.languages)) {
  const de = nav.languages.find((l) => l.language === 'de');
  deNav = de ? { ...de } : null;
} else {
  deNav = { ...nav, language: 'de', default: true };
}

if (!deNav) throw new Error('Could not derive DE navigation');

const { global, language, default: _default, ...deBody } = deNav;
const deLang = { language: 'de', default: true, ...deBody };
if (global) deLang.global = global;

const enBody = toEn(deBody);
const enLang = { language: 'en', ...enBody };
if (global) enLang.global = global;

j.navigation = {
  languages: [deLang, enLang]
};

fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
console.log('Updated docs.json to navigation.languages with de/en');
