import { recommend, titles, movieCount } from '../../lib/recommender.js';

export default async function handler(req) {
  const query = new URL(req.url).searchParams.get('title') || '';
  const body = !query ? { movies: titles(''), movieCount } : recommend(query) || { error: 'Movie not found', movies: titles(query), movieCount };
  return new Response(JSON.stringify(body), { status: body.error ? 404 : 200, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
}
