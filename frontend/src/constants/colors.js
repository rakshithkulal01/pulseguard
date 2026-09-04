export const PATIENT_CARD_TYPES = ["blue", "green", "red", "orange"];
export const getPatientCardType = (index) =>
  PATIENT_CARD_TYPES[index % PATIENT_CARD_TYPES.length];
