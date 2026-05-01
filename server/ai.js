const axios = require("axios");

async function askAI(prompt) {
  try {
    const res = await axios.post(
      "https://text.pollinations.ai/",
      {
        messages: [
          {
            role: "system",
            content: "You are an expert pair-programmer and code assistant. Help the user by reviewing their code, finding bugs, and providing clean examples.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (res.data) {
      return res.data;
    }
  } catch (err) {
    console.error("AI API failed:", err.message);
  }

  return "I'm currently unable to process this request. Please try again later.";
}

module.exports = { askAI };