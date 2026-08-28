import { useState, useMemo, useRef } from 'react'
import { useQuery, useQueryClient }  from '@tanstack/react-query'
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
import DocumentCard, { type Doc, type DocCategory } from '../components/DocumentCard'
import DocumentDetailPanel         from '../components/DocumentDetailPanel'
import UploadModal                 from '../components/UploadModal'
import { useMediaQuery }           from '../hooks/useMediaQuery'
import { getDocuments, type DocumentListItem } from '../api/client'

type FilterBy   = 'none' | 'size' | 'date-created' | 'date-modified'
type SortDir    = 'default' | 'asc' | 'desc'
type ActiveCat  = 'all' | DocCategory

const CATEGORY_TABS: { value: ActiveCat; label: string }[] = [
  { value: 'all',            label: 'All'             },
  { value: 'salary-slip',    label: 'Salary slips'    },
  { value: 'bank-statement', label: 'Bank statements' },
  { value: 'invoice',        label: 'Invoices'        },
  { value: 'tax-document',   label: 'Tax documents'   },
  { value: 'insurance',      label: 'Insurance'       },
  { value: 'investment',     label: 'Investments'     },
]

function inferCategory(filename: string): DocCategory {
  const l = filename.toLowerCase()
  if (l.includes('salary') || l.includes('payslip') || l.includes('pay_slip')) return 'salary-slip'
  if (l.includes('bank') || l.includes('statement'))                           return 'bank-statement'
  if (l.includes('invoice') || l.includes('bill'))                             return 'invoice'
  if (l.includes('tax') || l.includes('itr') || l.includes('form16') || l.includes('india_finance')) return 'tax-document'
  if (l.includes('insur') || l.includes('policy'))                             return 'insurance'
  if (l.includes('invest') || l.includes('mutual') || l.includes('savings'))  return 'investment'
  return 'other'
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000)         return 'just now'
  if (ms < 3_600_000)      return `${Math.round(ms / 60_000)}m ago`
  if (ms < 86_400_000)     return `${Math.round(ms / 3_600_000)}h ago`
  return `${Math.round(ms / 86_400_000)}d ago`
}

function apiToDoc(item: DocumentListItem): Doc {
  const ext  = item.filename.split('.').pop()?.toUpperCase() ?? 'FILE'
  const ts   = new Date(item.created_at).getTime()
  return {
    id:               item.doc_id,
    name:             item.filename,
    size:             '—',
    sizeBytes:        0,
    type:             ext as Doc['type'],
    chunks:           item.chunk_count,
    timestamp:        relativeTime(item.created_at),
    dateCreated:      ts,
    dateModified:     ts,
    status:           item.status,
    compressionRatio: 0,
    category:         inferCategory(item.filename),
  }
}

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
  const [activeCat,     setActiveCat]    = useState<ActiveCat>('all')

  const queryClient = useQueryClient()
  const { data: apiDocs = [] } = useQuery({
    queryKey: ['documents'],
    queryFn:  getDocuments,
    staleTime: 30_000,
  })
  const DOCS: Doc[] = useMemo(() => apiDocs.map(apiToDoc), [apiDocs])

  const INDEXED_COUNT    = DOCS.filter(d => d.status === 'indexed').length
  const PROCESSING_COUNT = DOCS.filter(d => d.status === 'processing').length

  const filterBtnRef = useRef<HTMLDivElement>(null)
  const isPhone         = useMediaQuery('(max-width: 767px)')
  const useOverlayDrawer = useMediaQuery('(max-width: 1480px)')

  const selectedDoc = selectedId ? DOCS.find(d => d.id === selectedId) ?? null : null
  const detailOpen  = !!selectedDoc

  const closeDetail = () => setSelectedId(null)

  const cycleSortDir = () =>
    setSortDir(prev => prev === 'default' ? 'asc' : prev === 'asc' ? 'desc' : 'default')

  const SortIcon = sortDir === 'asc' ? IconArrowUp : sortDir === 'desc' ? IconArrowDown : IconArrowsSort

  const filtered = useMemo(() => {
    const base = DOCS.filter(d => {
      const matchesQuery = !query.trim() || d.name.toLowerCase().includes(query.toLowerCase())
      const matchesCat   = activeCat === 'all' || d.category === activeCat
      return matchesQuery && matchesCat
    })

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
  }, [DOCS, query, activeCat, filterBy, sortDir])

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
                aria-haspopup="listbox"
                aria-expanded={filterOpen}
                aria-label={`Sort by: ${filterBy === 'none' ? 'default' : FILTER_OPTIONS.find(o => o.value === filterBy)?.label}`}
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
                <ul
                  role="listbox"
                  aria-label="Sort options"
                  className="absolute top-full mt-1 left-0 z-30 bg-card rounded-lg py-1 min-w-[168px] shadow-lg list-none m-0 p-0"
                  style={{ border: '0.5px solid var(--color-border)' }}
                >
                  {FILTER_OPTIONS.map(opt => (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={filterBy === opt.value}
                    >
                      <button
                        data-testid={`doc-filter-${opt.value}`}
                        onClick={() => { setFilterBy(opt.value); setFilterOpen(false) }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          filterBy === opt.value
                            ? 'text-brand bg-brand-tint'
                            : 'text-ink hover:bg-brand-tint'
                        }`}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
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
              <span className="hidden sm:inline">Upload</span>
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

          {/* Category tabs */}
          <div className="flex items-center gap-1 px-5 py-2 flex-shrink-0 separator-soft-b overflow-x-auto">
            {CATEGORY_TABS.map(tab => {
              const count = tab.value === 'all'
                ? DOCS.length
                : DOCS.filter(d => d.category === tab.value).length
              return (
                <button
                  key={tab.value}
                  data-testid={`doc-cat-${tab.value}`}
                  onClick={() => setActiveCat(tab.value)}
                  aria-pressed={activeCat === tab.value}
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
                    activeCat === tab.value
                      ? 'bg-brand text-white font-medium'
                      : 'text-secondary hover:text-ink hover:bg-brand-tint'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`text-[10px] rounded px-1 ${activeCat === tab.value ? 'bg-white/20' : 'bg-brand-tint text-secondary'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
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

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['documents'] })}
        />
      )}
    </div>
  )
}
