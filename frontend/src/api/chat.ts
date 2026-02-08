import api from "./axiosConfig";

export const chatApi = {
    query: (message: string, conversationId?: string) =>
        api.post("/chat/query", { message, conversationId }),

    suggestedQueries: () => api.get("/chat/suggested-queries"),
};
