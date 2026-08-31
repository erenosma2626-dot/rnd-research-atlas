import logging
import os
import random
import re
import threading
import time
from typing import Any, Callable, TypeVar
from openai import APIError, RateLimitError

logger = logging.getLogger("rate_limiter")
T = TypeVar("T")


class GroqRateLimiter:
    """Groq API limitlerine (30 RPM, 8K TPM) uygun istek yöneticisi ve yeniden deneme katmanı."""

    def __init__(self, min_interval_seconds: float = 2.2):
        self.min_interval = min_interval_seconds
        self.last_call_time = 0.0
        self.lock = threading.Lock()

    def wait_if_needed(self):
        """İstekler arasında en az min_interval saniye olmasını sağlayarak 30 RPM sınırını korur."""
        with self.lock:
            now = time.time()
            elapsed = now - self.last_call_time
            if elapsed < self.min_interval:
                sleep_time = self.min_interval - elapsed
                time.sleep(sleep_time)
            self.last_call_time = time.time()


# Global tekil rate limiter
rate_limiter = GroqRateLimiter(min_interval_seconds=2.2)


def execute_with_retry(
    call_fn: Callable[..., T],
    *args: Any,
    max_retries: int = 12,
    initial_backoff: float = 5.0,
    max_wait_minutes: int = 10,
    **kwargs: Any,
) -> T:
    """Groq API çağrısını rate limiter kuyruğuna sokar ve 429 / RateLimit durumunda
    sunucu önerisine veya exponential backoff'a göre bekleyip yeniden dener.
    İşlem düşmez, rate limit süresince worker bekler ve isteği tamamlar.
    """
    retries = 0
    start_time = time.time()

    while True:
        # İstekler arası RPM koruması
        rate_limiter.wait_if_needed()

        try:
            return call_fn(*args, **kwargs)
        except Exception as exc:
            err_str = str(exc).lower()
            is_rate_limit = (
                isinstance(exc, RateLimitError)
                or "429" in err_str
                or "rate limit" in err_str
                or "tokens per minute" in err_str
                or "requests per minute" in err_str
                or "tpm" in err_str
                or "rpm" in err_str
            )
            is_json_retryable = ("json_validate_failed" in err_str or "failed to validate json" in err_str) and retries < 3

            if is_rate_limit:
                elapsed = time.time() - start_time
                if elapsed > max_wait_minutes * 60 or retries >= max_retries:
                    logger.error(
                        f"Rate limit: {max_wait_minutes} dakika sonunda ({retries} deneme) istek tamamlanamadı."
                    )
                    raise exc

                retries += 1

                # Hata mesajında "try again in X.XXs" var mı kontrol et
                wait_match = re.search(r"try again in (\d+\.?\d*)\s*s", err_str)
                if wait_match:
                    suggested_wait = float(wait_match.group(1)) + 1.5
                else:
                    suggested_wait = initial_backoff * (1.5 ** (retries - 1)) + random.uniform(1.0, 3.0)

                sleep_duration = max(suggested_wait, 6.0)
                logger.warning(
                    f"Rate limit'e takıldı (deneme {retries}/{max_retries}), "
                    f"{sleep_duration:.1f}sn bekleniyor ve otomatik tekrar denenecek..."
                )
                time.sleep(sleep_duration)
            elif is_json_retryable:
                retries += 1
                sleep_duration = 2.0 + random.uniform(0.5, 1.5)
                logger.info(f"JSON doğrulama hatası alındı, {sleep_duration:.1f}sn sonra yeniden deneniyor (deneme {retries}/3)...")
                time.sleep(sleep_duration)
            else:
                raise exc

