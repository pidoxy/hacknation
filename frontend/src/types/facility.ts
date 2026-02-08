export interface Facility {
    uniqueId: string;
    contentTableId?: string;
    name: string;
    facilityType?: string;
    operatorType?: string;
    description?: string;
    specialties: string[];
    capabilities: string[];
    procedures: string[];
    equipment: string[];
    addressCity?: string;
    addressRegion?: string;
    addressCountry: string;
    phoneNumbers: string[];
    email?: string;
    websites: string[];
    yearEstablished?: number;
    numberDoctors?: number;
    capacity?: number;
    lat?: number;
    lng?: number;
    dataCompleteness: number;
    anomalies: string[];
    normalizedRegion?: string;
}

export interface FacilitySummary {
    uniqueId: string;
    name: string;
    facilityType?: string;
    addressCity?: string;
    addressRegion?: string;
    specialties: string[];
    capabilitiesCount: number;
    dataCompleteness: number;
    hasAnomalies: boolean;
    lat?: number;
    lng?: number;
}

export interface FacilityMapData {
    uniqueId: string;
    name: string;
    facilityType?: string;
    lat: number;
    lng: number;
    region?: string;
    specialtiesCount: number;
    capabilitiesCount: number;
    hasAnomalies: boolean;
}

export interface RegionStats {
    region: string;
    totalFacilities: number;
    hospitals: number;
    clinics: number;
    specialtiesAvailable: string[];
    capabilitiesCoverage: Record<string, number>;
    avgDataCompleteness: number;
    anomalyCount: number;
    isMedicalDesert: boolean;
    desertGaps: string[];
    population?: number;
    facilitiesPer100k?: number;
}

export interface DataQualityStats {
    totalFacilities: number;
    uniqueFacilities: number;
    duplicatesFound: number;
    enrichmentRate: number;
    fieldsNormalized: number;
    regionVariantsFixed: number;
    avgCompleteness: number;
    completenessByRegion: Record<string, number>;
    completenessByField: Record<string, number>;
}
