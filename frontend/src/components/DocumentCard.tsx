import { IconFileText, IconFileTypePdf, IconCheck, IconLoader } from '@tabler/icons-react'

export interface Doc {
  id:        string
  name:      string
  size:      string
  type:      'TXT' | 'PDF'
  chunks:    number
  timestamp: string
  status:    'indexed' | 'processing'
}

interface Props {
  doc:       Doc
  selected:  boolean
  onClick:   () => void
}

export default function DocumentCard({ doc, selected, onClick }: Props) {
  const Icon = doc.type === 'PDF' ? IconFileTypePdf : IconFileText

  return (
    <button
      data-testid={`doc-card-${doc.id}`}
      onClick={onClick}
      className={`text-left w-full rounded-lg p-3 transition-colors flex flex-col gap-2 ${
        selected ? 'border-accent' : 'border-thin hover:bg-brand-tint'
      } bg-card`}
    >
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-md bg-brand-tint flex items-center justify-center flex-shrink-0">
          <Icon size={16} stroke={1.5} className="text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink truncate leading-tight">{doc.name}</p>
          <p className="text-xs text-secondary mt-0.5">
            {doc.size} · {doc.timestamp}
          </p>
        </div>
        <span className="text-[10px] font-medium text-secondary bg-brand-tint rounded px-1.5 py-0.5 flex-shrink-0">
          {doc.type}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {doc.status === 'indexed' ? (
          <>
            <IconCheck size={12} stroke={2.5} className="text-pass" />
            <span className="text-xs text-pass font-medium">Indexed</span>
          </>
        ) : (
          <>
            <IconLoader size={12} stroke={2} className="text-brand animate-spin" />
            <span className="text-xs text-brand font-medium">Processing</span>
          </>
        )}
      </div>
    </button>
  )
}
