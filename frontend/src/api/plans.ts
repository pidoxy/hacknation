import api from "./axiosConfig";

export const plansApi = {
    list: () => api.get("/plans"),
    create: (payload: any) => api.post("/plans", payload),
    update: (id: string, payload: any) => api.put(`/plans/${id}`, payload),
};
