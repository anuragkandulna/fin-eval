export default function StatusBar() {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2 text-xs flex-wrap"
      style={{ borderTop: '0.5px solid var(--color-border)' }}
    >
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-pass flex-shrink-0" />
        <span className="text-pass font-medium">CI gate passed</span>
      </span>

      <span className="text-bdr select-none">|</span>
      <span className="text-secondary">
        Faithfulness <span className="font-mono text-ink">0.82</span>
      </span>

      <span className="text-bdr select-none">|</span>
      <span className="text-secondary">
        Hallucination <span className="font-mono text-ink">0.11</span>
      </span>

      <span className="text-bdr select-none">|</span>
      <span className="text-secondary">
        Prompt <span className="font-mono text-ink">v3</span>
      </span>

      <span className="text-bdr select-none">|</span>
      <span className="text-secondary">
        Last run <span className="text-ink">2h ago</span>
      </span>
    </div>
  )
}
