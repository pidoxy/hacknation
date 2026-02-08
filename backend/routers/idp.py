from fastapi import APIRouter, HTTPException

from services.data_loader import data_store
from services.idp_engine import idp_engine
from models.queries import IDPExtractRequest

router = APIRouter()


@router.post("/extract")
def extract_facility(request: IDPExtractRequest):
    """Run IDP extraction on a single facility."""
    facility = data_store.get_facility(request.facility_id)
    if not facility:
        raise HTTPException(status_code=404, detail=f"Facility '{request.facility_id}' not found")

    result = idp_engine.extract(facility)
    return result.model_dump()


@router.get("/demo-facilities")
def get_demo_facilities():
    """Get facilities with richest data for demo purposes."""
    demo_ids = idp_engine.get_demo_facilities()
    demos = []
    for fid in demo_ids:
        facility = data_store.get_facility(fid)
        if facility:
            demos.append({
                "unique_id": facility.unique_id,
                "name": facility.name,
                "facility_type": facility.facility_type,
                "region": facility.normalized_region,
                "capabilities_count": len(facility.capabilities),
                "procedures_count": len(facility.procedures),
                "equipment_count": len(facility.equipment),
                "data_richness": len(facility.capabilities) + len(facility.procedures) + len(facility.equipment),
                "is_cached": facility.unique_id in idp_engine._cache,
            })
    return {"facilities": demos}


@router.get("/schema")
def get_schema():
    """Get the Pydantic schema used for extraction."""
    from models.facility import Facility
    return {
        "facility_schema": Facility.model_json_schema(),
        "description": "Schema used by the IDP agent to structure extracted data",
    }
