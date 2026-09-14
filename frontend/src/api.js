const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function parseJsonOrThrow(response) {
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.detail || `Request failed with status ${response.status}`
    throw new Error(message)
  }
  return data
}

export async function uploadPdf(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  })
  return parseJsonOrThrow(response)
}

export async function askQuestion(docId, question, history = []) {
  const response = await fetch(`${API_BASE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_id: docId, question, history }),
  })
  return parseJsonOrThrow(response)
}
