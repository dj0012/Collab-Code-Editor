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
