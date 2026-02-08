export interface AgentStep {
    stepNumber: number;
    agentName: string;
    action: string;
    inputSummary: string;
    outputSummary: string;
    dataSources: string[];
    citations?: Array<{
        type: string;
        id?: string;
        label?: string;
        region?: string;
    }>;
    durationMs?: number;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: ChatSource[];
    agentTrace?: AgentStep[];
    visualizationHint?: string;
    geospatial?: GeospatialResult;
    timestamp: Date;
}

export interface ChatSource {
    facilityId: string;
    facilityName: string;
    region: string;
    relevance: number;
    rowId?: string;
    evidence?: Array<{
        field: string;
        text: string;
    }>;
}

export interface ChatResponse {
    answer: string;
    sources: ChatSource[];
    agentTrace: AgentStep[];
    visualizationHint?: string;
    geospatial?: GeospatialResult;
    conversationId: string;
}

export interface GeospatialLocation {
    label?: string;
    coords?: [number, number];
    source?: string;
}

export interface GeospatialFacility {
    name: string;
    uniqueId?: string;
    type?: string;
    region?: string;
    distanceKm?: number;
}

export interface GeospatialColdSpot {
    region: string;
    distanceKm?: number;
}

export interface GeospatialResult {
    location?: GeospatialLocation;
    radiusKm?: number;
    timeHours?: number;
    assumedSpeedKmh?: number;
    facilityType?: string;
    capabilityCategory?: string;
    withinRadius?: GeospatialFacility[];
    nearest?: GeospatialFacility[];
    coldSpots?: GeospatialColdSpot[];
}

export interface SuggestedCategory {
    category: string;
    examples: string[];
}
