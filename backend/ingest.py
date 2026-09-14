import io
import uuid

import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer

CHROMA_DB_PATH = "./chroma_db"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"

_embedder: SentenceTransformer | None = None
_chroma_client: chromadb.ClientAPI | None = None


class EmptyPDFError(Exception):
    pass


def get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBED_MODEL_NAME)
    return _embedder


def get_chroma_client() -> chromadb.ClientAPI:
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    return _chroma_client


def extract_pages(pdf_bytes: bytes) -> list[tuple[int, str]]:
    """Return (page_number, text) for every page with extractable text."""
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages = []
    for page_num, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append((page_num, text))
    if not pages:
        raise EmptyPDFError("No extractable text found in PDF")
    return pages


def chunk_pages(pages: list[tuple[int, str]]) -> list[dict]:
    """Split each page's text into overlapping chunks, keeping the source page number.

    chunk_size/overlap are in characters, not tokens — ~4 chars per token for
    English text, so 2000/200 chars approximates the ~500/~50 token target.
    """
    splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
    chunks = []
    for page_num, text in pages:
        for chunk_text in splitter.split_text(text):
            chunks.append({"text": chunk_text, "page": page_num})
    return chunks


def ingest_pdf(pdf_bytes: bytes, filename: str) -> dict:
    pages = extract_pages(pdf_bytes)
    chunks = chunk_pages(pages)

    embedder = get_embedder()
    embeddings = embedder.encode([c["text"] for c in chunks]).tolist()

    doc_id = str(uuid.uuid4())
    client = get_chroma_client()
    collection = client.create_collection(name=f"doc_{doc_id}")
    collection.add(
        ids=[str(i) for i in range(len(chunks))],
        embeddings=embeddings,
        documents=[c["text"] for c in chunks],
        metadatas=[{"page": c["page"]} for c in chunks],
    )

    return {
        "doc_id": doc_id,
        "filename": filename,
        "num_pages": len(pages),
        "num_chunks": len(chunks),
    }
