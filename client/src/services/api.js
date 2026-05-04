import axios from "axios";

// 🔥 Backend URL (auto switch for production via Vercel env variables)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

const API = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const runCode = async (code, languageId) => {
  const response = await API.post("/api/execute", {
    code: code,
    languageId: languageId,
  });

  return response.data;
};
