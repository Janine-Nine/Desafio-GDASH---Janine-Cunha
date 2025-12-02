// Auth State (Simple simulation)
export const isAuthenticated = () => localStorage.getItem("gdash_auth") === "true";

export const logout = () => {
  localStorage.removeItem("gdash_auth");
  localStorage.removeItem("gdash_token");
};
