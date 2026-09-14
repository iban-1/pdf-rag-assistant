import { useState } from 'react'
import ChatWindow from './components/ChatWindow'
import Upload from './components/Upload'

function App() {
  const [docInfo, setDocInfo] = useState(null)

  return (
    <div className="mx-auto flex h-screen max-w-4xl flex-col gap-5 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M9 15h6" />
            <path d="M9 11h6" />
          </svg>
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
            style={{ background: 'var(--accent)' }}
          />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
            AI PDF Study Assistant
          </h1>
          <p className="text-sm text-neutral-500">
            Answers grounded in your document, with page citations
          </p>
        </div>
      </header>

      <Upload docInfo={docInfo} onUploaded={setDocInfo} />
      <ChatWindow docId={docInfo?.doc_id} />
    </div>
  )
}

export default App
