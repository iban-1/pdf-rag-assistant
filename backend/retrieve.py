from ingest import get_chroma_client, get_embedder


class DocNotFoundError(Exception):
    pass


def retrieve_chunks(
    doc_id: str, question: str, prev_question: str | None = None, k: int = 5
) -> list[dict]:
    """Embed the question and return the top-k most similar chunks for a doc.

    A vague follow-up like "tell me more about it" carries almost no meaning
    on its own, so when there's a previous question we fold it into the
    embedded query to give the follow-up enough context to retrieve the
    right chunks.
    """
    client = get_chroma_client()
    try:
        collection = client.get_collection(name=f"doc_{doc_id}")
    except Exception as e:
        raise DocNotFoundError(f"No document found with id {doc_id}") from e

    query = f"{prev_question} {question}" if prev_question else question

    embedder = get_embedder()
    question_embedding = embedder.encode([query]).tolist()

    results = collection.query(query_embeddings=question_embedding, n_results=k)

    documents = results.get("documents") or [[]]
    metadatas = results.get("metadatas") or [[]]

    chunks = []
    for text, meta in zip(documents[0], metadatas[0]):
        chunks.append({"text": text, "page": meta.get("page")})
    return chunks
