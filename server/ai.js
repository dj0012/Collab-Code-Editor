const axios = require("axios");

async function askAI(prompt) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return "AI feature is not configured. Missing GEMINI_API_KEY.";
    }

    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        systemInstruction: {
          parts: [{ text: "You are an expert pair-programmer and code assistant. Help the user by reviewing their code, finding bugs, and providing clean examples." }]
        },
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (res.data && res.data.candidates && res.data.candidates.length > 0) {
      return res.data.candidates[0].content.parts[0].text;
    }
  } catch (err) {
    console.error("AI API failed:", err.response?.data || err.message);
  }

  return "I'm currently unable to process this request. Please try again later.";
}

module.exports = { askAI };