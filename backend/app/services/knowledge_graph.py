from __future__ import annotations

import json

from sqlalchemy.orm import Session

from app.models.core import Document, EvidenceLink, KGEdge, KGNode, Signal, Source, Trend


def sync_entity_to_knowledge_graph(
    db: Session,
    entity_type: str,
    entity_id: str,
    label: str,
    summary: str | None = None,
    confidence_score: float = 1.0,
    evidence_ids: list[str] | None = None,
) -> tuple[KGNode, bool]:
    node = db.query(KGNode).filter(
        KGNode.node_type == entity_type,
        KGNode.properties.contains(f'"entity_id": "{entity_id}"'),
    ).first()
    if node:
        return node, False

    node = KGNode(
        label=label,
        node_type=entity_type,
        summary=summary,
        confidence_score=confidence_score,
        evidence_ids=json.dumps(evidence_ids or []),
        properties=json.dumps({"entity_id": entity_id}),
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    return node, True


def create_evidence_edge(
    db: Session,
    source_id: str,
    target_id: str,
    relationship_type: str,
    confidence_score: float = 1.0,
    evidence_ids: list[str] | None = None,
) -> tuple[KGEdge, bool]:
    existing = db.query(KGEdge).filter(
        KGEdge.source_id == source_id,
        KGEdge.target_id == target_id,
        KGEdge.relationship_type == relationship_type,
    ).first()
    if existing:
        return existing, False

    edge = KGEdge(
        source_id=source_id,
        target_id=target_id,
        relationship_type=relationship_type,
        confidence_score=confidence_score,
        evidence_ids=json.dumps(evidence_ids or []),
    )
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return edge, True


def build_knowledge_graph_for_trend(db: Session, trend_id: str) -> dict | None:
    trend = db.query(Trend).filter(Trend.id == trend_id).first()
    if not trend:
        return None

    nodes_created = 0
    edges_created = 0
    node_ids: set[str] = set()
    edge_ids: set[str] = set()

    trend_node, created = sync_entity_to_knowledge_graph(
        db,
        "trend",
        trend.id,
        trend.name,
        trend.summary,
        trend.confidence_score or 1.0,
    )
    nodes_created += int(created)
    node_ids.add(trend_node.entity_id)

    evidence_links = db.query(EvidenceLink).filter(EvidenceLink.trend_id == trend_id).all()
    for evidence in evidence_links:
        signal = db.query(Signal).filter(Signal.id == evidence.signal_id).first()
        if signal:
            signal_node, created = sync_entity_to_knowledge_graph(
                db,
                "signal",
                signal.id,
                signal.title,
                signal.summary,
                signal.confidence_score or 1.0,
                [evidence.id],
            )
            nodes_created += int(created)
            node_ids.add(signal_node.entity_id)
            edge, created = create_evidence_edge(
                db,
                signal_node.entity_id,
                trend_node.entity_id,
                evidence.relationship_type.value if hasattr(evidence.relationship_type, "value") else evidence.relationship_type,
                signal.confidence_score or 1.0,
                [evidence.id],
            )
            edges_created += int(created)
            edge_ids.add(edge.id)

        if evidence.document_id:
            document = db.query(Document).filter(Document.id == evidence.document_id).first()
            if document and signal:
                doc_node, created = sync_entity_to_knowledge_graph(
                    db,
                    "document",
                    document.id,
                    document.title,
                    document.content[:240],
                    1.0,
                    [evidence.id],
                )
                nodes_created += int(created)
                node_ids.add(doc_node.entity_id)
                edge, created = create_evidence_edge(db, doc_node.entity_id, signal_node.entity_id, "contains", 1.0, [evidence.id])
                edges_created += int(created)
                edge_ids.add(edge.id)

        if evidence.source_id:
            source = db.query(Source).filter(Source.id == evidence.source_id).first()
            if source and evidence.document_id:
                doc_node = _find_node(db, "document", evidence.document_id)
                source_node, created = sync_entity_to_knowledge_graph(
                    db,
                    "source",
                    source.id,
                    source.name,
                    source.notes,
                    source.credibility_score or 1.0,
                    [evidence.id],
                )
                nodes_created += int(created)
                node_ids.add(source_node.entity_id)
                if doc_node:
                    edge, created = create_evidence_edge(db, source_node.entity_id, doc_node.entity_id, "published", source.credibility_score or 1.0, [evidence.id])
                    edges_created += int(created)
                    edge_ids.add(edge.id)

    return {
        "trend_id": trend_id,
        "nodes_created": nodes_created,
        "edges_created": edges_created,
        "node_ids": sorted(node_ids),
        "edge_ids": sorted(edge_ids),
    }


def get_graph_neighborhood(db: Session, center_entity_id: str, depth: int = 1) -> dict | None:
    center = db.query(KGNode).filter(KGNode.entity_id == center_entity_id).first()
    if not center:
        return None

    depth = max(1, min(depth, 3))
    node_ids = {center_entity_id}
    edges: list[KGEdge] = []
    frontier = {center_entity_id}

    for _ in range(depth):
        connected = db.query(KGEdge).filter(
            (KGEdge.source_id.in_(frontier)) | (KGEdge.target_id.in_(frontier))
        ).all()
        next_frontier: set[str] = set()
        for edge in connected:
            edges.append(edge)
            if edge.source_id not in node_ids:
                next_frontier.add(edge.source_id)
            if edge.target_id not in node_ids:
                next_frontier.add(edge.target_id)
            node_ids.add(edge.source_id)
            node_ids.add(edge.target_id)
        frontier = next_frontier
        if not frontier:
            break

    nodes = db.query(KGNode).filter(KGNode.entity_id.in_(node_ids)).all()
    unique_edges = list({edge.id: edge for edge in edges}.values())
    return {
        "center_entity_id": center_entity_id,
        "depth": depth,
        "nodes": nodes,
        "edges": unique_edges,
    }


def _find_node(db: Session, entity_type: str, entity_id: str) -> KGNode | None:
    return db.query(KGNode).filter(
        KGNode.node_type == entity_type,
        KGNode.properties.contains(f'"entity_id": "{entity_id}"'),
    ).first()
