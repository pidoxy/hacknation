import api from "./client";
import type {
  Facility,
  FacilitySummary,
  MedicalDesertResponse,
  RegionStats,
  DataQualityStats,
  AnomalyReport,
  CoverageStats,
  ChatResponse,
  IDPResult,
} from "../types";

/* ── Facilities ───────────────────────────────────────────────────────────── */

export async function fetchFacilities(params?: {
  region?: string;
  facility_type?: string;
  specialty?: string;
  has_anomalies?: boolean;
  limit?: number;
  offset?: number;
}): Promise<FacilitySummary[]> {
  const { data } = await api.get("/facilities/", { params });
  return data;
}

export async function fetchFacility(id: string): Promise<Facility> {
  const { data } = await api.get(`/facilities/${id}`);
  return data;
}

export async function searchFacilities(
  query: string,
  topK = 10
): Promise<{ query: string; results: { facility: FacilitySummary; score: number }[] }> {
  const { data } = await api.post("/facilities/search", { query, top_k: topK });
  return data;
}

/* ── Analysis ─────────────────────────────────────────────────────────────── */

export async function fetchDeserts(): Promise<MedicalDesertResponse> {
  const { data } = await api.get("/analysis/deserts");
  return data;
}

export async function fetchRegions(): Promise<RegionStats[]> {
  const { data } = await api.get("/analysis/regions");
  return data;
}

export async function fetchRegion(name: string): Promise<RegionStats> {
  const { data } = await api.get(`/analysis/regions/${name}`);
  return data;
}

export async function fetchAnomalies(): Promise<AnomalyReport> {
  const { data } = await api.get("/analysis/anomalies");
  return data;
}

export async function fetchDataQuality(): Promise<DataQualityStats> {
  const { data } = await api.get("/analysis/quality");
  return data;
}

export async function fetchCoverage(): Promise<CoverageStats> {
  const { data } = await api.get("/analysis/coverage");
  return data;
}

/* ── Chat ─────────────────────────────────────────────────────────────────── */

export async function sendMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  const { data } = await api.post("/chat/", {
    message,
    conversation_id: conversationId,
  });
  return data;
}

/* ── IDP ──────────────────────────────────────────────────────────────────── */

export async function runIDPExtraction(facilityId: string): Promise<IDPResult> {
  const { data } = await api.post("/idp/extract", { facility_id: facilityId });
  return data;
}

/* ── Voice ────────────────────────────────────────────────────────────────── */

export async function textToSpeech(text: string): Promise<Blob> {
  const { data } = await api.post("/voice/tts", { text }, { responseType: "blob" });
  return data;
}

/* ── Health ───────────────────────────────────────────────────────────────── */

export async function healthCheck(): Promise<{
  status: string;
  facilities_loaded: number;
  vector_store_ready: boolean;
}> {
  const { data } = await api.get("/health");
  return data;
}
