import { useState, useRef } from 'react'
import {
  IconSearch,
  IconFilter,
  IconUpload,
  IconArrowLeft,
  IconCloudUpload,
  IconX,
} from '@tabler/icons-react'
import DocumentCard, { type Doc } from '../components/DocumentCard'
import DocumentDetailPanel         from '../components/DocumentDetailPanel'
import DisclaimerBar               from '../components/DisclaimerBar'
import MobileBottomNav             from '../components/MobileBottomNav'
import { useMediaQuery }           from '../hooks/useMediaQuery'

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
  const [selectedId,    setSelectedId]   = useState<string | null>(null)
  const [query,         setQuery]        = useState('')
  const [isDragging,    setIsDragging]   = useState(false)
  const [uploading,     setUploading]    = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isPhone = useMediaQuery('(max-width: 767px)')
  const useOverlayDrawer = useMediaQuery('(max-width: 1480px)')

  const selectedDoc = selectedId ? MOCK_DOCS.find(d => d.id === selectedId) ?? null : null
  const detailOpen = !!selectedDoc

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

  const closeDetail = () => setSelectedId(null)

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="flex flex-1 overflow-hidden min-h-0 relative">

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0 separator-soft-b">
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
          <div className="flex items-center gap-4 px-5 py-2 text-xs flex-shrink-0 separator-soft-b">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
              {filtered.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  selected={doc.id === selectedId}
                  onClick={() => {
                    setSelectedId(doc.id)
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

        {!useOverlayDrawer && detailOpen && selectedDoc ? (
          <div className="w-[23rem] max-w-[32vw] flex-shrink-0 separator-soft-l">
            <DocumentDetailPanel doc={selectedDoc} onClose={closeDetail} showClose />
          </div>
        ) : null}

        {useOverlayDrawer && detailOpen && selectedDoc ? (
          <>
            <button
              aria-label="Close document details"
              className="absolute inset-0 z-20 bg-slate-950/35 backdrop-blur-[1px]"
              onClick={closeDetail}
            />
            <div
              className={`absolute inset-y-0 right-0 z-30 drawer-surface separator-soft-l transition-transform duration-300 ease-out ${
                isPhone ? 'w-full max-w-full' : 'w-[24rem] max-w-[88vw]'
              }`}
            >
              {isPhone ? (
                <button
                  className="flex items-center gap-2 px-4 py-3 text-sm text-brand separator-soft-b"
                  onClick={closeDetail}
                >
                  <IconArrowLeft size={16} stroke={1.5} />
                  Back to documents
                </button>
              ) : (
                <div className="flex items-center justify-between px-4 py-3 separator-soft-b">
                  <p
                    className="text-secondary font-medium uppercase"
                    style={{ fontSize: 11, letterSpacing: '0.08em' }}
                  >
                    Document details
                  </p>
                  <button
                    data-testid="close-document-drawer"
                    onClick={closeDetail}
                    aria-label="Close document drawer"
                    className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
                  >
                    <IconX size={16} stroke={1.6} />
                  </button>
                </div>
              )}
              <DocumentDetailPanel doc={selectedDoc} />
            </div>
          </>
        ) : null}
      </div>

      <DisclaimerBar />
      <MobileBottomNav activeTab="docs" />
    </div>
  )
}
