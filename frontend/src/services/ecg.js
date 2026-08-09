import api from "./api";

export const processECG = async (payload) => {
  const response = await api.post("/ecg/process", payload);
  return response.data;
};

export const getHistory = async (profileId) => {
  const response = await api.get(`/ecg/history/${profileId}`);
  return response.data;
};

export const getSession = async (id) => {
  const response = await api.get(`/ecg/session/${id}`);
  return response.data;
};

export const deleteSession = async (id) => {
  const response = await api.delete(`/ecg/session/${id}`);
  return response.data;
};
