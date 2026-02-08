export interface AgentStep {
    stepNumber: number;
    agentName: string;
    action: string;
    inputSummary: string;
    outputSummary: string;
    dataSources: string[];
    durationMs?: number;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: ChatSource[];
    agentTrace?: AgentStep[];
    visualizationHint?: string;
    timestamp: Date;
}

export interface ChatSource {
    facilityId: string;
    facilityName: string;
    region: string;
    relevance: number;
}

export interface ChatResponse {
    answer: string;
    sources: ChatSource[];
    agentTrace: AgentStep[];
    visualizationHint?: string;
    conversationId: string;
}

export interface SuggestedCategory {
    category: string;
    examples: string[];
}
