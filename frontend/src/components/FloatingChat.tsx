import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { IconMessageCircle2, IconGripVertical } from '@tabler/icons-react'
import { useChat } from '../contexts/ChatContext'
import ChatPanel from './ChatPanel'

const BUTTON_SIZE = 56
const PANEL_WIDTH = 380
const PANEL_HEIGHT = 560
const VIEWPORT_PAD = 16
const STORAGE_KEY = 'fineval-chat-launcher-position'

type Point = { x: number; y: number }

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getDefaultPosition(): Point {
  if (typeof window === 'undefined') {
    return { x: 24, y: 24 }
  }

  return {
    x: window.innerWidth - BUTTON_SIZE - 24,
    y: window.innerHeight - BUTTON_SIZE - 24,
  }
}

export default function FloatingChat() {
  const { chatState, setChatState, unread } = useChat()
  const [position, setPosition] = useState<Point>(getDefaultPosition)
  const positionRef = useRef(position)
  const draggingRef = useRef(false)
  const movedRef = useRef(false)
  const startPointRef = useRef<Point>({ x: 0, y: 0 })
  const pointerOffsetRef = useRef<Point>({ x: 0, y: 0 })

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved) as Point
      setPosition({
        x: clamp(parsed.x, VIEWPORT_PAD, window.innerWidth - BUTTON_SIZE - VIEWPORT_PAD),
        y: clamp(parsed.y, VIEWPORT_PAD, window.innerHeight - BUTTON_SIZE - VIEWPORT_PAD),
      })
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setPosition(prev => ({
        x: clamp(prev.x, VIEWPORT_PAD, window.innerWidth - BUTTON_SIZE - VIEWPORT_PAD),
        y: clamp(prev.y, VIEWPORT_PAD, window.innerHeight - BUTTON_SIZE - VIEWPORT_PAD),
      }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true
    movedRef.current = false
    pointerOffsetRef.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    }
    startPointRef.current = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return

    const distance = Math.hypot(
      event.clientX - startPointRef.current.x,
      event.clientY - startPointRef.current.y,
    )
    movedRef.current = distance > 4
    const nextX = clamp(
      event.clientX - pointerOffsetRef.current.x,
      VIEWPORT_PAD,
      window.innerWidth - BUTTON_SIZE - VIEWPORT_PAD,
    )
    const nextY = clamp(
      event.clientY - pointerOffsetRef.current.y,
      VIEWPORT_PAD,
      window.innerHeight - BUTTON_SIZE - VIEWPORT_PAD,
    )

    setPosition({ x: nextX, y: nextY })
  }

  const endDrag = () => {
    if (!draggingRef.current || typeof window === 'undefined') return
    draggingRef.current = false
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(positionRef.current))
  }

  const toggleChat = () => {
    if (movedRef.current) {
      movedRef.current = false
      return
    }

    setChatState(chatState === 'collapsed' ? 'floating' : 'collapsed')
  }

  if (chatState === 'docked') return null

  const panelLeft = clamp(
    position.x - (PANEL_WIDTH - BUTTON_SIZE),
    VIEWPORT_PAD,
    typeof window === 'undefined' ? position.x : window.innerWidth - PANEL_WIDTH - VIEWPORT_PAD,
  )
  const panelTop = clamp(
    position.y - PANEL_HEIGHT - 18,
    VIEWPORT_PAD,
    typeof window === 'undefined' ? position.y : window.innerHeight - PANEL_HEIGHT - VIEWPORT_PAD,
  )

  return (
    <>
      {chatState === 'floating' && (
        <div
          className="hidden md:flex fixed z-[9998] rounded-[22px] pane-surface overflow-hidden"
          style={{
            width: PANEL_WIDTH,
            height: PANEL_HEIGHT,
            left: panelLeft,
            top: panelTop,
            animation: 'floatIn 200ms ease-out',
          }}
        >
          <ChatPanel
            compact
            onMinimize={() => setChatState('collapsed')}
            onDock={() => setChatState('docked')}
            onClose={() => setChatState('collapsed')}
          />
        </div>
      )}

      <button
        data-testid="chat-floating-btn"
        type="button"
        onClick={toggleChat}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label="Open finance advisor"
        className="hidden md:flex fixed items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-[9999] touch-none"
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          left: position.x,
          top: position.y,
          background: 'linear-gradient(180deg, var(--color-brand), color-mix(in srgb, var(--color-brand) 78%, black))',
          border: '1px solid color-mix(in srgb, var(--color-brand) 72%, white)',
          boxShadow: '0 18px 36px -24px var(--pane-shadow)',
        }}
      >
        <div className="absolute left-1.5 top-1.5 opacity-70">
          <IconGripVertical size={12} stroke={2} className="text-white/85" />
        </div>
        <IconMessageCircle2 size={24} stroke={1.9} className="text-white" />
        {unread > 0 && (
          <span
            className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-card animate-pulse"
          />
        )}
      </button>
    </>
  )
}
