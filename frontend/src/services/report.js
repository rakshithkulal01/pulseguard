import api from "./api";

export const getReport = async (sessionId) => {
  const response = await api.get(`/report/${sessionId}`);
  return response.data;
};

export const downloadReport = async (sessionId) => {
  const response = await api.get(`/report/download/${sessionId}`, {
    responseType: "blob"
  });
  return response.data;
};
