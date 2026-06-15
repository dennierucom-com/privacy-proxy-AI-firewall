# 🛡️ Strategic Blueprint: Enterprise AI Privacy Proxy & PHI Firewall

An enterprise-grade, localized **AI Privacy Interceptor Firewall** engineered using **LangChain.js (TypeScript)**, **Docker**, and **ChromaDB**. This system acts as a secure, "Fail-Closed" compliance layer that intercepts incoming user prompts, evaluates them for Protected Health Information (PHI) via a multi-detector consensus model, optimizes token overhead using Contextual Compression, and completely neutralizes data leak vectors before reaching public cloud LLM endpoints (Google Gemini).

---

## 🏗️ System Architecture & Data Flow

The architecture operates entirely inside a private network perimeter using localized rules and semantic vectors to achieve a low-cost, healthcare-compliant AI guardrail:

```text
  [ User Prompt Input ]
           │
           ▼
┌──────────────────────────────────────────────┐
│   Advanced Optimization: Contextual-     │
│   Compression Filter (EmbeddingsFilter)      │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│   LAYER 1 & 2: Local Rule Validation         │
│   - Regex Scans (SSN, MRN, Phone Numbers)    │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│   LAYER 3: Local Semantic Proximity Engine   │
│   - Local ChromaDB Vector Container Queries  │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│   LAYER 4: Multi-Detector Policy Engine      │
│   - Computes Consensus Risk Score Weights    │
└──────────┬───────────────────────────────────┘
           │
     [ Risk Score < 40? ]
        ├── NO  ──► [ FAIL CLOSED: Abort & Quarantine ]
        └── YES ──► [ Forward Verified Safe Context to Gemini ]

```

## 🛠️ Stack & Free-Tier Prerequisites

This deployment uses 100% free-tier, developer-friendly open-source software tools:

-   **Runtime Node Engine:** Node.js v18+ & `ts-node`
    
-   **Orchestration Model:** LangChain.js (LangChain Expression Language - LCEL)
    
-   **Localized Vector Store:** ChromaDB (Containerized via Docker)
    
-   **Cloud LLM Interface:** Google Gemini API (Free Developer License API Key)
    
-   **Observability Matrix:** LangSmith (Free Developer Tracking Tier)
    

## 🚀 Step-by-Step Local Deployment

### 1. Environment Configuration Setup

Clone this codebase locally and create a `.env` configuration file in the project root containing your orchestration parameters:

Code snippet

```
GEMINI_API_KEY=your_free_gemini_api_key_here
CHROMA_URL=http://localhost:8000
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_PROJECT=phi-privacy-firewall

```

### 2. Launch Local Data Infrastructure

Spin up the decoupled, persistent vector engine backend locally via Docker Compose:

Bash

```
docker-compose up -d

```

_To verify that the database engine is online and active, test the network heartbeat via terminal curl:_

Bash

```
curl http://localhost:8000/api/v1/heartbeat

```

### 3. Initialize Workspace Dependencies

Execute the project installation layer to download required code packages:

Bash

```
npm install @langchain/community @langchain/google-genai @langchain/core dotenv langchain ts-node typescript

```

### 4. Seed the Semantic Proximity Models

Run the initialization database profile module to populate ChromaDB with synthetic medical charts, diagnosis records, and attack signatures:

Bash

```
npx ts-node seedFirewall.ts

```

### 5. Run the Optimized Production Firewall Prototype

Execute the main Contextual Compression and Multi-Detector verification model to simulate a bloated prompt threat analysis:

Bash

```
npx ts-node compressedFirewall.ts

```

## 📊 Verification Matrix & Logs

When running `compressedFirewall.ts`, the system outputs real-time evaluation logs tracking the execution metrics:

-   **Token Isolation Output:** `🗜️ [COMPRESSION ACTIVE] Isolated 5 high-risk sentence fragments.`
    
-   **Consensus Scoring Engine Log:** `🛡️ [FIREWALL AUDIT] Final Evaluated Risk Score: 45`
    
-   **Defensive Intercept Confirmation:** `❌ [EXPECTED BEHAVIOR SUCCESSFUL]: SECURITY_ALERT: PHI patterns detected. Transaction aborted via Fail-Closed protocol.`
    

Every runtime execution trace, latency curve, and similarity calculation is tracked in your centralized **LangSmith Dashboard** under the `phi-privacy-firewall` project space.
