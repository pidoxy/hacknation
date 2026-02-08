import api from "./axiosConfig";

export const analysisApi = {
    medicalDeserts: () => api.get("/analysis/medical-deserts"),
    regionDesert: (region: string) => api.get(`/analysis/medical-deserts/${region}`),
    anomalies: () => api.get("/analysis/anomalies"),
    dataQuality: () => api.get("/analysis/data-quality"),
    regionStats: () => api.get("/analysis/region-stats"),
    specialtyCoverage: () => api.get("/analysis/specialty-coverage"),
};
