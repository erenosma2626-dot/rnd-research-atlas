from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.models.report_section import FilledSection, SourceReference
from app.models.section_candidate import (
    BuildControlPanelRequest,
    ControlPanelState,
    FinalizeReportRequest,
    SectionCandidate,
)
from app.services.control_panel import (
    apply_control_panel_changes,
    build_control_panel_state,
    build_final_report,
    generate_content_preview,
)

client = TestClient(app)


@pytest.fixture
def sample_filled_sections() -> list[FilledSection]:
    return [
        FilledSection(
            group_id="core_summary",
            title="Özet ve Katkı",
            content_type="prose",
            content={"text": "Bu makale yeni bir dikkat mekanizması tanıtmaktadır. " * 5},
            sources=[SourceReference(page=1, section_title="Abstract")],
            diagram_requested=False,
        ),
        FilledSection(
            group_id="method_steps",
            title="Yöntem",
            content_type="list",
            content={
                "items": [
                    "Adım 1: Veri ön işleme ve tokenize etme.",
                    "Adım 2: Transformer bloklarından geçirme.",
                ]
            },
            sources=[SourceReference(page=2, section_title="Methodology")],
            diagram_requested=False,
        ),
        FilledSection(
            group_id="ml_experiment_table",
            title="Veri & Yöntem (ML)",
            content_type="table",
            content={
                "columns": ["Dataset", "Model", "Accuracy"],
                "rows": [["ImageNet", "Model-A", "82.5%"], ["CIFAR-10", "Model-B", "96.1%"]],
            },
            sources=[SourceReference(page=4, section_title="Experiments")],
            diagram_requested=False,
        ),
    ]


def test_generate_content_preview_types():
    """generate_content_preview fonksiyonunun tüm içerik tipleri için doğru çalıştığını test eder."""
    # Prose
    prose_sec = FilledSection(
        group_id="core_summary",
        title="Özet",
        content_type="prose",
        content={"text": "A" * 200},
        sources=[],
    )
    preview = generate_content_preview(prose_sec)
    assert len(preview) <= 150
    assert preview.endswith("...")

    # Table
    table_sec = FilledSection(
        group_id="table_group",
        title="Tablo",
        content_type="table",
        content={"columns": ["A", "B", "C"], "rows": [["1", "2", "3"]]},
        sources=[],
    )
    table_preview = generate_content_preview(table_sec)
    assert "1 satır, 3 sütun" in table_preview
    assert "A, B, C" in table_preview

    # List
    list_sec = FilledSection(
        group_id="list_group",
        title="Liste",
        content_type="list",
        content={"items": ["İlk madde içeriği"]},
        sources=[],
    )
    list_preview = generate_content_preview(list_sec)
    assert "Liste (1 madde)" in list_preview
    assert "İlk madde" in list_preview

    # Error
    err_sec = FilledSection(
        group_id="err_group",
        title="Hata",
        content_type="error",
        content={"error": "LLM timeout occurred"},
        sources=[],
    )
    err_preview = generate_content_preview(err_sec)
    assert "Hata: LLM timeout occurred" in err_preview


def test_build_control_panel_state(sample_filled_sections):
    """build_control_panel_state aday listesini ve diyagram uygunluğunu doğru kurmalı."""
    state = build_control_panel_state("doc-123", sample_filled_sections)

    assert state.document_id == "doc-123"
    assert len(state.candidates) == 3

    # core_summary diyagrama uygun değil
    assert state.candidates[0].section_id == "core_summary"
    assert state.candidates[0].diagram_available is False
    assert state.candidates[0].order == 0

    # method_steps diyagrama uygun
    assert state.candidates[1].section_id == "method_steps"
    assert state.candidates[1].diagram_available is True
    assert state.candidates[1].order == 1


def test_build_final_report_reordering_and_filtering(sample_filled_sections):
    """build_final_report sıralama, çıkarma ve diyagram bayrağını doğru uygulamalı."""
    # core_summary çıkarılsın, method_steps ve ml_experiment_table sıraları ters çevrilsin
    candidates = [
        SectionCandidate(
            section_id="core_summary",
            section_title="Özet ve Katkı",
            detected=True,
            included=False,  # ÇIKARILDI
            order=0,
            diagram_available=False,
            diagram_included=False,
            content_preview="...",
        ),
        SectionCandidate(
            section_id="method_steps",
            section_title="Yöntem",
            detected=True,
            included=True,
            order=2,  # SONA ALINDI
            diagram_available=True,
            diagram_included=True,  # DİYAGRAM İSTENDİ
            content_preview="...",
        ),
        SectionCandidate(
            section_id="ml_experiment_table",
            section_title="Veri & Yöntem (ML)",
            detected=True,
            included=True,
            order=1,  # BAŞA ALINDI
            diagram_available=False,
            diagram_included=False,
            content_preview="...",
        ),
    ]

    state = ControlPanelState(document_id="doc-123", candidates=candidates)
    final_report = build_final_report("doc-123", sample_filled_sections, state)

    # 1 tanesi çıkarıldığı için 2 adet dönmeli
    assert len(final_report) == 2

    # Sıralama: İlk ml_experiment_table (order 1), sonra method_steps (order 2)
    assert final_report[0].group_id == "ml_experiment_table"
    assert final_report[1].group_id == "method_steps"

    # method_steps için diagram_requested True olmalı
    assert final_report[1].diagram_requested is True


def test_control_panel_endpoints(sample_filled_sections):
    """POST /control-panel/build, PATCH /control-panel/update, POST /control-panel/finalize testleri."""
    # 1. Build
    build_resp = client.post(
        "/control-panel/build",
        json={
            "document_id": "doc-test-456",
            "filled_sections": [s.model_dump() for s in sample_filled_sections],
        },
    )
    assert build_resp.status_code == 200
    state_data = build_resp.json()
    assert state_data["document_id"] == "doc-test-456"
    assert len(state_data["candidates"]) == 3

    # 2. Update
    state_data["candidates"][0]["included"] = False
    state_data["candidates"][1]["diagram_included"] = True
    update_resp = client.patch(
        "/control-panel/update",
        json=state_data,
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["candidates"][0]["included"] is False

    # 3. Finalize
    finalize_resp = client.post(
        "/control-panel/finalize",
        json={
            "document_id": "doc-test-456",
            "filled_sections": [s.model_dump() for s in sample_filled_sections],
            "control_panel_state": updated_data,
        },
    )
    assert finalize_resp.status_code == 200
    final_data = finalize_resp.json()
    assert "sections" in final_data
    assert "diagrams" in final_data
    assert len(final_data["sections"]) == 2
    assert final_data["sections"][0]["group_id"] == "method_steps"
    assert final_data["sections"][0]["diagram_requested"] is True
