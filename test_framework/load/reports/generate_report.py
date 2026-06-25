from datetime import datetime
from pathlib import Path
from jinja2 import Environment, BaseLoader

LOAD_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>FinEval — Load Test Report</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:1100px;margin:40px auto;padding:0 20px;color:#1f2937}
  h1{font-size:22px;font-weight:700;margin-bottom:4px}
  .meta{color:#6b7280;font-size:13px;margin-bottom:32px}
  .summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:32px}
  .card{border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center}
  .label{font-size:11px;color:#6b7280;margin-bottom:4px;text-transform:uppercase}
  .val{font-size:26px;font-weight:700}
  .pass{color:#16a34a}.fail{color:#dc2626}.warn{color:#d97706}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:32px}
  th{background:#f9fafb;text-align:left;padding:10px 12px;border-bottom:2px solid #e5e7eb;font-weight:600}
  td{padding:9px 12px;border-bottom:1px solid #f3f4f6}
  tr:hover td{background:#f9fafb}
  .ep{font-family:monospace;font-size:12px}
</style>
</head>
<body>
<h1>FinEval — Load Test Report</h1>
<div class="meta">Generated: {{ generated_at }} · Users: {{ users }} · Duration: {{ duration }}s</div>
<table>
  <thead>
    <tr>
      <th>Endpoint</th><th>Requests</th><th>Errors</th><th>Error %</th>
      <th>Avg</th><th>p50</th><th>p90</th><th>p95</th><th>p99</th><th>Max</th>
    </tr>
  </thead>
  <tbody>
    {% for ep, s in stats.items() %}
    <tr>
      <td class="ep">/{{ ep }}</td>
      <td>{{ s.count }}</td>
      <td class="{{ 'fail' if s.errors > 0 else '' }}">{{ s.errors }}</td>
      <td class="{{ 'fail' if s.error_rate >= 5 else 'warn' if s.error_rate >= 1 else 'pass' }}">
        {{ s.error_rate }}%
      </td>
      <td>{{ s.avg }}</td><td>{{ s.p50 }}</td><td>{{ s.p90 }}</td>
      <td class="{{ 'pass' if s.p95 < 5000 else 'fail' }}">{{ s.p95 }}</td>
      <td>{{ s.p99 }}</td><td>{{ s.max }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>
</body>
</html>"""


def generate_load_report(
    stats: dict,
    output_path: str,
    users: int = 20,
    duration: int = 60,
):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    html = Environment(loader=BaseLoader()).from_string(LOAD_TEMPLATE).render(
        stats=stats,
        generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        users=users,
        duration=duration,
    )
    Path(output_path).write_text(html)
    print(f"Load report → {output_path}")
