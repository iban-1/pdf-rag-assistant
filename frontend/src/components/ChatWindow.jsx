import { useState } from 'react'
import { askQuestion } from '../api'
import Character from './Character'
import SourceCitation from './SourceCitation'

const BULLET_RE = /^[-*•]\s+/

// Splits on **bold** spans and renders them as <strong>, everything else as plain text.
function InlineText({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  )
}

function AnswerText({ text }) {
  const lines = text.split('\n').filter((l) => l.trim() !== '')
  const blocks = []
  let currentList = null

  for (const line of lines) {
    if (BULLET_RE.test(line)) {
      if (!currentList) {
        currentList = []
        blocks.push({ type: 'list', items: currentList })
      }
      currentList.push(line.replace(BULLET_RE, ''))
    } else {
      currentList = null
      blocks.push({ type: 'p', text: line })
    }
  }

  return (
    <div className="space-y-1.5">
      {blocks.map((block, i) =>
        block.type === 'list' ? (
          <ul key={i} className="list-disc space-y-1 pl-4">
            {block.items.map((item, j) => (
              <li key={j}>
                <InlineText text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <InlineText text={block.text} />
          </p>
        ),
      )}
    </div>
  )
}

export default function ChatWindow({ docId }) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [error, setError] = useState(null)

  const hasAssistantMessage = messages.some((m) => m.role === 'assistant')
  const charState = isAsking ? 'thinking' : hasAssistantMessage ? 'speaking' : 'idle'

  async function handleSend() {
    const trimmed = question.trim()
    if (!trimmed || !docId || isAsking) return

    const history = messages.slice(-2).map(({ role, text }) => ({ role, text }))

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setQuestion('')
    setIsAsking(true)
    setError(null)

    try {
      const result = await askQuestion(docId, trimmed, history)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: result.answer, sources: result.sources },
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAsking(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-1 gap-4 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-neutral-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-neutral-300"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-sm">
                {docId
                  ? 'Ask a question about your PDF to get started.'
                  : 'Upload a PDF above to start asking questions.'}
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'rounded-tr-sm bg-neutral-900 text-white'
                    : 'rounded-tl-sm bg-neutral-100 text-neutral-900'
                }`}
              >
                {m.role === 'assistant' ? (
                  <AnswerText text={m.text} />
                ) : (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                )}
                {m.role === 'assistant' && <SourceCitation sources={m.sources} />}
              </div>
            </div>
          ))}
          {isAsking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-xl rounded-tl-sm bg-neutral-100 px-3.5 py-2.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400" />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-2 border-t border-neutral-200 bg-neutral-50 p-3">
          <textarea
            rows={1}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!docId}
            placeholder={docId ? 'Ask a question…' : 'Upload a PDF first'}
            className="flex-1 resize-none rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-400"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!docId || !question.trim() || isAsking}
            className="flex shrink-0 items-center justify-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>

      <div className="hidden w-44 shrink-0 flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-6 lg:flex">
        <Character state={charState} />
      </div>
    </div>
  )
}
