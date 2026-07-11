from typing import TypeVar, Generic, Type, Any, Optional
from sqlalchemy.orm import Session
from app.models.core import (
    Industry, Source, Document, Signal, Trend, EvidenceLink,
    MonitoringRule, MonitoringRun, Alert, WhatChangedSummary,
    SourceSnapshot, ChangeEvent, TrendScoreSnapshot, TrendScoreChange,
    StrategicContext, Assumption, LeadingIndicator, StrategicImplication,
    Scenario, StrategicOption, DecisionBrief, RoadmapItem,
    AgentActivity, Prediction, PredictionUpdate, PredictionOutcome, AgentDebate,
    KGNode, KGEdge, AuditEvent, Embedding,
    DataExport, HealthCheck
)

ModelType = TypeVar("ModelType")

class CRUDBase(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get(self, id: Any) -> Optional[ModelType]:
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_all(self):
        return self.db.query(self.model).all()

    def create(self, **kwargs) -> ModelType:
        obj = self.model(**kwargs)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, id: Any, **kwargs) -> Optional[ModelType]:
        obj = self.get(id)
        if obj:
            for key, value in kwargs.items():
                setattr(obj, key, value)
            self.db.commit()
            self.db.refresh(obj)
        return obj
        
    def delete(self, id: Any) -> bool:
        """Hard delete is disabled. Use audited_delete() for immutable audit compliance."""
        raise NotImplementedError(
            "CRUDBase.delete() is disabled. "
            "Use audited_delete(id, actor, reason) to produce an immutable AuditEvent before removal."
        )

    def audited_delete(self, id: Any, actor: str = "system", reason: str = "") -> bool:
        """Soft-safe delete: writes an AuditEvent then hard-deletes. Only use for non-critical data."""
        from app.models.core import AuditEvent
        import json
        obj = self.get(id)
        if obj:
            audit = AuditEvent(
                action="delete",
                entity_type=self.model.__tablename__,
                entity_id=str(id),
                user_id=actor,
                details=json.dumps({"reason": reason})
            )
            self.db.add(audit)
            self.db.delete(obj)
            self.db.commit()
            return True
        return False

# Phase 1
class IndustryRepository(CRUDBase[Industry]):
    def __init__(self, db: Session):
        super().__init__(Industry, db)

class SourceRepository(CRUDBase[Source]):
    def __init__(self, db: Session):
        super().__init__(Source, db)
        
    def get_by_status(self, status: str):
        return self.db.query(self.model).filter(self.model.status == status).all()

class DocumentRepository(CRUDBase[Document]):
    def __init__(self, db: Session):
        super().__init__(Document, db)

class SignalRepository(CRUDBase[Signal]):
    def __init__(self, db: Session):
        super().__init__(Signal, db)

class TrendRepository(CRUDBase[Trend]):
    def __init__(self, db: Session):
        super().__init__(Trend, db)

class EvidenceLinkRepository(CRUDBase[EvidenceLink]):
    def __init__(self, db: Session):
        super().__init__(EvidenceLink, db)

# Phase 2
class MonitoringRuleRepository(CRUDBase[MonitoringRule]):
    def __init__(self, db: Session):
        super().__init__(MonitoringRule, db)

class MonitoringRunRepository(CRUDBase[MonitoringRun]):
    def __init__(self, db: Session):
        super().__init__(MonitoringRun, db)

class AlertRepository(CRUDBase[Alert]):
    def __init__(self, db: Session):
        super().__init__(Alert, db)

class WhatChangedSummaryRepository(CRUDBase[WhatChangedSummary]):
    def __init__(self, db: Session):
        super().__init__(WhatChangedSummary, db)

class SourceSnapshotRepository(CRUDBase[SourceSnapshot]):
    def __init__(self, db: Session):
        super().__init__(SourceSnapshot, db)

    def get_by_source(self, source_id: str):
        return self.db.query(self.model).filter(self.model.source_id == source_id).all()

class ChangeEventRepository(CRUDBase[ChangeEvent]):
    def __init__(self, db: Session):
        super().__init__(ChangeEvent, db)

    def get_by_source(self, source_id: str):
        return self.db.query(self.model).filter(self.model.source_id == source_id).all()

class TrendScoreSnapshotRepository(CRUDBase[TrendScoreSnapshot]):
    def __init__(self, db: Session):
        super().__init__(TrendScoreSnapshot, db)

    def get_by_trend(self, trend_id: str):
        return self.db.query(self.model).filter(
            self.model.trend_id == trend_id
        ).order_by(self.model.captured_at).all()

class TrendScoreChangeRepository(CRUDBase[TrendScoreChange]):
    def __init__(self, db: Session):
        super().__init__(TrendScoreChange, db)

    def get_by_trend(self, trend_id: str):
        return self.db.query(self.model).filter(
            self.model.trend_id == trend_id
        ).order_by(self.model.changed_at).all()

# Phase 3
class StrategicContextRepository(CRUDBase[StrategicContext]):
    def __init__(self, db: Session):
        super().__init__(StrategicContext, db)

class AssumptionRepository(CRUDBase[Assumption]):
    def __init__(self, db: Session):
        super().__init__(Assumption, db)

class LeadingIndicatorRepository(CRUDBase[LeadingIndicator]):
    def __init__(self, db: Session):
        super().__init__(LeadingIndicator, db)

class StrategicImplicationRepository(CRUDBase[StrategicImplication]):
    def __init__(self, db: Session):
        super().__init__(StrategicImplication, db)

class ScenarioRepository(CRUDBase[Scenario]):
    def __init__(self, db: Session):
        super().__init__(Scenario, db)

class StrategicOptionRepository(CRUDBase[StrategicOption]):
    def __init__(self, db: Session):
        super().__init__(StrategicOption, db)

class DecisionBriefRepository(CRUDBase[DecisionBrief]):
    def __init__(self, db: Session):
        super().__init__(DecisionBrief, db)

class RoadmapItemRepository(CRUDBase[RoadmapItem]):
    def __init__(self, db: Session):
        super().__init__(RoadmapItem, db)

# Phase 4
class AgentActivityRepository(CRUDBase[AgentActivity]):
    def __init__(self, db: Session):
        super().__init__(AgentActivity, db)

class PredictionRepository(CRUDBase[Prediction]):
    def __init__(self, db: Session):
        super().__init__(Prediction, db)

class PredictionUpdateRepository(CRUDBase[PredictionUpdate]):
    def __init__(self, db: Session):
        super().__init__(PredictionUpdate, db)

class PredictionOutcomeRepository(CRUDBase[PredictionOutcome]):
    def __init__(self, db: Session):
        super().__init__(PredictionOutcome, db)

class AgentDebateRepository(CRUDBase[AgentDebate]):
    def __init__(self, db: Session):
        super().__init__(AgentDebate, db)

# Phase 5
class KGNodeRepository(CRUDBase[KGNode]):
    def __init__(self, db: Session):
        super().__init__(KGNode, db)

class KGEdgeRepository(CRUDBase[KGEdge]):
    def __init__(self, db: Session):
        super().__init__(KGEdge, db)

class AuditEventRepository(CRUDBase[AuditEvent]):
    def __init__(self, db: Session):
        super().__init__(AuditEvent, db)

class EmbeddingRepository(CRUDBase[Embedding]):
    def __init__(self, db: Session):
        super().__init__(Embedding, db)

class DataExportRepository(CRUDBase[DataExport]):
    def __init__(self, db: Session):
        super().__init__(DataExport, db)

class HealthCheckRepository(CRUDBase[HealthCheck]):
    def __init__(self, db: Session):
        super().__init__(HealthCheck, db)
