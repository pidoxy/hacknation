from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class Facility(BaseModel):
    unique_id: str = ""
    content_table_id: Optional[str] = None
    name: str = ""
    facility_type: Optional[str] = None
    operator_type: Optional[str] = None
    description: Optional[str] = None
    specialties: List[str] = Field(default_factory=list)
    capabilities: List[str] = Field(default_factory=list)
    procedures: List[str] = Field(default_factory=list)
    equipment: List[str] = Field(default_factory=list)
    address_city: Optional[str] = None
    address_region: Optional[str] = None
    address_country: str = "Ghana"
    phone_numbers: List[str] = Field(default_factory=list)
    email: Optional[str] = None
    websites: List[str] = Field(default_factory=list)
    year_established: Optional[int] = None
    number_doctors: Optional[int] = None
    capacity: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    data_completeness: float = 0.0
    anomalies: List[str] = Field(default_factory=list)
    normalized_region: Optional[str] = None


class FacilitySummary(BaseModel):
    unique_id: str
    name: str
    facility_type: Optional[str] = None
    address_city: Optional[str] = None
    address_region: Optional[str] = None
    specialties: List[str] = Field(default_factory=list)
    capabilities_count: int = 0
    data_completeness: float = 0.0
    has_anomalies: bool = False
    lat: Optional[float] = None
    lng: Optional[float] = None


class RegionStats(BaseModel):
    region: str
    total_facilities: int = 0
    hospitals: int = 0
    clinics: int = 0
    specialties_available: List[str] = Field(default_factory=list)
    capabilities_coverage: dict = Field(default_factory=dict)
    avg_data_completeness: float = 0.0
    anomaly_count: int = 0
    is_medical_desert: bool = False
    desert_gaps: List[str] = Field(default_factory=list)


class DataQualityStats(BaseModel):
    total_facilities: int = 0
    unique_facilities: int = 0
    duplicates_found: int = 0
    enrichment_rate: float = 0.0
    fields_normalized: int = 0
    region_variants_fixed: int = 0
    avg_completeness: float = 0.0
    completeness_by_region: dict = Field(default_factory=dict)
    completeness_by_field: dict = Field(default_factory=dict)
