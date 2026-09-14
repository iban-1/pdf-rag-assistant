# AI PDF Study Assistant

A RAG-based (Retrieval-Augmented Generation) application that lets you upload
PDFs and ask questions about their content, with answers grounded in and
cited from the source document.

**Status:** backend complete (upload → ingest → retrieve → generate with
citations). Frontend not yet built.

## How It Works

1. **Ingest** — PDF text is extracted per page and split into overlapping chunks
2. **Embed** — each chunk is converted into a vector using a local sentence
   embedding model
3. **Store** — vectors, chunk text, and page numbers are stored in a local
   ChromaDB collection (one per uploaded document)
4. **Retrieve** — a question is embedded and matched against stored chunks by
   semantic similarity (top 5)
5. **Generate** — the matched chunks are passed to an LLM as context, with a
   system prompt that restricts it to answering only from that context
6. **Cite** — the page numbers of the source chunks are returned alongside
   the answer

## Tech Stack

- **Backend:** FastAPI, Python
- **PDF parsing:** pypdf
- **Chunking:** langchain-text-splitters (`RecursiveCharacterTextSplitter`, ~500 token chunks, ~50 token overlap)
- **Embeddings:** sentence-transformers (`all-MiniLM-L6-v2`), local and free
- **Vector DB:** ChromaDB, local persistence
- **LLM:** Groq's free-tier API by default (`openai/gpt-oss-20b`); can be
  swapped to a local Ollama model via one env var — see below
- **Frontend:** not yet built (planned: React + Tailwind)

## Running the Backend Locally

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in a Groq API key:

```bash
cp ../.env.example .env
```

Get a free key at [console.groq.com/keys](https://console.groq.com/keys)
(sign in with Google/GitHub, no card required), then set `GROQ_API_KEY` in
`backend/.env`.

Start the server:

```bash
uvicorn main:app --reload
```

Open [http://localhost:8000/docs](http://localhost:8000/docs) for the
interactive Swagger UI — use it to try `/upload` (pick a PDF) and then
`/query` (paste the returned `doc_id` and ask a question).

### Switching to local Ollama instead of Groq

The LLM call is isolated behind `call_llm()` in `backend/generate.py`, which
branches on `LLM_PROVIDER`. To use a fully local, free model instead of
Groq's hosted API:

1. Install [Ollama](https://ollama.com) and run `ollama pull llama3.1:8b`
2. Start it with `ollama serve`
3. In `backend/.env`, set `LLM_PROVIDER=ollama`

No code changes needed.

## Key Design Decisions

- Chunks are limited to ~500 tokens with overlap to preserve context across
  chunk boundaries without exceeding LLM context limits.
- The system prompt restricts the LLM to answering only from retrieved
  context and to say "I don't know based on the provided document" when the
  answer isn't present, reducing hallucination.
- Citations (page numbers + snippet) are returned with every answer so
  answers can be verified against the source.
- The LLM call is behind a single provider-switch function so the free
  Groq API used for development can be swapped for a fully local Ollama
  model later without touching the rest of the pipeline.

## Limitations

- Retrieval quality depends on chunking strategy — very short or very dense
  PDFs may retrieve less relevant chunks.
- Text-based PDFs only — no OCR for scanned documents yet.
- No frontend yet; interact via the Swagger UI or direct API calls.

## Future Improvements

- React frontend (upload, chat window, source citations)
- OCR support for scanned PDFs
- Multi-document querying
- Conversation memory across turns
