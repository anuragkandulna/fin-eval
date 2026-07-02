import { useRef, useState, useEffect } from 'react'
import ChatPanel from './ChatPanel'

interface Props {
  open:    boolean
  onClose: () => void
}

export default function MobileChatSheet({ open, onClose }: Props) {
  const [expanded,  setExpanded]  = useState(false)
  const startYRef   = useRef(0)
  const draggingRef = useRef(false)

  // Reset to half-height each time the sheet opens
  useEffect(() => {
    if (open) setExpanded(false)
  }, [open])

  if (!open) return null

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startYRef.current   = e.clientY
    draggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    const delta = e.clientY - startYRef.current
    if      (delta < -40 && !expanded) setExpanded(true)
    else if (delta >  40 &&  expanded) setExpanded(false)
    else if (delta >  40 && !expanded) onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[98] bg-ink/40 backdrop-blur-sm md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Finance advisor"
        className="fixed bottom-0 left-0 right-0 z-[99] md:hidden flex flex-col rounded-t-2xl bg-card overflow-hidden"
        style={{
          height:     expanded ? '94dvh' : '64vh',
          transition: 'height 300ms cubic-bezier(0.32, 0.72, 0, 1)',
          animation:  'sheetIn 280ms cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow:  '0 -8px 32px -8px var(--pane-shadow)',
          border:     '1px solid var(--color-border)',
          borderBottom: 'none',
        }}
      >
        {/* Drag handle — only this zone is draggable */}
        <div
          data-testid="sheet-drag-handle"
          className="flex-shrink-0 pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: 'var(--color-border)' }}
          />
        </div>

        {/* Chat panel fills remaining height */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatPanel onClose={onClose} />
        </div>
      </div>
    </>
  )
}
