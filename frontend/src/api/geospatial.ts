import api from "./axiosConfig";

export interface GeospatialQuery {
    message?: string;
    lat?: number;
    lng?: number;
    locationLabel?: string;
    radiusKm?: number;
    hours?: number;
    facilityType?: string;
    capabilityCategory?: string;
    limitWithin?: number;
    limitNearest?: number;
    limitColdSpots?: number;
}

export const geospatialApi = {
    query: (payload: GeospatialQuery) => api.post("/geospatial", payload),
};
