export const getInitials = (name) => {
  if (!name) return "";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};


export const mapBloodGroup = (bloodGroup) => {
  const map = {
    A_POSITIVE: "A+",
    A_NEGATIVE: "A-",
    B_POSITIVE: "B+",
    B_NEGATIVE: "B-",
    AB_POSITIVE: "AB+",
    AB_NEGATIVE: "AB-",
    O_POSITIVE: "O+",
    O_NEGATIVE: "O-",
  };

  return map[bloodGroup] || bloodGroup;
};


export const mapGender = (gender) => {
  if (!gender) return "";

  return gender.charAt(0) + gender.slice(1).toLowerCase();
};


export const getCardType = (index) => {
  const types = ["blue", "green", "red", "orange"];

  return types[index % types.length];
};