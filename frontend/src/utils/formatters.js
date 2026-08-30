const BLOOD_GROUPS = {
  A_POSITIVE: "A+", A_NEGATIVE: "A-", B_POSITIVE: "B+", B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+", AB_NEGATIVE: "AB-", O_POSITIVE: "O+", O_NEGATIVE: "O-",
};

export const getInitials = (name = "") => name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join("").toUpperCase().slice(0, 2);
export const formatBloodGroup = (value) => BLOOD_GROUPS[value] || value || "N/A";
export const formatGender = (value) => {
  if (!value) return "N/A";
  return value.charAt(0) + value.slice(1).toLowerCase();
};
export const formatDateTime = (value, fallback = "Never monitored") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => error?.response?.data?.message || error?.message || fallback;
