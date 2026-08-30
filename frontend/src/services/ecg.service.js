import api from "./api";
export const processECG = async (payload) => (await api.post("/ecg/process", payload)).data;
export const getHistory = async (profileId) => (await api.get(`/ecg/history/${profileId}`)).data;
export const getSession = async (id) => (await api.get(`/ecg/session/${id}`)).data;
export const deleteSession = async (id) => (await api.delete(`/ecg/session/${id}`)).data;
