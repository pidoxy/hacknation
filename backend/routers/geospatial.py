from fastapi import APIRouter, HTTPException

from models.queries import GeospatialRequest, GeospatialResponse
from services.geospatial import build_geospatial_response

router = APIRouter()


@router.post("/geospatial", response_model=GeospatialResponse)
def geospatial_query(request: GeospatialRequest):
    """Deterministic geospatial calculations (no LLM)."""
    center = None
    if request.lat is not None and request.lng is not None:
        center = (request.lat, request.lng)

    result = build_geospatial_response(
        message=request.message,
        center=center,
        location_label=request.location_label,
        radius_km=request.radius_km,
        hours=request.hours,
        facility_type=request.facility_type,
        capability_category=request.capability_category,
        limit_within=request.limit_within,
        limit_nearest=request.limit_nearest,
        limit_cold_spots=request.limit_cold_spots,
    )

    location = result.get("location", {})
    if not location or not location.get("coords"):
        raise HTTPException(
            status_code=400,
            detail="Location not found. Provide lat/lng or a known city/region.",
        )

    return result
