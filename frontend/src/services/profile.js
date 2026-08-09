import api from "./api";

export const getProfiles = async () => {
  const response = await api.get("/profiles");
  return response.data;
};

export const createProfile = async (profileData) => {
  const response = await api.post("/profiles", profileData);
  return response.data;
};

export const getProfileById = async (id) => {
  const response = await api.get(`/profiles/${id}`);
  return response.data;
};

export const updateProfile = async (id, profileData) => {
  const response = await api.put(`/profiles/${id}`, profileData);
  return response.data;
};

export const deleteProfile = async (id) => {
  const response = await api.delete(`/profiles/${id}`);
  return response.data;
};
