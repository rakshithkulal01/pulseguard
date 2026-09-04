export const normalizeListResponse = (response) =>
  Array.isArray(response) ? response : response?.data || [];

export const normalizeObjectResponse = (response) => response?.data ?? response;
