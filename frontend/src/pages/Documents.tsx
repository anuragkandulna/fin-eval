import { useState, useMemo, useRef } from 'react'
import {
  IconSearch,
  IconFilter,
  IconUpload,
  IconArrowLeft,
  IconX,
  IconArrowsSort,
  IconArrowUp,
  IconArrowDown,
} from '@tabler/icons-react'
import DocumentCard, { type Doc } from '../components/DocumentCard'
import DocumentDetailPanel         from '../components/DocumentDetailPanel'
import DisclaimerBar               from '../components/DisclaimerBar'
import MobileBottomNav             from '../components/MobileBottomNav'
import UploadModal                 from '../components/UploadModal'
import { useMediaQuery }           from '../hooks/useMediaQuery'

type FilterBy = 'none' | 'size' | 'date-created' | 'date-modified'
type SortDir  = 'default' | 'asc' | 'desc'

const now = Date.now()

const MOCK_DOCS: Doc[] = [
  { id: '1', name: 'budgeting_basics.txt',    size: '18.4 KB', sizeBytes: 18841,  type: 'TXT', chunks: 48, timestamp: '2h ago',   dateCreated: now - 7_200_000,  dateModified: now - 7_200_000,  status: 'indexed',    compressionRatio: 0.68 },
  { id: '2', name: 'debt_management.txt',      size: '22.1 KB', sizeBytes: 22630,  type: 'TXT', chunks: 52, timestamp: '2h ago',   dateCreated: now - 7_300_000,  dateModified: now - 7_200_000,  status: 'indexed',    compressionRatio: 0.71 },
  { id: '3', name: 'savings_investing.txt',    size: '33.8 KB', sizeBytes: 34611,  type: 'TXT', chunks: 61, timestamp: '3h ago',   dateCreated: now - 10_800_000, dateModified: now - 10_800_000, status: 'indexed',    compressionRatio: 0.73 },
  { id: '4', name: 'india_finance_basics.txt', size: '26.3 KB', sizeBytes: 26931,  type: 'TXT', chunks: 71, timestamp: '3h ago',   dateCreated: now - 11_000_000, dateModified: now - 10_900_000, status: 'indexed',    compressionRatio: 0.69 },
  { id: '5', name: 'salary_slip_june.pdf',     size: '34.8 KB', sizeBytes: 35635,  type: 'PDF', chunks: 12, timestamp: '1h ago',   dateCreated: now - 3_600_000,  dateModified: now - 3_600_000,  status: 'indexed',    compressionRatio: 0.62 },
  { id: '6', name: 'bank_statement_q2.pdf',    size: '204 KB',  sizeBytes: 208896, type: 'PDF', chunks: 0,  timestamp: 'just now', dateCreated: now - 120_000,    dateModified: now - 60_000,     status: 'processing', compressionRatio: 0.58 },
]

const INDEXED_COUNT    = MOCK_DOCS.filter(d => d.status === 'indexed').length
const PROCESSING_COUNT = MOCK_DOCS.filter(d => d.status === 'processing').length

const FILTER_OPTIONS: { value: FilterBy; label: string }[] = [
  { value: 'none',          label: 'Default' },
  { value: 'size',          label: 'By size' },
  { value: 'date-created',  label: 'By date created' },
  { value: 'date-modified', label: 'By date modified' },
]

export default function Documents() {
  const [selectedId,    setSelectedId]   = useState<string | null>(null)
  const [query,         setQuery]        = useState('')
  const [filterBy,      setFilterBy]     = useState<FilterBy>('none')
  const [sortDir,       setSortDir]      = useState<SortDir>('default')
  const [filterOpen,    setFilterOpen]   = useState(false)
  const [uploadOpen,    setUploadOpen]   = useState(false)

  const filterBtnRef = useRef<HTMLDivElement>(null)
  const isPhone         = useMediaQuery('(max-width: 767px)')
  const useOverlayDrawer = useMediaQuery('(max-width: 1480px)')

  const selectedDoc = selectedId ? MOCK_DOCS.find(d => d.id === selectedId) ?? null : null
  const detailOpen  = !!selectedDoc

  const closeDetail = () => setSelectedId(null)

  const cycleSortDir = () =>
    setSortDir(prev => prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default')

  const SortIcon = sortDir === 'asc' ? IconArrowUp : sortDir === 'desc' ? IconArrowDown : IconArrowsSort

  const filtered = useMemo(() => {
    const base = query.trim()
      ? MOCK_DOCS.filter(d => d.name.toLowerCase().includes(query.toLowerCase()))
      : [...MOCK_DOCS]

    if (sortDir === 'default' && filterBy === 'none') return base

    const getVal = (doc: Doc): number => {
      if (filterBy === 'size')          return doc.sizeBytes
      if (filterBy === 'date-created')  return doc.dateCreated
      if (filterBy === 'date-modified') return doc.dateModified
      return doc.name.toLowerCase().charCodeAt(0)
    }

    return base.sort((a, b) => {
      const diff = getVal(a) - getVal(b)
      return sortDir === 'desc' ? -diff : diff
    })
  }, [query, filterBy, sortDir])

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="flex flex-1 overflow-hidden min-h-0 relative">

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Toolbar */}
          <div className="flex items-center gap-2 px-5 py-3 flex-shrink-0 separator-soft-b">
            {/* Search */}
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

            {/* Filter dropdown */}
            <div ref={filterBtnRef} className="relative">
              <button
                data-testid="doc-filter"
                onClick={() => setFilterOpen(p => !p)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterBy !== 'none'
                    ? 'text-brand bg-brand-tint'
                    : 'text-secondary hover:bg-brand-tint'
                }`}
                style={{ border: '0.5px solid var(--color-border)' }}
              >
                <IconFilter size={14} stroke={1.5} />
                {filterBy === 'none' ? 'Filter' : FILTER_OPTIONS.find(o => o.value === filterBy)?.label}
              </button>

              {filterOpen && (
                <div
                  className="absolute top-full mt-1 left-0 z-30 bg-card rounded-lg py-1 min-w-[168px] shadow-lg"
                  style={{ border: '0.5px solid var(--color-border)' }}
                >
                  {FILTER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setFilterBy(opt.value); setFilterOpen(false) }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        filterBy === opt.value
                          ? 'text-brand bg-brand-tint'
                          : 'text-ink hover:bg-brand-tint'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort direction */}
            <button
              data-testid="doc-sort"
              onClick={cycleSortDir}
              aria-label={`Sort: ${sortDir}`}
              title={`Sort: ${sortDir}`}
              className={`w-9 h-9 flex items-center justify-center rounded-md transition-colors ${
                sortDir !== 'default'
                  ? 'text-brand bg-brand-tint'
                  : 'text-secondary hover:bg-brand-tint'
              }`}
              style={{ border: '0.5px solid var(--color-border)' }}
            >
              <SortIcon size={16} stroke={1.5} />
            </button>

            {/* Upload */}
            <button
              data-testid="upload-button"
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-sm font-medium rounded-md hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <IconUpload size={14} stroke={2} />
              <span className="hidden sm:inline">Upload document</span>
              <span className="sm:hidden">Upload</span>
            </button>
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
              Collection <span className="font-mono text-ink">finance_docs</span>
            </span>
          </div>

          {/* Document grid */}
          <div
            className="flex-1 overflow-y-auto px-5 py-4"
            onClick={() => filterOpen && setFilterOpen(false)}
          >
            <p
              className="text-secondary font-medium uppercase mb-3"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              Knowledge base documents
            </p>

            {filtered.length === 0 ? (
              <p className="text-sm text-secondary py-8 text-center">No documents match your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    selected={doc.id === selectedId}
                    onClick={() => setSelectedId(doc.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail panel — inline on wide screens */}
        {!useOverlayDrawer && detailOpen && selectedDoc ? (
          <div className="w-[23rem] max-w-[32vw] flex-shrink-0 separator-soft-l">
            <DocumentDetailPanel doc={selectedDoc} onClose={closeDetail} showClose />
          </div>
        ) : null}

        {/* Detail panel — overlay drawer on narrow screens */}
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
                  className="flex items-center gap-2 px-4 py-3 text-sm text-brand separator-soft-b w-full"
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

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </div>
  )
}
