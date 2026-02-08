import logging
import numpy as np
import faiss
from typing import List, Tuple, Optional
from openai import OpenAI, NotFoundError

from config import get_settings
from models.facility import Facility

logger = logging.getLogger(__name__)


class VectorStore:
    """FAISS vector store backed by OpenAI embeddings."""

    def __init__(self, model_name: Optional[str] = None):
        settings = get_settings()
        self.default_model = "text-embedding-3-small"
        self.model_name = model_name or settings.embedding_model or self.default_model
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.index: Optional[faiss.IndexFlatIP] = None
        self.facility_ids: List[str] = []
        self.facilities_map: dict = {}

    def build_index(self, facilities: List[Facility]):
        """Build FAISS index from facility data using OpenAI embeddings."""
        texts = []
        self.facility_ids = []
        self.facilities_map = {}

        for f in facilities:
            doc = self._facility_to_text(f)
            texts.append(doc)
            self.facility_ids.append(f.unique_id)
            self.facilities_map[f.unique_id] = f

        if not texts:
            self.index = None
            return self

        embeddings = self._embed_texts(texts)
        dim = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(embeddings)

        return self

    def search(self, query: str, top_k: int = 10) -> List[Tuple[Facility, float]]:
        """Search for facilities matching a natural language query."""
        if self.index is None:
            return []

        query_embedding = self._embed_texts([query])
        scores, indices = self.index.search(query_embedding, min(top_k, len(self.facility_ids)))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self.facility_ids):
                continue
            fid = self.facility_ids[idx]
            facility = self.facilities_map.get(fid)
            if facility:
                results.append((facility, float(score)))

        return results

    def _embed_texts(self, texts: List[str], batch_size: int = 64) -> np.ndarray:
        if not texts:
            return np.array([], dtype=np.float32)

        embeddings: List[List[float]] = []
        model_to_use = self.model_name
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            try:
                response = self.client.embeddings.create(
                    model=model_to_use,
                    input=batch,
                )
            except NotFoundError:
                if model_to_use != self.default_model:
                    logger.warning(
                        "Embedding model '%s' not found. Falling back to '%s'.",
                        model_to_use,
                        self.default_model,
                    )
                    model_to_use = self.default_model
                    response = self.client.embeddings.create(
                        model=model_to_use,
                        input=batch,
                    )
                else:
                    raise
            data_sorted = sorted(response.data, key=lambda d: d.index)
            embeddings.extend([item.embedding for item in data_sorted])

        if model_to_use != self.model_name:
            self.model_name = model_to_use

        arr = np.array(embeddings, dtype=np.float32)
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        arr = arr / norms
        return arr

    def _facility_to_text(self, f: Facility) -> str:
        """Convert a facility to a searchable text document."""
        parts = [
            f"Name: {f.name}",
            f"Type: {f.facility_type or 'Unknown'}",
            f"Location: {f.address_city or ''}, {f.normalized_region or f.address_region or ''}",
        ]
        if f.specialties:
            parts.append(f"Specialties: {', '.join(f.specialties)}")
        if f.capabilities:
            parts.append(f"Capabilities: {', '.join(f.capabilities[:20])}")
        if f.procedures:
            parts.append(f"Procedures: {', '.join(f.procedures[:20])}")
        if f.equipment:
            parts.append(f"Equipment: {', '.join(f.equipment[:20])}")
        if f.description:
            parts.append(f"Description: {f.description[:500]}")
        return " | ".join(parts)


# Global vector store instance
vector_store = VectorStore()
