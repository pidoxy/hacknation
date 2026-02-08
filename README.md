# Virtue Foundation Intelligence Platform

**Bridging Medical Deserts with AI-Powered Healthcare Gap Analysis**

Databricks x Hack-Nation Global AI Hackathon | Feb 7–8, 2026

---

[Live Demo](https://hacknation-three.vercel.app/) · [Demo Video](https://youtu.be/4w29E3NGFV0) · [Tech Video](https://youtu.be/jgot8fLplxw) · [Dataset](https://drive.google.com/file/d/1qgmLHrJYu8TKY2UeQ-VFD4PQ_avPoZ3d/view)

---

## Problem

By 2030, the world faces a shortage of **10 million healthcare workers**. The Virtue Foundation operates in regions where skilled doctors exist but remain disconnected from the communities that need them. Facility data is fragmented, unstructured, and incomplete — making it impossible for NGO planners to identify where critical care is available and where it is dangerously absent.

## Solution

We built an **agentic AI intelligence layer** that ingests **797 real healthcare facility records** across Ghana's 16 regions, extracts structured capabilities from messy free-form text, and identifies medical deserts where entire populations lack access to essential services like surgery, emergency care, or maternal health.

## Core Features

- **Intelligent Document Processing (IDP)** — GPT-4o-mini powered extraction engine that parses unstructured facility text into structured, queryable data with per-field confidence scores (0–99%).

- **AI Command Center** — Natural language query interface backed by a LangGraph multi-agent pipeline. A supervisor agent classifies queries into 6 categories and routes to specialized sub-agents that search a FAISS vector store. Every response includes full agent tracing with row-level citations.

- **Medical Desert Detection** — Automated analysis mapping 10 capability categories across all 16 regions. Regions missing 3+ capabilities are flagged as medical deserts — we identified **10 critical deserts** affecting millions.

- **Strategic Resource Planner** — Interactive gap matrix (16 regions × 10 capabilities) with AI-generated deployment recommendations, priority scoring, and a 4-step plan builder for NGO resource allocation.

- **Interactive Map Visualization** — Leaflet-powered map with color-coded facility markers, region boundary overlays, and medical desert zone highlights.

- **Voice I/O** — ElevenLabs-powered speech-to-text input and text-to-speech narration for accessibility.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | FastAPI, Python 3.11, Uvicorn, Pydantic v2 |
| **AI/ML** | LangGraph, GPT-4o-mini, FAISS-CPU, OpenAI Embeddings (text-embedding-3-small) |
| **IDP** | GPT-4o-mini structured extraction with confidence scoring |
| **Voice** | ElevenLabs (TTS: multilingual_v2, STT: scribe_v1) |
| **Frontend** | React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4 |
| **State** | TanStack Query v5, React hooks |
| **Maps** | Leaflet + react-leaflet |
| **Deployment** | Railway (backend), Vercel (frontend) |

## Architecture

```
                    VIRTUE FOUNDATION INTELLIGENCE PLATFORM

    +-------------------+         +----------------------------+
    |   FRONTEND        |         |   BACKEND (FastAPI)        |
    |   React 19 + TS   | <-----> |   Python 3.11              |
    |   Vite + Tailwind |  REST   |   Uvicorn ASGI             |
    |   TanStack Query  |         |   Pydantic Models          |
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

## Data Pipeline

Raw CSV (1,003 records) → Region normalization (fuzzy matching + Ghana regions map) → Deduplication (merge by unique ID, union list fields) → Geocoding (city coords + jitter) → Anomaly detection (43 flagged across 39 facilities) → FAISS vector index → **797 clean, searchable facilities**

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API key
- ElevenLabs API key (optional, for voice features)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Links

| Resource | URL |
|----------|-----|
| **Live App** | https://hacknation-three.vercel.app/ |
| **Demo Video** | https://youtu.be/4w29E3NGFV0 |
| **Tech Video** | https://youtu.be/jgot8fLplxw |
| **Dataset** | [Virtue Foundation Ghana v0.3 (CSV)](https://drive.google.com/file/d/1qgmLHrJYu8TKY2UeQ-VFD4PQ_avPoZ3d/view) |

## Impact

The platform transforms the Virtue Foundation's ability to allocate resources by replacing manual spreadsheet analysis with AI-driven insights. By identifying **10 medical deserts** and **67 critical capability gaps**, it provides a clear roadmap for intervention — ensuring healthcare investment reaches the communities where it will save the most lives.

---

**Track:** Databricks — Bridging Medical Deserts | **Dataset:** Virtue Foundation Ghana Facilities
