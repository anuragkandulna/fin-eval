import { IconCheck, IconFileText, IconFileTypePdf } from '@tabler/icons-react'
import type { Doc } from './DocumentCard'

interface Props {
  doc: Doc
}

interface ProgressBarProps {
  label:  string
  value:  number
  max?:   number
  color?: string
}

function ProgressBar({ label, value, max = 100, color = 'var(--color-brand)' }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-secondary w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-brand-tint overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono text-ink w-8 text-right flex-shrink-0">
        {value < 1 ? value.toFixed(2) : `${value}${value <= 1 ? '' : ''}`}
      </span>
    </div>
  )
}

const DETAIL_INFO = {
  chunkSize:  '512 tokens',
  overlap:    '64 tokens',
  embedding:  'text-embed-3-small',
  collection: 'finance_docs',
}

const EVAL = {
  testCases:    { value: 14,   max: 20 },
  faithfulness: { value: 0.82, max: 1 },
  retrieval:    { value: 91,   max: 100 },
}

export default function DocumentDetailPanel({ doc }: Props) {
  const Icon = doc.type === 'PDF' ? IconFileTypePdf : IconFileText

  return (
    <aside
      className="w-72 flex-shrink-0 flex flex-col bg-card overflow-y-auto"
      style={{ borderLeft: '0.5px solid var(--color-border)' }}
    >
      {/* Document header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '0.5px solid var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-secondary">{doc.timestamp} · {doc.size}</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-md bg-brand-tint flex items-center justify-center">
            <Icon size={16} stroke={1.5} className="text-brand" />
          </div>
          <p className="text-sm font-semibold text-ink">{doc.name}</p>
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

      {/* Document info */}
      <div className="px-4 py-3" style={{ borderBottom: '0.5px solid var(--color-border)' }}>
        <p
          className="text-secondary font-medium uppercase mb-2"
          style={{ fontSize: 11, letterSpacing: '0.08em' }}
        >
          Document info
        </p>
        {[
          ['Chunks',     String(doc.chunks)],
          ['Chunk size', DETAIL_INFO.chunkSize],
          ['Overlap',    DETAIL_INFO.overlap],
          ['Embedding',  DETAIL_INFO.embedding],
          ['Collection', DETAIL_INFO.collection],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between py-1">
            <span className="text-xs text-secondary">{k}</span>
            <span className="text-xs font-mono text-ink">{v}</span>
          </div>
        ))}
      </div>

      {/* Eval coverage */}
      <div className="px-4 py-3" style={{ borderBottom: '0.5px solid var(--color-border)' }}>
        <p
          className="text-secondary font-medium uppercase mb-3"
          style={{ fontSize: 11, letterSpacing: '0.08em' }}
        >
          Eval coverage
        </p>
        <div className="flex flex-col gap-2.5">
          <ProgressBar label="Test cases"    value={EVAL.testCases.value}    max={EVAL.testCases.max} />
          <ProgressBar label="Faithfulness"  value={EVAL.faithfulness.value} max={EVAL.faithfulness.max} color="var(--color-pass)" />
          <ProgressBar label="Retrieval hits" value={EVAL.retrieval.value}   max={EVAL.retrieval.max} />
        </div>
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
          data-testid="ask-about-doc"
          className="w-full py-2 bg-brand text-white text-sm font-medium rounded-md hover:opacity-80 transition-opacity"
        >
          Ask about this document
        </button>
        <button
          data-testid="reindex-doc"
          className="w-full py-2 text-sm text-ink rounded-md hover:bg-brand-tint transition-colors"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          Re-index
        </button>
        <button
          data-testid="download-doc"
          className="w-full py-2 text-sm text-ink rounded-md hover:bg-brand-tint transition-colors"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          Download original
        </button>
        <button
          data-testid="remove-doc"
          className="w-full py-2 text-sm text-fail rounded-md hover:bg-brand-tint transition-colors"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          Remove from knowledge base
        </button>
      </div>
    </aside>
  )
}
