# privacy-proxy-AI-firewall

Privacy Proxy, AI Firewall, or Data Guardrail.

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

# Local vector database (ChromaDB)

Container Name: local_chroma_firewall
Port: 8000

# To start the backend

docker compose -f scripts/docker-compose.yml up -d

# To stop the backend

docker compose -f scripts/docker-compose.yml down

# To view logs

docker logs local_chroma_firewall
```
