import os
import shutil
import tempfile
import uuid
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.models.routing import (
    ActiveSectionGroup,
    IndexRequest,
    IndexResponse,
    ParseClassifyIndexResponse,
    RouteSectionsRequest,
)
from app.parsers.docling_parser import parse_pdf
from app.services.classifier import classify_paper
from app.services.section_router import route_sections
from app.services.vector_store import index_document

router = APIRouter(tags=["Indexing & Routing"])


@router.post(
    "/index",
    response_model=IndexResponse,
    summary="Ayrıştırılmış dokümanı ChromaDB'ye indeksle",
    description="ParsedDocument nesnesindeki bölümleri metadata'ları ile birlikte ChromaDB'ye chunk olarak kaydeder.",
)
async def index_document_endpoint(request: IndexRequest) -> IndexResponse:
    """ParsedDocument'i ChromaDB vektör veritabanına indeksler."""
    try:
        count = index_document(request.document_id, request.parsed_document)
        return IndexResponse(status="indexed", chunk_count=count)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"İndeksleme sırasında hata oluştu: {str(e)}",
        )


@router.post(
    "/route-sections",
    response_model=list[ActiveSectionGroup],
    summary="PaperProfile'a göre aktif rapor bölümlerini belirle",
    description="Makale profilindeki bayraklara göre tetiklenen ve raporda yer alacak bölüm gruplarını döner.",
)
async def route_sections_endpoint(
    request: RouteSectionsRequest,
) -> list[ActiveSectionGroup]:
    """PaperProfile nesnesine göre aktif bölüm gruplarını hesaplar."""
    return route_sections(request.paper_profile)


@router.post(
    "/parse-classify-index",
    response_model=ParseClassifyIndexResponse,
    summary="PDF yükle, ayrıştır, sınıflandır, indeksle ve bölümleri belirle",
    description="Tam boru hattı: PDF -> Docling Parsing -> Groq Classification -> ChromaDB Indexing -> Section Routing.",
)
async def parse_classify_index_endpoint(
    file: UploadFile = File(...),
) -> ParseClassifyIndexResponse:
    """PDF dosyasını alır ve baştan sona tüm pipeline adımlarını yürüterek sonuç döner."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Geçersiz dosya formatı. Lütfen bir PDF dosyası yükleyin.",
        )

    document_id = str(uuid.uuid4())

    suffix = ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_path = temp_file.name
        try:
            shutil.copyfileobj(file.file, temp_file)
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Dosya kaydedilirken hata oluştu: {str(e)}",
            )

    try:
        # Step 1: Docling Parsing
        parsed_doc = parse_pdf(temp_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"PDF parse edilirken hata oluştu: {str(e)}",
        )
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass

    try:
        # Step 2: Classification
        profile = classify_paper(parsed_doc)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Sınıflandırma aşamasında hata oluştu: {str(e)}",
        )

    try:
        # Step 3: ChromaDB Indexing
        index_document(document_id, parsed_doc)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vektör indeksleme aşamasında hata oluştu: {str(e)}",
        )

    # Step 3: Section Routing
    active_sections = route_sections(profile)

    return ParseClassifyIndexResponse(
        document_id=document_id,
        parsed_document=parsed_doc,
        paper_profile=profile,
        active_sections=active_sections,
    )
