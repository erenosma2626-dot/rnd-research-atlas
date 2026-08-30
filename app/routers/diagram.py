from fastapi import APIRouter, HTTPException, status

from app.models.diagram import (
    GenerateDiagramRequest,
    GenerateDiagramsBatchRequest,
    GeneratedDiagram,
)
from app.services.diagram_generator import (
    generate_diagram_spec,
    generate_diagrams_batch,
)

router = APIRouter(tags=["Diagram Generation"])


@router.post(
    "/generate-diagram",
    response_model=GeneratedDiagram,
    summary="Tek bir bölüm için Mermaid diyagramı üret",
    description="FilledSection içeriğinden Groq (llama-3.1-8b-instant) ile DiagramSpec JSON üretir ve deterministik Mermaid koduna çevirir.",
)
async def generate_diagram_endpoint(
    request: GenerateDiagramRequest,
) -> GeneratedDiagram:
    """Tek bir bölüm için diyagram üretir."""
    try:
        return generate_diagram_spec(request.section)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diyagram üretilirken hata oluştu: {str(e)}",
        )


@router.post(
    "/generate-diagrams-batch",
    response_model=list[GeneratedDiagram],
    summary="Çoklu bölümler için toplu Mermaid diyagramı üret",
    description="diagram_requested=True olan bölümler için toplu diyagram spesifikasyonu ve Mermaid kodu üretir.",
)
async def generate_diagrams_batch_endpoint(
    request: GenerateDiagramsBatchRequest,
) -> list[GeneratedDiagram]:
    """Birden fazla bölüm için toplu diyagram üretir."""
    try:
        return generate_diagrams_batch(request.sections)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Toplu diyagram üretilirken hata oluştu: {str(e)}",
        )
