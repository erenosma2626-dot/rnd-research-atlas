import os
import random
import time
import threading
from typing import Callable, TypeVar, Any
from openai import RateLimitError, APIError

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
    max_retries: int = 5,
    initial_backoff: float = 3.0,
    **kwargs: Any,
) -> T:
    """Groq API çağrısını rate limiter kuyruğuna sokar ve 429 / RateLimit durumunda exponential backoff ile yeniden dener.

    Args:
        call_fn: Çağrılacak fonksiyon (örn: client.chat.completions.create).
        max_retries: Maksimum yeniden deneme sayısı.
        initial_backoff: İlk bekleme süresi (saniye).

    Returns:
        T: Fonksiyonun dönüş değeri.
    """
    retries = 0
    backoff = initial_backoff

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

            if is_rate_limit and retries < max_retries:
                retries += 1
                # Exponential backoff + jitter (rastgele sapma)
                jitter = random.uniform(0.5, 1.5)
                sleep_duration = (backoff * (1.8 ** (retries - 1))) + jitter
                time.sleep(sleep_duration)
            else:
                raise exc
