import json
import time
from typing import Dict, List, Optional
from openai import OpenAI

from config import get_settings
from models.facility import Facility
from models.queries import AgentStep, IDPExtractResponse


# IDP extraction system prompt adapted from the Virtue Foundation prompts
IDP_SYSTEM_PROMPT = """You are an intelligent document parsing (IDP) agent for the Virtue Foundation.
Your task is to analyze raw healthcare facility data from Ghana and extract structured information.

Given a raw facility record (CSV row data), you must:

1. EXTRACT structured information from free-form text fields (capability, procedure, equipment, description).
2. CLASSIFY the facility's service capabilities into standard categories.
3. ASSESS data quality and assign confidence scores to each extracted field.
4. DETECT anomalies (mismatches, suspicious claims, data quality issues).

Output your analysis as a JSON object with these fields:
{
  "facility_classification": {
    "primary_type": "hospital|clinic|diagnostic_center|pharmacy|other",
    "service_level": "primary|secondary|tertiary|specialized",
    "ownership": "government|private|ngo|faith_based|unknown"
  },
  "extracted_capabilities": {
    "emergency_care": {"available": bool, "details": str, "confidence": float},
    "surgery": {"available": bool, "types": [str], "confidence": float},
    "maternal_obstetric": {"available": bool, "details": str, "confidence": float},
    "pediatrics": {"available": bool, "details": str, "confidence": float},
    "internal_medicine": {"available": bool, "details": str, "confidence": float},
    "dental": {"available": bool, "details": str, "confidence": float},
    "infectious_disease": {"available": bool, "details": str, "confidence": float},
    "cardiology": {"available": bool, "details": str, "confidence": float},
    "imaging_radiology": {"available": bool, "types": [str], "confidence": float},
    "laboratory": {"available": bool, "types": [str], "confidence": float},
    "pharmacy": {"available": bool, "confidence": float},
    "icu_critical_care": {"available": bool, "confidence": float}
  },
  "extracted_equipment": [
    {"name": str, "status": "confirmed|inferred|unknown", "source_text": str}
  ],
  "extracted_procedures": [
    {"name": str, "category": str, "confidence": float, "source_text": str}
  ],
  "workforce_indicators": {
    "has_specialists": bool,
    "specialist_types": [str],
    "staffing_level": "unknown|understaffed|adequate|well_staffed",
    "confidence": float
  },
  "anomalies_detected": [
    {"type": str, "description": str, "severity": "low|medium|high"}
  ],
  "data_quality_assessment": {
    "overall_completeness": float,
    "reliability_score": float,
    "missing_critical_fields": [str],
    "recommendations": [str]
  },
  "reasoning_steps": [str]
}

Be thorough but conservative with confidence scores. Only mark capabilities as "available" if
there is clear textual evidence. Flag any suspicious claims as anomalies.
"""


class IDPEngine:
    """Intelligent Document Parsing engine using OpenAI GPT."""

    def __init__(self):
        self._client: Optional[OpenAI] = None
        self._cache: Dict[str, IDPExtractResponse] = {}

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            settings = get_settings()
            self._client = OpenAI(api_key=settings.openai_api_key)
        return self._client

    def extract(self, facility: Facility) -> IDPExtractResponse:
        """Run IDP extraction on a single facility."""
        # Check cache
        if facility.unique_id in self._cache:
            return self._cache[facility.unique_id]

        start_time = time.time()
        agent_trace = []

        # Step 1: Prepare raw data
        raw_data = facility.model_dump()
        agent_trace.append(AgentStep(
            step_number=1,
            agent_name="IDP Parser",
            action="prepare_input",
            input_summary=f"Raw facility data for '{facility.name}' ({len(str(raw_data))} chars)",
            output_summary="Formatted input for LLM extraction",
            data_sources=[f"facility:{facility.unique_id}"],
        ))

        # Step 2: Call OpenAI for extraction
        raw_text = self._format_raw_for_llm(facility)
        agent_trace.append(AgentStep(
            step_number=2,
            agent_name="IDP Extractor",
            action="llm_extraction",
            input_summary=f"Free-form text: {len(facility.capabilities)} capabilities, "
                          f"{len(facility.procedures)} procedures, {len(facility.equipment)} equipment items",
            output_summary="Calling OpenAI GPT for structured extraction...",
            data_sources=["openai_gpt"],
        ))

        try:
            extraction = self._call_llm(raw_text)
        except Exception as e:
            extraction = {"error": str(e), "reasoning_steps": [f"LLM call failed: {e}"]}

        elapsed = int((time.time() - start_time) * 1000)

        # Step 3: Generate confidence scores
        confidence_scores = self._compute_confidence(facility, extraction)
        agent_trace.append(AgentStep(
            step_number=3,
            agent_name="Confidence Scorer",
            action="score_confidence",
            input_summary="Extracted fields vs raw data",
            output_summary=f"Average confidence: {sum(confidence_scores.values()) / max(len(confidence_scores), 1):.2f}",
            data_sources=["extraction_result"],
            duration_ms=elapsed,
        ))

        # Step 4: Format response
        result = IDPExtractResponse(
            original=raw_data,
            extracted=extraction,
            confidence_scores=confidence_scores,
            agent_trace=agent_trace,
            pydantic_schema=Facility.model_json_schema(),
            processing_cost=0.004,  # Approximate cost
        )

        # Cache result
        self._cache[facility.unique_id] = result
        return result

    def _format_raw_for_llm(self, f: Facility) -> str:
        """Format facility data as input for the LLM."""
        parts = [
            f"=== FACILITY RECORD ===",
            f"Name: {f.name}",
            f"Type: {f.facility_type or 'Unknown'}",
            f"Operator: {f.operator_type or 'Unknown'}",
            f"Location: {f.address_city or 'Unknown'}, {f.normalized_region or f.address_region or 'Unknown'}",
            f"Year Established: {f.year_established or 'Unknown'}",
            f"Capacity: {f.capacity or 'Unknown'}",
            f"Number of Doctors: {f.number_doctors or 'Unknown'}",
        ]
        if f.specialties:
            parts.append(f"\nSpecialties: {json.dumps(f.specialties)}")
        if f.capabilities:
            parts.append(f"\nCapabilities (free text): {json.dumps(f.capabilities)}")
        if f.procedures:
            parts.append(f"\nProcedures (free text): {json.dumps(f.procedures)}")
        if f.equipment:
            parts.append(f"\nEquipment (free text): {json.dumps(f.equipment)}")
        if f.description:
            parts.append(f"\nDescription: {f.description}")
        return "\n".join(parts)

    def _call_llm(self, raw_text: str) -> dict:
        """Call OpenAI GPT for structured extraction."""
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": IDP_SYSTEM_PROMPT},
                {"role": "user", "content": raw_text},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=2000,
        )

        content = response.choices[0].message.content
        return json.loads(content)

    def _compute_confidence(self, facility: Facility, extraction: dict) -> dict:
        """Compute confidence scores for key fields."""
        scores = {}

        # Name confidence
        scores["name"] = 0.99 if facility.name and facility.name != "Unknown Facility" else 0.3

        # Location confidence
        if facility.address_city and facility.normalized_region:
            scores["location"] = 0.95
        elif facility.address_city or facility.normalized_region:
            scores["location"] = 0.7
        else:
            scores["location"] = 0.2

        # Capabilities confidence based on evidence
        if facility.capabilities:
            scores["capabilities"] = min(0.95, 0.5 + len(facility.capabilities) * 0.05)
        else:
            scores["capabilities"] = 0.1

        # Procedures confidence
        if facility.procedures:
            scores["procedures"] = min(0.95, 0.5 + len(facility.procedures) * 0.05)
        else:
            scores["procedures"] = 0.1

        # Equipment confidence
        if facility.equipment:
            scores["equipment"] = min(0.95, 0.5 + len(facility.equipment) * 0.05)
        else:
            scores["equipment"] = 0.1

        # Specialties confidence
        if facility.specialties:
            scores["specialties"] = min(0.95, 0.6 + len(facility.specialties) * 0.03)
        else:
            scores["specialties"] = 0.2

        # Overall
        scores["overall"] = round(sum(scores.values()) / len(scores), 2)

        return scores

    def get_demo_facilities(self) -> List[str]:
        """Get IDs of facilities with the richest data (best for demo)."""
        from services.data_loader import data_store

        # Sort by data richness (most capabilities + procedures + equipment)
        ranked = sorted(
            data_store.facilities,
            key=lambda f: len(f.capabilities) + len(f.procedures) + len(f.equipment),
            reverse=True,
        )
        return [f.unique_id for f in ranked[:20]]

    def pre_extract_demos(self):
        """Pre-extract top facilities for demo speed."""
        from services.data_loader import data_store

        demo_ids = self.get_demo_facilities()
        for fid in demo_ids[:5]:  # Pre-extract top 5 to save on API costs
            facility = data_store.get_facility(fid)
            if facility:
                try:
                    self.extract(facility)
                except Exception:
                    pass  # Skip failures in pre-extraction


# Global instance
idp_engine = IDPEngine()
