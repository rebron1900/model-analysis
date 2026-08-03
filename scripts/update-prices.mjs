#!/usr/bin/env node
// Refresh input/output/cache prices in data.json from the OpenRouter API.
// Usage: node scripts/update-prices.mjs
// Runs daily via .github/workflows/update-prices.yml (cron 0 0 * * * UTC).
import { readFile, writeFile } from 'node:fs/promises';

const API = 'https://openrouter.ai/api/v1/models?output_modalities=all';
const DATA_PATH = new URL('../data.json', import.meta.url);
const PER_M = 1e6; // API prices are per token; data.json stores per 1M tokens

// Split letter→digit boundaries so 'qwen3.6' and 'qwen 3.6' both tokenize to [qwen, 3, 6].
const norm = s => s.toLowerCase().replace(/([a-z])(\d)/g, '$1 $2').replace(/[^a-z0-9]+/g, ' ').trim();
const tokens = s => new Set(norm(s).split(' ').filter(Boolean));

// Match a data.json model name to an OpenRouter entry: normalized exact name
// first, then token-subset match, preferring canonical (non-alias) entries
// with the fewest extra tokens. Returns null when nothing matches.
function match(target, entries) {
  const t = tokens(target);
  let best = null;
  entries.forEach((e, i) => {
    const cand = tokens(e.name);
    if (![...t].every(k => cand.has(k))) return;
    const score = [norm(e.name) === norm(target) ? 0 : 1, e.id.startsWith('~') ? 1 : 0, cand.size - t.size, i];
    if (!best || score < best[0]) best = [score, e];
  });
  return best ? best[1] : null;
}

const usd = v => (Number.isFinite(v) ? Number((v * PER_M).toFixed(6)) : null);

const data = JSON.parse(await readFile(DATA_PATH, 'utf8'));
const res = await fetch(API);
if (!res.ok) throw new Error(`OpenRouter API ${res.status}: ${res.statusText}`);
const { data: models } = await res.json();

let updated = 0;
const unmatched = [];
for (const m of data.models) {
  m.cachePrice ??= null; // uniform schema; null = no cache pricing on OpenRouter
  const api = match(m.model, models);
  if (!api) { unmatched.push(m.model); continue; }
  const p = api.pricing ?? {};
  const prices = {
    inputPrice: usd(parseFloat(p.prompt)),
    outputPrice: usd(parseFloat(p.completion)),
    cachePrice: usd(parseFloat(p.input_cache_read)),
  };
  if (prices.inputPrice == null || prices.outputPrice == null) { unmatched.push(`${m.model} (no pricing)`); continue; }
  for (const [key, val] of Object.entries(prices)) {
    if (m[key] !== val) { m[key] = val; updated++; }
  }
}

data.lastUpdated = new Date().toISOString().slice(0, 10);
await writeFile(DATA_PATH, JSON.stringify(data, null, 2) + '\n');
console.log(`Updated ${updated} price fields across ${data.models.length} models; lastUpdated=${data.lastUpdated}`);
if (unmatched.length) console.warn(`No OpenRouter match (kept old prices):\n  ${unmatched.join('\n  ')}`);
