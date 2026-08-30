import os
import re
from typing import Any, Optional
from openai import OpenAI

from app.models.formula import ExtractedFormula
from app.services.classifier import LLMCallLog, log_llm_call
from app.services.rate_limiter import execute_with_retry

_pix2tex_ocr = None


def get_pix2tex_ocr() -> Optional[Any]:
    """pix2tex LatexOCR modelini tembel (lazy) olarak yükler."""
    global _pix2tex_ocr
    formula_mode = os.getenv("FORMULA_MODE", "hybrid").lower().strip()
    if formula_mode == "llm_only":
        return None

    if _pix2tex_ocr is None:
        try:
            from pix2tex.cli import LatexOCR
            _pix2tex_ocr = LatexOCR()
        except Exception:
            _pix2tex_ocr = False
    return _pix2tex_ocr if _pix2tex_ocr is not False else None


def clean_latex_string(latex_text: str) -> str:
    """LaTeX dizesindeki gereksiz markdown bloklarını ve dolar işaretlerini temizler."""
    cleaned = latex_text.strip()
    cleaned = re.sub(r"^```(?:latex)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip("$").strip()
    return cleaned


def is_trivial_formula(raw_text: str) -> bool:
    """Tek haneli rakamlar veya önemsiz semboller için LLM çağrısını atlar."""
    s = raw_text.strip()
    if len(s) <= 1:
        return True
    if s.isdigit():
        return True
    return False


def extract_formula_latex(raw_text: str, page: int) -> ExtractedFormula:
    """Ham formül metnini kademeli pipeline (pix2tex -> Groq LLM fallback) ile LaTeX'e çevirir."""
    raw_str = raw_text.strip()
    if not raw_str:
        return ExtractedFormula(
            raw_text=raw_text,
            page=page,
            latex_code=None,
            method="failed",
            low_confidence=True,
        )

    # Çok basit / tek karakterli metinler için LLM kotası harcamadan doğrudan dön
    if is_trivial_formula(raw_str):
        return ExtractedFormula(
            raw_text=raw_text,
            page=page,
            latex_code=raw_str,
            method="docling_raw",
            low_confidence=False,
        )

    # 1. pix2tex Denemesi
    ocr = get_pix2tex_ocr()
    if ocr is not None:
        try:
            pass
        except Exception:
            pass

    # 2. LLM Fallback (Groq) with Rate Limiting & Retry
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        try:
            base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
            model_name = os.getenv("GROQ_FORMULA_MODEL", "openai/gpt-oss-20b")
            client = OpenAI(api_key=api_key, base_url=base_url)

            system_prompt = (
                "You are an expert mathematical typesetter. Convert the given raw formula into clean LaTeX.\n"
                "Return ONLY the raw LaTeX string without markdown code fences, dollar signs, or commentary."
            )

            response = execute_with_retry(
                client.chat.completions.create,
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"RAW FORMULA:\n{raw_str[:1500]}"},
                ],
                temperature=0.1,
                max_retries=5,
            )

            raw_latex = response.choices[0].message.content or ""
            cleaned_latex = clean_latex_string(raw_latex)

            log_llm_call(
                LLMCallLog(
                    call_type="formula_fallback",
                    model=model_name,
                    input_tokens=0,
                    output_tokens=0,
                )
            )

            if cleaned_latex:
                return ExtractedFormula(
                    raw_text=raw_text,
                    page=page,
                    latex_code=cleaned_latex,
                    method="llm_fallback",
                    low_confidence=True,
                )
        except Exception:
            pass

    return ExtractedFormula(
        raw_text=raw_text,
        page=page,
        latex_code=None,
        method="failed",
        low_confidence=True,
    )


def extract_all_formulas(
    formulas: list[Any],
    max_formulas_limit: int = 15,
) -> list[ExtractedFormula]:
    """Tüm ham formüller listesi için LaTeX çıkarma işlemini yürütür.

    TPM / RPM limitlerini korumak için tek dokümanda en önemli ilk N formülü işler.
    """
    extracted: list[ExtractedFormula] = []
    # En fazla max_formulas_limit adet formülü işle (RPM ve TPM tasarrufu)
    selected_formulas = formulas[:max_formulas_limit]

    for item in selected_formulas:
        if isinstance(item, ExtractedFormula):
            raw_text = item.raw_text
            page = item.page
        elif hasattr(item, "raw_text") and hasattr(item, "page"):
            raw_text = item.raw_text
            page = item.page
        elif isinstance(item, dict):
            raw_text = item.get("raw_text", "")
            page = item.get("page", 1)
        else:
            raw_text = str(item)
            page = 1

        extracted_formula = extract_formula_latex(raw_text, page)
        extracted.append(extracted_formula)
    return extracted
