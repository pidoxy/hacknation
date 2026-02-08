from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException

from services.data_loader import data_store
from services.vector_store import vector_store
from models.facility import Facility, FacilitySummary

router = APIRouter()


def facility_to_summary(f: Facility) -> FacilitySummary:
    return FacilitySummary(
        unique_id=f.unique_id,
        name=f.name,
        facility_type=f.facility_type,
        address_city=f.address_city,
        address_region=f.normalized_region or f.address_region,
        specialties=f.specialties,
        capabilities_count=len(f.capabilities),
        data_completeness=f.data_completeness,
        has_anomalies=len(f.anomalies) > 0,
        lat=f.lat,
        lng=f.lng,
    )


@router.get("/")
def list_facilities(
    region: Optional[str] = None,
    facility_type: Optional[str] = None,
    specialty: Optional[str] = None,
    has_anomalies: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """List facilities with optional filters and pagination."""
    results = data_store.search_facilities(
        region=region,
        facility_type=facility_type,
        specialty=specialty,
        has_anomalies=has_anomalies,
    )
    total = len(results)
    start = (page - 1) * page_size
    end = start + page_size
    page_results = results[start:end]

    return {
        "facilities": [facility_to_summary(f) for f in page_results],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/all-map-data")
def get_all_map_data():
    """Get minimal facility data for map rendering (all facilities)."""
    return [
        {
            "unique_id": f.unique_id,
            "name": f.name,
            "facility_type": f.facility_type,
            "lat": f.lat,
            "lng": f.lng,
            "region": f.normalized_region,
            "specialties_count": len(f.specialties),
            "capabilities_count": len(f.capabilities),
            "has_anomalies": len(f.anomalies) > 0,
        }
        for f in data_store.facilities
        if f.lat is not None and f.lng is not None
    ]


@router.get("/stats")
def get_stats():
    """Get aggregate facility statistics."""
    facilities = data_store.facilities
    types = {}
    regions = {}
    for f in facilities:
        t = f.facility_type or "unknown"
        types[t] = types.get(t, 0) + 1
        r = f.normalized_region or "Unknown"
        regions[r] = regions.get(r, 0) + 1

    return {
        "total": len(facilities),
        "by_type": types,
        "by_region": dict(sorted(regions.items(), key=lambda x: x[1], reverse=True)),
        "with_anomalies": sum(1 for f in facilities if f.anomalies),
        "avg_completeness": round(
            sum(f.data_completeness for f in facilities) / max(len(facilities), 1) * 100, 1
        ),
    }


@router.get("/search")
def search_facilities(q: str = Query(..., min_length=1), top_k: int = Query(10, ge=1, le=50)):
    """Semantic search across facilities."""
    results = vector_store.search(q, top_k=top_k)
    return {
        "query": q,
        "results": [
            {
                "facility": facility_to_summary(f),
                "similarity_score": round(score, 4),
            }
            for f, score in results
        ],
        "total": len(results),
    }


@router.get("/regions")
def list_regions():
    """Get all regions with facility counts."""
    return {
        region: {
            "total_facilities": stats.total_facilities,
            "hospitals": stats.hospitals,
            "clinics": stats.clinics,
            "is_medical_desert": stats.is_medical_desert,
            "desert_gaps": stats.desert_gaps,
        }
        for region, stats in data_store.region_stats.items()
    }


@router.get("/{unique_id}")
def get_facility(unique_id: str):
    """Get a single facility by ID."""
    facility = data_store.get_facility(unique_id)
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    return facility
