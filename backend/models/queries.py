from typing import List, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class AgentStep(BaseModel):
    step_number: int
    agent_name: str
    action: str
    input_summary: str
    output_summary: str
    data_sources: List[str] = Field(default_factory=list)
    citations: List[dict] = Field(default_factory=list)
    duration_ms: Optional[int] = None


class GeospatialLocation(BaseModel):
    label: Optional[str] = None
    coords: Optional[List[float]] = None
    source: Optional[str] = None


class GeospatialFacility(BaseModel):
    name: str
    unique_id: Optional[str] = None
    type: Optional[str] = None
    region: Optional[str] = None
    distance_km: Optional[float] = None


class GeospatialColdSpot(BaseModel):
    region: str
    distance_km: Optional[float] = None


class GeospatialResponse(BaseModel):
    location: GeospatialLocation
    radius_km: Optional[float] = None
    time_hours: Optional[float] = None
    assumed_speed_kmh: float = 40.0
    facility_type: Optional[str] = None
    capability_category: Optional[str] = None
    within_radius: List[GeospatialFacility] = Field(default_factory=list)
    nearest: List[GeospatialFacility] = Field(default_factory=list)
    cold_spots: List[GeospatialColdSpot] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict] = Field(default_factory=list)
    agent_trace: List[AgentStep] = Field(default_factory=list)
    visualization_hint: Optional[str] = None
    conversation_id: str = ""
    geospatial: Optional[GeospatialResponse] = None


class GeospatialRequest(BaseModel):
    message: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    location_label: Optional[str] = None
    radius_km: Optional[float] = None
    hours: Optional[float] = None
    facility_type: Optional[str] = None
    capability_category: Optional[str] = None
    limit_within: int = 25
    limit_nearest: int = 5
    limit_cold_spots: int = 10


class FacilitySearchRequest(BaseModel):
    query: str
    top_k: int = 10
    filters: Optional[dict] = None


class IDPExtractRequest(BaseModel):
    facility_id: str


class IDPExtractResponse(BaseModel):
    original: dict
    extracted: dict
    confidence_scores: dict = Field(default_factory=dict)
    agent_trace: List[AgentStep] = Field(default_factory=list)
    pydantic_schema: dict = Field(default_factory=dict)
    processing_cost: float = 0.0


class TTSRequest(BaseModel):
    text: str


class DesertMatrixEntry(BaseModel):
    region: str
    capability: str
    facility_count: int
    status: str  # "critical", "underserved", "adequate"


class MedicalDesertResponse(BaseModel):
    matrix: List[DesertMatrixEntry] = Field(default_factory=list)
    recommendations: List[dict] = Field(default_factory=list)
    total_deserts: int = 0
    critical_regions: List[str] = Field(default_factory=list)
