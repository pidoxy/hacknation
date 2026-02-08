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
    duration_ms: Optional[int] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[dict] = Field(default_factory=list)
    agent_trace: List[AgentStep] = Field(default_factory=list)
    visualization_hint: Optional[str] = None
    conversation_id: str = ""


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
