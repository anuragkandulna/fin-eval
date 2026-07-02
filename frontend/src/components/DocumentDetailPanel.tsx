import {
  IconCheck,
  IconFileText,
  IconFileTypePdf,
  IconX,
  IconRefresh,
  IconDownload,
  IconTrash,
  IconArchive,
} from '@tabler/icons-react'
import type { Doc } from './DocumentCard'

interface Props {
  doc:       Doc
  onClose?:  () => void
  showClose?: boolean
}

export default function DocumentDetailPanel({ doc, onClose, showClose = false }: Props) {
  const Icon = doc.type === 'PDF' ? IconFileTypePdf : IconFileText
  const compressionPct = Math.round(doc.compressionRatio * 100)

  return (
    <aside className="h-full flex flex-col bg-card overflow-y-auto drawer-surface">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 separator-soft-b">
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="text-xs text-secondary truncate">{doc.timestamp} · {doc.size}</span>
          {showClose && onClose ? (
            <button
              data-testid="close-document-detail"
              onClick={onClose}
              aria-label="Close document detail"
              className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-ink hover:bg-brand-tint transition-colors flex-shrink-0"
            >
              <IconX size={16} stroke={1.6} />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-md bg-brand-tint flex items-center justify-center">
            <Icon size={16} stroke={1.5} className="text-brand" />
          </div>
          <p className="text-sm font-semibold text-ink break-all">{doc.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-pass font-medium status-pass rounded px-1.5 py-0.5">
            <IconCheck size={10} stroke={2.5} /> Indexed
          </span>
          <span className="text-xs font-medium text-secondary bg-brand-tint rounded px-1.5 py-0.5">
            {doc.type}
          </span>
        </div>
      </div>

      {/* AI extract */}
      {doc.aiExtract && Object.keys(doc.aiExtract).length > 0 && (
        <div className="px-4 py-3 separator-soft-b">
          <p
            className="text-secondary font-medium uppercase mb-2"
            style={{ fontSize: 11, letterSpacing: '0.08em' }}
          >
            AI extract
          </p>
          <div
            className="rounded-md px-3 py-2.5"
            style={{ background: 'var(--color-brand-tint)', border: '0.5px solid var(--color-grid)' }}
          >
            {Object.entries(doc.aiExtract).map(([k, v]) => (
              <div key={k} className="flex justify-between py-0.5">
                <span className="text-xs text-secondary">{k}</span>
                <span className="text-xs font-mono text-ink">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="px-4 py-3 separator-soft-b">
        <p
          className="text-secondary font-medium uppercase mb-2"
          style={{ fontSize: 11, letterSpacing: '0.08em' }}
        >
          Details
        </p>
        {([
          ['Collection',   'finance_docs'],
          ['Vector ratio', `${compressionPct}% compressed`],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} className="flex justify-between py-1">
            <span className="text-xs text-secondary">{k}</span>
            <span className="text-xs font-mono text-ink">{v}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <p
          className="text-secondary font-medium uppercase mb-1"
          style={{ fontSize: 11, letterSpacing: '0.08em' }}
        >
          Actions
        </p>
        <button
          data-testid="reindex-doc"
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-ink rounded-md hover:bg-brand-tint transition-colors"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <IconRefresh size={14} stroke={1.5} /> Re-index
        </button>
        <button
          data-testid="download-doc"
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-ink rounded-md hover:bg-brand-tint transition-colors"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <IconDownload size={14} stroke={1.5} /> Download
        </button>
        <button
          data-testid="archive-doc"
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-ink rounded-md hover:bg-brand-tint transition-colors"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <IconArchive size={14} stroke={1.5} /> Archive
        </button>
        <button
          data-testid="remove-doc"
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-fail rounded-md hover:bg-brand-tint transition-colors"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <IconTrash size={14} stroke={1.5} /> Delete
        </button>
      </div>
    </aside>
  )
}
