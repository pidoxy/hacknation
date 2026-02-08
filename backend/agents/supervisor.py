import json
import time
import uuid
from typing import List, Optional
from openai import OpenAI

from config import get_settings
from models.queries import AgentStep, ChatResponse
from services.data_loader import data_store, CAPABILITY_CATEGORIES, REGION_POPULATIONS
from services.vector_store import vector_store
from services.geospatial import build_geospatial_response


SUPERVISOR_SYSTEM_PROMPT = """You are an AI healthcare intelligence agent for the Virtue Foundation.
You help NGO planners and health workers understand healthcare facility data in Ghana.

You have access to a dataset of ~700+ healthcare facilities across Ghana's 16 regions.
You can answer questions about:
- Facility locations, types, capabilities, and specialties
- Medical deserts (regions lacking critical services)
- Data quality and anomalies
- Resource allocation recommendations
- Geospatial analysis (nearest facilities, coverage gaps)

IMPORTANT RULES:
1. Always cite specific facilities, regions, and data points in your answers.
2. When referencing facilities, include their name, type, and location.
3. For quantitative questions, provide exact numbers from the data.
4. For medical desert analysis, reference the capability coverage matrix.
5. Flag any data quality concerns you notice.
6. Be concise but thorough — NGO planners need actionable information.

When you cannot answer from the data, say so clearly rather than speculating.
"""

QUERY_CLASSIFIER_PROMPT = """Classify this user query into one of these categories:
- "basic": Simple facility lookup, counts, listings
- "geospatial": Location-based queries, nearest facility, distances, coverage
- "anomaly": Data quality, suspicious claims, mismatches
- "medical_desert": Service gaps, underserved regions, resource allocation
- "comparison": Comparing facilities or regions
- "recommendation": Asking for suggestions or action plans

Also extract any filters mentioned:
- region: Ghana region name
- facility_type: hospital, clinic, pharmacy, dentist, doctor
- capability: specific service like surgery, emergency, maternal, etc.
- specialty: medical specialty

Return JSON: {"category": str, "filters": {"region": str|null, "facility_type": str|null, "capability": str|null, "specialty": str|null}}
"""


class AgentSupervisor:
    """Orchestrates query handling across specialized sub-agents."""

    def __init__(self):
        self._client: Optional[OpenAI] = None
        self._conversations: dict = {}

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            settings = get_settings()
            self._client = OpenAI(api_key=settings.openai_api_key)
        return self._client

    def handle_query(self, message: str, conversation_id: Optional[str] = None) -> ChatResponse:
        """Process a natural language query through the agent pipeline."""
        if not conversation_id:
            conversation_id = str(uuid.uuid4())

        start_time = time.time()
        agent_trace = []

        # Step 1: Classify query
        classification = self._classify_query(message)
        agent_trace.append(AgentStep(
            step_number=1,
            agent_name="Supervisor",
            action="classify_query",
            input_summary=f"User query: '{message[:100]}...'",
            output_summary=f"Category: {classification.get('category', 'basic')}, "
                          f"Filters: {json.dumps(classification.get('filters', {}))}",
            data_sources=["user_input"],
            citations=[{"type": "input", "label": "user_query"}],
            duration_ms=int((time.time() - start_time) * 1000),
        ))

        # Step 2: Gather relevant data
        step2_start = time.time()
        context_data = self._gather_context(message, classification)
        step2_citations = [
            {
                "type": "facility",
                "id": f["unique_id"],
                "label": f["name"],
                "region": f.get("region", ""),
            }
            for f in context_data.get("facilities", [])[:5]
        ]
        if classification.get("filters", {}).get("region"):
            step2_citations.append({
                "type": "region",
                "label": classification["filters"]["region"],
            })
        if classification.get("category") in ["medical_desert", "recommendation"]:
            step2_citations.append({
                "type": "matrix",
                "label": "Capability coverage matrix",
            })

        agent_trace.append(AgentStep(
            step_number=2,
            agent_name=self._get_agent_name(classification),
            action="data_retrieval",
            input_summary=f"Searching with filters: {json.dumps(classification.get('filters', {}))}",
            output_summary=f"Found {len(context_data.get('facilities', []))} relevant facilities, "
                          f"{len(context_data.get('desert_data', []))} desert entries",
            data_sources=[
                "faiss_index",
                "facility_database",
                "desert_matrix",
                "geospatial_calc",
            ],
            citations=step2_citations,
            duration_ms=int((time.time() - step2_start) * 1000),
        ))

        # Step 3: Generate response
        step3_start = time.time()
        answer, sources, viz_hint = self._generate_response(message, classification, context_data)
        step3_citations = [
            {
                "type": "facility",
                "id": s.get("facility_id"),
                "label": s.get("facility_name"),
                "region": s.get("region", ""),
            }
            for s in sources[:5]
        ]
        agent_trace.append(AgentStep(
            step_number=3,
            agent_name="Response Generator",
            action="synthesize_answer",
            input_summary=f"Context: {len(str(context_data))} chars of data",
            output_summary=f"Generated {len(answer)} char response with {len(sources)} sources",
            data_sources=["openai_gpt"],
            citations=step3_citations,
            duration_ms=int((time.time() - step3_start) * 1000),
        ))

        return ChatResponse(
            answer=answer,
            sources=sources,
            agent_trace=agent_trace,
            visualization_hint=viz_hint,
            conversation_id=conversation_id,
            geospatial=context_data.get("geospatial"),
        )

    def _classify_query(self, message: str) -> dict:
        """Classify the query type and extract filters."""
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": QUERY_CLASSIFIER_PROMPT},
                    {"role": "user", "content": message},
                ],
                response_format={"type": "json_object"},
                temperature=0,
                max_tokens=200,
            )
            return json.loads(response.choices[0].message.content)
        except Exception:
            return {"category": "basic", "filters": {}}

    def _get_agent_name(self, classification: dict) -> str:
        category = classification.get("category", "basic")
        names = {
            "basic": "Query Agent",
            "geospatial": "Geospatial Agent",
            "anomaly": "Anomaly Detection Agent",
            "medical_desert": "Medical Reasoning Agent",
            "comparison": "Query Agent",
            "recommendation": "Medical Reasoning Agent",
        }
        return names.get(category, "Query Agent")

    def _gather_context(self, message: str, classification: dict) -> dict:
        """Gather relevant data based on query classification."""
        context = {
            "facilities": [],
            "stats": {},
            "desert_data": [],
            "anomaly_data": [],
        }

        filters = classification.get("filters", {})
        category = classification.get("category", "basic")

        # Always do semantic search
        search_results = vector_store.search(message, top_k=15)
        context["facilities"] = [
            {
                "name": f.name,
                "unique_id": f.unique_id,
                "type": f.facility_type,
                "city": f.address_city,
                "region": f.normalized_region,
                "specialties": f.specialties[:10],
                "capabilities": f.capabilities[:10],
                "procedures": f.procedures[:5],
                "equipment": f.equipment[:5],
                "description": f.description,
                "data_completeness": f.data_completeness,
                "anomalies": f.anomalies,
                "score": round(score, 3),
            }
            for f, score in search_results
        ]

        # Add filtered results if filters present
        region = filters.get("region")
        ftype = filters.get("facility_type")
        if region or ftype:
            filtered = data_store.search_facilities(region=region, facility_type=ftype)
            context["stats"]["filtered_count"] = len(filtered)
            context["stats"]["filtered_sample"] = [
                {"name": f.name, "type": f.facility_type, "region": f.normalized_region}
                for f in filtered[:10]
            ]

        # Add region stats
        if region and region in data_store.region_stats:
            stats = data_store.region_stats[region]
            context["stats"]["region"] = stats.model_dump()

        # Add desert data for medical desert queries
        if category in ["medical_desert", "recommendation"]:
            context["desert_data"] = data_store.desert_matrix
            context["stats"]["total_regions"] = len(data_store.region_stats)
            context["stats"]["desert_regions"] = [
                r for r, s in data_store.region_stats.items() if s.is_medical_desert
            ]

        # Geospatial queries
        if category == "geospatial":
            geo = build_geospatial_response(message=message)
            context["geospatial"] = geo
            context["stats"]["geospatial_summary"] = {
                "within_radius_count": len(geo.get("within_radius", [])),
                "nearest_count": len(geo.get("nearest", [])),
                "cold_spots_count": len(geo.get("cold_spots", [])),
            }

            ranked = geo.get("within_radius") or geo.get("nearest") or []
            if ranked:
                distance_by_id = {
                    item.get("unique_id"): item.get("distance_km")
                    for item in ranked
                    if item.get("unique_id")
                }
                ranked_ids = set(distance_by_id.keys())
                ranked_facilities = []
                for f in data_store.facilities:
                    if f.unique_id not in ranked_ids:
                        continue
                    ranked_facilities.append({
                        "name": f.name,
                        "unique_id": f.unique_id,
                        "type": f.facility_type,
                        "city": f.address_city,
                        "region": f.normalized_region,
                        "specialties": f.specialties[:10],
                        "capabilities": f.capabilities[:10],
                        "procedures": f.procedures[:5],
                        "equipment": f.equipment[:5],
                        "description": f.description,
                        "data_completeness": f.data_completeness,
                        "anomalies": f.anomalies,
                        "score": 1.0,
                        "distance_km": distance_by_id.get(f.unique_id),
                    })
                ranked_facilities.sort(
                    key=lambda item: item.get("distance_km") if item.get("distance_km") is not None else 1e9
                )
                context["facilities"] = ranked_facilities[:15]

        # Add anomaly data
        if category == "anomaly":
            context["anomaly_data"] = [
                {"name": f.name, "type": f.facility_type, "region": f.normalized_region,
                 "anomalies": f.anomalies}
                for f in data_store.facilities if f.anomalies
            ][:20]

        # Add overall stats
        context["stats"]["total_facilities"] = len(data_store.facilities)
        context["stats"]["regions"] = list(data_store.region_stats.keys())

        return context

    def _generate_response(self, message: str, classification: dict, context: dict):
        """Generate the final response using GPT."""
        context_str = json.dumps(context, indent=2, default=str)

        # Truncate if too long
        if len(context_str) > 8000:
            context_str = context_str[:8000] + "\n... (truncated)"

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SUPERVISOR_SYSTEM_PROMPT},
                    {"role": "user", "content": f"""Answer this query using the facility data below.

QUERY: {message}

QUERY CLASSIFICATION: {json.dumps(classification)}

RELEVANT DATA:
{context_str}

Provide a clear, concise answer with specific data citations. If showing facilities, mention their names and locations.
At the end, suggest 2-3 follow-up questions the user might want to ask."""},
                ],
                temperature=0.3,
                max_tokens=1500,
            )

            answer = response.choices[0].message.content

            # Build sources
            sources = []
            for f in context["facilities"][:5]:
                evidence = []
                if f.get("description"):
                    evidence.append({"field": "description", "text": f["description"]})
                for cap in (f.get("capabilities") or [])[:2]:
                    evidence.append({"field": "capability", "text": cap})
                for proc in (f.get("procedures") or [])[:2]:
                    evidence.append({"field": "procedure", "text": proc})
                for eq in (f.get("equipment") or [])[:2]:
                    evidence.append({"field": "equipment", "text": eq})
                for spec in (f.get("specialties") or [])[:1]:
                    evidence.append({"field": "specialty", "text": spec})

                sources.append({
                    "facility_id": f["unique_id"],
                    "facility_name": f["name"],
                    "region": f.get("region", ""),
                    "relevance": f.get("score", 0),
                    "row_id": f["unique_id"],
                    "evidence": evidence,
                })

            # Determine visualization hint
            category = classification.get("category", "basic")
            viz_hint = None
            if category == "geospatial":
                viz_hint = "map"
            elif category == "medical_desert":
                viz_hint = "heatmap"
            elif category == "comparison":
                viz_hint = "chart"

            return answer, sources, viz_hint

        except Exception as e:
            return f"I encountered an error processing your query: {str(e)}", [], None


# Global instance
agent_supervisor = AgentSupervisor()
