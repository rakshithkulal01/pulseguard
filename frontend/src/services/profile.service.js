import api from "./api";
export const getProfiles = async () => (await api.get("/profiles")).data;
export const createProfile = async (profileData) => (await api.post("/profiles", profileData)).data;
export const getProfileById = async (id) => (await api.get(`/profiles/${id}`)).data;
export const updateProfile = async (id, profileData) => (await api.put(`/profiles/${id}`, profileData)).data;
export const deleteProfile = async (id) => (await api.delete(`/profiles/${id}`)).data;
