"""
MLflow metric logger for DeepEval runs.

Called from conftest.py session teardown to ship eval scores to the
fineval-evals MLflow experiment after each test session.
"""
import os
from datetime import datetime, timezone


def log_eval_run(metrics: dict[str, float], params: dict[str, str]) -> None:
    """Log eval scores and params to MLflow. No-op if mlflow is unavailable."""
    try:
        import mlflow
    except ImportError:
        print("[tracker] mlflow not installed — skipping metric logging")
        return

    uri = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5001")
    exp = os.getenv("MLFLOW_EXPERIMENT", "fineval-evals")

    try:
        mlflow.set_tracking_uri(uri)
        mlflow.set_experiment(exp)
        run_name = f"eval-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M')}"
        with mlflow.start_run(run_name=run_name):
            for k, v in metrics.items():
                mlflow.log_metric(k, v)
            for k, v in params.items():
                mlflow.log_param(k, v)
        print(f"[tracker] logged {len(metrics)} metrics to MLflow experiment '{exp}'")
    except Exception as exc:
        print(f"[tracker] MLflow logging failed (non-fatal): {exc}")
