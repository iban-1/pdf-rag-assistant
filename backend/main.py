from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from generate import build_prompt, call_llm
from ingest import EmptyPDFError, ingest_pdf
from retrieve import DocNotFoundError, retrieve_chunks

app = FastAPI(title="AI PDF Study Assistant")

# Dev-only permissive CORS; tighten once the frontend has a fixed origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    is_pdf = (file.content_type == "application/pdf") or (
        file.filename and file.filename.lower().endswith(".pdf")
    )
    if not is_pdf:
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(pdf_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds the 20MB limit")

    try:
        return ingest_pdf(pdf_bytes, file.filename)
    except EmptyPDFError:
        raise HTTPException(
            status_code=400,
            detail="No extractable text found in this PDF (it may be scanned/image-only)",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {e}")


class HistoryTurn(BaseModel):
    role: str
    text: str


class QueryRequest(BaseModel):
    doc_id: str
    question: str
    history: list[HistoryTurn] | None = None


@app.post("/query")
async def query(req: QueryRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    history = [turn.model_dump() for turn in req.history] if req.history else []
    prev_question = next(
        (turn["text"] for turn in reversed(history) if turn["role"] == "user"), None
    )

    try:
        chunks = retrieve_chunks(req.doc_id, req.question, prev_question=prev_question)
    except DocNotFoundError:
        raise HTTPException(
            status_code=404, detail="Document not found. Upload it first via /upload"
        )

    if not chunks:
        return {"answer": "I don't know based on the provided document.", "sources": []}

    prompt = build_prompt(req.question, chunks)
    try:
        answer = call_llm(prompt, history=history)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM call failed: {e}")

    sources = [{"page": c["page"], "snippet": c["text"][:200]} for c in chunks]
    return {"answer": answer, "sources": sources}
