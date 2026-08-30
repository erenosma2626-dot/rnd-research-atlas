import os
import instructor
from openai import OpenAI

from app.config.diagram_eligibility import DIAGRAM_ELIGIBLE_GROUPS
from app.models.diagram import DiagramNode, DiagramSpec, GeneratedDiagram
from app.models.report_section import FilledSection
from app.services.classifier import LLMCallLog, log_llm_call
from app.services.mermaid_converter import spec_to_mermaid

MAX_NODES = 8


def get_diagram_instructor_client() -> tuple[instructor.Instructor, str]:
    """Diyagram üretimi için Groq istemcisi ve modelini (llama-3.1-8b-instant) döner."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY ortam değişkeni ayarlanmamış.")

    base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    model = os.getenv("GROQ_DIAGRAM_MODEL", "llama-3.1-8b-instant")

    client = instructor.from_openai(
        OpenAI(api_key=api_key, base_url=base_url),
        mode=instructor.Mode.JSON,
    )
    return client, model


def format_section_content_for_prompt(section: FilledSection) -> str:
    """FilledSection içeriğini diyagram promptu için metin haline getirir."""
    c_type = section.content_type
    content = section.content

    if c_type == "prose":
        return str(content.get("text", ""))[:3000]
    elif c_type == "list":
        items = content.get("items", [])
        return "\n".join(f"- {item}" for item in items[:15])
    elif c_type == "table":
        cols = content.get("columns", [])
        rows = content.get("rows", [])
        col_str = " | ".join(cols)
        row_strs = [" | ".join(str(cell) for cell in row) for row in rows[:10]]
        return f"Columns: {col_str}\nRows:\n" + "\n".join(row_strs)
    else:
        return str(content)[:3000]


def generate_diagram_spec(section: FilledSection) -> GeneratedDiagram:
    """FilledSection içeriğinden Groq ile DiagramSpec JSON üretir ve Mermaid koduna çevirir.

    - LLM sadece node/edge JSON üretir.
    - Mermaid koduna çevrim deterministik olarak kod tarafında yapılır.
    - Maksimum 8 düğüm kuralı uygulanır.

    Args:
        section: Diyagramı üretilecek doldurulmuş bölüm.

    Returns:
        GeneratedDiagram: Mermaid kodu ve ham spesifikasyonu içeren nesne.
    """
    diagram_type = DIAGRAM_ELIGIBLE_GROUPS.get(section.group_id, "flowchart")
    client, model_name = get_diagram_instructor_client()
    content_text = format_section_content_for_prompt(section)

    system_prompt = (
        f"You are a technical diagram designer. Extract the key visual flow, pipeline, or hierarchy "
        f"from the given academic section content into a structured node-and-edge specification.\n"
        f"- Target Diagram Type: {diagram_type}\n"
        f"- Maximum Nodes: {MAX_NODES}\n"
        f"- Keep node IDs short, lowercase, and alphanumeric without spaces (e.g. 'raw_data', 'transformer', 'loss').\n"
        f"- Use descriptive and concise labels in Turkish or English according to content language.\n"
        f"- Connect nodes logically with directed edges."
    )

    user_prompt = (
        f"SECTION TITLE: {section.title}\n"
        f"CONTENT:\n{content_text}\n\n"
        f"Generate the DiagramSpec with nodes and edges."
    )

    try:
        spec: DiagramSpec = client.chat.completions.create(
            model=model_name,
            response_model=DiagramSpec,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
        )

        # Truncation Safeguard (Maksimum 8 düğüm kuralı)
        if len(spec.nodes) > MAX_NODES:
            spec.nodes = spec.nodes[:MAX_NODES]
            valid_node_ids = {n.id for n in spec.nodes}
            spec.edges = [
                e
                for e in spec.edges
                if e.from_id in valid_node_ids and e.to_id in valid_node_ids
            ]

        # Diyagram türünü garantiye al
        spec.diagram_type = diagram_type

        # Deterministik Mermaid koduna çevir
        mermaid_code = spec_to_mermaid(spec)

        # Log LLM call
        log_llm_call(
            LLMCallLog(
                call_type="diagram",
                model=model_name,
                input_tokens=0,
                output_tokens=0,
            )
        )

        return GeneratedDiagram(
            section_id=section.group_id,
            mermaid_code=mermaid_code,
            spec=spec,
        )
    except Exception as e:
        # Hata durumunda boş/güvenli bir yedek spesifikasyon oluştur
        fallback_node = DiagramNode(id="section_node", label=section.title)
        fallback_spec = DiagramSpec(
            nodes=[fallback_node],
            edges=[],
            diagram_type=diagram_type,
        )
        fallback_mermaid = spec_to_mermaid(fallback_spec)
        return GeneratedDiagram(
            section_id=section.group_id,
            mermaid_code=fallback_mermaid,
            spec=fallback_spec,
        )


def generate_diagrams_batch(sections: list[FilledSection]) -> list[GeneratedDiagram]:
    """Birden fazla bölüm için toplu diyagram üretir.

    Sadece diagram_requested=True olan bölümleri işler (veya listeye verilen tüm bölümleri).

    Args:
        sections: Doldurulmuş bölümler listesi.

    Returns:
        list[GeneratedDiagram]: Üretilen diyagramlar listesi.
    """
    diagrams: list[GeneratedDiagram] = []
    for sec in sections:
        diagram = generate_diagram_spec(sec)
        diagrams.append(diagram)
    return diagrams
