import { useRef, useState } from 'react'
import { uploadPdf } from '../api'

export default function Upload({ docInfo, onUploaded }) {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle | uploading | error
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  function pickFile(selected) {
    if (!selected) return
    setFile(selected)
    setStatus('idle')
    setError(null)
  }

  async function handleUpload(selected) {
    const toUpload = selected ?? file
    if (!toUpload) return
    setStatus('uploading')
    setError(null)
    try {
      const result = await uploadPdf(toUpload)
      onUploaded(result)
      setStatus('idle')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) {
      pickFile(dropped)
      handleUpload(dropped)
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors ${
          isDragging
            ? 'border-neutral-900 bg-neutral-50'
            : 'border-neutral-300 hover:border-neutral-500'
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
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
            <path d="M12 3v12" />
            <path d="m7 8 5-5 5 5" />
            <path d="M5 21h14" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          {status === 'uploading' ? (
            <p className="text-sm font-medium text-neutral-700">
              Reading and embedding your PDF…
            </p>
          ) : file ? (
            <p className="truncate text-sm font-medium text-neutral-700">
              {file.name}
            </p>
          ) : (
            <p className="text-sm text-neutral-500">
              <span className="font-medium text-neutral-900">
                Click to upload
              </span>{' '}
              or drag a PDF here
            </p>
          )}
        </div>

        {file && status !== 'uploading' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleUpload()
            }}
            className="shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Upload
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </div>

      {status === 'error' && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
          {error}
        </p>
      )}

      {docInfo && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-600">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: 'var(--accent)' }}
          />
          Loaded <span className="font-medium">{docInfo.filename}</span> —{' '}
          {docInfo.num_pages} pages, {docInfo.num_chunks} chunks
        </p>
      )}
    </div>
  )
}
