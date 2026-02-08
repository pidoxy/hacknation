from fastapi import APIRouter

from agents.supervisor import agent_supervisor
from models.queries import ChatRequest

router = APIRouter()


@router.post("/query")
def chat_query(request: ChatRequest):
    """Process a natural language query through the agent pipeline."""
    result = agent_supervisor.handle_query(
        message=request.message,
        conversation_id=request.conversation_id,
    )
    return result.model_dump()


@router.get("/suggested-queries")
def get_suggested_queries():
    """Return a set of example queries for the UI."""
    return {
        "queries": [
            {
                "category": "Basic Queries",
                "examples": [
                    "How many hospitals are in the Ashanti Region?",
                    "List all facilities in Accra offering pediatric services",
                    "What specialties does Korle Bu Teaching Hospital offer?",
                ]
            },
            {
                "category": "Medical Desert Analysis",
                "examples": [
                    "Which regions lack emergency care facilities?",
                    "Where are the biggest gaps in maternal healthcare?",
                    "Show me the medical deserts in Northern Ghana",
                ]
            },
            {
                "category": "Geospatial Queries",
                "examples": [
                    "What is the nearest hospital to Tamale with surgical capability?",
                    "Which region has the highest facility density?",
                    "Show facility distribution across northern Ghana",
                ]
            },
            {
                "category": "Data Quality",
                "examples": [
                    "Are there any facilities with suspicious capability claims?",
                    "Which facilities have incomplete data?",
                    "Show me data anomalies in the Western Region",
                ]
            },
            {
                "category": "Resource Planning",
                "examples": [
                    "Where should we deploy a mobile MRI unit?",
                    "What are the top 5 most underserved regions?",
                    "Compare healthcare capacity between Ashanti and Northern regions",
                ]
            },
        ]
    }
