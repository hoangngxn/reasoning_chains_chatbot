import api from "../config/apiConfig";

export const loginService = async (email: string, password: string) => {
  return api.post("/login", { email, password });
};

export const signUpService = async (
  username: string,
  email: string,
  password: string
) => {
  return api.post("/register", { username, email, password });
};

export const getListConversations = async () => {
  return api.get(`/conversations`);
};

export const getHistory = async (idConversation: string) => {
  return api.get(`/history/${idConversation}`);
};

export const getMe = async () => {
  return api.get(`/info`);
};

export const getModelsService = async () => {
  return api.get(`/models`);
};

export const deleteConversation = async (conv_id: string) => {
  return api.delete(`/conversations/${conv_id}`);
};

export const getUsageData = async () => {
  return api.get(`/usage`);
};

export const getUsageLastDaysService = async () => {
  return api.get(`/usage/last-days-summary`);
};

export const getUsageGemini = async () => {
  return api.get(`/usage/total?model=gemini-2.0-flash`);
};
export const getUsageOllama = async () => {
  return api.get(`/usage/total?model=llama3.2:latest`);
};
