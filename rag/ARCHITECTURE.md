# RevSathi RAG System — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (WhatsApp Bot)                        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FastAPI Application Layer                       │
│                                                                     │
│   POST /documents/upload   POST /query   GET /documents/:id/status  │
│   POST /tenants            PATCH /tenants/:id/plan                  │
└──────┬─────────────────────────┬───────────────────────────────────┘
       │                         │
       ▼                         ▼
┌──────────────────┐    ┌────────────────────────────────────────────┐
│   Redis Queue    │    │         Query Flow (async)                  │
│   (BullMQ/       │    │                                             │
│    Celery)       │    │  1. embed_texts_async (OpenRouter)          │
└──────┬───────────┘    │  2. retrieve_async (pgvector + FTS)         │
       │                │  3. _build_context                          │
       ▼                │  4. _call_llm (OpenRouter chat)             │
┌──────────────────┐    │  5. return answer + sources                 │
│  Celery Worker   │    └────────────────────────────────────────────┘
│                  │
│  ingest_document │
│  ┌─────────────┐ │
│  │ dispatcher  │ │    ┌──────────────────────────────────────────┐
│  │ (PDF/DOCX/  │ │    │            Supabase                      │
│  │  XLSX)      │ │    │                                          │
│  └──────┬──────┘ │    │  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│         │        │    │  │ tenants  │  │documents │  │chunks │ │
│  chunker│        │◄───┼─►│          │  │          │  │       │ │
│         │        │    │  │priority  │  │status    │  │embed  │ │
│  embedder         │    │  │_score    │  │chunk_cnt │  │vector │ │
│         │        │    │  └──────────┘  └──────────┘  │(1536) │ │
│         ▼        │    │                               └───────┘ │
│   upsert chunks  │    │  pgvector HNSW index                    │
└──────────────────┘    │  Postgres FTS (GIN) index               │
                        │  Row-Level Security (per tenant)         │
                        └──────────────────────────────────────────┘
```

---

## Module Map

```
rag/
├── config/
│   └── settings.py          # Pydantic-settings; all env vars in one place
│
├── ingestion/
│   ├── dispatcher.py        # Routes files to correct extractor
│   ├── pdf_extractor.py     # PyMuPDF text path + pdf2image/Tesseract OCR fallback
│   ├── docx_extractor.py    # python-docx; preserves headings + tables
│   └── xlsx_extractor.py    # openpyxl; sheet-by-sheet extraction
│
├── chunking/
│   └── chunker.py           # Token-aware sliding window with sentence boundaries
│
├── embedding/
│   └── embedder.py          # OpenRouter embeddings; batched + L2-normalised
│
├── retrieval/
│   ├── retriever.py         # Hybrid pgvector + FTS with priority scoring
│   ├── priority.py          # Tenant plan/priority CRUD
│   └── query_flow.py        # End-to-end: embed → retrieve → prompt → LLM
│
├── queue/
│   ├── celery_app.py        # Celery factory (Redis broker)
│   └── tasks.py             # ingest_document + embed_document tasks
│
├── api/
│   ├── main.py              # FastAPI app
│   └── routers/
│       ├── health.py
│       ├── tenants.py
│       ├── documents.py     # Upload + status
│       └── query.py         # RAG query endpoint
│
├── utils/
│   └── logger.py            # Structured JSON logging (structlog)
│
├── worker.py                # Celery worker entry point
├── schema.sql               # Supabase-ready SQL (run once)
├── requirements.txt
└── .env.example
```

---

## Ingestion Pipeline (Detailed)

```
File Upload (PDF / DOCX / XLSX)
        │
        ▼
[dispatcher.py] detect_file_type()
        │
   ┌────┴─────────────┬──────────────┐
   ▼                  ▼              ▼
pdf_extractor    docx_extractor  xlsx_extractor
   │
   ├─ PyMuPDF text extraction
   │       │
   │       ▼ total_chars < threshold?
   │       YES → Full OCR path
   │       NO  → per-page OCR check
   │               │
   │    pdf2image (300 DPI)
   │               │
   │    Tesseract / PaddleOCR
   │
   ▼
[List of text blocks: {text, section, is_heading, type}]
        │
        ▼
[chunker.py] chunk_blocks()
  - heading-aware grouping
  - tiktoken token counting
  - sliding window 400 tokens / 60 overlap
        │
        ▼
[embedder.py] embed_texts()
  - batches of 32
  - OpenRouter text-embedding-3-small
  - L2 normalisation
        │
        ▼
[Supabase] INSERT INTO chunks (embedding vector)
```

---

## Retrieval + Scoring Formula

```sql
final_score =
    (similarity_score   * 0.60)   -- cosine similarity from pgvector
  + (tenant_priority    * 0.25)   -- plan tier: free=1, growth=2, enterprise=3
  + (chunk_importance   * 0.15)   -- per-chunk weight (default 1.0)
  + (fts_rank           * 0.10)   -- Postgres full-text rank bonus
```

Weights are configurable in `config/settings.py`.

---

## Multi-Tenant Isolation

| Layer | Mechanism |
|---|---|
| Application | `tenant_id` filter on every query |
| Database | Row-Level Security policies |
| Storage | Tenant-scoped paths: `documents/{tenant_id}/...` |
| Retrieval | `WHERE tenant_id = ?` before HNSW scan |

---

## Priority Tiers (Monetisation)

| Plan | Priority Score | Effect |
|---|---|---|
| free | 1.0 | Base retrieval quality |
| growth | 2.0 | 25% higher final score boost |
| enterprise | 3.0 | 50% higher final score boost |

Higher-priority tenants see more of their own documents surfaced when scores are close.

---

## Async Document Status States

```
pending → processing → ready
                    ↘ failed (auto-retry x3)
```

Poll via `GET /documents/{id}/status`.

---

## Running Locally

```bash
# 1. Install deps
cd rag && pip install -r requirements.txt

# Also install system deps:
# macOS: brew install tesseract poppler
# Ubuntu: apt-get install tesseract-ocr poppler-utils

# 2. Copy env file
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_DB_URL, OPENROUTER_API_KEY

# 3. Run schema
psql $SUPABASE_DB_URL < schema.sql

# 4. Start Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# 5. Start worker
celery -A rag.worker.celery_app worker -Q ingestion,embedding --loglevel=info

# 6. Start API
uvicorn rag.api.main:app --reload --port 8000
```

### API Quick Test

```bash
# Create tenant
curl -X POST http://localhost:8000/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme","slug":"acme","plan":"growth"}'

# Upload document
curl -X POST http://localhost:8000/documents/upload \
  -F "tenant_id=<uuid>" \
  -F "file=@product_catalog.pdf"

# Poll status
curl http://localhost:8000/documents/<doc_id>/status

# Query
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"tenant_id":"<uuid>","query":"What is the return policy?"}'
```

---

## Cost Optimisation Notes

- **text-embedding-3-small** via OpenRouter: ~$0.02 / 1M tokens (cheapest performant embedding)
- Batching (32 texts per call) reduces API overhead
- HNSW index: fast approximate search, no re-ranking needed
- Celery workers can be scaled horizontally; ingestion is the only heavy step
- `pdf_dpi=300` balances OCR accuracy vs processing time (lower = faster, higher = better)
