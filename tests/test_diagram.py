from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.models.diagram import (
    DiagramEdge,
    DiagramNode,
    DiagramSpec,
    GeneratedDiagram,
)
from app.models.report_section import FilledSection, SourceReference
from app.models.section_candidate import (
    ControlPanelState,
    SectionCandidate,
)
from app.services.diagram_generator import (
    format_section_content_for_prompt,
    generate_diagram_spec,
    generate_diagrams_batch,
)
from app.services.mermaid_converter import (
    sanitize_label,
    sanitize_node_id,
    spec_to_mermaid,
)

client = TestClient(app)


@pytest.fixture
def sample_method_section() -> FilledSection:
    return FilledSection(
        group_id="method_steps",
        title="Yöntem",
        content_type="list",
        content={
            "items": [
                "Veri seti yükleme ve ön işleme",
                "Özellik çıkarımı ve vektörleştirme",
                "Model eğitimi ve hiperparametre optimizasyonu",
                "Doğrulama ve test değerlendirmesi",
            ]
        },
        sources=[SourceReference(page=2, section_title="Methodology")],
        diagram_requested=True,
    )


def test_sanitize_node_id_and_label():
    """sanitize_node_id ve sanitize_label doğruluğu."""
    assert sanitize_node_id("data input") == "data_input"
    assert sanitize_node_id("123_start") == "node_123_start"
    assert sanitize_node_id("model-layer#1") == "model_layer_1"

    assert sanitize_label('Model with "Attention"') == "Model with 'Attention'"
    assert sanitize_label("Multi\nLine") == "Multi Line"


def test_spec_to_mermaid_flowchart():
    """Flowchart türünde DiagramSpec'in deterministik Mermaid çıktısı."""
    spec = DiagramSpec(
        nodes=[
            DiagramNode(id="raw_data", label="Ham Veri"),
            DiagramNode(id="clean_data", label="Temiz Veri"),
            DiagramNode(id="model", label="Transformer"),
        ],
        edges=[
            DiagramEdge(from_id="raw_data", to_id="clean_data", label="Ön İşleme"),
            DiagramEdge(from_id="clean_data", to_id="model", label=None),
        ],
        diagram_type="flowchart",
    )
    code = spec_to_mermaid(spec)

    assert "flowchart TD" in code
    assert 'raw_data["Ham Veri"]' in code
    assert 'clean_data["Temiz Veri"]' in code
    assert "raw_data -->|Ön İşleme| clean_data" in code
    assert "clean_data --> model" in code


def test_spec_to_mermaid_tree():
    """Tree türünde DiagramSpec çıktısı."""
    spec = DiagramSpec(
        nodes=[
            DiagramNode(id="root", label="Yöntemler"),
            DiagramNode(id="supervised", label="Denetimli"),
        ],
        edges=[DiagramEdge(from_id="root", to_id="supervised")],
        diagram_type="tree",
    )
    code = spec_to_mermaid(spec)
    assert "graph TD" in code
    assert "root --> supervised" in code


def test_format_section_content_for_prompt(sample_method_section):
    """Bölüm içeriğinin prompt için doğru formatlanması."""
    formatted = format_section_content_for_prompt(sample_method_section)
    assert "Veri seti yükleme" in formatted
    assert "Özellik çıkarımı" in formatted


@patch("app.services.diagram_generator.get_diagram_instructor_client")
def test_generate_diagram_spec_success(mock_get_client, sample_method_section):
    """generate_diagram_spec fonksiyonunun başarılı çalışması ve Mermaid üretimi."""
    mock_client = MagicMock()
    mock_spec = DiagramSpec(
        nodes=[
            DiagramNode(id="step1", label="Adım 1"),
            DiagramNode(id="step2", label="Adım 2"),
        ],
        edges=[DiagramEdge(from_id="step1", to_id="step2", label="Akış")],
        diagram_type="flowchart",
    )
    mock_client.chat.completions.create.return_value = mock_spec
    mock_get_client.return_value = (mock_client, "openai/gpt-oss-20b")

    result = generate_diagram_spec(sample_method_section)

    assert result.section_id == "method_steps"
    assert "flowchart TD" in result.mermaid_code
    assert 'step1["Adım 1"]' in result.mermaid_code
    assert len(result.spec.nodes) == 2


@patch("app.services.diagram_generator.get_diagram_instructor_client")
def test_generate_diagram_spec_truncation_safeguard(mock_get_client, sample_method_section):
    """Maksimum 8 düğüm kuralı ve fazla kenarların temizlenmesi."""
    mock_client = MagicMock()
    # 10 adet node üretilsin
    nodes = [DiagramNode(id=f"node_{i}", label=f"Düğüm {i}") for i in range(10)]
    edges = [
        DiagramEdge(from_id="node_0", to_id="node_1"),
        DiagramEdge(from_id="node_7", to_id="node_8"),  # node_8 elenecek
    ]
    mock_spec = DiagramSpec(nodes=nodes, edges=edges, diagram_type="flowchart")
    mock_client.chat.completions.create.return_value = mock_spec
    mock_get_client.return_value = (mock_client, "openai/gpt-oss-20b")

    result = generate_diagram_spec(sample_method_section)

    assert len(result.spec.nodes) == 8
    # node_8'e giden kenar silinmiş olmalı
    assert len(result.spec.edges) == 1
    assert result.spec.edges[0].to_id == "node_1"


@patch("app.services.diagram_generator.get_diagram_instructor_client")
def test_generate_diagram_spec_fallback_on_error(mock_get_client, sample_method_section):
    """LLM hatası durumunda fallback spesifikasyon dönülmesi."""
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = Exception("LLM failure")
    mock_get_client.return_value = (mock_client, "openai/gpt-oss-20b")

    result = generate_diagram_spec(sample_method_section)

    assert result.section_id == "method_steps"
    assert len(result.spec.nodes) == 1
    assert "flowchart TD" in result.mermaid_code


@patch("app.services.diagram_generator.generate_diagram_spec")
def test_generate_diagrams_batch(mock_gen, sample_method_section):
    """Toplu diyagram üretimi testi."""
    mock_gen.return_value = GeneratedDiagram(
        section_id="method_steps",
        mermaid_code="flowchart TD\n    a --> b",
        spec=DiagramSpec(nodes=[], edges=[], diagram_type="flowchart"),
    )
    results = generate_diagrams_batch([sample_method_section, sample_method_section])
    assert len(results) == 2
    assert mock_gen.call_count == 2


@patch("app.routers.diagram.generate_diagram_spec")
def test_generate_diagram_endpoint(mock_gen, sample_method_section):
    """POST /generate-diagram endpoint testi."""
    mock_gen.return_value = GeneratedDiagram(
        section_id="method_steps",
        mermaid_code="flowchart TD\n    a --> b",
        spec=DiagramSpec(
            nodes=[DiagramNode(id="a", label="A"), DiagramNode(id="b", label="B")],
            edges=[DiagramEdge(from_id="a", to_id="b")],
            diagram_type="flowchart",
        ),
    )

    response = client.post(
        "/generate-diagram",
        json={"section": sample_method_section.model_dump()},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["section_id"] == "method_steps"
    assert "flowchart TD" in data["mermaid_code"]


@patch("app.routers.diagram.generate_diagrams_batch")
def test_generate_diagrams_batch_endpoint(mock_batch, sample_method_section):
    """POST /generate-diagrams-batch endpoint testi."""
    mock_batch.return_value = [
        GeneratedDiagram(
            section_id="method_steps",
            mermaid_code="flowchart TD\n    a --> b",
            spec=DiagramSpec(nodes=[], edges=[]),
        )
    ]

    response = client.post(
        "/generate-diagrams-batch",
        json={"sections": [sample_method_section.model_dump()]},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["section_id"] == "method_steps"
