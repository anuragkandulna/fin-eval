import { IconChartBar } from '@tabler/icons-react'
import MobileBottomNav from '../components/MobileBottomNav'

export default function Reports() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-16 text-center">
        <div className="w-16 h-16 rounded-lg bg-brand-tint flex items-center justify-center">
          <IconChartBar size={32} stroke={1.5} className="text-brand" />
        </div>
        <div>
          <p className="text-lg font-semibold text-ink">No eval runs yet</p>
          <p className="text-sm text-secondary mt-1">
            Push to main to trigger the pipeline.
          </p>
        </div>
        <p className="text-xs text-secondary font-mono max-w-xs">
          MLflow experiment: fineval-production · ci_gate.py thresholds: faithfulness ≥ 0.70, hallucination ≤ 0.20
        </p>
      </div>
      <MobileBottomNav activeTab="dashboard" />
    </div>
  )
}
