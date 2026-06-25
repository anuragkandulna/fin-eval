import json
import time
import statistics
from contextlib import contextmanager
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional


@dataclass
class ActionRecord:
    action:      str
    start_ts:    float
    end_ts:      float
    duration_ms: float
    iteration:   int
    metadata:    dict  = field(default_factory=dict)
    timestamp:   str   = field(default_factory=lambda: datetime.utcnow().isoformat())


class MetricsEmitter:
    def __init__(self, output_path: str = "data/metrics.jsonl"):
        self.output_path = Path(output_path)
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        self._records: list[ActionRecord] = []

    def record(
        self,
        action: str,
        start_ts: float,
        end_ts: float,
        iteration: int = 1,
        metadata: Optional[dict] = None,
    ) -> ActionRecord:
        duration_ms = (end_ts - start_ts) * 1000
        record = ActionRecord(
            action=action,
            start_ts=start_ts,
            end_ts=end_ts,
            duration_ms=round(duration_ms, 2),
            iteration=iteration,
            metadata=metadata or {},
        )
        self._records.append(record)
        with open(self.output_path, "a") as f:
            f.write(json.dumps(asdict(record)) + "\n")
        return record

    @contextmanager
    def measure(self, action: str, iteration: int = 1, metadata: Optional[dict] = None):
        start = time.perf_counter()
        try:
            yield
        finally:
            self.record(action, start, time.perf_counter(), iteration, metadata)

    def compute_stats(self, action: Optional[str] = None) -> dict:
        records = [r for r in self._records if r.action == action] if action else self._records
        if not records:
            return {}
        durations = sorted(r.duration_ms for r in records)
        n = len(durations)

        def pct(p):
            return round(durations[max(0, int(n * p / 100) - 1)], 2)

        return {
            "action": action or "all",
            "count":  n,
            "min":    round(min(durations), 2),
            "max":    round(max(durations), 2),
            "avg":    round(statistics.mean(durations), 2),
            "p50":    pct(50),
            "p75":    pct(75),
            "p90":    pct(90),
            "p95":    pct(95),
            "p99":    pct(99),
        }

    def all_stats(self) -> list[dict]:
        actions = sorted({r.action for r in self._records})
        return [self.compute_stats(a) for a in actions]

    def clear(self):
        self._records = []
