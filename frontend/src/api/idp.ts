import api from "./axiosConfig";

export const idpApi = {
    extract: (facilityId: string) =>
        api.post("/idp/extract", { facilityId }),

    demoFacilities: () => api.get("/idp/demo-facilities"),

    schema: () => api.get("/idp/schema"),
};
