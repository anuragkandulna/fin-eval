// Standalone chat route — currently redirected to Dashboard (/ route)
// which embeds ChatPanel in its right column.
// This file is kept so existing Playwright test imports don't break.
import ChatPanel from '../components/ChatPanel'

export default function Chat() {
  return (
    <div className="flex-1 flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>
      <ChatPanel />
    </div>
  )
}
