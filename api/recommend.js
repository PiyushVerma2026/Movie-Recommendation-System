import { recommend, titles, movieCount } from '../lib/recommender.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const query = typeof req.query?.title === 'string' ? req.query.title : '';
  if (!query) return res.status(200).json({ movies: titles(''), movieCount });
  const result = recommend(query);
  if (!result) return res.status(404).json({ error: 'Movie not found', movies: titles(query), movieCount });
  return res.status(200).json(result);
}
