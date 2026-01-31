# Cognivista QA Intelligence Platform - Complete Architecture

**Generated:** January 31, 2026

> **🔒 SINGLE SOURCE OF TRUTH**: All final severity, priority, and insights originate exclusively from the multi-agent intelligence pipeline defined in [ARCHITECTURE.md](ARCHITECTURE.md). The platform consumes validated outputs and never modifies AI-generated decisions.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Backend Architecture](#backend-architecture)
5. [Agent Pipeline Integration](#agent-pipeline-integration)
6. [Frontend Architecture](#frontend-architecture)
7. [Data Flow & Integration](#data-flow--integration)
8. [Component Interactions](#component-interactions)
9. [API Endpoints](#api-endpoints)
10. [Database Schema](#database-schema)
11. [Real-Time Communication](#real-time-communication)
12. [Live vs Post-Call Path Separation](#live-vs-post-call-path-separation)

---

## Project Overview

**Cognivista** is an enterprise-grade intelligence overlay designed to enhance call center operations without replacing existing infrastructure. It provides:

- **Real-time coaching** during live customer calls
- **Automated QA scoring** with 100% auditability
- **Multi-level intelligence dashboards** for agents, supervisors, and managers
- **AI-powered insights** using Google Gemini 2.x (Flash Lite)
- **Enterprise reliability** with circuit breakers, retries, and PII masking

### Core Value Proposition
Transform raw call transcripts into **actionable intelligence** through a deterministic scoring engine combined with AI-extracted facts, enabling:
- Instant agent nudges during live calls
- Quantifiable coaching effectiveness
- Strategic regional analytics and training ROI

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          COGNIVISTA PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        FRONTEND LAYER (React)                       │  │
│  │                                                                     │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │  │
│  │  │Agent Console │ │Supervisor    │ │Manager       │               │  │
│  │  │(Live Assist) │ │Dashboard     │ │Dashboard     │               │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘               │  │
│  │                                                                     │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │  │
│  │  │Call Detail   │ │Coaching Hub  │ │Strategic     │               │  │
│  │  │View          │ │(Training ROI)│ │Intelligence  │               │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘               │  │
│  │                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────┐ │  │
│  │  │              Cinematic Sidebar Navigation Layout              │ │  │
│  │  │           Theme System + State Management Context             │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                              ↑ ↓ WebSocket/HTTP                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                      API GATEWAY LAYER (FastAPI)                           │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│  │/api/v1/live │ │/api/v1/     │ │/api/v1/     │ │/api/v1/     │         │
│  │(WebSocket)  │ │analysis     │ │simulator    │ │stats        │         │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                          │
│  │/api/v1/sop  │ │/api/v1/audio│ │/metrics     │                          │
│  │(SOP Mgmt)   │ │(Streaming)  │ │(Prometheus) │                          │
│  └─────────────┘ └─────────────┘ └─────────────┘                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                      BUSINESS LOGIC LAYER (Services)                        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    LIVE SERVICE (Real-time Coaching)                │  │
│  │  ┌────────────────────┐      ┌───────────────────────────┐         │  │
│  │  │Connection Manager  │      │NudgeEngine                │         │  │
│  │  │(WebSocket Pool)    │      │- Keyword Triggers        │         │  │
│  │  │                    │      │- LLM Semantic Analysis   │         │  │
│  │  │• connect()         │      │- Broadcast to Supervisors│         │  │
│  │  │• disconnect()      │      │                          │         │  │
│  │  │• broadcast_to_call │      │Hybrid Approach:          │         │  │
│  │  └────────────────────┘      │• Instant (<1ms latency)  │         │  │
│  │                              │• Intelligent (~500ms)    │         │  │
│  │                              └───────────────────────────┘         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │              INGESTION SERVICE (Audio Pipeline)                      │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │  STT Service: Google Gemini Multimodal STT                     │ │  │
│  │  │  • Direct audio-to-text conversion                            │ │  │
│  │  │  • PII Masking on transcripts                                 │ │  │
│  │  │  • Real-time streaming ingestion                              │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │              ANALYSIS SERVICE (Call Intelligence)                    │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │  ⚙️ INVOKES MULTI-AGENT PIPELINE (See ARCHITECTURE.md)        │ │  │
│  │  │  • Pipeline executes as single atomic unit                     │ │  │
│  │  │  • Service does NOT make AI decisions                         │ │  │
│  │  │  • Receives validated JSON output only                        │ │  │
│  │  │  • Stores results to database                                 │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │           SIMULATOR SERVICE (Training & QA Testing)                 │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │  • Generate synthetic customer scenarios                       │ │  │
│  │  │  • Test agent responses                                        │ │  │
│  │  │  • Performance baseline creation                               │ │  │
│  │  │  • Training environment                                        │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│                    INTELLIGENCE LAYER (LLM & Scoring)                       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   LLM GATEWAY (Enterprise Reliability)               │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │  • Circuit Breaker (Open → Half-Open → Closed)                │ │  │
│  │  │  • Exponential Backoff Retries (max 3 attempts)               │ │  │
│  │  │  • Schema Validation & Type Safety                            │ │  │
│  │  │  • Centralized Error Logging & Metrics                        │ │  │
│  │  │  • Structured Output Generation                               │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  │                                ↓                                      │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │        GEMINI CLIENT (Google Gemini 2.x Integration)           │ │  │
│  │  │  • API Key Rotation                                            │ │  │
│  │  │  • Model: gemini-2.5-flash-lite-lite                               │ │  │
│  │  │  • Multimodal Support (text, audio, images)                   │ │  │
│  │  │  • Streaming & Non-streaming modes                            │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │          SCORING ENGINE (Deterministic & Auditable)                  │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │  Input: AI-extracted facts + Call metadata                     │ │  │
│  │  │  Process: Python-based scoring logic                           │ │  │
│  │  │  Output: Deterministic scores + audit trail                   │ │  │
│  │  │                                                                │ │  │
│  │  │  Scoring Dimensions:                                           │ │  │
│  │  │  • Compliance Score (0-100)                                    │ │  │
│  │  │  • Quality Score (0-100)                                       │ │  │
│  │  │  • SOP Adherence (0-100)                                       │ │  │
│  │  │  • Sentiment Management (0-100)                               │ │  │
│  │  │  • Churn Risk (0-100)                                          │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│                         DATA PERSISTENCE LAYER                              │
│                                                                             │
│  ┌────────────────┐        ┌────────────────┐        ┌────────────────┐  │
│  │  PRIMARY DB    │        │   CACHE LAYER  │        │  QUEUE LAYER   │  │
│  │                │        │                │        │                │  │
│  │ SQLite/        │        │   Redis        │        │   ARQ (async)  │  │
│  │ PostgreSQL     │        │                │        │   job queue    │  │
│  │                │        │ • Session data │        │                │  │
│  │ Models:        │        │ • Call cache   │        │ • Background   │  │
│  │ • Calls        │        │ • Scoring      │        │   analysis     │  │
│  │ • Transcripts  │        │   results      │        │ • Batch ops    │  │
│  │ • Scores       │        │ • Metrics      │        │ • Notifications│  │
│  │ • Agents       │        │                │        │                │  │
│  │ • SOPs         │        │ TTL: 24 hours  │        │ Workers on     │  │
│  │ • Coaching     │        │                │        │ schedule       │  │
│  │   Records      │        │                │        │                │  │
│  └────────────────┘        └────────────────┘        └────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Backend Stack
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | FastAPI | High-performance async web framework |
| **Runtime** | Python 3.10+ | Server runtime |
| **ORM** | SQLModel | Type-safe database models |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Persistent data storage |
| **LLM Provider** | Google Gemini 2.x Flash Lite | AI intelligence engine |
| **Cache** | Redis | Session & result caching |
| **Task Queue** | ARQ | Async job processing (lightweight) |
| **Monitoring** | Prometheus | Metrics & observability |
| **API Validation** | Pydantic | Request/response validation |
| **Async Runtime** | AsyncIO + Uvicorn | Concurrent request handling |

### Frontend Stack
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 19 | UI component library |
| **Build Tool** | Vite | Fast bundling & HMR |
| **Styling** | Tailwind CSS + Vanilla CSS | Design tokens & theming |
| **Routing** | React Router v7 | Client-side navigation |
| **Animations** | Framer Motion | Cinematic transitions |
| **Icons** | Lucide React | SVG icon library |
| **Charts** | Recharts | Data visualization (Radar, Bar, Pie) |
| **State** | React Context API | Theme & global state |
| **Communication** | WebSocket + Fetch API | Real-time & REST |

---

## Backend Architecture

### Directory Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI app initialization
│   │
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── live.py              # WebSocket live coaching
│   │           ├── analysis.py          # Call analysis & scoring
│   │           ├── simulator.py         # Training simulator
│   │           ├── stats.py             # Analytics & dashboards
│   │           ├── sop.py               # SOP management
│   │           └── audio.py             # Audio streaming
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                    # Environment settings
│   │   ├── db.py                        # Database engine & sessions
│   │   ├── logging.py                   # Structured logging
│   │   ├── metrics.py                   # Prometheus metrics
│   │   ├── security.py                  # Auth & PII masking
│   │   ├── redis_config.py              # Cache configuration
│   │   ├── scoring.py                   # Deterministic scoring logic
│   │   │
│   │   └── llm/
│   │       ├── __init__.py
│   │       ├── gateway.py               # LLM gateway (circuit breaker)
│   │       └── gemini_client.py         # Google Gemini integration
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── db.py                        # SQLModel definitions
│   │   ├── analysis.py                  # Analysis schemas
│   │   ├── simulator.py                 # Simulator schemas
│   │   └── sop.py                       # SOP schemas
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── live_service.py              # WebSocket & nudge engine
│   │   ├── ingestion_service.py         # Audio ingestion pipeline
│   │   ├── analysis_service.py          # Call analysis service
│   │   ├── simulator_service.py         # Simulator logic
│   │   └── stt_service.py               # Speech-to-text integration
│   │
│   └── tasks/
│       ├── __init__.py
│       └── workers/
│           └── tasks.py                 # Background job definitions
│
├── seeder.py                            # Database initialization
├── reset_db.py                          # Database reset utility
├── test_gateway.py                      # LLM gateway testing
├── verify_model.py                      # Model verification script
└── requirements.txt                     # Python dependencies
```

### Core Components

#### 1. **FastAPI Application** (`main.py`)
```
Responsibility: App initialization, middleware setup, route registration

Components:
├── CORS Middleware (allow_origins=*)
├── Global Exception Handler
├── Startup Event → create_db_and_tables()
├── Health Check Endpoint (/health)
├── Metrics Endpoint (/metrics)
└── Route Inclusion:
    ├── /api/v1/simulator
    ├── /api/v1/analysis
    ├── /api/v1/live
    ├── /api/v1/stats
    ├── /api/v1/sop
    └── /api/v1/audio
```

#### 2. **LLM Gateway** (`core/llm/gateway.py`)
```
Responsibility: Enterprise reliability wrapper for all LLM calls

Pattern: Circuit Breaker + Exponential Backoff

States:
├── CLOSED (operational) → allows requests
├── OPEN (failure threshold exceeded) → blocks requests for 60s
└── HALF-OPEN (recovery attempt) → tries single request

Features:
├── Failure Tracking
├── Max Retry Logic (3 attempts)
├── Structured Output Generation
├── Schema Validation
├── Metrics Tracking
└── Error Logging

Flow:
1. Check circuit state
2. Attempt LLM call (with threading for non-blocking)
3. On success: record success, return result
4. On failure: increment failure count
5. If failures ≥ threshold: open circuit
```

#### 3. **Live Service** (`services/live_service.py`)
```
Responsibility: Real-time coaching through WebSocket connections

ConnectionManager:
├── active_connections: Dict[call_id → List[WebSocket]]
├── connect(websocket, call_id)
├── disconnect(websocket, call_id)
└── broadcast_to_call(call_id, message)

NudgeEngine (Hybrid Approach):
├── INSTANT PATH (< 1ms):
│   ├── Keyword triggers: "cancel", "terminate", "angry", "upset"
│   └── Immediate broadcast to supervisors
│
└── INTELLIGENT PATH (~ 500ms):
    ├── LLM semantic analysis (non-blocking)
    ├── Evaluates tone, SOP adherence, opportunities
    └── Async task creation (fire-and-forget)

Nudge Output:
{
  "type": "nudge",
  "severity": "low|medium|high",
  "message": "Short actionable phrase",
  "priority": "low|medium|high"
}
```

#### 4. **Database Models** (`models/db.py`)
```
Core Tables:

Call (represents a customer interaction)
├── id: UUID primary key
├── agent_id: Foreign key to Agent
├── transcript: Full call text
├── started_at: Timestamp
├── ended_at: Timestamp
├── duration_seconds: Integer
├── status: "ongoing", "completed", "failed"
├── metadata: JSON (customer_id, department, etc)
└── scores: Relationship to Scores table

Agent (call center agent)
├── id: UUID
├── name: String
├── email: String
├── department: String
├── hire_date: Date
├── performance_metrics: JSON
└── calls: Relationship to Call

Scores (deterministic QA scoring)
├── id: UUID
├── call_id: Foreign key
├── compliance_score: 0-100
├── quality_score: 0-100
├── sop_adherence: 0-100
├── sentiment_score: 0-100
├── churn_risk: 0-100
├── created_at: Timestamp
└── audit_trail: JSON

SOP (Standard Operating Procedures)
├── id: UUID
├── department: String
├── title: String
├── content: Text (markdown)
├── version: Integer
├── effective_date: Date
└── mandatory_keywords: List[String]

CoachingRecord (training interactions)
├── id: UUID
├── agent_id: Foreign key
├── coach_id: Foreign key to Agent (supervisor)
├── call_id: Foreign key
├── feedback: Text
├── created_at: Timestamp
└── effectiveness_score: 0-100
```

#### 5. **Services Architecture**

**Ingestion Service**: Audio-to-intelligence pipeline
- Google Gemini multimodal STT (Speech-to-Text)
- Real-time streaming or batch transcription
- PII masking on transcripts
- **Passes cleaned transcript to Analysis Service**
- Does NOT perform any analysis or scoring

**Analysis Service**: Orchestrator for post-call intelligence
- **Invokes the multi-agent pipeline as a single execution unit**
- Does NOT make AI decisions itself
- Does NOT modify or enhance AI outputs
- Receives structured, validated JSON from the pipeline
- Stores validated results to database
- See [Agent Pipeline Integration](#agent-pipeline-integration) for details

**Live Service**: Real-time bidirectional communication
- WebSocket endpoint for agents & supervisors
- Transcript streaming as customer speaks
- Real-time nudges based on keywords + lightweight LLM signals
- Supervisor monitoring & intervention
- **Does NOT invoke full agent pipeline during calls**
- **Does NOT produce final severity or priority scores**

**Simulator Service**: Training & testing
- Generate synthetic customer scenarios
- Test agent responses in sandbox
- Create performance baselines
- Training environment for new agents

---

## Agent Pipeline Integration

> **⚠️ CRITICAL**: This section describes how the platform integrates with the internal AI intelligence pipeline. The pipeline logic itself is defined in [ARCHITECTURE.md](ARCHITECTURE.md) and must NOT be modified by platform services.

### Mental Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PLATFORM INTEGRATION LAYERS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Frontend (React)                                                           │
│       │                                                                     │
│       │  HTTP/WebSocket                                                     │
│       ▼                                                                     │
│  API / Services (FastAPI)                                                   │
│       │                                                                     │
│       │  Function call                                                      │
│       ▼                                                                     │
│  Analysis Service                                                           │
│       │                                                                     │
│       │  analyze_call(transcript, metadata)                                 │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              AGENT PIPELINE (BLACK BOX)                             │   │
│  │              Defined in: ARCHITECTURE.md                            │   │
│  │                                                                     │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │   │
│  │  │   Agent 1   │───▶│   Agent 2   │───▶│   Agent 3   │             │   │
│  │  │   Issue     │    │  Knowledge  │    │   Service   │             │   │
│  │  │ Extraction  │    │  Retrieval  │    │Classification│            │   │
│  │  └─────────────┘    └─────────────┘    └──────┬──────┘             │   │
│  │                                               │                     │   │
│  │                                               ▼                     │   │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │   │
│  │  │   Agent 5   │◀───│  Validation │◀───│   Agent 4   │             │   │
│  │  │   Insight   │    │    Gate     │    │  Severity   │             │   │
│  │  │ Generation  │    │             │    │ Validation  │             │   │
│  │  └──────┬──────┘    └─────────────┘    └─────────────┘             │   │
│  │         │                                                           │   │
│  │         ▼                                                           │   │
│  │  Validated JSON Output                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       │  Validated result (immutable)                                       │
│       ▼                                                                     │
│  Database Storage + Dashboard Consumption                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Pipeline Contract

The Analysis Service invokes the agent pipeline as a **single function call**:

```text
analyze_call(transcript: str, metadata: dict) → ValidatedAnalysisJSON
```

**Input Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `transcript` | `str` | Full call transcript (cleaned, PII-masked) |
| `metadata` | `dict` | Call context: `{call_id, agent_id, department, timestamp}` |

**Output (Immutable):**
```json
{
  "issues": [
    {
      "issue": "Product broke after one day",
      "category": "Product Quality",
      "final_severity": 4,
      "severity_label": "Critical",
      "confidence": 0.90,
      "justification": "Per SOP-2024-001 §3.2...",
      "source": "SOP-2024-001 v2.1"
    }
  ],
  "sentiment": {
    "score": 0.15,
    "label": "Negative",
    "confidence": 0.87
  },
  "priority": {
    "score": 0.76,
    "level": "P1",
    "components": {
      "severity_weighted": 0.48,
      "sentiment_weighted": 0.28
    }
  },
  "insights": "Critical weakness in Product Quality...",
  "recommended_actions": [
    "Implement quality control before shipping",
    "Establish 24-hour response time SLA"
  ],
  "validation": {
    "passed": true,
    "flags": []
  }
}
```

**Contract Rules:**
- ✅ Website consumes output as-is
- ✅ Output is stored directly to database
- ❌ Website NEVER modifies severity, priority, or insights
- ❌ Website NEVER recalculates scores
- ❌ Website NEVER calls LLMs directly for analysis

### Internal Intelligence Engine (Multi-Agent Pipeline)

The Analysis Service invokes a **sequential multi-agent pipeline** defined in [ARCHITECTURE.md](ARCHITECTURE.md).

**Pipeline Responsibilities:**

| Stage | Agent | Responsibility | Authority |
|-------|-------|----------------|-----------|
| 1 | Issue Extraction | Extract customer complaints from transcript | Definitive |
| 2 | Knowledge Retrieval | Fetch relevant SOPs/policies for grounding | Authoritative |
| 3 | Service Classification | Categorize issues + **propose** severity | Proposal Only |
| 4 | Severity Validation | Validate/correct severity using SOP rules | **Final Authority** |
| 5 | Insight Generation | Generate recommendations (uses validated data only) | Advisory |

**Parallel Components:**
- Sentiment Analysis (ML Model - TensorFlow/Keras)
- Priority Scoring (Deterministic Algorithm - 60% severity, 40% sentiment)

**Validation Gate:**
- Schema validation (JSON structure)
- Range checks (severity 1-5, priority P0-P3)
- Consistency checks (sentiment vs severity alignment)
- **Hard stop if validation fails**

> **📌 Reference**: For complete agent specifications, execution order, and validation rules, see [ARCHITECTURE.md](ARCHITECTURE.md).

### Service → Pipeline Mapping

| Platform Service | Pipeline Interaction | Notes |
|------------------|---------------------|-------|
| **Ingestion Service** | None (upstream) | Handles audio/text, calls STT, passes transcript to Analysis Service |
| **Analysis Service** | **Invokes pipeline** | Calls pipeline as single execution unit, receives validated JSON |
| **Live Service** | Partial signals only | Uses keyword triggers + lightweight LLM for nudges, **does NOT invoke full pipeline** |
| **Simulator Service** | Optional invocation | May invoke pipeline for training scenarios |

### Frontend Integration Rules

The frontend is a **read-only intelligence consumer**:

**Frontend Receives:**
- Priority level (P0-P3)
- Severity scores (1-5)
- Insights and recommendations
- Confidence scores and sources
- Validation status

**Frontend NEVER:**
- ❌ Recalculates severity
- ❌ Infers or modifies priority
- ❌ Calls LLMs directly
- ❌ Overrides pipeline decisions
- ❌ Interpolates between agent outputs

```
Frontend Role: DISPLAY ONLY
┌────────────────────────────────────────────────────────┐
│  AgentDashboard, SupervisorDashboard, CallDetail, etc  │
│                                                         │
│  • Fetch validated results via API                      │
│  • Render charts, scores, insights                      │
│  • NO business logic recalculation                      │
│  • NO AI inference                                      │
└────────────────────────────────────────────────────────┘
```

---

## Live vs Post-Call Path Separation

> **⚠️ CRITICAL**: Live and post-call paths have fundamentally different behaviors. This section prevents architectural confusion.

### Live Path (During Call)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            LIVE PATH (REAL-TIME)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Purpose: Provide immediate coaching nudges during active calls             │
│                                                                             │
│  Triggers:                                                                  │
│  ├── Keyword detection ("cancel", "terminate", "angry")                     │
│  ├── Lightweight LLM semantic signals (~500ms)                              │
│  └── Supervisor manual input                                                │
│                                                                             │
│  Outputs:                                                                   │
│  ├── Nudges with severity hints (low/medium/high)                          │
│  ├── SOP reminders                                                          │
│  └── De-escalation prompts                                                  │
│                                                                             │
│  ⚠️ LIMITATIONS:                                                            │
│  ├── NO final severity scores                                               │
│  ├── NO SOP-backed validated severity                                       │
│  ├── NO priority level assignment                                           │
│  ├── NO grounding context retrieval                                         │
│  └── Results NOT stored as official scores                                  │
│                                                                             │
│  Authority: ADVISORY ONLY (not authoritative)                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Post-Call Path (After Call Ends)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          POST-CALL PATH (BATCH)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Purpose: Generate official, validated analysis for completed calls         │
│                                                                             │
│  Trigger: Call ends → Analysis job queued                                   │
│                                                                             │
│  Process:                                                                   │
│  ├── Full agent pipeline execution (5 agents + validation)                  │
│  ├── Knowledge grounding (SOP retrieval)                                    │
│  ├── Severity validation (proposal → final)                                 │
│  ├── Priority calculation (deterministic algorithm)                         │
│  └── Insight generation (uses validated data only)                          │
│                                                                             │
│  Outputs:                                                                   │
│  ├── Final severity (1-5, SOP-backed)                                       │
│  ├── Priority level (P0-P3)                                                 │
│  ├── Validated insights and recommendations                                 │
│  ├── Audit trail with sources                                               │
│  └── Stored to database as official record                                  │
│                                                                             │
│  Authority: DEFINITIVE (single source of truth)                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Path Comparison

| Aspect | Live Path | Post-Call Path |
|--------|-----------|----------------|
| **Timing** | During call | After call ends |
| **Latency** | < 1 second | 15-30 seconds |
| **Agent Pipeline** | ❌ Not invoked | ✅ Full execution |
| **Knowledge Grounding** | ❌ None | ✅ SOP retrieval |
| **Severity** | Hint only | Final (validated) |
| **Priority** | ❌ Not assigned | ✅ P0-P3 |
| **Validation Gate** | ❌ Bypassed | ✅ Hard stop |
| **Stored to DB** | Nudge logs only | Official scores |
| **Authority** | Advisory | Authoritative |

---

## Frontend Architecture

### Directory Structure
```
frontend/
├── index.html                           # Entry HTML
├── package.json                         # Dependencies & scripts
├── vite.config.js                       # Vite build config
│
└── src/
    ├── main.jsx                         # React entry point
    ├── App.jsx                          # Route definitions
    ├── index.css                        # Global styles
    ├── style.css                        # Additional CSS
    │
    ├── context/
    │   └── ThemeContext.jsx             # Global theme state
    │
    ├── theme/
    │   └── theme.config.js              # Design tokens
    │
    ├── components/
    │   ├── layout/
    │   │   └── AgentLayout.jsx          # Cinematic sidebar nav
    │   │
    │   ├── overlay/
    │   │   └── LiveAssistOverlay.jsx    # Real-time HUD
    │   │
    │   └── ui/
    │       ├── LiveAudioStreamer.jsx    # Audio visualization
    │       └── StatusBadge.jsx          # Status indicators
    │
    └── pages/
        ├── AgentConsole.jsx             # Live assist interface
        ├── CallDetail.jsx               # Single call analysis
        ├── AgentDashboard.jsx           # Agent performance view
        ├── CoachingHub.jsx              # Coaching records & feedback
        ├── ManagerDashboard.jsx         # Regional analytics
        ├── StrategicIntelligence.jsx    # Executive insights
        ├── SupervisorDashboard.jsx      # Real-time monitoring
        ├── SOPManager.jsx               # SOP management interface
        └── ExtensionOverlay.jsx         # Browser extension view
```

### Routing Architecture
```
Router (BrowserRouter)
│
├── /extension-overlay
│   └── ExtensionOverlay (Standalone, no layout)
│
└── AgentLayout (Cinematic Sidebar Navigation)
    ├── /dashboard
    │   └── AgentDashboard (Agent's personal performance)
    │
    ├── /coaching
    │   └── CoachingHub (Coaching records, feedback, ROI)
    │
    ├── /manager
    │   └── ManagerDashboard (Regional analytics, team performance)
    │
    ├── /sops
    │   └── SOPManager (SOP browsing, version management)
    │
    ├── /supervisor
    │   └── SupervisorDashboard (Real-time risk monitoring)
    │
    ├── /strategic
    │   └── StrategicIntelligence (Executive dashboards)
    │
    ├── /simulator
    │   └── AgentConsole (Training simulator interface)
    │
    └── /simulator/call/:callId
        └── CallDetail (Detailed call analysis)
```

### Key Components

#### 1. **AgentLayout Component**
```
Purpose: Provides cinematic sidebar navigation shared by all main pages

Structure:
├── Sidebar Navigation
│   ├── Logo & Branding
│   ├── Navigation Links (with icons)
│   ├── User Profile Section
│   └── Logout Button
│
├── Main Content Area
│   └── Outlet (React Router nested routes)
│
└── Theme Toggle

Features:
├── Responsive design
├── Active route highlighting
├── Smooth transitions
└── Accessible navigation
```

#### 2. **LiveAssistOverlay Component**
```
Purpose: Real-time Heads-Up Display (HUD) for agents

Content:
├── Current Call Info
│   ├── Customer name
│   ├── Call duration
│   └── Call status
│
├── Live Transcript
│   ├── Agent speech (left-aligned)
│   └── Customer speech (right-aligned)
│
├── Real-time Nudges
│   ├── Priority badge (High/Medium/Low)
│   ├── Message display
│   └── Animated entry/exit
│
├── Relevant SOPs
│   ├── Matching keywords
│   └── Quick reference
│
└── Supervisor Notes
    ├── Live coaching feedback
    └── Override options

WebSocket Integration:
├── Listen to /api/v1/live endpoint
├── Update transcript on new text chunks
├── Display nudges as they arrive
└── Send agent actions (acknowledge, etc)
```

#### 3. **Dashboard Pages**

**AgentDashboard**
```
Displays:
├── Personal Performance Metrics
│   ├── Average Compliance Score
│   ├── Call Volume (this month)
│   ├── Average Call Duration
│   └── Improvement Trend
│
├── Recent Calls List
│   ├── Call ID, duration, score
│   ├── Sentiment indicator
│   └── Status badge
│
├── Top Improvement Areas
│   ├── Ranked by frequency
│   └── Coaching recommendations
│
└── Performance Radar Chart
    ├── Compliance, Quality, SOP, Sentiment, Churn Risk
    └── Weekly comparison
```

**SupervisorDashboard**
```
Displays:
├── Team Overview
│   ├── Agent status (Available, On Call, Offline)
│   ├── Current active calls
│   └── Team performance
│
├── Risk Monitoring
│   ├── High churn risk alerts
│   ├── Compliance violations
│   └── Escalation queue
│
├── Real-time Call Grid
│   ├── Active calls list
│   ├── Agent name, customer, duration
│   └── Live score updates
│
├── Coaching Effectiveness
│   ├── Agents coached today
│   ├── Score improvements
│   └── Training recommendations
│
└── Nudge Activity
    ├── Nudges sent (count)
    ├── Acknowledgement rate
    └── Effectiveness metrics
```

**ManagerDashboard**
```
Displays:
├── Regional Analytics
│   ├── Department performance
│   ├── Team comparisons
│   └── Trend analysis
│
├── Training ROI
│   ├── Coaching sessions → Score improvements
│   ├── Cost per improvement point
│   └── Training effectiveness ranking
│
├── Compliance Reporting
│   ├── Department compliance trends
│   ├── Violation heatmap
│   └── Corrective actions
│
├── Agent Leaderboard
│   ├── Top performers
│   ├── Improvement trajectory
│   └── Benchmarking
│
└── Strategic KPIs
    ├── Customer satisfaction trends
    ├── Churn reduction metrics
    └── Revenue impact
```

**StrategicIntelligence**
```
Displays:
├── Executive Summary
│   ├── Platform utilization
│   ├── ROI indicators
│   └── Key achievements
│
├── Department Benchmarking
│   ├── Cross-department analysis
│   ├── Best practice sharing
│   └── Performance gaps
│
├── Predictive Insights
│   ├── Churn risk by segment
│   ├── Training impact forecasts
│   └── Optimization recommendations
│
└── Historical Trends
    ├── Multi-month analysis
    ├── Seasonal patterns
    └── Success factors
```

---

## Data Flow & Integration

### Real-Time Call Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME CALL PROCESSING FLOW                       │
└─────────────────────────────────────────────────────────────────────────┘

PHASE 1: Call Initiated
┌────────────────────────────────────────┐
│ Agent answers customer call            │
│ Call recorded with unique ID           │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│ Frontend → POST /api/v1/live/start     │
│ Payload: {call_id, agent_id}           │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│ Backend creates Call record (DB)       │
│ Creates WebSocket context              │
│ Returns call_id                        │
└────────┬───────────────────────────────┘
         │
         ↓
PHASE 2: Audio Streaming & Transcription
┌────────────────────────────────────────┐
│ Audio stream → Google STT              │
│ (Gemini Multimodal)                    │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│ Transcript chunks arrive (every 500ms) │
│ Agent speech: "How can I help?"        │
│ Customer: "I want to cancel..."        │
└────────┬───────────────────────────────┘
         │
         ↓
PHASE 3: Real-Time Nudging (Hybrid)
┌────────────────────────────────────────────────────────────────┐
│ NudgeEngine.process_update(call_id, transcript_snippet)       │
├──────────────────────────────────────────────────────────────┤
│ PATH A: INSTANT KEYWORD DETECTION (< 1ms)                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ if "cancel" in snippet.lower():                          │ │
│ │   broadcast {                                            │ │
│ │     type: "nudge",                                       │ │
│ │     severity: "high",                                    │ │
│ │     message: "⚠️ Churn Risk: Acknowledge frustration..." │ │
│ │   } → Agent Console + Supervisor Dashboard               │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ PATH B: INTELLIGENT SEMANTIC ANALYSIS (~ 500ms, non-blocking)│
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ async task:                                              │ │
│ │ 1. LLM analyzes tone, SOP compliance, opportunity       │ │
│ │ 2. Returns structured nudge or skip                     │ │
│ │ 3. If nudge needed: broadcast to WebSocket              │ │
│ │ 4. Fire-and-forget (doesn't block current request)      │ │
│ └──────────────────────────────────────────────────────────┘ │
└────────┬───────────────────────────────────────────────────────┘
         │
         ↓
PHASE 4: Supervisor & Agent Notifications
┌────────────────────────────────────────┐
│ WebSocket broadcast:                   │
│ Agent Console: Display nudge HUD       │
│ Supervisor Dashboard: Log nudge event  │
│ Update in-memory metrics               │
└────────┬───────────────────────────────┘
         │
         ↓
PHASE 5: Call Completion
┌────────────────────────────────────────┐
│ Agent ends call                        │
│ Frontend → POST /api/v1/live/end       │
│ Payload: {call_id, transcript}         │
└────────┬───────────────────────────────┘
         │
         ↓
PHASE 6: Post-Call Analysis (Agent Pipeline Invocation)
┌────────────────────────────────────────────────────────────────┐
│ Job queued: AnalyzeCall(call_id)                              │
│ Analysis Service invokes AGENT PIPELINE (See ARCHITECTURE.md)│
├────────────────────────────────────────────────────────────────┤
│ Pipeline Execution (Sequential - UNCHANGED):                  │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ 1. Issue Extraction Agent → Extract complaints            ││
│ │ 2. Knowledge Retrieval Agent → Fetch SOP grounding        ││
│ │ 3. Service Classification Agent → Propose severity        ││
│ │ 4. Severity Validation Agent → FINAL severity (1-5)       ││
│ │ 5. [Parallel] Sentiment Model + Priority Scoring          ││
│ │ 6. Output Validation Gate → Schema + range checks         ││
│ │ 7. Insight Generation Agent → Recommendations             ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                │
│ ⚠️ Analysis Service does NOT modify pipeline outputs          │
│ ⚠️ Pipeline is invoked as a BLACK BOX                         │
└────────┬───────────────────────────────────────────────────────┘
         │
         ↓
PHASE 7: Validated Output Storage
┌────────────────────────────────────────┐
│ Pipeline returns validated JSON:       │
│ ├─ issues[] with final_severity        │
│ ├─ priority (P0-P3)                    │
│ ├─ sentiment score                     │
│ ├─ insights + recommendations          │
│ └─ validation flags                    │
│                                        │
│ Analysis Service stores AS-IS to DB    │
│ NO modifications or enhancements       │
└────────┬───────────────────────────────┘
         │
         ↓
PHASE 8: Dashboard Updates
┌────────────────────────────────────────┐
│ Dashboards fetch new scores            │
│ Agent sees completed call analysis     │
│ Supervisor reviews for coaching        │
│ Manager sees regional metrics update   │
└────────────────────────────────────────┘
```

### Data Integration Points

```
External API Integrations:
├── Google Gemini API
│   ├── STT (Speech-to-Text)
│   ├── Structured output generation
│   ├── Semantic analysis
│   └── Circuit breaker protection
│
└── Redis (Optional, Caching)
    ├── Session data
    ├── Recent call results
    ├── Metrics aggregation
    └── TTL-based expiry

Database Reads/Writes:
├── On Call Start:
│   └── INSERT Call record
│
├── During Call:
│   └── UPDATE Call.transcript
│
├── On Call End:
│   ├── UPDATE Call.status = "completed"
│   ├── UPDATE Call.ended_at
│   └── INSERT Scores record
│
├── For Dashboards:
│   ├── SELECT calls WHERE agent_id = ?
│   ├── SELECT scores WHERE call_id = ?
│   ├── SELECT coaching_records WHERE agent_id = ?
│   └── Aggregates for team/department metrics
│
└── Background Jobs:
    └── ARQ queue processes async analysis tasks
```

---

## Component Interactions

### Call Lifecycle Sequence Diagram

```
Agent                Frontend               Backend                   LLM Service
  │                    │                       │                           │
  │─ Answer Call ─────→│                       │                           │
  │                    │─ POST /live/start ───→│                           │
  │                    │                       │─ Create Call record       │
  │                    │←─ WebSocket URL ──────│                           │
  │                    │                       │                           │
  │─ WebSocket Connected────────────────────→ ConnectionManager           │
  │                    │                       │ (stores connection)       │
  │                    │                       │                           │
  │─ Call starts ─────→│────────────────────→ STT Service               │
  │                    │                       │                           │
  │─ Customer speaks ──│─ Audio stream ────→ BedRock STT                │
  │                    │                       │←─ Transcript chunks ──┐  │
  │                    │                       │                       │  │
  │                    │ Real-time updates     │                       │  │
  │─ "I want to      ←─│─ broadcast() ────┐  │←─────────────────┐    │  │
  │  cancel" spoken ──→│                   │ NudgeEngine.process │    │  │
  │                    │                   │                     │    │  │
  │                    │                   ↓                     │    │  │
  │                    │            Keyword Match? ←─────────────┘    │  │
  │                    │            ("cancel" detected)               │  │
  │                    │                 YES                          │  │
  │                    │                 │                           │  │
  │ Nudge Display      │←─ broadcast ────│────────────────────────────┘  │
  │ "⚠️ Churn Risk"   │  {nudge msg}    │ (< 1ms latency)            │  │
  │                    │                 │                           │  │
  │─ Responds to ─────→│─ WebSocket ────→│─ Record agent action       │  │
  │  nudge            │  ("ack")        │ (Optional)                │  │
  │                    │                 │                           │  │
  │  [More conversation...]             │                           │  │
  │                    │                 │                           │  │
  │─ Agent ends call ─→│─ POST /live/end─│                           │  │
  │                    │  {full_transcript}  │                       │  │
  │                    │                 │ Queue async job           │  │
  │                    │←─ 200 OK ───────│ (Analysis)               │  │
  │                    │                 │                           │  │
  │                    │                 │─────────────────→ Analyze │  │
  │                    │                 │  compliance, sentiment    │  │
  │                    │                 │  churn risk, etc ────────→   │
  │                    │                 │                           │  │
  │                    │                 │←─ Extracted facts ────────┘  │
  │                    │                 │                           │  │
  │                    │                 │ Calculate scores          │  │
  │                    │                 │ (deterministic)           │  │
  │                    │                 │                           │  │
  │                    │                 │ Save Scores record        │  │
  │                    │                 │                           │  │
  │─ View completed ──→│ FETCH /analysis/│                           │  │
  │  call analysis     │ :call_id        │                           │  │
  │ (Dashboard)        │←─ {scores,      │                           │  │
  │                    │   analysis, etc}│                           │  │
  │                    │                 │                           │  │
```

---

## API Endpoints

### Summary of Endpoints

#### **1. Live Assist WebSocket**
```
WebSocket: /api/v1/live/ws/{call_id}/{user_id}

Purpose: Real-time bidirectional communication for agents and supervisors

Server → Client (broadcast):
{
  "type": "nudge" | "transcript_update" | "supervisor_message",
  "severity": "low" | "medium" | "high",
  "message": "Action message",
  "timestamp": "ISO 8601"
}

Client → Server:
{
  "type": "ack_nudge" | "transcript_chunk" | "call_ended",
  "data": {...}
}
```

#### **2. Analysis API**
```
POST /api/v1/analysis/analyze
Body: {
  "call_id": "uuid",
  "transcript": "full text",
  "agent_id": "uuid"
}
Response: {
  "call_id": "uuid",
  "scores": {
    "compliance": 85,
    "quality": 78,
    "sop_adherence": 92,
    "sentiment": 80,
    "churn_risk": 15
  },
  "analysis": {
    "violations": ["..."],
    "sentiment_trajectory": "positive",
    "coaching_notes": "..."
  },
  "audit_trail": {...}
}

GET /api/v1/analysis/{call_id}
Response: Full analysis record

GET /api/v1/analysis/agent/{agent_id}
Response: Recent analyses for agent
```

#### **3. Simulator API**
```
POST /api/v1/simulator/generate-scenario
Body: {
  "department": "string",
  "difficulty": "easy|medium|hard",
  "duration_minutes": 5
}
Response: {
  "scenario_id": "uuid",
  "customer_profile": {...},
  "initial_greeting": "string",
  "expected_sops": ["list of SOPs"],
  "challenge_points": [...]
}

POST /api/v1/simulator/evaluate-response
Body: {
  "scenario_id": "uuid",
  "agent_response": "string"
}
Response: {
  "feedback": "string",
  "score": 85,
  "areas_to_improve": [...]
}
```

#### **4. Stats/Analytics API**
```
GET /api/v1/stats/agent/{agent_id}
Response: {
  "total_calls": 145,
  "avg_compliance": 82.5,
  "avg_call_duration": 420,
  "recent_calls": [...],
  "trend": "improving"
}

GET /api/v1/stats/supervisor/{supervisor_id}
Response: {
  "team_size": 12,
  "team_avg_compliance": 80,
  "active_calls": 3,
  "alerts": [...]
}

GET /api/v1/stats/manager/regional
Response: {
  "departments": {...},
  "coaching_roi": {...},
  "trends": {...}
}
```

#### **5. SOP Management API**
```
GET /api/v1/sop
Response: List of all SOPs

GET /api/v1/sop/{sop_id}
Response: Full SOP content

POST /api/v1/sop
Body: {
  "department": "string",
  "title": "string",
  "content": "markdown text",
  "mandatory_keywords": ["list"]
}
Response: Created SOP record

PUT /api/v1/sop/{sop_id}
Body: Updated SOP content
Response: Updated SOP
```

#### **6. Audio Streaming API**
```
POST /api/v1/audio/stream
Body: Binary audio chunks (multipart)
Response: {
  "transcript_chunk": "string",
  "confidence": 0.95
}
```

#### **7. Health & Metrics**
```
GET /health
Response: {"status": "ok", "app_name": "Cognivista..."}

GET /metrics
Response: Prometheus format metrics
```

---

## Database Schema

### Core Tables (SQLModel)

#### **calls**
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL FOREIGN KEY REFERENCES agents(id),
  transcript TEXT,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  status VARCHAR (20),  -- ongoing, completed, failed
  metadata JSONB,       -- {customer_id, department, channel}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **agents**
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  department VARCHAR(100),
  hire_date DATE,
  performance_metrics JSONB,  -- {total_calls, avg_score, ...}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **scores**
```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY,
  call_id UUID NOT NULL FOREIGN KEY REFERENCES calls(id),
  compliance_score SMALLINT CHECK (0 <= compliance_score <= 100),
  quality_score SMALLINT,
  sop_adherence SMALLINT,
  sentiment_score SMALLINT,
  churn_risk SMALLINT,
  audit_trail JSONB,    -- {factors, weights, decisions}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **sops**
```sql
CREATE TABLE sops (
  id UUID PRIMARY KEY,
  department VARCHAR(100),
  title VARCHAR(255),
  content TEXT,  -- Markdown
  version INTEGER DEFAULT 1,
  effective_date DATE,
  mandatory_keywords TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **coaching_records**
```sql
CREATE TABLE coaching_records (
  id UUID PRIMARY KEY,
  agent_id UUID FOREIGN KEY REFERENCES agents(id),
  coach_id UUID FOREIGN KEY REFERENCES agents(id),
  call_id UUID FOREIGN KEY REFERENCES calls(id),
  feedback TEXT,
  effectiveness_score SMALLINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Real-Time Communication

### WebSocket Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     WEBSOCKET COMMUNICATION                     │
└─────────────────────────────────────────────────────────────────┘

Frontend (React Agent Console)
    │
    ├─ useEffect(() => {
    │    const ws = new WebSocket(
    │      `ws://backend:8000/api/v1/live/ws/${call_id}/${user_id}`
    │    );
    │    ws.onmessage = (e) => {
    │      const { type, message } = JSON.parse(e.data);
    │      if (type === "nudge") displayNudge(message);
    │      if (type === "transcript_update") updateLiveTranscript();
    │    };
    │  }, [call_id])
    │
    └─ Listens to:
       ├─ nudge: Real-time coaching prompts
       ├─ transcript_update: Live transcript chunks
       ├─ supervisor_message: Coaching input from supervisor
       └─ call_ended: Disconnection signal


Backend (FastAPI Live Service)
    │
    ├─ ConnectionManager
    │  ├─ Maps: {call_id: [ws1, ws2, ...]}
    │  │  (Agent's connection + Supervisor connections)
    │  │
    │  └─ broadcast_to_call(call_id, message)
    │     └─ Sends to ALL connected WebSockets for that call
    │
    └─ NudgeEngine
       ├─ Keyword triggers (instant)
       │  └─ Broadcast immediately
       │
       └─ LLM analysis (async)
          └─ Broadcast when analysis completes

Message Flow:
1. Agent answers call
2. Frontend opens WebSocket to /api/v1/live/ws/{call_id}/{agent_id}
3. Backend ConnectionManager.connect() adds to active_connections
4. STT service sends transcript chunks
5. NudgeEngine.process_update() analyzes
6. manager.broadcast_to_call() sends nudges to connected clients
7. Frontend receives nudge message
8. React component displays animated nudge HUD
9. Call ends
10. ConnectionManager.disconnect() removes from active_connections
```

### Message Formats

**Nudge Message**
```json
{
  "type": "nudge",
  "severity": "high|medium|low",
  "message": "⚠️ Churn Risk: Acknowledge frustration, offer retention.",
  "action": "Acknowledge customer frustration",
  "priority": "high",
  "timestamp": "2026-01-31T14:23:45Z"
}
```

**Transcript Update**
```json
{
  "type": "transcript_update",
  "chunk": "I want to cancel my subscription",
  "speaker": "customer|agent",
  "timestamp": "2026-01-31T14:23:40Z",
  "confidence": 0.95
}
```

**Supervisor Message**
```json
{
  "type": "supervisor_message",
  "from": "Supervisor Name",
  "message": "Try the retention offer in SOP section 3.2",
  "timestamp": "2026-01-31T14:23:42Z"
}
```

---

## Deployment Considerations

### Environment Configuration
```
.env
├── ENVIRONMENT=production|development
├── DATABASE_URL=postgresql://user:pass@host/db
├── GEMINI_API_KEYS=key1,key2,key3  (comma-separated for rotation)
├── REDIS_URL=redis://localhost:6379
├── BACKEND_CORS_ORIGINS=["http://frontend:3000", "https://app.cognivista.com"]
└── LOG_LEVEL=DEBUG|INFO|WARNING
```

### Scalability Architecture
```
Production Setup:
├── Load Balancer (nginx/CloudFlare)
│  └─ Routes to multiple backend instances
│
├── Multiple FastAPI Instances
│  ├─ Instance 1 (Shared state via Redis)
│  ├─ Instance 2
│  └─ Instance N
│
├── PostgreSQL Database (Main)
│  ├─ Read replicas
│  └─ Backup replication
│
├── Redis Cluster (Caching)
│  └─ Session & result caching
│
└── ARQ Workers (Job Processing)
   ├─ Worker 1 (Analysis jobs)
   ├─ Worker 2 (Notifications)
   └─ Worker N
```

---

## Summary

**Cognivista** is a multi-layered intelligence platform:

1. **Frontend Layer**: React 19 with Vite, real-time updates via WebSocket
2. **API Gateway**: FastAPI with CORS, health checks, metrics
3. **Business Logic**: Services for live coaching, analysis, ingestion, simulation
4. **Intelligence**: Multi-agent pipeline (defined in ARCHITECTURE.md) invoked by Analysis Service
5. **Scoring**: Deterministic priority scoring (60% severity, 40% sentiment) within agent pipeline
6. **Data**: SQLite (dev) / PostgreSQL (prod) with SQLModel ORM
7. **Real-time**: WebSocket connections managed by ConnectionManager
8. **Reliability**: Circuit breakers, exponential backoff, structured logging

### Architecture Authority Summary

| Question | Answer | Source |
|----------|--------|--------|
| Where is the AI logic? | Multi-agent pipeline | [ARCHITECTURE.md](ARCHITECTURE.md) |
| How does the website use AI? | Analysis Service invokes pipeline | This document |
| Who decides final severity? | Severity Validation Agent (Agent 4) | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Who calculates priority? | Deterministic algorithm (not AI) | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Can services modify AI outputs? | ❌ NO - outputs are immutable | Contract rules |
| Can frontend recalculate scores? | ❌ NO - display only | Frontend integration rules |

### Document Cross-References

| Document | Purpose | Authority |
|----------|---------|-----------|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Internal AI agent pipeline | Single source for all severity, priority, insights |
| **ARCHITECTURE_COMPLETE.md** (this file) | Platform/website architecture | Integration layer, services, frontend |

> **🔒 SINGLE SOURCE OF TRUTH**: All final severity, priority, and insights originate exclusively from the agent pipeline defined in [ARCHITECTURE.md](ARCHITECTURE.md). The platform consumes validated outputs and never modifies AI-generated decisions.

