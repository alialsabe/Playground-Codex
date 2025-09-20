from __future__ import annotations

import json
import os
from collections import OrderedDict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List

from flask import Flask, render_template


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "cities.json"


@dataclass(frozen=True)
class CityProfile:
    """Simple representation of a city's follower footprint."""

    city: str
    latitude: float
    longitude: float
    followers: int

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "CityProfile":
        return cls(
            city=str(payload["city"]),
            latitude=float(payload["latitude"]),
            longitude=float(payload["longitude"]),
            followers=int(payload["followers"]),
        )

    def as_geojson_feature(self) -> Dict[str, Any]:
        return {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [self.longitude, self.latitude],
            },
            "properties": {
                "city": self.city,
                "followers": self.followers,
            },
        }


def load_city_profiles(path: Path) -> List[CityProfile]:
    if not path.exists():
        raise FileNotFoundError(
            "Expected follower dataset to exist at {path}".format(path=path)
        )
    with path.open("r", encoding="utf-8") as handle:
        raw_payload = json.load(handle)
    return [CityProfile.from_dict(entry) for entry in raw_payload]


def build_geojson(profiles: List[CityProfile]) -> Dict[str, Any]:
    return {
        "type": "FeatureCollection",
        "features": [profile.as_geojson_feature() for profile in profiles],
    }


def build_city_table(profiles: List[CityProfile]) -> List[Dict[str, Any]]:
    ordered = sorted(profiles, key=lambda profile: profile.followers, reverse=True)
    results: List[Dict[str, Any]] = []
    for profile in ordered:
        results.append(
            OrderedDict(
                city=profile.city,
                followers=profile.followers,
                latitude=profile.latitude,
                longitude=profile.longitude,
            )
        )
    return results


app = Flask(__name__)
CITY_PROFILES = load_city_profiles(DATA_PATH)
CITY_GEOJSON = build_geojson(CITY_PROFILES)
CITY_TABLE = build_city_table(CITY_PROFILES)
TOTAL_FOLLOWERS = sum(profile.followers for profile in CITY_PROFILES)


@app.route("/")
def dashboard() -> str:
    return render_template(
        "dashboard.html",
        geojson=CITY_GEOJSON,
        city_table=CITY_TABLE,
        total_followers=TOTAL_FOLLOWERS,
        mapbox_token=os.getenv("MAPBOX_TOKEN", ""),
    )


if __name__ == "__main__":
    app.run(debug=True)
