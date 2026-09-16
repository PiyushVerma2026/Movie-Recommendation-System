import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { recommend, titles, movieCount } from './lib/recommender.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/recommend') {
    const title = url.searchParams.get('title') || '';
    const result = title ? (recommend(title) || { error: 'Movie not found', movies: titles(title), movieCount }) : { movies: titles(''), movieCount };
    res.writeHead(result.error ? 404 : 200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(result));
  }
  const file = path.join(root, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(path.join(root, 'public'))) return res.writeHead(403).end();
  try { const content = fs.readFileSync(file); res.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(content); }
  catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(process.env.PORT || 3000, () => console.log('Reelwise running at http://localhost:' + (process.env.PORT || 3000)));
