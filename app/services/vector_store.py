import os
from typing import Any, Optional
import chromadb
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection

from app.models.document import ParsedDocument, Section

# Singleton persistent ChromaDB client
_CHROMA_DATA_PATH = os.getenv("CHROMA_DATA_PATH", "./chroma_data")
_client: Optional[ClientAPI] = None
_COLLECTION_NAME = "research_papers"


def get_chroma_client(data_path: Optional[str] = None) -> ClientAPI:
    """Singleton ChromaDB persistent istemcisini döner."""
    global _client
    target_path = data_path or _CHROMA_DATA_PATH
    if _client is None or (data_path and target_path != _CHROMA_DATA_PATH):
        _client = chromadb.PersistentClient(path=target_path)
    return _client


def get_or_create_collection(
    client: Optional[ClientAPI] = None, collection_name: str = _COLLECTION_NAME
) -> Collection:
    """Hedef koleksiyonu döner veya yoksa oluşturur."""
    c = client or get_chroma_client()
    return c.get_or_create_collection(name=collection_name)


def chunk_section(
    section: Section, max_chunk_chars: int = 2500, overlap: int = 200
) -> list[str]:
    """Bir bölümün metnini bölüm sınırlarını koruyarak alt chunk'lara böler.

    Args:
        section: Ayrıştırılmış bölüm nesnesi.
        max_chunk_chars: Maksimum karakter uzunluğu.
        overlap: Kayan pencere çakışma uzunluğu.

    Returns:
        list[str]: Bölüm metnine ait chunk listesi.
    """
    text = section.text.strip()
    if not text:
        # Eğer metin boşsa ama başlık varsa, başlığı chunk olarak koru
        return [f"Section: {section.title}"]

    if len(text) <= max_chunk_chars:
        return [f"Section: {section.title}\n\n{text}"]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + max_chunk_chars, len(text))
        sub_text = text[start:end]
        chunks.append(f"Section: {section.title} (Part {len(chunks)+1})\n\n{sub_text}")
        if end >= len(text):
            break
        start += max_chunk_chars - overlap

    return chunks


def index_document(
    document_id: str,
    parsed_doc: ParsedDocument,
    client: Optional[ClientAPI] = None,
) -> int:
    """ParsedDocument nesnesindeki tüm bölümleri ChromaDB'ye indeksler.

    Section sınırları ve metadata korunur.

    Args:
        document_id: Benzersiz doküman kimliği.
        parsed_doc: Docling ile ayrıştırılmış doküman.
        client: İsteğe bağlı özel ChromaDB client (testler için).

    Returns:
        int: İndekslenen toplam chunk sayısı.
    """
    collection = get_or_create_collection(client=client)

    documents: list[str] = []
    metadatas: list[dict[str, Any]] = []
    ids: list[str] = []

    chunk_idx = 0
    for sec in parsed_doc.sections:
        section_chunks = chunk_section(sec)
        for sub_idx, chunk_text in enumerate(section_chunks):
            chunk_id = f"{document_id}_sec_{sec.level}_{chunk_idx}_{sub_idx}"
            documents.append(chunk_text)
            metadatas.append(
                {
                    "document_id": document_id,
                    "section_title": sec.title,
                    "section_level": sec.level,
                    "page_start": sec.page_start,
                    "page_end": sec.page_end,
                }
            )
            ids.append(chunk_id)
            chunk_idx += 1

    # Eğer dokümanda hiç bölüm yoksa raw_markdown'dan yedek chunk üret
    if not documents and parsed_doc.raw_markdown.strip():
        documents.append(parsed_doc.raw_markdown[:3000])
        metadatas.append(
            {
                "document_id": document_id,
                "section_title": "Full Document",
                "section_level": 1,
                "page_start": 1,
                "page_end": parsed_doc.total_pages,
            }
        )
        ids.append(f"{document_id}_raw_0")

    if documents:
        collection.upsert(
            documents=documents,
            metadatas=metadatas,
            ids=ids,
        )

    return len(documents)


def query_document(
    document_id: str,
    query: str,
    section_filter: Optional[str] = None,
    n_results: int = 5,
    client: Optional[ClientAPI] = None,
) -> list[dict[str, Any]]:
    """ChromaDB üzerinden ilgili dökümana ait chunk'ları sorgular.

    Args:
        document_id: Sorgulanacak döküman kimliği.
        query: Semantik arama sorgusu.
        section_filter: İsteğe bağlı bölüm başlığı filtresi.
        n_results: Getirilecek maksimum sonuç sayısı.
        client: İsteğe bağlı ChromaDB istemcisi.

    Returns:
        list[dict[str, Any]]: Eşleşen chunk metinleri ve metadata listesi.
    """
    collection = get_or_create_collection(client=client)

    where_clause: dict[str, Any]
    if section_filter:
        where_clause = {
            "$and": [
                {"document_id": {"$eq": document_id}},
                {"section_title": {"$eq": section_filter}},
            ]
        }
    else:
        where_clause = {"document_id": {"$eq": document_id}}

    results = collection.query(
        query_texts=[query],
        n_results=n_results,
        where=where_clause,
    )

    formatted_results: list[dict[str, Any]] = []
    if results and results.get("documents") and results["documents"][0]:
        docs = results["documents"][0]
        metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
        distances = (
            results["distances"][0]
            if results.get("distances") and results["distances"][0]
            else [0.0] * len(docs)
        )

        for doc_text, meta, dist in zip(docs, metas, distances):
            formatted_results.append(
                {
                    "content": doc_text,
                    "metadata": meta,
                    "distance": dist,
                }
            )

    return formatted_results
