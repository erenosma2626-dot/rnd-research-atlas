import io
import logging
from typing import Optional
from uuid import uuid4
from PIL import Image

from app.models.figure import ExtractedFigure
from app.storage.object_store import upload_bytes

logger = logging.getLogger("figure_extractor")


def _heuristic_figure_type(caption: Optional[str]) -> str:
    """Altyazı metnine göre figür türünü belirler."""
    if not caption:
        return "diagram"
    text = caption.lower()
    if any(k in text for k in ["flowchart", "architecture", "framework", "pipeline", "schema", "şema", "overview", "workflow", "block diagram"]):
        return "diagram"
    if any(k in text for k in ["accuracy", "comparison", "results", "error", "loss", "scatter", "histogram", "curve", "f1", "rmse", "performance", "metric", "table"]):
        return "chart"
    if any(k in text for k in ["sem", "microscope", "photograph", "photo", "setup", "experimental", "specimen", "tool wear"]):
        return "photo"
    return "diagram"


def extract_figures(pdf_path: str, document_id: str) -> list[ExtractedFigure]:
    """PDF dosyasından gömülü görselleri/şemaları ayıklar ve MinIO'ya yükler.

    Docling ve PyMuPDF (fitz) destekli esnek ayıklama uygular.
    """
    extracted_figures: list[ExtractedFigure] = []

    try:
        # PyMuPDF (fitz) ile PDF sayfalarındaki gömülü görselleri hızlıca çek
        import fitz  # PyMuPDF

        doc = fitz.open(pdf_path)
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_num = page_idx + 1
            image_list = page.get_images(full=True)

            # Sayfadaki metinden "Fig" veya "Figure" başlığını yakalamaya çalış
            page_text = page.get_text("text")
            captions = [line.strip() for line in page_text.splitlines() if line.strip().lower().startswith(("fig.", "figure", "şekil"))]

            for img_idx, img_info in enumerate(image_list):
                xref = img_info[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image.get("image")
                image_ext = base_image.get("ext", "png")

                if not image_bytes:
                    continue

                # Çok küçük ikonları (örn. 80x80 altı) filtrele
                width = base_image.get("width", 0)
                height = base_image.get("height", 0)
                if width < 120 or height < 120:
                    continue

                # Uygun caption eşleştir
                caption = captions[img_idx] if img_idx < len(captions) else f"Şekil (Sayfa {page_num})"
                fig_type = _heuristic_figure_type(caption)

                fig_id = str(uuid4())
                object_name = f"{document_id}/fig_{page_num}_{img_idx}_{fig_id[:8]}.{image_ext}"

                try:
                    storage_uri = upload_bytes(
                        data=image_bytes,
                        bucket="figures",
                        object_name=object_name,
                        content_type=f"image/{image_ext}",
                    )
                    extracted_figures.append(
                        ExtractedFigure(
                            figure_id=fig_id,
                            page=page_num,
                            caption=caption,
                            image_storage_path=storage_uri,
                            figure_type=fig_type,
                        )
                    )
                except Exception as upload_err:
                    logger.warning(f"Figür MinIO'ya yüklenirken hata: {upload_err}")

        doc.close()

    except ImportError:
        logger.info("PyMuPDF (fitz) yüklü değil, figür çıkarma atlandı.")
    except Exception as e:
        logger.warning(f"PDF figür ayıklama sırasında hata oluştu: {e}")

    logger.info(f"Toplam {len(extracted_figures)} figür ayıklandı ve kaydedildi: doc={document_id}")
    return extracted_figures
