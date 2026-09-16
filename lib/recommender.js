import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const model = JSON.parse(fs.readFileSync(path.join(here, '..', 'model', 'model.json'), 'utf8'));
const byTitle = new Map(model.movies.map((m, i) => [m.title.toLowerCase(), i]));

export function titles(query = '') {
  const q = query.trim().toLowerCase();
  return model.movies.filter(m => !q || m.title.toLowerCase().includes(q)).slice(0, 8).map(m => m.title);
}

export function recommend(title, limit = 10) {
  const idx = byTitle.get(String(title).trim().toLowerCase());
  if (idx === undefined) return null;
  const source = new Map(model.movies[idx].v);
  const scored = model.movies.map((movie, i) => {
    if (i === idx) return null;
    let score = 0;
    for (const [feature, weight] of movie.v) score += weight * (source.get(feature) || 0);
    return { movie, score };
  }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, limit);
  return { source: model.movies[idx], recommendations: scored.map(({ movie, score }) => ({ ...movie, score: Number(score.toFixed(3)) })) };
}

export const movieCount = model.movies.length;
