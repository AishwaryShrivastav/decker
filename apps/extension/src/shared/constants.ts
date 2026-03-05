export const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "https://your-decker-app.vercel.app"
    : "http://localhost:3000";
