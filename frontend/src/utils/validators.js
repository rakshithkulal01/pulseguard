export const validatePatient = ({ name, age, gender, bloodGroup }) => {
  const errors = {};
  if (!name?.trim()) errors.name = "Full name is required.";
  const numericAge = Number(age);
  if (!age || !Number.isInteger(numericAge) || numericAge < 1 || numericAge > 120) errors.age = "Age must be between 1 and 120.";
  if (!gender) errors.gender = "Gender is required.";
  if (!bloodGroup) errors.bloodGroup = "Blood group is required.";
  return errors;
};
