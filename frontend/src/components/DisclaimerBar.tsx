import { IconAlertTriangle } from '@tabler/icons-react'

const NOTICE =
  'Do not upload personal or actual financial documents · ' +
  'Management is not responsible for any data or information shared with this tool · ' +
  'This is an interview portfolio project for demonstration purposes only · ' +
  'All financial data and analysis shown is entirely fictional · ' +
  'FinEval is not a registered financial advisor · ' +
  'Nothing on this platform constitutes professional financial advice · ' +
  'For portfolio evaluation and demonstration use only · '

export default function DisclaimerBar() {
  return (
    <div
      className="flex-shrink-0 flex items-center gap-3 px-4 overflow-hidden"
      style={{
        height: 28,
        borderTop: '0.5px solid #D97706',
        background: 'rgba(217, 119, 6, 0.12)',
      }}
    >
      {/* Static label */}
      <span
        className="flex items-center gap-1 font-semibold uppercase flex-shrink-0 select-none"
        style={{ fontSize: 9, letterSpacing: '0.12em', color: '#D97706' }}
      >
        <IconAlertTriangle size={11} stroke={2.5} />
        Notice
      </span>

      <span className="flex-shrink-0 select-none" style={{ color: '#D97706', fontSize: 10 }}>|</span>

      {/* Scrolling ticker — single line */}
      <div className="overflow-hidden flex-1" style={{ lineHeight: '28px' }}>
        <div className="animate-marquee" style={{ whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 10, color: 'var(--disclaimer-text)' }}>{NOTICE}</span>
          <span style={{ fontSize: 10, color: 'var(--disclaimer-text)' }}>{NOTICE}</span>
        </div>
      </div>
    </div>
  )
}
