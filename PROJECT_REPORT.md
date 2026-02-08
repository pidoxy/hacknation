# Virtue Foundation Intelligence Platform
### Bridging Medical Deserts with AI-Powered Healthcare Gap Analysis
**Databricks x Hack-Nation Global AI Hackathon | Feb 7-8, 2026**

---

## Problem

By 2030, the world faces a shortage of 10 million healthcare workers. The Virtue Foundation operates in regions where skilled doctors exist but remain disconnected from the communities that need them. Facility data is fragmented, unstructured, and incomplete — making it impossible for NGO planners to identify where critical care is available and where it is dangerously absent. Lives are lost not from a lack of expertise, but from a lack of coordination.

## Solution

We built an **agentic AI intelligence layer** that ingests 797 real healthcare facility records across Ghana's 16 regions, extracts structured capabilities from messy free-form text, and identifies medical deserts where entire populations lack access to essential services like surgery, emergency care, or maternal health.

## Core Features

- **Intelligent Document Processing (IDP):** A GPT-4o-mini powered extraction engine parses unstructured facility text (capabilities, procedures, equipment fields) into structured, queryable data with per-field confidence scores (0-99%). Turns chaotic records into actionable intelligence.

- **AI Command Center:** Natural language query interface backed by a LangGraph multi-agent pipeline. A supervisor agent classifies queries into 6 categories (basic, geospatial, anomaly, medical desert, comparison, recommendation) and routes to specialized sub-agents that search a FAISS vector store built on OpenAI embeddings. Every response includes full agent tracing with row-level citations.

- **Medical Desert Detection:** Automated analysis maps 10 capability categories (Emergency Care, Surgery, Maternal/Obstetric, Pediatrics, Internal Medicine, Dental, Infectious Disease, Cardiology, Imaging/Radiology, Laboratory) across all 16 regions. Regions missing 3+ capabilities are flagged as medical deserts — we identified **10 critical deserts** affecting millions.

- **Strategic Resource Planner:** Interactive gap matrix (16 regions x 10 capabilities) with AI-generated deployment recommendations, priority scoring, and a 4-step plan builder for NGO resource allocation.

- **Interactive Map Visualization:** Leaflet-powered map of Ghana with color-coded facility markers, region boundary overlays, and medical desert zone highlights for instant spatial understanding.

- **Voice I/O:** ElevenLabs-powered speech-to-text input and text-to-speech narration, making the platform accessible to non-technical field workers.

## Technical Architecture

| Layer | Stack |
|-------|-------|
| **Backend** | FastAPI, Python 3.11, Uvicorn, Pydantic v2, Pandas |
| **AI/ML** | LangGraph (multi-agent orchestration), GPT-4o-mini, FAISS-CPU, OpenAI Embeddings (text-embedding-3-small) |
| **Voice** | ElevenLabs (TTS: eleven_multilingual_v2, STT: scribe_v1) |
| **Frontend** | React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4, TanStack Query v5 |
| **Maps** | Leaflet + react-leaflet |
| **Deployment** | Railway (backend), Vercel (frontend) |

## Data Pipeline

Raw CSV (1,003 records) &rarr; Region normalization (fuzzy matching + Ghana regions map) &rarr; Deduplication (merge by unique ID, union list fields) &rarr; Geocoding (city coords + jitter) &rarr; Anomaly detection (43 flagged across 39 facilities) &rarr; FAISS vector index &rarr; **797 clean, searchable facilities**

## Impact

The platform transforms the Virtue Foundation's ability to allocate resources by replacing manual spreadsheet analysis with AI-driven insights. It answers critical questions instantly: *Which regions have zero emergency care? Where should the next surgical unit be deployed? Which facility claims don't match their data?* By identifying 10 medical deserts and 67 critical capability gaps, it provides a clear roadmap for intervention — ensuring that healthcare investment reaches the communities where it will save the most lives.

---

**Team:** Hack-Nation 2025 | **Track:** Databricks — Bridging Medical Deserts | **Dataset:** Virtue Foundation Ghana Facilities
