import os
import json
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from app.db.database import SQLALCHEMY_DATABASE_URL
from app.models.core import Signal, Trend, TrendScoreSnapshot, TrendScoreChange

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("Deduplicating Signals...")
signals = db.query(Signal).all()
signals_by_title = {}
for s in signals:
    t = s.title.lower()
    if t not in signals_by_title:
        signals_by_title[t] = []
    signals_by_title[t].append(s)

for t, sigs in signals_by_title.items():
    if len(sigs) > 1:
        # Keep the first one
        keep = sigs[0]
        for s in sigs[1:]:
            db.delete(s)

print("Deduplicating Trends...")
trends = db.query(Trend).all()
trends_by_name = {}
for t in trends:
    n = t.name.lower()
    if n not in trends_by_name:
        trends_by_name[n] = []
    trends_by_name[n].append(t)

for n, trs in trends_by_name.items():
    if len(trs) > 1:
        keep = trs[0]
        for t in trs[1:]:
            # Delete related snapshots and changes first
            db.query(TrendScoreChange).filter(TrendScoreChange.trend_id == t.id).delete()
            db.query(TrendScoreSnapshot).filter(TrendScoreSnapshot.trend_id == t.id).delete()
            db.delete(t)

db.commit()
db.close()
print("Done!")
