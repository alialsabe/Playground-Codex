# Playground-Codex Dashboard

An interactive Flask dashboard showcasing community follower metrics across major cities. The experience combines a Mapbox map, sortable data table, and Chart.js analytics within a tabbed interface so viewers can pivot between visualizations without refreshing the page.

## Features

- **Interactive tabs** let you switch between the map, detailed city list, and analytics without triggering a full page reload.
- **Mapbox GL JS** renders clustered markers whose hover cards display follower counts. All coordinates are precomputed server-side for faster load times.
- **Chart.js visualizations** (bar and pie charts) complement the data table to highlight follower distribution patterns.

## Getting started

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Export your Mapbox token (required for the interactive map):

   ```bash
   export MAPBOX_TOKEN="pk.your-token-here"
   ```

3. Run the Flask development server:

   ```bash
   flask --app app run --debug
   ```

4. Open [http://127.0.0.1:5000/](http://127.0.0.1:5000/) in your browser to explore the dashboard.

The dataset in `data/cities.json` can be extended with new cities by supplying a name, latitude, longitude, and follower count. Changes are automatically reflected across the map, table, and charts on the next page load.
