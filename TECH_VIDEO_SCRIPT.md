# Tech Video Script - Virtue Foundation Intelligence Platform
## Duration: 60 seconds max | Format: Screen recording + voiceover

---

## SYSTEM ARCHITECTURE DIAGRAM (Show this on screen)

```
                        VIRTUE FOUNDATION INTELLIGENCE PLATFORM
                              System Architecture

    +-------------------+         +----------------------------+
    |   FRONTEND        |         |   BACKEND (FastAPI)        |
    |   React 19 + TS   | <-----> |   Python 3.11              |
    |   Vite + Tailwind |  Axios  |   Uvicorn ASGI             |
    |   TanStack Query  |  REST   |   Pydantic Models          |
    +-------------------+         +----------------------------+
           |                                  |
    +------+------+              +------------+-------------+
    |             |              |            |             |
  Leaflet     Recharts     LangGraph    FAISS Vector    ElevenLabs
  Maps        Charts       Agent       Store + OpenAI   Voice I/O
                           Pipeline    Embeddings       TTS + STT
                              |
              +---------------+---------------+
              |               |               |
         GPT-4o-mini    Query Classifier   IDP Engine
         Response Gen   (6 categories)     (Structured
                                            Extraction)
```

---

## SCRIPT (Read this as voiceover while showing the architecture + code)

---

### OPENING (0:00 - 0:08)

**[SHOW: Architecture diagram above]**

> "Here's how we built the Virtue Foundation Intelligence Platform - a full-stack AI system that analyzes 797 healthcare facilities across Ghana's 16 regions to identify medical deserts and service gaps."

---

### BACKEND ARCHITECTURE (0:08 - 0:20)

**[SHOW: Quick scroll through `backend/` folder structure, then `main.py` lifespan function]**

> "The backend runs on FastAPI with Python. At startup, we load the raw CSV data through a multi-step pipeline: region normalization using a custom Ghana regions map, deduplication that merges 1,003 raw records into 797 unique facilities, geocoding with coordinate jitter for map display, and anomaly detection that flags 43 data quality issues across 39 facilities."

**[SHOW: `services/data_loader.py` briefly - the dedup and normalization code]**

> "All data lives in-memory using Pandas for fast query performance - no database needed."

---

### AI AGENT PIPELINE (0:20 - 0:35)

**[SHOW: `agents/supervisor.py` - the classify and respond functions]**

> "The core intelligence uses a LangGraph-style multi-agent pipeline. When a user asks a question, a Supervisor agent first classifies the query into one of six categories - basic lookup, geospatial, anomaly detection, medical desert analysis, comparison, or recommendation. It then routes to specialized sub-agents that gather context from our FAISS vector store."

**[SHOW: `services/vector_store.py` - the FAISS index build + search]**

> "The vector store uses FAISS with OpenAI's text-embedding-3-small model. We embed each facility's full profile - name, type, location, specialties, capabilities, procedures, equipment - into dense vectors. Semantic search returns the most relevant facilities for any natural language query."

**[SHOW: `services/idp_engine.py` - the extraction prompt and confidence scoring]**

> "The IDP engine is where the real innovation lives. It takes raw, unstructured free-form text from facility records and uses GPT-4o-mini to extract structured data - capabilities, equipment, procedures, workforce indicators - each with a confidence score. This is how we turn messy real-world data into actionable intelligence."

---

### GEOSPATIAL + MEDICAL DESERT DETECTION (0:35 - 0:42)

**[SHOW: `services/geospatial.py` - haversine formula, then `data_loader.py` medical desert logic]**

> "The geospatial engine uses the Haversine formula for distance calculations. Medical desert detection works by mapping 10 capability categories across all 16 regions. Any region missing 3 or more capabilities is flagged as a medical desert - we detected 10 such regions in the Ghana dataset."

---

### FRONTEND (0:42 - 0:50)

**[SHOW: Quick browser view of the app - Command Center with map]**

> "The frontend is React 19 with TypeScript, built with Vite, styled with Tailwind CSS 4. TanStack Query handles all server state with automatic caching. The interactive map uses Leaflet with custom layers for facility markers, region boundaries, and medical desert overlays."

**[SHOW: Quick flash of IDP Agent page showing extraction results]**

> "Every AI response includes full agent tracing - you can see exactly which agents ran, what data sources were queried, and the citations for transparency."

---

### VOICE I/O (0:50 - 0:55)

**[SHOW: Click the mic button or Listen button briefly]**

> "Voice input and output is powered by ElevenLabs - speech-to-text for voice queries using Scribe, and text-to-speech for reading responses aloud using the multilingual v2 model."

---

### DEPLOYMENT (0:55 - 0:60)

**[SHOW: Architecture diagram again or Railway/Vercel logos]**

> "The backend deploys to Railway with Nixpacks, the frontend to Vercel with SPA routing. All API keys are managed via environment variables with Pydantic settings validation. The entire system is production-ready and serves real data - no mock endpoints."

---

## KEY TECH STACK SUMMARY (For on-screen text overlay)

| Layer | Technologies |
|-------|-------------|
| **Backend** | FastAPI, Python 3.11, Uvicorn, Pydantic v2 |
| **AI/ML** | LangGraph, GPT-4o-mini, FAISS, OpenAI Embeddings |
| **IDP** | GPT-4o-mini structured extraction with confidence scoring |
| **Data** | Pandas, NumPy, in-memory processing, CSV pipeline |
| **Voice** | ElevenLabs (TTS: multilingual_v2, STT: scribe_v1) |
| **Geospatial** | Haversine distance, cold-spot detection, geocoding |
| **Frontend** | React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4 |
| **State** | TanStack Query v5, React hooks |
| **Maps** | Leaflet + react-leaflet |
| **Deployment** | Railway (backend), Vercel (frontend) |

---

## RECORDING TIPS

1. **Screen flow**: Architecture diagram (8s) -> Backend code scroll (12s) -> Agent pipeline code (15s) -> Geospatial code (7s) -> Live app browser (8s) -> Voice demo (5s) -> Architecture wrap-up (5s)

2. **Keep code visible** but don't linger - the voiceover carries the explanation

3. **Highlight key files** to show on screen:
   - `agents/supervisor.py` (lines 1-50: classify function)
   - `services/vector_store.py` (lines showing FAISS index build)
   - `services/idp_engine.py` (lines showing extraction prompt)
   - `services/data_loader.py` (lines showing dedup/normalization)
   - `services/geospatial.py` (haversine function)
   - `main.py` (lifespan startup sequence)

4. **Browser shots**: Show Command Center map + chat, IDP extraction with confidence bars, Strategic Planner matrix

5. **Speak at moderate pace** - ~150 words per minute. Total script is ~380 words = ~2.5 min at normal pace. For 60 seconds, speak faster or trim sections.

---

## 60-SECOND CONDENSED VERSION

If you need to fit exactly 60 seconds (~150 words):

**[0:00-0:10 | Architecture diagram]**
> "The Virtue Foundation Intelligence Platform is a full-stack AI system analyzing 797 Ghana healthcare facilities. Backend: FastAPI with Python. Frontend: React 19 with TypeScript and Leaflet maps."

**[0:10-0:25 | Show agent code + FAISS]**
> "The AI core uses a LangGraph multi-agent pipeline. A supervisor classifies queries into six categories, then routes to specialized agents that search a FAISS vector store built on OpenAI embeddings. The IDP engine extracts structured data from unstructured free-form text using GPT-4o-mini with confidence scoring."

**[0:25-0:40 | Show data pipeline + desert detection]**
> "The data pipeline normalizes regions, deduplicates records, geocodes facilities, and detects anomalies. Medical desert detection maps 10 capability categories across 16 regions - any region missing 3 or more capabilities is flagged. We identified 10 medical deserts."

**[0:40-0:52 | Show live app]**
> "The frontend uses TanStack Query for state management, Leaflet for interactive maps with desert overlays, and ElevenLabs for voice input and output. Every response includes full agent tracing with citations."

**[0:52-0:60 | Show deployment]**
> "Deployed on Railway and Vercel. No mock data - everything is real, from the 797 facilities to the AI-generated insights. Built for the Virtue Foundation to bridge medical deserts in Ghana."

---

## TALKING POINTS FOR Q&A

- **Why FAISS over a database?** In-memory vector search is faster for our dataset size (797 facilities). No cold-start latency, instant semantic search.

- **Why GPT-4o-mini?** Cost-effective for classification and extraction. Fast inference (~150ms for classification). Good enough for structured extraction with our detailed prompts.

- **Why no LangChain chains?** We use LangGraph's agent pattern for more control over the pipeline. Each agent step is traced and exposed in the UI for transparency.

- **How does IDP handle messy data?** The extraction prompt defines exact output schema. Confidence scores are computed from data completeness - more fields filled = higher confidence. The system gracefully handles missing data.

- **What about scalability?** For production: swap in-memory store for PostgreSQL + pgvector, add Redis caching, use batch processing for embeddings. Current architecture handles demo-scale perfectly.

- **Why ElevenLabs over browser speech?** Higher quality, natural-sounding voices. Browser speechSynthesis is used as fallback when ElevenLabs is unavailable.
