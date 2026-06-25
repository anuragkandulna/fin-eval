import { useState, useRef } from 'react'
import { uploadDocument } from '../api/client'

type UploadState =
  | { kind: 'idle' }
  | { kind: 'uploading' }
  | { kind: 'success'; filename: string; chunks: number }
  | { kind: 'error'; message: string }

export default function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<UploadState>({ kind: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null
    setState({ kind: 'idle' })

    if (picked && !picked.name.endsWith('.pdf')) {
      setFile(null)
      setState({ kind: 'error', message: 'Only PDF files are accepted.' })
      return
    }
    setFile(picked)
  }

  const upload = async () => {
    if (!file) return
    setState({ kind: 'uploading' })
    try {
      const res = await uploadDocument(file)
      setState({ kind: 'success', filename: res.filename, chunks: res.chunks })
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Upload failed. Please try again.'
      setState({ kind: 'error', message: msg })
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Upload Financial Document
      </h2>

      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-500 mb-4">PDF files only</p>

        <input
          ref={inputRef}
          data-testid="file-upload"
          type="file"
          accept=".pdf"
          onChange={onFileChange}
          className="block mx-auto text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {file && (
          <p className="mt-3 text-sm text-gray-700">
            Selected: <span className="font-medium">{file.name}</span>
          </p>
        )}
      </div>

      <button
        data-testid="upload-button"
        onClick={upload}
        disabled={!file || state.kind === 'uploading'}
        className="mt-4 w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors"
      >
        {state.kind === 'uploading' ? 'Uploading…' : 'Upload'}
      </button>

      <div data-testid="upload-status" className="mt-4">
        {state.kind === 'success' && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            ✓ <span className="font-medium">{state.filename}</span> uploaded
            successfully — {state.chunks} chunks indexed.
          </div>
        )}
        {state.kind === 'error' && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {state.message}
          </div>
        )}
      </div>
    </div>
  )
}
