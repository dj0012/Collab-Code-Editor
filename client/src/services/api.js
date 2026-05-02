import axios from "axios";

const API = axios.create({
  baseURL: "https://judge0-ce.p.rapidapi.com",
  timeout: 10000,
  headers: {
    "X-RapidAPI-Key": "556bc9d3a0mshc2c011f74f308a9p1ab0c3jsn4172e0fbe926",
    "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
    "Content-Type": "application/json",
  },
});

export const runCode = async (code, languageId) => {
  const response = await API.post("/submissions?base64_encoded=false&wait=true", {
    source_code: code,
    language_id: languageId,
  });

  return response.data;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
const BackendAPI = axios.create({
  baseURL: BACKEND_URL,
});

BackendAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("collab_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = async (username, password) => {
  const res = await BackendAPI.post("/api/auth/register", { username, password });
  return res.data;
};

export const loginUser = async (username, password) => {
  const res = await BackendAPI.post("/api/auth/login", { username, password });
  return res.data;
};

export const getUserRooms = async () => {
  const res = await BackendAPI.get("/api/user/rooms");
  return res.data;
};

export const getTemplates = async () => {
  const res = await BackendAPI.get("/api/templates");
  return res.data;
};

export const getVersions = async (roomId) => {
  const res = await BackendAPI.get(`/api/versions/${roomId}`);
  return res.data;
};

export const saveVersion = async (roomId, name, savedBy, files) => {
  const res = await BackendAPI.post("/api/versions", { roomId, name, savedBy, files });
  return res.data;
};
