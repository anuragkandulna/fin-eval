import { useState, useRef } from 'react'
import {
  IconSearch,
  IconFilter,
  IconUpload,
  IconArrowLeft,
  IconCloudUpload,
} from '@tabler/icons-react'
import DocumentCard, { type Doc } from '../components/DocumentCard'
import DocumentDetailPanel         from '../components/DocumentDetailPanel'
import MobileBottomNav             from '../components/MobileBottomNav'

// POST /documents/upload — see docs/api-endpoints.md
async function stubUpload(_file: File): Promise<void> {
  await new Promise(r => setTimeout(r, 1200))
}

const MOCK_DOCS: Doc[] = [
  { id: '1', name: 'budgeting_basics.txt',    size: '18.4 KB', type: 'TXT', chunks: 48, timestamp: '2h ago',   status: 'indexed' },
  { id: '2', name: 'debt_management.txt',      size: '22.1 KB', type: 'TXT', chunks: 52, timestamp: '2h ago',   status: 'indexed' },
  { id: '3', name: 'savings_investing.txt',    size: '33.8 KB', type: 'TXT', chunks: 61, timestamp: '3h ago',   status: 'indexed' },
  { id: '4', name: 'india_finance_basics.txt', size: '26.3 KB', type: 'TXT', chunks: 71, timestamp: '3h ago',   status: 'indexed' },
  { id: '5', name: 'salary_slip_june.pdf',     size: '34.8 KB', type: 'PDF', chunks: 12, timestamp: '1h ago',   status: 'indexed' },
  { id: '6', name: 'bank_statement_q2.pdf',    size: '204 KB',  type: 'PDF', chunks: 0,  timestamp: 'just now', status: 'processing' },
]

const INDEXED_COUNT    = MOCK_DOCS.filter(d => d.status === 'indexed').length
const PROCESSING_COUNT = MOCK_DOCS.filter(d => d.status === 'processing').length
const TOTAL_CHUNKS     = MOCK_DOCS.reduce((s, d) => s + d.chunks, 0)

export default function Documents() {
  const [selectedId,    setSelectedId]   = useState<string>('1')
  const [query,         setQuery]        = useState('')
  const [isDragging,    setIsDragging]   = useState(false)
  const [uploading,     setUploading]    = useState(false)
  const [mobileDetail,  setMobileDetail] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedDoc = MOCK_DOCS.find(d => d.id === selectedId) ?? MOCK_DOCS[0]

  const filtered = query.trim()
    ? MOCK_DOCS.filter(d => d.name.toLowerCase().includes(query.toLowerCase()))
    : MOCK_DOCS

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      await stubUpload(files[0])
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="flex flex-1 overflow-hidden">

        {/* Main content */}
        <div
          className={`flex-1 flex flex-col overflow-hidden ${
            mobileDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Toolbar */}
          <div
            className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
            style={{ borderBottom: '0.5px solid var(--color-border)' }}
          >
            <div
              className="flex items-center gap-2 flex-1 rounded-md px-3 py-1.5 bg-snow"
              style={{ border: '0.5px solid var(--color-border)' }}
            >
              <IconSearch size={14} stroke={1.5} className="text-secondary flex-shrink-0" />
              <input
                data-testid="doc-search"
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search documents…"
                className="flex-1 text-sm bg-transparent text-ink placeholder:text-secondary outline-none"
              />
            </div>
            <button
              data-testid="doc-filter"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-secondary rounded-md hover:bg-brand-tint transition-colors"
              style={{ border: '0.5px solid var(--color-border)' }}
            >
              <IconFilter size={14} stroke={1.5} />
              Filter
            </button>
            <button
              data-testid="upload-button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:opacity-80 transition-opacity"
            >
              <IconUpload size={14} stroke={2} />
              Upload document
            </button>
            <input
              ref={fileInputRef}
              data-testid="file-upload"
              type="file"
              accept=".pdf,.txt,.md,.docx,.csv"
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>

          {/* Status bar */}
          <div
            className="flex items-center gap-4 px-5 py-2 text-xs flex-shrink-0"
            style={{ borderBottom: '0.5px solid var(--color-border)' }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pass" />
              <span className="text-ink font-medium">Indexed {INDEXED_COUNT}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              <span className="text-ink font-medium">Processing {PROCESSING_COUNT}</span>
            </span>
            <span className="text-secondary">
              Total chunks <span className="font-mono text-ink">{TOTAL_CHUNKS}</span>
            </span>
            <span className="text-secondary">
              Collection <span className="font-mono text-ink">finance_docs</span>
            </span>
          </div>

          {/* Document grid + upload zone */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p
              className="text-secondary font-medium uppercase mb-3"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              Knowledge base documents
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {filtered.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  selected={doc.id === selectedId}
                  onClick={() => {
                    setSelectedId(doc.id)
                    setMobileDetail(true)
                  }}
                />
              ))}
            </div>

            {/* Drop zone */}
            <div
              data-testid="drop-zone"
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-lg flex flex-col items-center justify-center gap-2 py-8 cursor-pointer transition-colors ${
                isDragging ? 'bg-brand-tint' : 'hover:bg-brand-tint'
              }`}
              style={{ border: `0.5px dashed var(--color-${isDragging ? 'brand' : 'border'})` }}
            >
              <IconCloudUpload
                size={28}
                stroke={1.5}
                className={uploading ? 'text-brand animate-pulse' : 'text-secondary'}
              />
              <p className="text-sm text-secondary text-center">
                {uploading ? 'Uploading…' : 'Drop files here to upload'}
              </p>
              <p className="text-xs text-secondary">
                Supports PDF and TXT · Max 10 MB ·{' '}
                <span className="text-brand cursor-pointer">Browse files</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Document detail — mobile toggled, desktop always */}
        <div
          className={`flex-shrink-0 flex flex-col ${
            mobileDetail ? 'flex flex-1 md:flex-none md:w-72' : 'hidden md:flex md:w-72'
          }`}
        >
          {/* Mobile back button */}
          <button
            className="md:hidden flex items-center gap-2 px-4 py-3 text-sm text-brand"
            style={{ borderBottom: '0.5px solid var(--color-border)' }}
            onClick={() => setMobileDetail(false)}
          >
            <IconArrowLeft size={16} stroke={1.5} />
            Back to documents
          </button>
          <DocumentDetailPanel doc={selectedDoc} />
        </div>
      </div>

      <MobileBottomNav activeTab="docs" />
    </div>
  )
}
