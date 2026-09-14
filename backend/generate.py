import os

from groq import Groq

SYSTEM_PROMPT = (
    "You are a study assistant that answers questions using ONLY the provided "
    "document excerpts. If the answer is not contained in the excerpts, respond "
    "exactly with: \"I don't know based on the provided document.\" Do not use "
    "outside knowledge, and do not guess.\n\n"
    "You may be given earlier turns of this conversation. Use them only to "
    "resolve references like \"it\" or \"that\" in the current question — the "
    "answer itself must still come only from the document excerpts given with "
    "the current question.\n\n"
    "When you do answer, write in clear, natural sentences — not a single "
    "dense run-on sentence packed with every detail. Prefer short sentences, "
    "or a short bulleted list when there are several distinct points. Answer "
    "only what was asked; don't summarize the whole excerpt unless asked to. "
    "Cite the page number inline, like (p. 3), for each claim.\n\n"
    "Write in plain text only — no markdown. Do not use **bold**, headers, "
    "or code fences. If you list points, start each line with a single "
    "\"- \" and nothing else."
)

_groq_client: Groq | None = None


def get_groq_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set")
        _groq_client = Groq(api_key=api_key)
    return _groq_client


def build_prompt(question: str, chunks: list[dict]) -> str:
    context = "\n\n".join(f"[Page {c['page']}]\n{c['text']}" for c in chunks)
    return f"Document excerpts:\n{context}\n\nQuestion: {question}"


def build_messages(prompt: str, history: list[dict] | None) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in history or []:
        role = "assistant" if turn.get("role") == "assistant" else "user"
        messages.append({"role": role, "content": turn.get("text", "")})
    messages.append({"role": "user", "content": prompt})
    return messages


def call_llm(prompt: str, history: list[dict] | None = None) -> str:
    """Single swap point: LLM_PROVIDER=groq (default) or ollama."""
    messages = build_messages(prompt, history)
    provider = os.environ.get("LLM_PROVIDER", "groq")
    if provider == "groq":
        return _call_groq(messages)
    if provider == "ollama":
        return _call_ollama(messages)
    raise RuntimeError(f"Unknown LLM_PROVIDER: {provider}")


def _call_groq(messages: list[dict]) -> str:
    client = get_groq_client()
    model = os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b")
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.2,
    )
    return response.choices[0].message.content


def _call_ollama(messages: list[dict]) -> str:
    import requests

    base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    model = os.environ.get("OLLAMA_MODEL", "llama3.1:8b")
    response = requests.post(
        f"{base_url}/api/chat",
        json={
            "model": model,
            "messages": messages,
            "stream": False,
        },
        timeout=120,
    )
    response.raise_for_status()
    return response.json()["message"]["content"]
