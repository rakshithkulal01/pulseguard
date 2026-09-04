import api from "./api";
export const getReport = async (sessionId) =>
  (await api.get(`/report/${sessionId}`)).data;
export const downloadReport = async (sessionId) =>
  (await api.get(`/report/download/${sessionId}`, { responseType: "blob" }))
    .data;
