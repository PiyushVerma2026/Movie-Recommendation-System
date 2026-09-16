import fs from 'node:fs';

const moviesPath = 'tmdb_5000_movies.csv';
const creditsPath = 'tmdb_5000_credits.csv';

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift();
  return rows.filter(r => r.length === headers.length).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

function names(value, limit = Infinity) {
  if (!value) return [];
  const out = [];
  const re = /['"]name['"]\s*:\s*['"]((?:\\.|[^'"\\])*)['"]/g;
  let m;
  while ((m = re.exec(value)) && out.length < limit) out.push(m[1]);
  return out;
}

function director(value) {
  const re = /['"]job['"]\s*:\s*['"]Director['"][\s\S]*?['"]name['"]\s*:\s*['"]((?:\\.|[^'"\\])*)['"]/;
  return value?.match(re)?.[1] || '';
}

function tokens(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
}

const movies = parseCsv(fs.readFileSync(moviesPath, 'utf8'));
const credits = parseCsv(fs.readFileSync(creditsPath, 'utf8'));
const creditsByTitle = new Map(credits.map(c => [c.title, c]));
const records = movies.map(m => {
  const c = creditsByTitle.get(m.title) || {};
  const tagText = [...names(m.genres), ...names(m.keywords), ...names(c.cast, 3), director(c.crew), m.overview || ''].join(' ');
  return { id: m.movie_id, title: m.title, overview: m.overview || '', director: director(c.crew), cast: names(c.cast, 5), releaseDate: m.release_date || '', tags: tokens(tagText) };
}).filter(m => m.title && m.tags.length);

const counts = new Map();
for (const r of records) for (const t of new Set(r.tags)) counts.set(t, (counts.get(t) || 0) + 1);
const vocabulary = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5000).map(([t]) => t);
const index = new Map(vocabulary.map((t, i) => [t, i]));
const moviesOut = records.map(r => {
  const termCounts = new Map();
  for (const t of r.tags) if (index.has(t)) termCounts.set(index.get(t), (termCounts.get(index.get(t)) || 0) + 1);
  const norm = Math.sqrt([...termCounts.values()].reduce((s, v) => s + v * v, 0)) || 1;
  return { id: r.id, title: r.title, overview: r.overview, director: r.director, cast: r.cast, releaseDate: r.releaseDate, v: [...termCounts].map(([i, v]) => [i, Number((v / norm).toFixed(5))]) };
});
const model = { version: 1, vocabulary, movies: moviesOut };
fs.mkdirSync('model', { recursive: true });
fs.writeFileSync('model/model.json', JSON.stringify(model));
console.log(`Built model for ${moviesOut.length} movies with ${vocabulary.length} features.`);
