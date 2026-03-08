#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const mapFile = path.join(root, 'multilang', 'path-map.csv');

function parseCsv(content) {
  const lines = content.trim().split('\n');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const [de_path, en_path, status, ...rest] = lines[i].split(',');
    rows.push({ de_path, en_path, status, notes: rest.join(',') || '' });
  }
  return rows;
}

function toCsv(rows) {
  const header = 'de_path,en_path,status,notes';
  const lines = rows.map((r) => [r.de_path, r.en_path, r.status, r.notes || ''].join(','));
  return `${header}\n${lines.join('\n')}\n`;
}

async function translateWithOpenAI(apiKey, text) {
  const body = {
    model: 'gpt-4.1-mini',
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: 'You translate German technical docs (MDX) to English. Keep YAML frontmatter structure, headings, code blocks, API endpoints, JSON keys, variable names, and URLs unchanged where technical identifiers are involved. Translate explanatory prose and UI copy to natural English.'
          }
        ]
      },
      {
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    ]
  };

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errorText}`);
  }

  const json = await res.json();

  if (json.output_text && typeof json.output_text === 'string' && json.output_text.trim()) {
    return json.output_text;
  }

  if (Array.isArray(json.output)) {
    const chunks = [];
    for (const item of json.output) {
      if (!item || !Array.isArray(item.content)) continue;
      for (const c of item.content) {
        if (typeof c?.text === 'string' && c.text.trim()) {
          chunks.push(c.text);
        }
      }
    }
    if (chunks.length) return chunks.join('\n\n');
  }

  throw new Error(`No translatable text returned by OpenAI API. Response keys: ${Object.keys(json).join(',')}`);
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }

  const limitArg = Number(process.argv[2] || '0');
  const rows = parseCsv(fs.readFileSync(mapFile, 'utf8'));
  const targets = rows.filter((r) => r.status === 'needs_en_translation');

  const selected = limitArg > 0 ? targets.slice(0, limitArg) : targets;
  let done = 0;

  for (const row of selected) {
    const src = path.join(root, row.de_path);
    const dst = path.join(root, row.en_path);
    const input = fs.readFileSync(src, 'utf8');
    const translated = await translateWithOpenAI(apiKey, input);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, translated, 'utf8');
    row.status = 'translated_machine';
    done += 1;
    process.stdout.write(`Translated ${done}/${selected.length}: ${row.de_path}\n`);
  }

  fs.writeFileSync(mapFile, toCsv(rows), 'utf8');
  process.stdout.write(`Done. Updated ${done} file(s).\n`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
