# Virtue Foundation Intelligence Platform

A team-built hackathon prototype for exploring healthcare-facility capabilities and gaps in Ghana.

**2nd place — Databricks challenge, MIT Hack-Nation 2026.**

Databricks x Hack-Nation Global AI Hackathon | Feb 7–8, 2026

---

[Live Demo](https://hacknation-three.vercel.app/) · [Demo Video](https://youtu.be/4w29E3NGFV0) · [Tech Video](https://youtu.be/jgot8fLplxw) · [Dataset](https://drive.google.com/file/d/1qgmLHrJYu8TKY2UeQ-VFD4PQ_avPoZ3d/view)

---

## Problem

Facility information is fragmented across records and free-form descriptions. Planners need a way to inspect reported capabilities, trace answers to source records and identify gaps for further investigation.

## Solution

We built an **agentic AI intelligence layer** that ingests **797 real healthcare facility records** across Ghana's 16 regions, extracts structured capabilities from messy free-form text, and flags regional capability gaps for review. Missing information in a facility record is not proof that a service is unavailable.

## Core Features

- **Intelligent Document Processing (IDP)** — GPT-4o-mini powered extraction engine that parses unstructured facility text into structured, queryable data with model-generated per-field confidence scores (0–99%); these are not calibrated probabilities.

- **AI Command Center** — Natural language query interface backed by a LangGraph multi-agent pipeline. A supervisor agent classifies queries into 6 categories and routes to specialized sub-agents that search a FAISS vector store. Every response includes full agent tracing with row-level citations.

- **Medical Desert Detection** — Automated analysis mapping 10 capability categories across all 16 regions. The prototype flags regions missing 3+ recorded capabilities; its demonstration reported **10 flagged regions**. These are heuristic dataset findings, not independently validated measures of population access.

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

## Interpretation and limits

The demonstration reported **10 flagged regions** and **67 capability gaps** under its dataset rules. These outputs support exploration of the supplied records; they do not establish real-world service absence, adoption by the Virtue Foundation or measured health outcomes. City-level geocoding with jitter is approximate, and generated recommendations require human review.

This is collaborative hackathon work. The repository documents the team's implementation, rather than implying that one contributor independently built every component.

---

**Track:** Databricks — Bridging Medical Deserts | **Dataset:** Virtue Foundation Ghana Facilities
