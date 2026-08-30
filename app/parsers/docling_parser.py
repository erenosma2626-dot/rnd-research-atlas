from pathlib import Path
from typing import Optional
from docling.datamodel.document import DoclingDocument
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling_core.types.doc.labels import DocItemLabel

from app.models.document import Formula, ParsedDocument, Section


def parse_pdf(file_path: str) -> ParsedDocument:
    """Docling kullanarak PDF dosyasını parse eder ve yapılandırılmış çıktı döner.

    - Layout-aware section tespiti ve başlık hiyerarşisi (level) çıkarır.
    - Formül bloklarını (DocItemLabel.FORMULA vb.) izole eder.
    - Her bölüm için başlangıç ve bitiş sayfalarını (page_start, page_end) hesaplar.

    Args:
        file_path: Parse edilecek PDF dosyasının mutlak veya göreceli yolu.

    Returns:
        ParsedDocument: Bölümler, formüller, ham markdown ve sayfa sayısını içeren nesne.
    """
    path_obj = Path(file_path)
    if not path_obj.exists():
        raise FileNotFoundError(f"PDF dosyası bulunamadı: {file_path}")

    converter = DocumentConverter()
    result = converter.convert(file_path)
    doc: DoclingDocument = result.document

    # 1. Total Pages
    total_pages = len(doc.pages) if hasattr(doc, "pages") and doc.pages else 1

    # 2. Formula Extraction
    formulas: list[Formula] = []
    
    # 3. Section Extraction
    sections: list[Section] = []
    current_title: Optional[str] = None
    current_level: int = 1
    current_texts: list[str] = []
    current_page_start: Optional[int] = None
    current_page_end: Optional[int] = None

    def flush_current_section():
        nonlocal current_title, current_level, current_texts, current_page_start, current_page_end
        if current_title is not None or current_texts:
            title = current_title if current_title else "Overview"
            text_content = "\n\n".join(t for t in current_texts if t.strip()).strip()
            p_start = current_page_start or 1
            p_end = current_page_end or p_start
            sections.append(
                Section(
                    title=title,
                    level=current_level,
                    text=text_content,
                    page_start=p_start,
                    page_end=p_end,
                )
            )
        current_title = None
        current_level = 1
        current_texts = []
        current_page_start = None
        current_page_end = None

    for item, level in doc.iterate_items():
        # Check item page provenance
        page_no = 1
        if hasattr(item, "prov") and item.prov:
            prov_entry = item.prov[0]
            if hasattr(prov_entry, "page_no"):
                page_no = prov_entry.page_no

        item_label = getattr(item, "label", None)
        item_text = getattr(item, "text", "")

        # Formül tespiti
        if item_label == DocItemLabel.FORMULA or "formula" in str(item_label).lower():
            if item_text:
                formulas.append(Formula(raw_text=item_text, page=page_no))

        # Başlık / Bölüm ayrımı
        if item_label == DocItemLabel.SECTION_HEADER or "section_header" in str(item_label).lower() or "title" in str(item_label).lower():
            flush_current_section()
            current_title = item_text.strip()
            current_level = max(1, level if isinstance(level, int) else 1)
            current_page_start = page_no
            current_page_end = page_no
        else:
            if item_text and item_text.strip():
                current_texts.append(item_text.strip())
                if current_page_start is None:
                    current_page_start = page_no
                current_page_end = max(current_page_end or page_no, page_no)

    flush_current_section()

    # Raw markdown export
    raw_markdown = doc.export_to_markdown()

    return ParsedDocument(
        sections=sections,
        formulas=formulas,
        raw_markdown=raw_markdown,
        total_pages=total_pages,
    )
