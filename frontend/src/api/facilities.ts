import api from "./axiosConfig";

export const facilitiesApi = {
    list: (params?: {
        region?: string;
        facilityType?: string;
        specialty?: string;
        hasAnomalies?: boolean;
        page?: number;
        pageSize?: number;
    }) => api.get("/facilities/", { params }),

    get: (uniqueId: string) => api.get(`/facilities/${uniqueId}`),

    search: (query: string, topK?: number) =>
        api.get("/facilities/search", { params: { q: query, topK: topK || 10 } }),

    stats: () => api.get("/facilities/stats"),

    mapData: () => api.get("/facilities/all-map-data"),

    regions: () => api.get("/facilities/regions"),
};
