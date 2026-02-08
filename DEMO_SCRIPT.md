# VF Intelligence Platform — Comprehensive Demo Script

## Table of Contents

1. [Pre-Demo Setup](#1-pre-demo-setup)
2. [Scene 1: Opening — The Problem](#scene-1-opening--the-problem-2-minutes)
3. [Scene 2: Command Center — AI Chat Agent](#scene-2-command-center--ai-chat-agent-6-minutes)
4. [Scene 3: IDP Agent — Intelligent Document Parsing](#scene-3-idp-agent--intelligent-document-parsing-5-minutes)
5. [Scene 4: Strategic Planner — Bridging the Gaps](#scene-4-strategic-planner--bridging-the-gaps-5-minutes)
6. [Scene 5: Facility Explorer — Search & Discovery](#scene-5-facility-explorer--search--discovery-4-minutes)
7. [Scene 6: Data Integrity — Trust the Data](#scene-6-data-integrity--trust-the-data-3-minutes)
8. [Scene 7: Voice Interface & Accessibility](#scene-7-voice-interface--accessibility-2-minutes)
9. [Scene 8: Technical Architecture Walkthrough](#scene-8-technical-architecture-walkthrough-3-minutes)
10. [Scene 9: Closing — Impact & Vision](#scene-9-closing--impact--vision-2-minutes)
11. [Appendix A: Hackathon Requirements Mapping](#appendix-a-hackathon-requirements-mapping)
12. [Appendix B: All 59 VF Agent Questions](#appendix-b-all-59-vf-agent-questions)
13. [Appendix C: Troubleshooting](#appendix-c-troubleshooting)
14. [Appendix D: Judge Talking Points Cheat Sheet](#appendix-d-judge-talking-points-cheat-sheet)

---

## 1. Pre-Demo Setup

### What This Application Is

The **VF Intelligence Platform** is an AI-powered healthcare intelligence system built for the **Virtue Foundation**. It processes 987 raw facility records (deduplicated to 797 unique facilities) across Ghana's 16 regions to:

- **Identify medical deserts** — regions where critical healthcare services are absent
- **Parse unstructured data** — extract structured capabilities from messy, free-form text
- **Enable geospatial reasoning** — find nearest facilities, calculate distances, detect coverage gaps
- **Support strategic planning** — help NGO planners allocate resources where they matter most
- **Ensure data integrity** — detect anomalies, flag suspicious claims, measure data completeness

### Starting the Application

**1. Start the Backend**

```bash
cd backend
pip install -r requirements.txt
python main.py
```

The backend runs on `http://localhost:8000`. On startup it will:
- Load the Ghana facilities CSV (987 raw records → 797 unique after deduplication)
- Build a FAISS vector index for semantic search
- Normalize region names to Ghana's 16 official regions
- Geocode facilities using city/region coordinates
- Compute region statistics and the medical desert matrix (identifies 67 critical gaps)
- Detect anomalies across all facilities using rule-based checks
- Log a summary (total facilities, regions, anomalies found)

**2. Start the Frontend**

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

**3. Verify Environment Variables** (backend `.env`)

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Powers the AI chat, IDP extraction, and query classification |
| `ELEVENLABS_API_KEY` | Enables voice input/output (text-to-speech, speech-to-text) |
| `ELEVENLABS_VOICE_ID` | Specific voice for TTS |
| `FRONTEND_URL` | CORS configuration |

**4. Pre-Demo Warm-Up**

Before the live demo:
- Visit `http://localhost:8000/health` — verify system status
- Visit `http://localhost:5173` — verify Command Center loads
- **Make one test query** in the chat to warm up the OpenAI connection (first call is always slower)
- Open each page once to verify data loads correctly

---

## Scene 1: Opening — The Problem (~2 minutes)

### What to Say

> "By 2030, the world will face a shortage of over 10 million healthcare workers. The problem isn't that expertise doesn't exist — it's that it isn't intelligently coordinated. Skilled doctors remain disconnected from the hospitals and communities that urgently need them."
>
> "This is a real challenge faced by the Virtue Foundation. They have data — nearly a thousand facility records from Ghana — but it's messy, unstructured, and incomplete. Free-form text fields with inconsistent formatting. Duplicate entries. Region names that don't match. Equipment claims that contradict capability claims."
>
> "We built the VF Intelligence Platform to solve this. It's an AI-powered intelligence layer for healthcare that can reason over this real-world data — 987 facility records across Ghana's 16 regions — to understand where care truly exists, where it's missing, and what to do about it."
>
> "Let me show you everything it can do."

### What to Show

- Open the application at the **Command Center** (`/`)
- Let the audience take in the full layout:
  - **Left**: AI chat panel with suggested queries
  - **Center**: Interactive Leaflet map of Ghana with facility markers already plotted (color-coded by type)
  - **Right**: Regional health overview with capability metrics
- Point out that facility markers are already visible on the map — all 797 unique facilities were loaded, deduplicated, geocoded, and indexed on startup
- Briefly hover over a few facility markers to show the popup summaries

---

## Scene 2: Command Center — AI Chat Agent (~6 minutes)

> **Hackathon criteria covered:** Technical Accuracy (35%), User Experience (10%)
>
> **Features shown:** Supervisor Agent, Vector Search, Geospatial Calculations, Row-level Citations, Agentic-step-level Citations, Voice Output, Map Visualization

### 2.1 — Medical Desert Detection (Primary Query)

**What to do:** Click on the suggested query or type:

> `"Which regions lack emergency care facilities?"`

**Wait for the response to appear, then walk through everything:**

**A) The AI Answer**

- Read out the key findings — the agent identifies specific regions, cites exact facility counts, and names concrete facilities
- Point out that this isn't a canned response — it's generated from the actual data in real-time

**B) Source Citations (Row-Level)**

- Expand the **Sources** section below the response
- Show that each cited facility has **row-level evidence** including:
  - Facility ID (the actual `pk_unique_id` from the dataset)
  - Facility name and region
  - Evidence fields: direct quotes from description, capability, procedure, equipment, and specialty columns
- Say: "Every claim the AI makes is backed by specific rows in the dataset. You can verify any answer by checking the original data."
- This satisfies the **row-level citation stretch goal**

**C) Agent Trace — The Pipeline (The Killer Feature)**

- **Click "Agent Trace (3 steps)"** to expand
- Walk through each step slowly:
  - **Step 1 — Supervisor Agent**: Shows that the query was classified as `medical_desert`. Shows the extracted filters (region, facility_type, capability, specialty). Shows `duration_ms` for this step.
  - **Step 2 — Medical Reasoning Agent**: Shows the data sources used: `faiss_index`, `facility_database`, `desert_matrix`. Shows per-step citations — specific facility IDs and region labels that were retrieved. Shows how many facilities were found and how many desert entries were pulled.
  - **Step 3 — Response Generator**: Shows the context size (chars of data fed to GPT), response length, and output citations linking back to specific facilities.
- Say: "This is agentic-step-level citation — a stretch goal from the challenge. Most teams can show you an answer. We can show you exactly which data informed each step of the AI's reasoning, which agent handled it, and how long it took."

**D) Voice Output**

- **Click "Listen"** on the response to play TTS via ElevenLabs
- Let it play for a few seconds so the audience hears the natural voice
- Say: "Text-to-speech using ElevenLabs — we'll show more voice features later."

### 2.2 — Regional Comparison

**Type:**

> `"Compare healthcare coverage between Greater Accra and Northern region"`

**Wait for response, then point out:**

- The Supervisor classified this as a `comparison` query — a different category from the previous one
- The response highlights specific disparities: facility counts, capability differences, specialist availability, data completeness differences
- It cites concrete facility names from both regions
- The map updates to show the relevant regions
- Expand the Agent Trace again briefly to show the pipeline handled this differently — different data sources, different context gathered
- This demonstrates VF Questions **1.5**, **7.6** (Must Have)

### 2.3 — Geospatial Query

**Type:**

> `"What is the nearest hospital to Tamale with surgical capability?"`

**Wait for response, then point out:**

- The Supervisor routes this to the **Geospatial Agent** (visible in Agent Trace Step 2)
- The system performs **Haversine distance calculations** to find the nearest facilities
- Results appear both in the chat answer AND on the map — markers update to show relevant facilities
- The **Geospatial Results Panel** appears showing facilities ranked by distance in kilometers
- Each facility shows: name, type, distance, capabilities
- This demonstrates VF Question **2.1** (Must Have) — "How many hospitals treating [condition] are within [X] km of [location]?"

### 2.4 — Anomaly Detection

**Type:**

> `"Which facilities have suspicious capability claims?"`

**Wait for response, then point out:**

- The **Anomaly Detection Agent** is invoked (visible in Agent Trace)
- The response flags facilities with specific mismatches:
  - Clinics claiming surgical capabilities without supporting equipment
  - "Unusually high specialty count for facility size"
  - Imaging claims without imaging equipment listed
  - Procedure-equipment contradictions
- Each flagged facility is cited with its ID and region
- This addresses VF Questions **4.4**, **4.8**, **4.9** (all Must Have)
- Say: "These aren't just keyword searches — the system applies medical reasoning to detect claims that don't add up."

### 2.5 — Cold Spot Detection

**Type:**

> `"Where are the largest geographic cold spots where emergency care is absent?"`

**Wait for response, then point out:**

- The system identifies regions geographically far from emergency care
- Map updates to show **medical desert zones** as colored circles
- The response names specific regions and explains why they qualify as cold spots
- This directly addresses VF Question **2.3** (Must Have)

### 2.6 — Resource Recommendation

**Type:**

> `"Where should we deploy a mobile MRI unit?"`

**Wait for response, then point out:**

- The Supervisor classifies this as a `recommendation` query
- The Medical Reasoning Agent pulls from the desert matrix and region statistics
- The answer provides a ranked list of regions with reasoning: imaging gaps, population size, existing infrastructure
- Say: "This is actionable intelligence. A planner can take this answer and begin planning a deployment immediately."

### 2.7 — Regional Overview Panel

**While still on the Command Center**, draw attention to the **right panel**:

- **Region selector dropdown** — select a region to see its specific stats
- **Capability coverage metrics** — what percentage of capabilities are covered
- **Data completeness stats** — how reliable is the data for this region
- **Anomaly rates** — how many facilities have flagged issues
- **Critical gaps** — specific capabilities missing in this region
- **Region list** with medical desert indicators (red badges)

Say: "This panel gives planners instant context about any region without even asking a question."

---

## Scene 3: IDP Agent — Intelligent Document Parsing (~5 minutes)

> **Hackathon criteria covered:** IDP Innovation (30%), Technical Accuracy (35%)
>
> **Features shown:** Unstructured Feature Extraction (Core MVP), Intelligent Synthesis (Core MVP), Confidence Scoring, Anomaly Detection, Schema Alignment, Agent Trace, JSON Export

### What to Say (Transition)

> "Now let me show you the heart of this challenge — Intelligent Document Parsing. The Virtue Foundation's data has columns like 'capability', 'procedure', and 'equipment' that are free-form text. Messy, inconsistent, sometimes contradictory. Our IDP agent turns this into structured, confidence-scored, actionable intelligence."

### 3.1 — Show the Schema First

**Navigate to the IDP Agent** page (`/idp`).

**Click "View Schema"** to show the Pydantic model.

**What to point out:**
- The extraction schema is aligned with the **Virtue Foundation's own schema documentation** (the `Virtue Foundation Scheme Documentation.pdf`)
- Every field has:
  - Type constraints (string, boolean, float, list)
  - Validation rules
  - Clear descriptions
- The schema covers: facility classification, 12 capability categories, equipment, procedures, workforce indicators, anomalies, data quality
- Say: "This isn't ad-hoc extraction. The schema matches the VF's own data model — the output can be directly integrated into their systems."

### 3.2 — Select a Demo Facility

**Select "National Cardiothoracic Centre"** from the facility dropdown.

> This facility was chosen because it has rich, complex free-form text across all fields — ideal for demonstrating the full power of IDP extraction.

### 3.3 — Run Extraction

**Click "Run Extraction"** and wait for results.

While waiting, say: "The IDP agent is now sending the raw facility record to GPT-4o-mini with our specialized extraction prompt. It's analyzing every text field, cross-referencing claims, assigning confidence scores, and detecting anomalies."

### 3.4 — Side-by-Side Comparison (The Money Shot)

**Once results appear, point out the two panels:**

**Left Panel — Raw CSV Data:**
- Show the raw text in the capability field — point out the messy formatting, abbreviations, inconsistent structure
- Show the procedure field — a jumbled list with varying levels of detail
- Show the equipment field — some items clearly stated, others vague
- Say: "This is what the Virtue Foundation is working with. Hundreds of facilities, all with data like this. No human team can manually parse and standardize all of it."

**Right Panel — Structured Extraction:**
- Clean, categorized output with clear sections
- Every piece of data has been classified, scored, and organized

### 3.5 — Extracted Data Tab (Deep Dive)

**Walk through each section of the extraction:**

**A) Facility Classification:**
- **Primary type**: hospital / clinic / diagnostic_center / pharmacy / other
- **Service level**: primary / secondary / tertiary / specialized
- **Ownership**: government / private / NGO / faith_based / unknown
- Point out that this was inferred from the text, not from a structured field

**B) Capability Matrix (12 categories):**

Walk through a few categories to show the depth:

| Category | Fields | What to Show |
|---|---|---|
| Emergency Care | available, details, confidence | Whether the facility can handle emergencies, specific details, and how sure the AI is |
| Surgery | available, types[], confidence | Types of surgery offered, confidence level |
| Maternal/Obstetric | available, details, confidence | Prenatal, delivery, postnatal services |
| Cardiology | available, details, confidence | Especially relevant for the National Cardiothoracic Centre |
| Imaging/Radiology | available, types[], confidence | What imaging modalities are available |

- Point out the **confidence scores** (0.0 to 1.0): "A confidence of 0.95 means the text explicitly states this capability. A confidence of 0.4 means it was inferred from indirect evidence. This is critical — planners need to know what they can trust."
- Show a capability with high confidence AND one with low confidence to illustrate the difference

**C) Equipment List:**
- Each item has three fields:
  - `name`: the equipment identified
  - `status`: **confirmed** (explicitly stated in text), **inferred** (implied by procedures mentioned), or **unknown**
  - `source_text`: the exact text from the raw data that the AI used
- Point out the source text links — "You can trace every extraction back to the original text"

**D) Procedures:**
- Each procedure has: name, category, confidence score, source text
- Show how procedures are categorized (surgical, diagnostic, therapeutic, etc.)

**E) Workforce Indicators:**
- `has_specialists`: boolean
- Whether staff appears to be visiting vs. permanent
- This addresses VF Questions in Category 6 (Workforce Distribution)

### 3.6 — Anomaly Detection within IDP

**Scroll to the Anomalies section.**

**What to point out:**
- The IDP agent flags **inconsistencies within the facility's own data**:
  - Claims surgical capability but lists no surgical equipment
  - Unusually broad specialty claims for the facility size
  - Equipment claims that don't match stated procedures
  - Capability claims without supporting infrastructure signals
- Each anomaly has:
  - A **severity level** (high, medium, low)
  - A **detailed explanation** of why it was flagged
  - Reference to the specific fields that conflict
- Say: "This isn't just extraction — it's validation. The agent cross-checks claims against each other and flags anything suspicious."
- This directly supports VF Questions **3.1**, **4.3**, **4.4**, **4.6**, **4.8**, **4.9**

### 3.7 — Agent Reasoning Trace

**Switch to the Agent Trace tab.**

**What to point out:**
- The full extraction pipeline is visible step by step:
  1. **Text Analysis**: Parse free-form fields, identify key medical terms
  2. **Capability Extraction**: Map terms to the 12 capability categories
  3. **Equipment Matching**: Cross-reference equipment claims with procedure requirements
  4. **Anomaly Detection**: Flag mismatches and suspicious patterns
  5. **Confidence Scoring**: Assign scores based on evidence strength
- Each step cites **which specific text from the raw data it used**
- Say: "This is agentic-step-level citation for the IDP process. If a judge asks 'why did the AI say this facility has cardiology?', we can point to the exact step, the exact source text, and the confidence score."

### 3.8 — Export

**Click "Export JSON"** to download.

**What to point out:**
- The full structured extraction is exportable as clean JSON
- The JSON matches the Pydantic schema shown earlier
- Ready for downstream integration: databases, APIs, dashboards, or feeding into other AI systems
- Enables bulk processing — you could run this on all 797 facilities to build a complete structured database

---

## Scene 4: Strategic Planner — Bridging the Gaps (~5 minutes)

> **Hackathon criteria covered:** Social Impact (25%), User Experience (10%)
>
> **Features shown:** Planning System (Core MVP), Medical Desert Matrix, Deployment Plan Builder, AI Recommendations, Plan History, Export

### What to Say (Transition)

> "Identifying problems is only half the battle. The challenge brief specifically asks for a planning system that is 'easily accessible and could get adopted across experience levels and age groups.' Our Strategic Planner translates data insights into concrete deployment plans."

### 4.1 — Stats Cards Overview

**Navigate to the Strategic Planner** page (`/planner`).

**Point out the stats cards at the top:**
- **Surgical Capacity Deficit**: How many regions lack surgical services
- **Critical Capability Gaps**: Total number of critical (zero-facility) gaps across all regions and capabilities
- **Maternal Health Gap**: How many regions lack maternal/obstetric care
- **Pediatric Care Coverage**: Coverage percentage for pediatric services

Say: "These numbers are computed from the real data, not hardcoded. They update if the underlying dataset changes."

### 4.2 — Medical Desert Matrix (The Core Visualization)

**Point out the matrix:**
- **16 rows** = Ghana's 16 regions (after normalization)
- **10 columns** = capability categories (Emergency Care, Surgery, Maternal/Obstetric, Pediatrics, Internal Medicine, Dental, Infectious Disease, Cardiology, Imaging/Radiology, Laboratory)
- Each cell shows the **count** of facilities in that region with that capability
- Color coding:
  - **Red (0)** = **Medical desert** — zero facilities have this capability
  - **Orange (1-2)** = **Underserved** — fragile coverage, one facility closure away from a desert
  - **Green (3+)** = **Adequate** — reasonable coverage

**Call out the key number:**

> "There are **67 critical red zeros** in this matrix. That's 67 region-capability combinations where patients have zero access. Every red cell represents a population that cannot get the care they need."

**Hover over specific cells** to show the tooltip with details.

**Point out regional patterns:**
- Some regions (like Greater Accra) are mostly green — well-covered
- Some regions (like Upper East, Upper West, Savannah) have many red cells — severely underserved
- Even well-covered regions may have specific gaps (e.g., no cardiology in an otherwise well-served region)

### 4.3 — One-Click Plan Creation from the Matrix

**Click on a red cell** — for example, Surgery in the Upper East Region.

**What happens:**
- The **Deployment Plan Builder** panel activates on the right
- The **region** and **capability gap** are auto-populated from the cell you clicked

**Walk through the 4-step wizard:**

**Step 1 — Scope:**
- Region and capability gap are pre-filled
- Add a title: "Emergency Surgical Capability — Upper East"
- Set priority: Critical / High / Medium / Low
- Say: "The planner doesn't have to figure out what to plan for — the matrix tells them exactly where the gap is."

**Step 2 — Assets:**
- Select resources to deploy:
  - Mobile surgical unit
  - Specialist team (surgeons, anesthesiologists)
  - Equipment packages (surgical instruments, sterilization, anesthesia)
  - Support infrastructure (power, water, communications)
- Say: "These are the building blocks of a deployment. The planner selects what they have available."

**Step 3 — Actions:**
- Define concrete steps:
  - Site assessment and partner identification
  - Partnership agreements with existing facilities
  - Staff training and certification
  - Community outreach and awareness
  - Supply chain setup
  - Monitoring and evaluation plan
- Say: "Every plan has actionable next steps — this isn't a wish list, it's a work plan."

**Step 4 — Review:**
- Full plan summary with all details
- Add any additional notes

**Click "Save Plan"** to create the plan.

### 4.4 — AI Recommendations

**Scroll to the AI Recommendations panel.**

**What to point out:**
- The system generates **priority-ranked recommendations** based on the data
- Each recommendation includes:
  - The **region** and **capability gap**
  - **Estimated population impact** — how many people are affected
  - **Suggested resource type** — what kind of deployment would address the gap
  - **Priority score** — data-driven ranking

**Click "Approve"** on a recommendation.

**What happens:**
- The recommendation is converted into a plan and saved to Plan History
- Say: "One-click plan generation. A non-technical NGO planner can create an actionable deployment plan in under a minute."

**Click "Edit"** on another recommendation to show that planners can customize before approving.

### 4.5 — Plan History

**Point out the Plan History sidebar:**
- All saved plans appear with timestamps
- Plans can be viewed, updated, or deleted
- Say: "This creates organizational memory. Plans aren't lost when a team member leaves or a meeting ends. The Virtue Foundation can track what's been planned, what's in progress, and what's been completed."

### 4.6 — Export

**Click "Export Dataset"** to download the full analysis.

**What to point out:**
- The export includes the complete desert matrix, recommendations, and saved plans
- The **Gap Resolution Summary** is computed from real data, not hardcoded
- This can be shared with stakeholders, included in grant applications, or used for inter-organizational coordination

**Key Talking Point:**

> "The challenge asked for a planning system 'easily accessible across experience levels and age groups.' Our wizard guides users step-by-step. The matrix gives visual context — anyone can understand red means 'no access.' The AI provides intelligent defaults so planners don't start from a blank page. And everything is exportable for offline use."

---

## Scene 5: Facility Explorer — Search & Discovery (~4 minutes)

> **Hackathon criteria covered:** Technical Accuracy (35%), User Experience (10%)
>
> **Features shown:** Vector Search with Filtering, Semantic Search, Map Visualization, Facility Detail, Cross-Navigation to IDP

### What to Say (Transition)

> "Let me show you how planners can explore the facility data directly — searching by meaning, not just keywords."

### 5.1 — Semantic Search

**Navigate to the Facility Explorer** page (`/explorer`).

**Type in the search bar:**

> `"maternal healthcare"`

**Wait for results, then point out:**

- This uses **FAISS semantic search** with sentence-transformer embeddings, not keyword matching
- It finds facilities even if they use completely different terminology: "obstetrics", "prenatal", "delivery", "midwifery", "antenatal"
- The results are ranked by **semantic similarity** — most relevant facilities first
- Each result card shows:
  - Facility name, type, region
  - **Data completeness badge** (color-coded: green, amber, red)
  - Key specialties listed
  - Anomaly indicator if the facility has flagged issues
- Stats bar at the top shows: total facilities found, anomalies detected, medical desert count for matching results

### 5.2 — Try Another Search

**Clear and type:**

> `"facilities that can handle trauma and emergency cases"`

**Point out:**
- Different results from the previous search — the semantic engine understands this is about emergency medicine, not maternal care
- Facilities with "emergency", "trauma", "accident and emergency", "casualty" all surface even though those exact words weren't in the query

### 5.3 — Filtering

**Use the sidebar filters:**

1. **Select Facility Type**: Hospital
   - Results and map update in real-time
   - Only hospitals are shown now

2. **Select Region**: Ashanti Region
   - Results narrow further to hospitals in Ashanti only
   - Map zooms/filters to show only matching facilities

3. **Toggle "Anomalies Only"**
   - Shows only facilities with detected anomalies
   - Say: "A planner might use this to audit suspicious facilities in a specific region."

**Point out:**
- **Active filter chips** appear showing what's currently filtered
- Filters and search combine — you can do semantic search within a filtered subset
- The map on the right updates in real-time to show only matching facilities with appropriate markers

### 5.4 — Facility Detail Modal

**Click "View Details"** on a facility card.

**Walk through the detail panel:**
- **Basic info**: Name, type, operator type, region, city
- **Specialties**: Listed with badges
- **Capabilities**: What the facility can do
- **Procedures**: What specific procedures are offered
- **Equipment**: What equipment is available
- **Anomalies**: Any flagged issues with explanations
- **Data Completeness**: Progress bar showing what percentage of fields are filled

### 5.5 — Cross-Navigation to IDP

**In the facility detail modal, click "Run IDP Extraction".**

**What happens:**
- The app navigates directly to the IDP Agent page (`/idp`) with this facility pre-selected
- The extraction can be run immediately

Say: "Every view is connected — search, explore, drill into detail, and extract structured data. This is how a planner would naturally investigate a facility. They don't have to copy-paste IDs between pages."

### 5.6 — Map Interaction

**Go back to the Facility Explorer. Click facility markers on the map.**

**What to point out:**
- **Popup** shows facility summary (name, type, region, key specialties)
- **Desert zones** displayed as colored circles on the map
- **Region polygons** show coverage areas
- Map and list are **linked** — clicking a facility in either view highlights it in both
- You can zoom and pan to explore geographically

---

## Scene 6: Data Integrity — Trust the Data (~3 minutes)

> **Hackathon criteria covered:** Technical Accuracy (35%)
>
> **Features shown:** Data Processing Pipeline, Deduplication, Region Normalization, Anomaly Detection, Field Completeness, Data Quality Metrics

### What to Say (Transition)

> "Before you trust any AI system's conclusions, you need to trust the underlying data. Our Data Integrity dashboard provides full transparency into everything our pipeline does to the raw data before any AI model touches it."

### 6.1 — Overview Stats

**Navigate to the Data Integrity page** (`/data-integrity`).

**Point out the stats cards — call out the specific numbers:**

- **987 raw records** loaded from the Virtue Foundation's Ghana CSV
- **797 unique facilities** after deduplication — **190 duplicates resolved** automatically by matching on `pk_unique_id`
- **Average data completeness** percentage across all facilities
- **Total anomalies** detected by rule-based checks

Say: "190 duplicates in 987 records — that's almost 20% of the data. Without deduplication, every analysis would be inflated. Our pipeline catches this automatically."

### 6.2 — Field Completeness Analysis

**Scroll to the Field Completeness section.**

**What to point out:**
- Progress bars for each field showing completion percentage
- Color coded: **green** (>70%), **amber** (40-70%), **red** (<40%)
- **High completeness fields**: name, region, facility type — near 100%
- **Medium completeness**: specialties, contact info — varies
- **Lower completeness**: equipment, procedures, capacity — these are the free-form fields that need IDP extraction
- Say: "This tells planners which data they can rely on and which needs additional collection or IDP extraction. A region that shows no surgical capability might just have incomplete data — this context is critical."

### 6.3 — Region Completeness

**Scroll to the Region Completeness section.**

**What to point out:**
- Per-region data quality metrics
- Some regions have rich, detailed data; others are sparse
- This is important context for medical desert analysis:
  - A red cell in the desert matrix could mean "no capability exists" OR "we don't have data"
  - Data completeness helps distinguish between the two
- Say: "Region completeness is the meta-data about the data. It tells you how much you can trust the desert matrix for each region."

### 6.4 — Region Normalization Log

**Scroll to the Region Normalization table.**

**What to point out:**
- The raw dataset has **inconsistent region names**: abbreviations, old names, misspellings, variations
- The system automatically normalizes to Ghana's **16 official regions**
- Show specific examples:
  - "Brong Ahafo" → "Bono Region" (old region name)
  - "Northern Region" variants consolidated
  - Abbreviations expanded
- Status indicators show which normalizations were applied and how many records were affected
- Say: "Without normalization, you'd have 30+ 'regions' instead of 16. Aggregation, comparison, and desert analysis would all be wrong."

### 6.5 — Anomaly Detection Report

**Scroll to the Detected Anomalies section.**

**What to point out:**
- Full list of flagged facilities with detailed anomaly descriptions
- **Categories of anomalies** the pipeline detects:
  - **Capability Mismatches**: Clinics claiming surgical capabilities they likely can't support
  - **Equipment Gaps**: Facilities claiming imaging/radiology without listing any imaging equipment
  - **Overstatement**: Unusually high specialty counts relative to facility size (e.g., a small clinic claiming 15 specialties)
  - **Procedure-Equipment Mismatches**: Procedures listed that require equipment not mentioned
- Each anomaly shows:
  - The facility name and region
  - The specific rule that was triggered
  - A description of the mismatch
- Say: "These are rule-based checks, not AI hallucinations. Each rule implements domain knowledge — a clinic shouldn't claim to do cardiac surgery without an operating room. This supports VF Questions 3.1, 4.3, 4.4, 4.8, and 4.9."

### 6.6 — Duplicate Resolution Stats

**Point out the deduplication statistics:**
- Total duplicates found
- Method used (matching on `pk_unique_id`)
- Records merged vs. removed
- Say: "Deduplication happened before anything else in the pipeline. Every subsequent analysis — region stats, desert matrix, anomaly detection — operates on clean, unique records."

---

## Scene 7: Voice Interface & Accessibility (~2 minutes)

> **Hackathon criteria covered:** User Experience (10%)
>
> **Features shown:** Speech-to-Text (ElevenLabs Scribe v2), Text-to-Speech (ElevenLabs), Accessibility

### What to Say (Transition)

> "In healthcare settings across Ghana, not every user will be at a desk with a keyboard. Community health officers, field workers, and planners at all experience levels need to use this system. Voice input and output make that possible."

### 7.1 — Voice Input (Speech-to-Text)

**Go to the Command Center** (`/`).

**Click the microphone button** next to the chat input.

**Speak clearly into the microphone:**

> "Show me hospitals in the Greater Accra region"

**What to point out:**
- The speech is converted to text via **ElevenLabs Scribe v2** (speech-to-text API)
- The transcribed text appears in the input field
- It's then processed through the same agent pipeline — Supervisor → Specialized Agent → Response Generator
- The response appears just like a typed query
- Say: "The entire platform is voice-accessible. A field worker can ask questions verbally and get answers without typing a single character."

### 7.2 — Voice Output (Text-to-Speech)

**Click "Listen"** on the response to hear it read aloud.

**What to point out:**
- The response is read by **ElevenLabs TTS** with a natural, clear voice
- Not a robotic text-to-speech — it's a high-quality voice model

**Enable the "Auto-Read" toggle:**
- All future responses will be automatically read aloud
- Say: "With auto-read enabled, the system becomes fully hands-free. Ask a question by voice, hear the answer by voice."

### 7.3 — Accessibility for Non-Technical Users

**Point out other UX features that support accessibility:**
- **Suggested queries**: Users don't need to know what to ask — example queries are provided by category
- **Natural language**: No SQL, no technical syntax — just type or speak a question in plain English
- **Visual indicators**: Color-coded badges, progress bars, and map markers are intuitive without training
- **Wizard-based planning**: The Strategic Planner's 4-step wizard guides users through plan creation
- **One-click actions**: Approve recommendations, export data, run IDP — minimal clicks required

Say: "The challenge brief asked for a planning system 'accessible across experience levels and age groups.' Voice, natural language, visual design, and guided wizards work together to make this usable by anyone — from a data scientist to a community health volunteer."

---

## Scene 8: Technical Architecture Walkthrough (~3 minutes)

> **Hackathon criteria covered:** Technical Accuracy (35%), IDP Innovation (30%)
>
> This scene is for judges who want to understand what's under the hood. You can verbally walk through this or show the code briefly.

### What to Say

> "Let me walk through the technical architecture that powers everything you've seen."

### 8.1 — Multi-Agent System

- **Supervisor Agent**: Receives every user query. Uses GPT-4o-mini to classify it into one of 6 categories: `basic`, `geospatial`, `anomaly`, `medical_desert`, `comparison`, `recommendation`. Extracts filters (region, facility_type, capability, specialty). Routes to the appropriate specialized agent.
- **Query Agent**: Handles basic lookups and facility count queries
- **Geospatial Agent**: Performs Haversine distance calculations, finds nearest facilities, detects geographic cold spots (areas far from critical services)
- **Anomaly Detection Agent**: Retrieves and analyzes flagged facilities with rule-based anomaly data
- **Medical Reasoning Agent**: Analyzes the medical desert capability matrix, generates resource allocation recommendations
- **Response Generator**: Takes the gathered context and synthesizes a natural language answer using GPT-4o-mini, including row-level citations and visualization hints (map, heatmap, chart)

### 8.2 — RAG Pipeline

- **Retrieval**:
  - FAISS vector index built with **sentence-transformer embeddings** (`all-MiniLM-L6-v2`)
  - Each facility is converted to searchable text: name, type, location, specialties, capabilities, procedures, equipment, description
  - Semantic search returns top-k most relevant facilities
  - Also supports metadata-based filtering (region, type)
- **Augmentation**:
  - Context enriched with: facility details, region statistics, medical desert matrix, geospatial calculations
  - Context truncated at 8000 chars to stay within token limits
- **Generation**:
  - GPT-4o-mini synthesizes the response with a specialized system prompt
  - Output includes: answer text, source citations with evidence, visualization hint

### 8.3 — Data Processing Pipeline (9 Steps)

1. **Load** the Ghana facilities CSV (987 raw records)
2. **Parse** JSON array fields (specialties, capabilities, procedures, equipment)
3. **Deduplicate** by `pk_unique_id` (987 → 797 unique, 190 duplicates resolved)
4. **Normalize** region names to Ghana's 16 official regions using a mapping dictionary
5. **Geocode** facilities using city/region coordinate lookup with jitter for map display
6. **Calculate** data completeness scores per facility (field-by-field analysis)
7. **Detect** anomalies using rule-based checks (capability-equipment mismatches, overstatement, size inconsistencies)
8. **Build** capability coverage matrix (16 regions × 10 capabilities → identifies 67 critical gaps)
9. **Create** FAISS vector index for semantic search using sentence-transformers

### 8.4 — IDP Engine Architecture

- **Model**: OpenAI GPT-4o-mini with a specialized system prompt derived from the VF's schema documentation
- **Input**: Raw facility record (all CSV columns)
- **Processing**:
  - Structured extraction into 12 capability categories with boolean available, string details, float confidence
  - Equipment extraction with status tagging (confirmed / inferred / unknown) and source text linking
  - Procedure extraction with categorization and confidence scoring
  - Workforce indicator extraction
  - Cross-validation: equipment claims checked against procedure requirements
  - Anomaly detection: internal consistency checks
- **Output**: Pydantic-validated JSON matching the VF schema
- **Caching**: Results cached to avoid re-processing the same facility

### 8.5 — Voice Architecture

- **Speech-to-Text**: ElevenLabs Scribe v2 API — audio recorded in browser, sent to backend, transcribed
- **Text-to-Speech**: ElevenLabs TTS API — response text sent to backend, audio stream returned to browser

### 8.6 — Tech Stack Summary

| Layer | Technology |
|---|---|
| LLM | OpenAI GPT-4o-mini |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) |
| Vector Store | FAISS (Inner Product / cosine similarity) |
| Agent Orchestration | Custom Supervisor (inspired by LangGraph patterns) |
| Backend | FastAPI (Python 3.10+) |
| Frontend | React 19 + TypeScript + Vite |
| Maps | Leaflet / React-Leaflet |
| Charts | Recharts |
| Styling | TailwindCSS 4.0 |
| Voice | ElevenLabs (TTS + STT) |
| Data Fetching | TanStack React Query + Axios |
| Deployment | Railway (backend) + Vercel (frontend) |

### 8.7 — Deployment

- **Backend**: Deployed to Railway with `Procfile` and `railway.json`
- **Frontend**: Deployed to Vercel with `vercel.json`
- **Live URLs**: Available for judges to test independently

---

## Scene 9: Closing — Impact & Vision (~2 minutes)

### What to Say

> "Let me recap everything we've shown you and why it matters."
>
> "We started with the problem: the Virtue Foundation has nearly a thousand healthcare facility records from Ghana — messy, duplicated, incomplete. They need to understand where care exists, where it's missing, and how to allocate resources. That's a planetary-scale coordination challenge."
>
> "Here's what our platform delivers:"
>
> **"1. Understand"** — The AI chat agent answers any question about Ghana's healthcare landscape in natural language, with full citations at every step. The IDP engine extracts structured, confidence-scored insights from messy free-form text. Together, they turn raw data into understanding.
>
> **"2. Discover"** — Medical desert analysis reveals 67 critical gaps across 16 regions where patients cannot access care. Anomaly detection flags suspicious facility claims. Geospatial analysis shows not just what exists, but how far patients have to travel to reach it. Together, they reveal what's truly missing.
>
> **"3. Act"** — The Strategic Planner converts those discoveries into deployment plans. Click a gap, build a plan, approve a recommendation. It's not a dashboard — it's a decision-support tool. Together with Understand and Discover, it closes the loop from data to action.
>
> "The data integrity pipeline ensures all of this is built on trustworthy foundations — deduplicated, normalized, validated data."
>
> "Voice input and output make it accessible to everyone, from data scientists to field workers."
>
> "And the agent trace provides full transparency — you can always see exactly how the AI reached its conclusions."
>
> "Every data point we extract represents a patient who could receive care sooner. Every medical desert we identify is a community that could be reached. Every deployment plan we generate is an action that could save lives."
>
> "Thank you."

---

## Appendix A: Hackathon Requirements Mapping

### Core Features (MVP) — All Implemented

| Requirement | Where in App | How It Works |
|---|---|---|
| **Unstructured Feature Extraction** | IDP Agent (`/idp`) | GPT-4o-mini extracts structured data from free-form capability, procedure, equipment, and description fields with confidence scores |
| **Intelligent Synthesis** | Command Center (`/`), IDP Agent (`/idp`) | Combines unstructured extraction with structured facility schemas; region statistics blend multiple data sources |
| **Planning System** | Strategic Planner (`/planner`) | 4-step wizard with medical desert matrix, AI recommendations, and plan history — accessible across experience levels |

### Stretch Goals — All Implemented

| Stretch Goal | Where in App | How It Works |
|---|---|---|
| **Row-level Citations** | Command Center chat → Sources panel | Each response cites up to 5 facilities with evidence fields (description, capability, procedure, equipment, specialty) |
| **Agentic-step-level Citations** | Command Center chat → Agent Trace, IDP Agent → Agent Trace | Each agent step records input, output, data sources used, and specific citations |
| **Visualize with a Map** | Command Center (map), Facility Explorer (map) | Interactive Leaflet map with facility markers, medical desert zones, region polygons, geospatial result visualization |
| **Real-impact Bonus** | All pages | Addresses 59 VF Agent questions across 11 categories; focuses on Must-Have and Should-Have queries |

### Evaluation Criteria Coverage

| Criterion | Weight | Key Demo Scenes |
|---|---|---|
| **Technical Accuracy** | 35% | Scenes 2, 5, 6, 8 — Must-Have queries answered, anomalies detected, data quality metrics, architecture |
| **IDP Innovation** | 30% | Scene 3 — Full extraction pipeline with confidence scoring, anomaly detection, evidence linking, schema alignment |
| **Social Impact** | 25% | Scenes 1, 4, 9 — Medical desert identification (67 gaps), strategic planning, resource allocation |
| **User Experience** | 10% | Scenes 2, 4, 5, 7 — Natural language, voice I/O, wizard-based planning, cross-navigation, intuitive design |

---

## Appendix B: All 59 VF Agent Questions

Use these during the demo or Q&A to showcase specific capabilities. **Must-Have** queries are highest priority.

### Category 1: Basic Queries & Lookups (6 questions)

| # | Query to Type | Priority |
|---|---|---|
| 1.1 | `How many hospitals have cardiology?` | Must Have |
| 1.2 | `How many hospitals in the Ashanti Region have the ability to perform surgery?` | Must Have |
| 1.3 | `What services does Korle Bu Teaching Hospital offer?` | Must Have |
| 1.4 | `Are there any clinics in Accra that do dental services?` | Must Have |
| 1.5 | `Which region has the most private hospitals?` | Must Have |

### Category 2: Geospatial Queries (4 questions)

| # | Query to Type | Priority |
|---|---|---|
| 2.1 | `How many hospitals treating cardiac conditions are within 50 km of Kumasi?` | Must Have |
| 2.2 | `What areas have known disease prevalence but no facilities treating it within 100km?` | Could Have |
| 2.3 | `Where are the largest geographic cold spots where surgical capability is absent?` | Must Have |
| 2.4 | `What is the service provision gap between urban and rural areas for cardiology?` | Could Have |

### Category 3: Validation & Verification (5 questions)

| # | Query to Type | Priority |
|---|---|---|
| 3.1 | `Which facilities claim to offer surgical services but lack the basic equipment required?` | Should Have |
| 3.2 | `Which facilities have equipment that appears to be temporary rather than permanent?` | Could Have |
| 3.3 | `What percentage of facilities claiming imaging capability show evidence of permanent equipment?` | Could Have |
| 3.4 | `For cataract surgery, what percentage of facilities also list an operating microscope?` | Should Have |
| 3.5 | `Which procedure/equipment claims are most often corroborated by multiple sources?` | Should Have |

### Category 4: Misrepresentation & Anomaly Detection (10 questions)

| # | Query to Type | Priority |
|---|---|---|
| 4.1 | `What correlation exists between website quality and actual facility capabilities?` | Should Have |
| 4.2 | `Which facilities have high bed-to-operating-room ratios indicative of misrepresentation?` | Should Have |
| 4.3 | `Which facilities show abnormal patterns where expected features don't match?` | Should Have |
| 4.4 | `Which facilities claim an unrealistic number of procedures relative to their size?` | Must Have |
| 4.5 | `What physical features correlate with genuine advanced capabilities?` | Should Have |
| 4.6 | `What facilities show mismatches between claimed subspecialties and supporting infrastructure?` | Should Have |
| 4.7 | `What correlations exist between facility size, subspecialties, and equipment sophistication?` | Must Have |
| 4.8 | `Which facilities have unusually high breadth of procedures but minimal equipment?` | Must Have |
| 4.9 | `Where do we see things that shouldn't move together — like large bed counts but minimal surgical equipment?` | Must Have |
| 4.10 | `Do spelling/website quality markers correlate with reliability of claims?` | Won't Have |

### Category 5: Service Classification & Inference (5 questions)

| # | Query to Type | Priority |
|---|---|---|
| 5.1 | `Which procedures appear to be delivered via visiting surgeons rather than permanent staff?` | Could Have |
| 5.2 | `Which facilities suggest they refer patients rather than actually perform procedures?` | Could Have |
| 5.3 | `How often do strong clinical claims appear alongside weak operational signals?` | Could Have |
| 5.4 | `What procedure/equipment combinations co-occur as stable service bundles?` | Could Have |
| 5.5 | `Can we derive a service maturity index from procedure depth and equipment sophistication?` | Won't Have |

### Category 6: Workforce Distribution (6 questions)

| # | Query to Type | Priority |
|---|---|---|
| 6.1 | `Where is the workforce for cardiology actually practicing in Ghana?` | Must Have |
| 6.2 | `What is the ratio of specialists to population in the Northern region?` | Won't Have |
| 6.3 | `Which regions have specialists but unclear information about where they practice?` | Could Have |
| 6.4 | `How many facilities in Ashanti have evidence of visiting specialists vs permanent staff?` | Should Have |
| 6.5 | `What areas show evidence of surgical camps rather than standing services?` | Should Have |
| 6.6 | `Where do signals indicate services are tied to individuals rather than institutions?` | Should Have |

### Category 7: Resource Distribution & Gaps (6 questions)

| # | Query to Type | Priority |
|---|---|---|
| 7.1 | `What is the problem type by region: lack of equipment, training, or practitioners?` | Could Have |
| 7.2 | `What areas have high practitioner numbers but insufficient equipment?` | Could Have |
| 7.3 | `Are there facilities in resource-poor but population-rich areas with high patient volume?` | Could Have |
| 7.4 | `Which regions show the highest prevalence of older legacy equipment?` | Could Have |
| 7.5 | `Which procedures depend on very few facilities — only 1 or 2 offering the service?` | Must Have |
| 7.6 | `Where is there oversupply of low-complexity procedures vs scarcity of high-complexity ones?` | Must Have |

### Category 8: NGO & International Organization Analysis (4 questions)

| # | Query to Type | Priority |
|---|---|---|
| 8.1 | `Which regions have multiple NGOs providing overlapping services?` | Should Have |
| 8.2 | `What facilities show evidence of coordination vs competition between organizations?` | Could Have |
| 8.3 | `Where are there gaps in coverage where no organizations are currently working despite evident need?` | Must Have |
| 8.4 | `Where do we see evidence that periodic NGO activity substitutes for permanent capacity?` | Could Have |

### Category 9: Unmet Needs & Demand Analysis (6 questions)

| # | Query to Type | Priority |
|---|---|---|
| 9.1 | `Which regions would demand specific surgeries per year but lack adequate services?` | Could Have |
| 9.2 | `Which population centers show highest likelihood of unmet surgical need?` | Could Have |
| 9.3 | `What age bracket identifies an underserved area by specialty?` | Could Have |
| 9.4 | `Which regions have age demographics indicating high need for age-related procedures?` | Could Have |
| 9.5 | `Which facility regions serve population areas too large for their stated capabilities?` | Could Have |
| 9.6 | `Where do predicted high-demand procedures have low supply signals?` | Could Have |

### Category 10: Benchmarking & Comparative Analysis (4 questions)

| # | Query to Type | Priority |
|---|---|---|
| 10.1 | `How does the specialist-to-population ratio in Northern region compare to WHO guidelines?` | Could Have |
| 10.2 | `What facilities fall into the sweet spot — high population, some infrastructure, but ignored by development?` | Should Have |
| 10.3 | `Which regions show highest probability of being high-impact intervention sites?` | Should Have |
| 10.4 | `For each specialty, what population bands correlate with highest unmet need?` | Could Have |

### Category 11: Data Quality & Freshness (2 questions)

| # | Query to Type | Priority |
|---|---|---|
| 11.1 | `How quickly do procedure/equipment mentions go stale by region?` | Won't Have |
| 11.2 | `Which claims are corroborated by multiple independent sources?` | Won't Have |

### Summary

| Priority | Count | Status |
|---|---|---|
| **Must Have** | 15 | All handled by the agent pipeline |
| **Should Have** | 14 | Most handled; some require external data |
| **Could Have** | 22 | Many handled with caveats; some need external data |
| **Won't Have** | 4 | Out of scope (would need external data sources) |

---

## Appendix C: Troubleshooting

### Common Issues

| Issue | Solution |
|---|---|
| Backend won't start | Check that `OPENAI_API_KEY` is set in `backend/.env`. Verify Python 3.10+ and all requirements installed. |
| "No facilities loaded" error | Ensure `backend/data/ghana_facilities.csv` exists. Check CSV path in config. |
| Chat returns errors | Verify OpenAI API key is valid and has credits. Check terminal for error logs. |
| Map doesn't render | Ensure frontend can reach backend (CORS configured). Check browser console for Leaflet errors. |
| Voice features don't work | Verify `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in `.env`. Voice is optional — the rest of the app works without it. |
| IDP extraction fails | OpenAI API key required. Check backend logs for specific error messages. |
| Slow startup | Normal — building the FAISS index and computing analytics takes a few seconds on startup. |
| First query is slow | Pre-warm: make a test query before the live demo. Subsequent queries are faster. |

### Key URLs

| URL | Purpose |
|---|---|
| `http://localhost:5173` | Frontend application |
| `http://localhost:8000` | Backend API root (shows system status) |
| `http://localhost:8000/health` | Health check endpoint |
| `http://localhost:8000/docs` | FastAPI Swagger UI — interactive API documentation |

### Deployed Versions

| Service | Platform | Config File |
|---|---|---|
| Backend | Railway | `backend/railway.json`, `backend/Procfile` |
| Frontend | Vercel | `frontend/vercel.json` |

---

## Appendix D: Judge Talking Points Cheat Sheet

> Print this page. Keep it next to you during the demo.

### Technical Accuracy (35%) — What Judges Are Looking For

| What to Highlight | Where to Show It |
|---|---|
| Real FAISS vector search with sentence-transformers | Command Center: type any query, show semantic results |
| Real OpenAI GPT pipeline with 3-step agent trace | Command Center: expand "Agent Trace (3 steps)" |
| Query classification → context gathering → response generation | Agent Trace: Step 1 → Step 2 → Step 3 |
| Row-level citations with facility IDs | Command Center: expand Sources panel |
| Haversine distance calculations | Geospatial query: "nearest hospital to Tamale with surgery" |
| Rule-based anomaly detection | Data Integrity: scroll to Detected Anomalies |
| Data deduplication (987 → 797) | Data Integrity: stats cards |
| Region normalization (16 official regions) | Data Integrity: Region Normalization table |

**If asked "How does the agent pipeline work?":**
> "The Supervisor classifies the query into one of six categories — basic, geospatial, anomaly, medical_desert, comparison, or recommendation. It then routes to a specialized sub-agent that gathers context from our FAISS vector index, facility database, desert matrix, or geospatial service. Finally, the Response Generator synthesizes the answer with GPT-4o-mini, including row-level citations. Every step is traced with data sources and duration."

**If asked "Why not use a single LLM call?":**
> "Three reasons. First, specialized agents are more accurate — the geospatial agent knows to run distance calculations, the anomaly agent knows to pull flagged data. Second, the pipeline provides transparency — you can see exactly what happened at each step. Third, it's extensible — we can add new agent types without rewriting the whole system."

### IDP Innovation (30%) — What Judges Are Looking For

| What to Highlight | Where to Show It |
|---|---|
| GPT-4o-mini structured extraction from free-form text | IDP Agent: run on National Cardiothoracic Centre |
| 12 capability categories with confidence scores | IDP Agent: Extracted Data tab |
| Raw CSV vs structured output (side-by-side) | IDP Agent: left panel vs right panel |
| Equipment status: confirmed / inferred / unknown | IDP Agent: Equipment section |
| Anomaly detection within IDP | IDP Agent: Anomalies section |
| Pydantic schema aligned to VF documentation | IDP Agent: View Schema button |
| Agent reasoning trace for extraction | IDP Agent: Agent Trace tab |
| JSON export for downstream integration | IDP Agent: Export JSON button |

**If asked "How is this different from just prompting GPT?":**
> "Three things. First, confidence scoring — the system assigns a 0-1 confidence to every extraction so planners know what they can trust. Second, cross-validation — equipment claims are checked against procedure requirements to flag inconsistencies. Third, the extraction schema is a Pydantic model aligned to the Virtue Foundation's own schema documentation, ensuring standardized, interoperable output. And we show the full agent trace — every step of the extraction is auditable."

**If asked "Can this scale to thousands of facilities?":**
> "Yes. The IDP engine processes one facility at a time via the API, and results are cached. For bulk processing, you'd batch the requests. The FAISS index already handles semantic search over hundreds of facilities in milliseconds. The data pipeline — deduplication, normalization, geocoding, anomaly detection — runs on the full dataset at startup in seconds."

### Social Impact (25%) — What Judges Are Looking For

| What to Highlight | Where to Show It |
|---|---|
| 67 critical healthcare gaps identified | Strategic Planner: Medical Desert Matrix |
| Medical desert identification across 16 regions | Strategic Planner: red cells in matrix |
| Actionable deployment plans | Strategic Planner: click red cell → 4-step wizard |
| AI recommendations with population impact | Strategic Planner: Recommendations panel |
| Resource allocation guidance | Strategic Planner: Approve → Plan History |
| Data-driven, not guesswork | Data Integrity: all metrics computed from real data |

**If asked "How does this help real people?":**
> "Every red cell in our desert matrix represents a population without access to a critical service. Our system doesn't just identify the gap — it generates a deployment plan with specific resources and actions. For example, clicking 'Surgery — Upper East Region' auto-creates a plan to deploy a mobile surgical unit, identifies partner facilities, and estimates population impact. The Virtue Foundation can take this plan and execute it."

**If asked "What about the 67 critical gaps — is that real?":**
> "Completely real. It's computed by counting how many facilities in each of the 16 regions have each of the 10 capability categories. A zero count in any cell means no facility in that region has that capability — that's a medical desert. 67 of those 160 cells are zero. You can verify by looking at the matrix and counting the red cells."

### User Experience (10%) — What Judges Are Looking For

| What to Highlight | Where to Show It |
|---|---|
| Natural language chat (no SQL, no technical queries) | Command Center: just type a question |
| Voice input and output (ElevenLabs) | Command Center: mic button + Listen button |
| Suggested queries for discoverability | Command Center: suggested query chips |
| Wizard-based planning (4 steps, guided) | Strategic Planner: Deployment Plan Builder |
| One-click plan from matrix cell | Strategic Planner: click red cell |
| Cross-navigation (Explorer → IDP) | Facility Explorer: "Run IDP Extraction" button |
| Interactive map with facility markers | All pages with maps |
| Regional overview panel | Command Center: right panel with region selector |

**If asked "Who is the target user?":**
> "Non-technical NGO planners at the Virtue Foundation. They need to make resource allocation decisions quickly without writing SQL or understanding data schemas. Everything in our interface is natural language, visual, or guided by wizards. Voice input/output extends accessibility to field workers who may not be at a desk. The suggested queries help new users discover what the system can do."

---

### Quick Numbers to Memorize

| Number | What It Means |
|---|---|
| **987** | Raw facility records in the VF Ghana dataset |
| **797** | Unique facilities after deduplication |
| **190** | Duplicates automatically resolved |
| **16** | Ghana regions (normalized from inconsistent names) |
| **10** | Capability categories in the desert matrix |
| **67** | Critical red zeros (medical deserts) in the matrix |
| **160** | Total cells in the matrix (16 regions × 10 capabilities) |
| **12** | IDP extraction capability categories |
| **59** | VF Agent Questions across 11 categories |
| **15** | Must-Have questions (all handled) |
| **3** | Agent pipeline steps (classify → gather → generate) |
| **6** | Query classification categories |

---

### Demo Tips

1. **Pre-warm the backend**: Make a test query before the live demo so the first OpenAI call isn't slow
2. **Have fallback queries ready**: If a query produces an unexpected result, pivot to one of the pre-tested queries from Appendix B
3. **Show the Agent Trace on every query**: This is a differentiator — most teams won't have step-level citation visibility
4. **Emphasize the IDP confidence scores**: This shows the system knows what it's sure about and what it's guessing
5. **Click the matrix**: The strategic planner's click-to-plan interaction from the desert matrix is visually impressive and demonstrates real UX thinking
6. **Use voice**: It's memorable and demonstrates accessibility thinking — don't skip it
7. **Use "National Cardiothoracic Centre"** for IDP — it has the richest data and produces the most impressive extraction
8. **Show the cross-navigation**: Explorer → Detail → Run IDP demonstrates connected UX
9. **Know your numbers**: 987 → 797, 190 duplicates, 67 gaps, 16 regions, 10 capabilities, 12 IDP categories
10. **End on impact**: Always bring it back to patients — "every data point represents a patient who could receive care sooner"
