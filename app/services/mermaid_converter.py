import re
from app.models.diagram import DiagramSpec


def sanitize_node_id(raw_id: str) -> str:
    """Mermaid syntaxına uygun güvenli bir node id üretir (sadece alfanumerik ve alt çizgi)."""
    clean_id = re.sub(r"[^a-zA-Z0-9_]", "_", raw_id.strip())
    if not clean_id or clean_id[0].isdigit():
        clean_id = f"node_{clean_id}"
    return clean_id


def sanitize_label(raw_label: str) -> str:
    """Mermaid düğüm ve ok etiketlerindeki tırnakları ve özel karakterleri güvenli hale getirir."""
    clean_label = raw_label.replace('"', "'").replace("\n", " ").strip()
    return clean_label


def spec_to_mermaid(spec: DiagramSpec) -> str:
    """DiagramSpec JSON nesnesini deterministik olarak Mermaid.js koduna dönüştürür."""
    lines: list[str] = []

    # 1. Diyagram başlığı
    if spec.diagram_type == "tree":
        lines.append("graph TD")
    elif spec.diagram_type == "flowchart_decision":
        lines.append("flowchart TD")
    else:
        lines.append("flowchart TD")

    # 2. Düğümlerin tanımlanması
    node_id_map: dict[str, str] = {}
    for node in spec.nodes:
        clean_id = sanitize_node_id(node.id)
        node_id_map[node.id] = clean_id
        clean_label = sanitize_label(node.label)

        # Karar ağacı için diamond düğüm kontrolü
        if spec.diagram_type == "flowchart_decision" and (
            "?" in clean_label or "mi" in clean_label.lower() or "karar" in clean_label.lower() or "seçim" in clean_label.lower()
        ):
            lines.append(f'    {clean_id}{{"{clean_label}"}}')
        else:
            lines.append(f'    {clean_id}["{clean_label}"]')

    # 3. Kenarların (bağlantıların) eklenmesi
    for edge in spec.edges:
        from_clean = node_id_map.get(edge.from_id, sanitize_node_id(edge.from_id))
        to_clean = node_id_map.get(edge.to_id, sanitize_node_id(edge.to_id))

        if edge.label and edge.label.strip():
            clean_edge_label = sanitize_label(edge.label)
            lines.append(f"    {from_clean} -->|{clean_edge_label}| {to_clean}")
        else:
            lines.append(f"    {from_clean} --> {to_clean}")

    return "\n".join(lines)
