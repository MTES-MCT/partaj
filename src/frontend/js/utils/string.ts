export const isValidEmail = (email: string) => {
  return /\S+@\S+\.\S+/.test(email);
};
