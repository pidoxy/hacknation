import json
import uuid
from pathlib import Path
from typing import List, Dict

DATA_DIR = Path(__file__).parent.parent / "data"
PLANS_FILE = DATA_DIR / "plans.json"


class PlanStore:
    def __init__(self):
        self._plans: List[Dict] = []
        self._load()

    def _load(self):
        if PLANS_FILE.exists():
            try:
                self._plans = json.loads(PLANS_FILE.read_text())
            except Exception:
                self._plans = []

    def _save(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        PLANS_FILE.write_text(json.dumps(self._plans, indent=2))

    def list(self) -> List[Dict]:
        return sorted(self._plans, key=lambda p: p.get("created_at", ""), reverse=True)

    def create(self, plan: Dict) -> Dict:
        plan_id = str(uuid.uuid4())
        record = {
            **plan,
            "id": plan_id,
        }
        self._plans.append(record)
        self._save()
        return record

    def update(self, plan_id: str, updates: Dict) -> Dict:
        for i, plan in enumerate(self._plans):
            if plan.get("id") == plan_id:
                self._plans[i] = {**plan, **updates}
                self._save()
                return self._plans[i]
        raise KeyError(plan_id)


plan_store = PlanStore()
