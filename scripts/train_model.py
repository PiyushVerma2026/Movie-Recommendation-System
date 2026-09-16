"""Optional sklearn exporter matching the notebook's original pipeline.

Run with Python + pandas + scikit-learn + nltk installed. The deployed app uses
model/model.json so it does not need a Python runtime at request time.
"""
import ast, pickle
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

movies = pd.read_csv('tmdb_5000_movies.csv')
credits = pd.read_csv('tmdb_5000_credits.csv')
movies = movies.merge(credits, on='title')[['movie_id','title','genres','keywords','overview','cast','crew']].dropna()
def names(x): return [i['name'].replace(' ', '') for i in ast.literal_eval(x)]
def cast(x): return names(x)[:3]
def director(x): return [i['name'].replace(' ', '') for i in ast.literal_eval(x) if i.get('job') == 'Director']
for col in ('genres','keywords'): movies[col] = movies[col].apply(names)
movies['cast'] = movies['cast'].apply(cast); movies['crew'] = movies['crew'].apply(director)
movies['overview'] = movies['overview'].apply(lambda x: x.split())
movies['tags'] = (movies['crew'] + movies['cast'] + movies['keywords'] + movies['genres'] + movies['overview']).apply(lambda x: ' '.join(x).lower())
vectorizer = CountVectorizer(max_features=5000, stop_words='english')
vectors = vectorizer.fit_transform(movies['tags'])
artifact = {'movies': movies[['movie_id','title','overview']].to_dict('records'), 'vectorizer': vectorizer, 'similarity': cosine_similarity(vectors)}
with open('model/model.pkl', 'wb') as f: pickle.dump(artifact, f, protocol=pickle.HIGHEST_PROTOCOL)
print(f'Wrote model/model.pkl for {len(movies)} movies')
