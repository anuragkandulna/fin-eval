import { useState, useRef, useCallback } from 'react'
import {
  IconX,
  IconCloudUpload,
  IconFile,
  IconFileTypePdf,
  IconCheck,
  IconAlertCircle,
  IconTrash,
} from '@tabler/icons-react'

const MAX_FILES = 5
const MAX_BYTES = 2 * 1024 * 1024  // 2 MB

interface FileItem {
  id:       string
  file:     File
  status:   'pending' | 'uploading' | 'done' | 'error'
  progress: number
  error?:   string
}

interface Props {
  onClose: () => void
}

// POST /documents/upload — see docs/api-endpoints.md
async function stubUploadFile(_file: File, onProgress: (p: number) => void): Promise<void> {
  return new Promise(resolve => {
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 14 + 5
      if (p >= 100) {
        clearInterval(iv)
        onProgress(100)
        resolve()
      } else {
        onProgress(Math.min(p, 99))
      }
    }, 80)
  })
}

export default function UploadModal({ onClose }: Props) {
  const [files,      setFiles]      = useState<FileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    setFiles(prev => {
      const slots = MAX_FILES - prev.length
      if (slots <= 0) return prev
      const additions: FileItem[] = arr.slice(0, slots).map(file => ({
        id:       `${Date.now()}-${Math.random()}`,
        file,
        status:   file.size > MAX_BYTES ? 'error' : 'pending',
        progress: 0,
        error:    file.size > MAX_BYTES ? 'Exceeds 2 MB limit' : undefined,
      }))
      return [...prev, ...additions]
    })
  }, [])

  const removeFile = (id: string) =>
    setFiles(prev => prev.filter(f => f.id !== id))

  const handleUpload = async () => {
    const pending = files.filter(f => f.status === 'pending')
    if (!pending.length) return

    setFiles(prev =>
      prev.map(f => pending.find(p => p.id === f.id) ? { ...f, status: 'uploading' } : f)
    )

    await Promise.all(pending.map(item =>
      stubUploadFile(item.file, progress => {
        setFiles(prev =>
          prev.map(f => f.id === item.id
            ? { ...f, progress, status: progress === 100 ? 'done' : 'uploading' }
            : f
          )
        )
      })
    ))
  }

  const canUpload = files.some(f => f.status === 'pending')
  const allSettled = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error')

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
      <div
        className="bg-card rounded-xl w-[540px] max-w-full max-h-[82vh] flex flex-col shadow-xl"
        style={{ border: '0.5px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 separator-soft-b flex-shrink-0">
          <p className="text-sm font-semibold text-ink">Upload Documents</p>
          <button
            data-testid="upload-modal-close"
            onClick={onClose}
            aria-label="Close upload modal"
            className="w-8 h-8 flex items-center justify-center rounded-md text-secondary hover:text-ink hover:bg-brand-tint transition-colors"
          >
            <IconX size={16} stroke={1.6} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          data-testid="drop-zone"
          className={`mx-5 mt-4 rounded-lg flex flex-col items-center gap-2 py-7 cursor-pointer transition-colors flex-shrink-0 ${
            isDragging ? 'bg-brand-tint' : 'hover:bg-brand-tint'
          }`}
          style={{
            border: `1.5px dashed var(--color-${isDragging ? 'brand' : 'border'})`,
          }}
        >
          <IconCloudUpload size={26} stroke={1.5} className={isDragging ? 'text-brand' : 'text-secondary'} />
          <p className="text-sm text-secondary">
            Drop files or{' '}
            <span className="text-brand font-medium">browse</span>
          </p>
          <p className="text-xs text-secondary">
            PDF, TXT, MD, DOCX, CSV · max 2 MB per file · up to {MAX_FILES} files
          </p>
          <input
            ref={inputRef}
            data-testid="file-upload"
            type="file"
            multiple
            accept=".pdf,.txt,.md,.docx,.csv"
            className="hidden"
            onChange={e => {
              if (e.target.files) addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2 min-h-0">
            {files.map(item => {
              const isPdf = item.file.name.toLowerCase().endsWith('.pdf')
              const FileIcon = isPdf ? IconFileTypePdf : IconFile
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-snow rounded-lg px-3 py-2.5 border-thin"
                >
                  <FileIcon size={18} stroke={1.5} className="text-brand flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-ink font-medium truncate">{item.file.name}</p>
                      <span className="text-xs text-secondary flex-shrink-0">
                        {(item.file.size / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    {item.status === 'error' && (
                      <p className="text-xs text-fail mt-0.5">{item.error}</p>
                    )}
                    {(item.status === 'uploading' || item.status === 'done') && (
                      <div className="mt-1.5 h-1 rounded-full bg-brand-tint overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand transition-all duration-100"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    {item.status === 'pending' && (
                      <p className="text-xs text-secondary mt-0.5">Ready to upload</p>
                    )}
                  </div>

                  {item.status === 'done'  && <IconCheck        size={15} stroke={2.5} className="text-pass flex-shrink-0" />}
                  {item.status === 'error' && <IconAlertCircle  size={15} stroke={1.5} className="text-fail flex-shrink-0" />}
                  {item.status === 'pending' && (
                    <button
                      onClick={() => removeFile(item.id)}
                      aria-label={`Remove ${item.file.name}`}
                      className="w-6 h-6 flex items-center justify-center rounded text-secondary hover:text-fail hover:bg-brand-tint transition-colors flex-shrink-0"
                    >
                      <IconTrash size={13} stroke={1.5} />
                    </button>
                  )}
                </div>
              )
            })}
            {files.length >= MAX_FILES && (
              <p className="text-xs text-secondary text-center py-1">
                Maximum {MAX_FILES} files reached
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 separator-soft-t flex items-center justify-between gap-3 flex-shrink-0">
          <p className="text-xs text-secondary">{files.length} / {MAX_FILES} files</p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-secondary rounded-md hover:bg-brand-tint transition-colors border-thin"
            >
              {allSettled ? 'Close' : 'Cancel'}
            </button>
            {!allSettled && (
              <button
                data-testid="upload-confirm"
                onClick={handleUpload}
                disabled={!canUpload}
                className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-md hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Upload
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
