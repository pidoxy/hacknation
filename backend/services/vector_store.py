import numpy as np
import faiss
from typing import List, Tuple, Optional
from sentence_transformers import SentenceTransformer

from models.facility import Facility


class VectorStore:
    """FAISS-based vector store for semantic facility search."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.index: Optional[faiss.IndexFlatL2] = None
        self.facility_ids: List[str] = []
        self.facilities_map: dict = {}

    def build_index(self, facilities: List[Facility]):
        """Build FAISS index from facility data."""
        texts = []
        self.facility_ids = []
        self.facilities_map = {}

        for f in facilities:
            doc = self._facility_to_text(f)
            texts.append(doc)
            self.facility_ids.append(f.unique_id)
            self.facilities_map[f.unique_id] = f

        # Generate embeddings
        embeddings = self.model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
        embeddings = np.array(embeddings, dtype=np.float32)

        # Build FAISS index
        dim = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)  # Inner product (cosine sim with normalized vectors)
        self.index.add(embeddings)

        return self

    def search(self, query: str, top_k: int = 10) -> List[Tuple[Facility, float]]:
        """Search for facilities matching a natural language query."""
        if self.index is None:
            return []

        query_embedding = self.model.encode([query], normalize_embeddings=True)
        query_embedding = np.array(query_embedding, dtype=np.float32)

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
