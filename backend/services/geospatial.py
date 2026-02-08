import math
import re
from typing import Dict, List, Optional, Tuple

from services.data_loader import data_store, CAPABILITY_KEYWORDS


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def extract_distance_km(message: str) -> Tuple[Optional[float], Optional[float]]:
    text = message.lower()
    km_match = re.search(r"(\\d+(?:\\.\\d+)?)\\s*(km|kilometers|kilometres)", text)
    mi_match = re.search(r"(\\d+(?:\\.\\d+)?)\\s*(mi|miles)", text)
    hr_match = re.search(r"(\\d+(?:\\.\\d+)?)\\s*(hours|hrs|hr)", text)
    if km_match:
        return float(km_match.group(1)), None
    if mi_match:
        return float(mi_match.group(1)) * 1.609, None
    if hr_match:
        return None, float(hr_match.group(1))
    return None, None


def extract_coords(message: str) -> Optional[Tuple[float, float]]:
    text = message.lower()
    # Patterns: "lat, lng" or "lat lng"
    match = re.search(r"(-?\\d+(?:\\.\\d+)?)\\s*,\\s*(-?\\d+(?:\\.\\d+)?)", text)
    if match:
        lat = float(match.group(1))
        lng = float(match.group(2))
        if -90 <= lat <= 90 and -180 <= lng <= 180:
            return (lat, lng)
    match = re.search(
        r"lat\\s*[:=]\\s*(-?\\d+(?:\\.\\d+)?)\\s*[ ,;/]+\\s*(lon|lng|long)\\w*\\s*[:=]\\s*(-?\\d+(?:\\.\\d+)?)",
        text,
    )
    if match:
        lat = float(match.group(1))
        lng = float(match.group(3))
        if -90 <= lat <= 90 and -180 <= lng <= 180:
            return (lat, lng)
    return None


def detect_facility_type(message: str) -> Optional[str]:
    text = message.lower()
    for t in ["hospital", "clinic", "dentist", "pharmacy", "doctor", "diagnostic"]:
        if t in text:
            return "farmacy" if t == "pharmacy" else t
    return None


def detect_capability_category(message: str) -> Optional[str]:
    text = message.lower()
    for cat, keywords in CAPABILITY_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return cat
    return None


def find_location_coords(message: str) -> Tuple[Optional[Tuple[float, float]], Optional[str], Optional[str]]:
    text = message.lower()
    cities = data_store._city_coords or {}
    regions = data_store._region_centroids or {}

    coords = extract_coords(message)
    if coords:
        return coords, "Custom Coordinates", "custom_coords"

    for city in sorted(cities.keys(), key=len, reverse=True):
        if city in text:
            return (cities[city][0], cities[city][1]), city.title(), "city"

    for region in sorted(regions.keys(), key=len, reverse=True):
        if region.lower() in text:
            return (regions[region][0], regions[region][1]), region, "region"

    return None, None, None


def build_geospatial_response(
    message: Optional[str] = None,
    center: Optional[Tuple[float, float]] = None,
    location_label: Optional[str] = None,
    radius_km: Optional[float] = None,
    hours: Optional[float] = None,
    facility_type: Optional[str] = None,
    capability_category: Optional[str] = None,
    limit_within: int = 25,
    limit_nearest: int = 5,
    limit_cold_spots: int = 10,
) -> Dict[str, object]:
    """Deterministic geospatial query builder (no LLM)."""
    assumed_speed = 40.0

    if message:
        if radius_km is None and hours is None:
            distance_km, parsed_hours = extract_distance_km(message)
            radius_km = distance_km
            hours = parsed_hours
        if facility_type is None:
            facility_type = detect_facility_type(message)
        if capability_category is None:
            capability_category = detect_capability_category(message)

    location_source = None
    if center is None:
        coords, label, location_source = find_location_coords(message or "")
    else:
        coords = center
        label = location_label or "Custom Coordinates"
        location_source = "custom_coords"

    if coords and radius_km is None and hours:
        radius_km = hours * assumed_speed

    geo: Dict[str, object] = {
        "location": {
            "label": label,
            "coords": coords,
            "source": location_source,
        },
        "radius_km": radius_km,
        "time_hours": hours,
        "assumed_speed_kmh": assumed_speed,
        "facility_type": facility_type,
        "capability_category": capability_category,
        "within_radius": [],
        "nearest": [],
        "cold_spots": [],
    }

    if coords and radius_km:
        within = facilities_within_radius(coords, radius_km, facility_type, capability_category)
        geo["within_radius"] = [
            {
                "name": r["facility"].name,
                "unique_id": r["facility"].unique_id,
                "type": r["facility"].facility_type,
                "region": r["facility"].normalized_region,
                "distance_km": r["distance_km"],
            }
            for r in within[:limit_within]
        ]

    if coords:
        nearest = nearest_facilities(coords, facility_type, capability_category, limit=limit_nearest)
        geo["nearest"] = [
            {
                "name": r["facility"].name,
                "unique_id": r["facility"].unique_id,
                "type": r["facility"].facility_type,
                "region": r["facility"].normalized_region,
                "distance_km": r["distance_km"],
            }
            for r in nearest
        ]

    if radius_km and capability_category:
        geo["cold_spots"] = cold_spots(radius_km, capability_category)[:limit_cold_spots]

    return geo


def facility_matches(f, facility_type: Optional[str], capability_category: Optional[str]) -> bool:
    if facility_type and f.facility_type != facility_type:
        return False
    if capability_category:
        text = " ".join(f.capabilities + f.procedures + f.equipment).lower()
        keywords = CAPABILITY_KEYWORDS.get(capability_category, [])
        return any(kw in text for kw in keywords)
    return True


def facilities_within_radius(
    center: Tuple[float, float],
    radius_km: float,
    facility_type: Optional[str],
    capability_category: Optional[str],
) -> List[dict]:
    results = []
    for f in data_store.facilities:
        if f.lat is None or f.lng is None:
            continue
        if not facility_matches(f, facility_type, capability_category):
            continue
        d = haversine_km(center[0], center[1], f.lat, f.lng)
        if d <= radius_km:
            results.append({"facility": f, "distance_km": round(d, 2)})
    results.sort(key=lambda r: r["distance_km"])
    return results


def nearest_facilities(
    center: Tuple[float, float],
    facility_type: Optional[str],
    capability_category: Optional[str],
    limit: int = 5,
) -> List[dict]:
    results = []
    for f in data_store.facilities:
        if f.lat is None or f.lng is None:
            continue
        if not facility_matches(f, facility_type, capability_category):
            continue
        d = haversine_km(center[0], center[1], f.lat, f.lng)
        results.append({"facility": f, "distance_km": round(d, 2)})
    results.sort(key=lambda r: r["distance_km"])
    return results[:limit]


def cold_spots(
    radius_km: float,
    capability_category: Optional[str],
) -> List[dict]:
    spots = []
    for region, coords in (data_store._region_centroids or {}).items():
        nearest = nearest_facilities(coords, None, capability_category, limit=1)
        if not nearest:
            spots.append({"region": region, "distance_km": None})
            continue
        distance = nearest[0]["distance_km"]
        if distance > radius_km:
            spots.append({"region": region, "distance_km": distance})
    spots.sort(key=lambda s: s["distance_km"] or 0, reverse=True)
    return spots
