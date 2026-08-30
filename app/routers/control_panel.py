from fastapi import APIRouter, HTTPException, status

from app.models.report_section import FilledSection
from app.models.section_candidate import (
    BuildControlPanelRequest,
    ControlPanelState,
    FinalizeReportRequest,
)
from app.services.control_panel import (
    apply_control_panel_changes,
    build_control_panel_state,
    build_final_report,
)

router = APIRouter(prefix="/control-panel", tags=["Control Panel"])


@router.post(
    "/build",
    response_model=ControlPanelState,
    summary="Kontrol paneli durumunu oluştur",
    description="Doldurulmuş bölümlerden (FilledSection) kullanıcı kontrol paneli aday listesini (ControlPanelState) üretir.",
)
async def build_control_panel_endpoint(
    request: BuildControlPanelRequest,
) -> ControlPanelState:
    """FilledSection listesinden kontrol paneli durumu oluşturur."""
    try:
        state = build_control_panel_state(
            document_id=request.document_id,
            filled_sections=request.filled_sections,
        )
        return state
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Kontrol paneli durumu oluşturulurken hata: {str(e)}",
        )


@router.patch(
    "/update",
    response_model=ControlPanelState,
    summary="Kontrol paneli durumunu güncelle",
    description="Kullanıcının bölüm sıralaması, dahil etme/etmeme ve diyagram seçimlerini içeren güncel durumu doğrular ve döner.",
)
async def update_control_panel_endpoint(
    state: ControlPanelState,
) -> ControlPanelState:
    """Kontrol paneli kullanıcı seçimlerini kaydeder/günceller."""
    try:
        updated_state = apply_control_panel_changes(
            document_id=state.document_id,
            updated_candidates=state.candidates,
        )
        return updated_state
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Kontrol paneli güncellenirken hata: {str(e)}",
        )


@router.post(
    "/finalize",
    response_model=list[FilledSection],
    summary="Nihai raporu oluştur ve filtrele",
    description="Kontrol paneli seçimlerine göre bölümleri sıralar, dahil edilmeyenleri çıkarır ve diyagram taleplerini işler.",
)
async def finalize_report_endpoint(
    request: FinalizeReportRequest,
) -> list[FilledSection]:
    """Seçimlere göre sıralanmış ve filtrelenmiş final rapor bölümlerini döner."""
    try:
        final_sections = build_final_report(
            document_id=request.document_id,
            filled_sections=request.filled_sections,
            control_panel_state=request.control_panel_state,
        )
        return final_sections
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Nihai rapor oluşturulurken hata: {str(e)}",
        )
