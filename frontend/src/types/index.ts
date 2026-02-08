/* ── Facility ─────────────────────────────────────────────────────────────── */

export interface Facility {
  unique_id: string;
  name: string;
  facility_type?: string;
  operator_type?: string;
  description?: string;
  specialties: string[];
  capabilities: string[];
  procedures: string[];
  equipment: string[];
  address_city?: string;
  address_region?: string;
  address_country: string;
  phone_numbers: string[];
  email?: string;
  websites: string[];
  year_established?: number;
  number_doctors?: number;
  capacity?: number;
  lat?: number;
  lng?: number;
  data_completeness: number;
  anomalies: string[];
  normalized_region?: string;
}

export interface FacilitySummary {
  unique_id: string;
  name: string;
  facility_type?: string;
  address_city?: string;
  address_region?: string;
  specialties: string[];
  capabilities_count: number;
  data_completeness: number;
  has_anomalies: boolean;
  lat?: number;
  lng?: number;
}

/* ── Region ───────────────────────────────────────────────────────────────── */

export interface RegionStats {
  region: string;
  total_facilities: number;
  hospitals: number;
  clinics: number;
  specialties_available: string[];
  capabilities_coverage: Record<string, number>;
  avg_data_completeness: number;
  anomaly_count: number;
  is_medical_desert: boolean;
  desert_gaps: string[];
}

/* ── Analysis ─────────────────────────────────────────────────────────────── */

export interface DesertMatrixEntry {
  region: string;
  capability: string;
  facility_count: number;
  status: "critical" | "underserved" | "adequate";
}

export interface MedicalDesertResponse {
  matrix: DesertMatrixEntry[];
  recommendations: Recommendation[];
  total_deserts: number;
  critical_regions: string[];
}

export interface Recommendation {
  priority: string;
  region: string;
  capability: string;
  population_affected?: number;
  recommendation: string;
  [key: string]: unknown;
}

export interface DataQualityStats {
  total_facilities: number;
  unique_facilities: number;
  duplicates_found: number;
  enrichment_rate: number;
  fields_normalized: number;
  region_variants_fixed: number;
  avg_completeness: number;
  completeness_by_region: Record<string, number>;
  completeness_by_field: Record<string, number>;
}

export interface AnomalyReport {
  summary: {
    total_anomalies: number;
    facilities_with_anomalies: number;
    facilities_clean: number;
    anomaly_rate: number;
    by_type: Record<string, number>;
  };
  flagged: FlaggedFacility[];
}

export interface FlaggedFacility {
  unique_id: string;
  name: string;
  facility_type?: string;
  region?: string;
  anomalies: string[];
  data_completeness: number;
}

/* ── Chat ─────────────────────────────────────────────────────────────────── */

export interface AgentStep {
  step_number: number;
  agent_name: string;
  action: string;
  input_summary: string;
  output_summary: string;
  data_sources: string[];
  duration_ms?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent_trace?: AgentStep[];
  visualization_hint?: string;
  timestamp: Date;
}

export interface ChatResponse {
  answer: string;
  sources: Record<string, unknown>[];
  agent_trace: AgentStep[];
  visualization_hint?: string;
  conversation_id: string;
}

/* ── IDP ──────────────────────────────────────────────────────────────────── */

export interface IDPResult {
  original: Record<string, unknown>;
  extracted: Record<string, unknown>;
  confidence_scores: Record<string, number>;
  agent_trace: AgentStep[];
  pydantic_schema: Record<string, unknown>;
  processing_cost: number;
}

/* ── Geospatial ───────────────────────────────────────────────────────────── */

export interface CoverageStats {
  total: number;
  geocoded_count: number;
  geocode_rate: number;
  bounding_box: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  facilities_per_region: Record<string, number>;
  facilities_per_100k: Record<string, number>;
}
