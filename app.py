import json
from pathlib import Path
from typing import List, Dict

from flask import Flask, render_template, request, redirect, url_for

DATA_FILE = Path('data/followers.json')
MAPBOX_TOKEN = 'pk.eyJ1IjoiYWxpYWxzYWJlIiwiYSI6ImNtZmlodHdvMzBtYTEya29lZ3dmZ3d4M2gifQ.MrUmbQ4_mj1KFXgJDTDZQA'

app = Flask(__name__)


def load_followers() -> List[Dict]:
    if DATA_FILE.exists():
        with DATA_FILE.open() as f:
            return json.load(f)
    return []


def save_followers(followers: List[Dict]) -> None:
    DATA_FILE.parent.mkdir(exist_ok=True)
    with DATA_FILE.open('w') as f:
        json.dump(followers, f, indent=2)


@app.route('/', methods=['GET', 'POST'])
def index():
    followers = load_followers()
    if request.method == 'POST' and 'file' in request.files:
        file = request.files['file']
        if file.filename:
            data = json.load(file.stream)
            for item in data:
                info = item.get('string_list_data', [{}])[0]
                username = info.get('value')
                href = info.get('href')
                if username and not any(f['username'] == username for f in followers):
                    followers.append({
                        'username': username,
                        'href': href,
                        'location': '',
                        'tags': [],
                        'notes': ''
                    })
            save_followers(followers)
        return redirect(url_for('index'))
    return render_template('index.html', followers=followers)


@app.route('/update/<username>', methods=['POST'])
def update_follower(username):
    followers = load_followers()
    for f in followers:
        if f['username'] == username:
            f['location'] = request.form.get('location', '')
            tags_raw = request.form.get('tags', '')
            f['tags'] = [t.strip() for t in tags_raw.split() if t.strip()]
            f['notes'] = request.form.get('notes', '')
            break
    save_followers(followers)
    return redirect(url_for('index'))


@app.route('/map')
def map_view():
    followers = [f for f in load_followers() if f.get('location')]
    return render_template('map.html', followers=followers, mapbox_token=MAPBOX_TOKEN)


@app.route('/stats')
def stats_view():
    followers = load_followers()
    cities: Dict[str, List[Dict]] = {}
    for f in followers:
        if f.get('location'):
            cities.setdefault(f['location'], []).append(f)
    return render_template('stats.html', cities=cities)


@app.route('/city/<city>')
def city_view(city):
    followers = [f for f in load_followers() if f.get('location') == city]
    return render_template('city.html', city=city, followers=followers)


if __name__ == '__main__':
    app.run(debug=True)
