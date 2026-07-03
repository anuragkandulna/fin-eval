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
          ['Category',     doc.category.replace(/-/g, ' ')],
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
      <div className="px-4 py-4 separator-soft-t">
        <p
          className="text-secondary font-medium uppercase mb-3"
          style={{ fontSize: 11, letterSpacing: '0.08em' }}
        >
          Actions
        </p>
        <div className="flex flex-col gap-2">
          {[
            { testid: 'reindex-doc',  Icon: IconRefresh,  label: 'Re-index' },
            { testid: 'download-doc', Icon: IconDownload, label: 'Download' },
            { testid: 'archive-doc',  Icon: IconArchive,  label: 'Archive'  },
          ].map(({ testid, Icon, label }) => (
            <button
              key={testid}
              data-testid={testid}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink rounded-lg hover:bg-brand-tint transition-colors"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <Icon size={14} stroke={1.5} className="text-secondary flex-shrink-0" />
              {label}
            </button>
          ))}

          <button
            data-testid="remove-doc"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-fail rounded-lg hover:bg-brand-tint transition-colors"
            style={{ border: '1px solid color-mix(in srgb, var(--color-fail) 30%, transparent)' }}
          >
            <IconTrash size={14} stroke={1.5} className="flex-shrink-0" />
            Delete
          </button>
        </div>
      </div>
    </aside>
  )
}
