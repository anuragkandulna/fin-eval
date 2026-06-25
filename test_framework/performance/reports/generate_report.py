from datetime import datetime
from pathlib import Path
from jinja2 import Environment, BaseLoader

PERF_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>FinEval — {{ title }}</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:1100px;margin:40px auto;padding:0 20px;color:#1f2937}
  h1{font-size:22px;font-weight:700;margin-bottom:4px}
  .meta{color:#6b7280;font-size:13px;margin-bottom:32px}
  table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:32px}
  th{background:#f9fafb;text-align:left;padding:10px 12px;border-bottom:2px solid #e5e7eb;font-weight:600}
  td{padding:9px 12px;border-bottom:1px solid #f3f4f6}
  tr:hover td{background:#f9fafb}
  .action{font-family:monospace;font-size:12px}
  .pass{color:#16a34a;font-weight:600}
  .fail{color:#dc2626;font-weight:600}
</style>
</head>
<body>
<h1>FinEval — {{ title }}</h1>
<div class="meta">Generated: {{ generated_at }} · Iterations: {{ iterations }}</div>
<table>
  <thead>
    <tr><th>Action</th><th>Count</th><th>Min</th><th>Avg</th><th>p50</th><th>p75</th><th>p90</th><th>p95 (ms)</th><th>p99</th><th>Max</th></tr>
  </thead>
  <tbody>
    {% for s in stats %}
    <tr>
      <td class="action">{{ s.action }}</td>
      <td>{{ s.count }}</td><td>{{ s.min }}</td><td>{{ s.avg }}</td>
      <td>{{ s.p50 }}</td><td>{{ s.p75 }}</td><td>{{ s.p90 }}</td>
      <td class="{{ 'pass' if s.p95 < 3000 else 'fail' }}">{{ s.p95 }}</td>
      <td>{{ s.p99 }}</td><td>{{ s.max }}</td>
    </tr>
    {% endfor %}
  </tbody>
</table>
</body>
</html>"""

LIGHTHOUSE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>FinEval — Lighthouse Report</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:1000px;margin:40px auto;padding:0 20px;color:#1f2937}
  h1{font-size:22px;font-weight:700}
  .meta{color:#6b7280;font-size:13px;margin-bottom:32px}
  .route{margin-bottom:40px}
  h2{font-size:16px;font-weight:600;margin-bottom:12px;text-transform:capitalize}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:16px}
  .card{border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center}
  .label{font-size:11px;color:#6b7280;margin-bottom:4px;text-transform:uppercase}
  .val{font-size:28px;font-weight:700}
  .g{color:#16a34a}.a{color:#d97706}.r{color:#dc2626}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f9fafb;padding:8px 12px;border-bottom:2px solid #e5e7eb;text-align:left}
  td{padding:8px 12px;border-bottom:1px solid #f3f4f6}
</style>
</head>
<body>
<h1>FinEval — Lighthouse Report</h1>
<div class="meta">Generated: {{ generated_at }}</div>
{% for route, runs in results.items() %}
<div class="route">
  <h2>{{ route }}</h2>
  {% set n = runs|length %}
  {% set avg_perf = (runs | map(attribute='performance') | sum) / n %}
  {% set avg_a11y = (runs | map(attribute='accessibility') | sum) / n %}
  {% set avg_bp   = (runs | map(attribute='best-practices') | sum) / n %}
  {% set avg_fcp  = (runs | map(attribute='fcp_ms') | sum) / n %}
  {% set avg_lcp  = (runs | map(attribute='lcp_ms') | sum) / n %}
  <div class="grid">
    <div class="card"><div class="label">Performance</div>
      <div class="val {{ 'g' if avg_perf >= 70 else 'r' }}">{{ avg_perf | round | int }}</div></div>
    <div class="card"><div class="label">Accessibility</div>
      <div class="val {{ 'g' if avg_a11y >= 85 else 'r' }}">{{ avg_a11y | round | int }}</div></div>
    <div class="card"><div class="label">Best Practices</div>
      <div class="val {{ 'g' if avg_bp >= 80 else 'r' }}">{{ avg_bp | round | int }}</div></div>
    <div class="card"><div class="label">FCP avg</div>
      <div class="val {{ 'g' if avg_fcp < 1800 else 'a' }}">{{ avg_fcp | round | int }}ms</div></div>
    <div class="card"><div class="label">LCP avg</div>
      <div class="val {{ 'g' if avg_lcp < 2500 else 'r' }}">{{ avg_lcp | round | int }}ms</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Perf</th><th>A11y</th><th>BP</th><th>FCP ms</th><th>LCP ms</th><th>TBT ms</th><th>CLS</th></tr></thead>
    <tbody>
      {% for i in range(runs|length) %}
      {% set r = runs[i] %}
      <tr>
        <td>{{ i+1 }}</td>
        <td class="{{ 'g' if r.performance >= 70 else 'r' }}">{{ r.performance }}</td>
        <td class="{{ 'g' if r.accessibility >= 85 else 'r' }}">{{ r.accessibility }}</td>
        <td class="{{ 'g' if r['best-practices'] >= 80 else 'r' }}">{{ r['best-practices'] }}</td>
        <td>{{ r.fcp_ms }}</td><td>{{ r.lcp_ms }}</td><td>{{ r.tbt_ms }}</td><td>{{ r.cls }}</td>
      </tr>
      {% endfor %}
    </tbody>
  </table>
</div>
{% endfor %}
</body>
</html>"""


def _env():
    return Environment(loader=BaseLoader())


def generate_performance_report(
    stats: list[dict],
    output_path: str,
    title: str = "Performance Report",
    iterations: int = 3,
):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    html = _env().from_string(PERF_TEMPLATE).render(
        title=title,
        stats=stats,
        generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        iterations=iterations,
    )
    Path(output_path).write_text(html)
    print(f"Report → {output_path}")


def generate_lighthouse_report(results: dict, output_path: str):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    html = _env().from_string(LIGHTHOUSE_TEMPLATE).render(
        results=results,
        generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
    )
    Path(output_path).write_text(html)
    print(f"Lighthouse report → {output_path}")
