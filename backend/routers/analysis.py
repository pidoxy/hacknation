from fastapi import APIRouter

from services.data_loader import data_store, CAPABILITY_CATEGORIES, REGION_POPULATIONS

router = APIRouter()


@router.get("/medical-deserts")
def get_medical_deserts():
    """Get the full medical desert matrix (Region x Capability)."""
    matrix = data_store.desert_matrix
    critical_regions = [
        region for region, stats in data_store.region_stats.items()
        if stats.is_medical_desert
    ]
    total_critical = sum(1 for e in matrix if e["status"] == "critical")

    recommendations = _generate_recommendations()

    return {
        "matrix": matrix,
        "capabilities": CAPABILITY_CATEGORIES,
        "regions": list(REGION_POPULATIONS.keys()),
        "total_critical_gaps": total_critical,
        "critical_regions": critical_regions,
        "recommendations": recommendations,
    }


@router.get("/medical-deserts/{region}")
def get_region_desert(region: str):
    """Get medical desert analysis for a specific region."""
    stats = data_store.region_stats.get(region)
    if not stats:
        return {"error": f"Region '{region}' not found"}

    region_matrix = [e for e in data_store.desert_matrix if e["region"] == region]
    population = REGION_POPULATIONS.get(region, 0)

    return {
        "region": region,
        "stats": stats.model_dump(),
        "matrix": region_matrix,
        "population": population,
        "facilities_per_100k": round(stats.total_facilities / max(population, 1) * 100000, 1),
    }


@router.get("/anomalies")
def get_anomalies():
    """Get all detected anomalies across facilities."""
    anomalies = []
    for f in data_store.facilities:
        if f.anomalies:
            anomalies.append({
                "facility_id": f.unique_id,
                "facility_name": f.name,
                "facility_type": f.facility_type,
                "region": f.normalized_region,
                "anomalies": f.anomalies,
            })

    return {
        "total_facilities_with_anomalies": len(anomalies),
        "total_anomaly_count": sum(len(a["anomalies"]) for a in anomalies),
        "anomalies": anomalies,
    }


@router.get("/data-quality")
def get_data_quality():
    """Get data quality statistics."""
    if data_store.data_quality:
        return data_store.data_quality.model_dump()
    return {"error": "Data not loaded yet"}


@router.get("/region-stats")
def get_region_stats():
    """Get per-region statistics."""
    return {
        region: {
            **stats.model_dump(),
            "population": REGION_POPULATIONS.get(region, 0),
            "facilities_per_100k": round(
                stats.total_facilities / max(REGION_POPULATIONS.get(region, 1), 1) * 100000, 1
            ),
        }
        for region, stats in data_store.region_stats.items()
    }


@router.get("/specialty-coverage")
def get_specialty_coverage():
    """Get specialty availability across regions."""
    coverage = {}
    for region, stats in data_store.region_stats.items():
        coverage[region] = {
            "specialties": stats.specialties_available,
            "count": len(stats.specialties_available),
        }
    return coverage


def _generate_recommendations() -> list:
    """Generate AI-style recommendations based on desert analysis."""
    recommendations = []
    priority_order = 0

    for region, stats in data_store.region_stats.items():
        if not stats.desert_gaps:
            continue

        population = REGION_POPULATIONS.get(region, 0)

        for gap in stats.desert_gaps:
            priority_order += 1
            # Find nearest region with the capability
            nearest = _find_nearest_region_with_capability(region, gap)

            severity = "CRITICAL" if stats.total_facilities < 20 else "HIGH"
            if population > 1_000_000 and stats.total_facilities == 0:
                severity = "CRITICAL"

            recommendations.append({
                "id": priority_order,
                "region": region,
                "gap": gap,
                "severity": severity,
                "population_affected": population,
                "total_facilities_in_region": stats.total_facilities,
                "nearest_region_with_capability": nearest,
                "recommendation": f"Deploy {gap.lower()} services to {region}. "
                                  f"Currently 0 facilities offer this in a region with "
                                  f"an estimated population of {population:,}. "
                                  f"Nearest {gap.lower()} is in {nearest}.",
            })

    # Sort by severity then population
    recommendations.sort(
        key=lambda r: (0 if r["severity"] == "CRITICAL" else 1, -r["population_affected"])
    )
    return recommendations


def _find_nearest_region_with_capability(region: str, capability: str) -> str:
    """Find the nearest region that has a given capability."""
    for r, stats in data_store.region_stats.items():
        if r == region:
            continue
        if stats.capabilities_coverage.get(capability, 0) > 0:
            return r
    return "Unknown"
