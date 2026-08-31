import os
import sys
from celery import Celery
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "rnd_paper_canvas",
    broker=redis_url,
    backend=redis_url,
    include=["app.worker.tasks"],
)

# macOS (Apple Silicon / arm64) üzerinde PyTorch, Docling ve ONNX runtime kütüphanelerinin
# prefork/fork() esnasında SIGSEGV (signal 11) çökmesini engellemek için varsayılan havuzu solo yap
default_pool = "solo" if sys.platform == "darwin" else "prefork"

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_pool=default_pool,
    task_time_limit=1800,  # 30 dakika (rate limit ve geniş dokümanlar için güvenli süre)
    task_soft_time_limit=1700,
)

if redis_url.startswith("rediss://"):
    celery_app.conf.update(
        broker_use_ssl={"ssl_cert_reqs": None},
        redis_backend_use_ssl={"ssl_cert_reqs": None},
    )
