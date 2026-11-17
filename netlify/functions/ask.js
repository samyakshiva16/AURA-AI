
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Please send a POST request."
      })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API key is missing in Netlify.");
    }

    const data = JSON.parse(event.body || "{}");
    const question = data.question || data.message;

    if (!question || !String(question).trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Please ask a question."
        })
      };
    }

    const prompt = `
You are AURA, a helpful AI voice assistant.

Your responsibilities:
- Answer general knowledge questions.
- Explain CBSE Class 11 NCERT subjects clearly.
- Help with Physics, Chemistry, Mathematics,
  Computer Science and English.
- Explain difficult topics from the basics.
- Answer questions in simple English.
- Help with everyday questions.
- Be friendly, accurate and concise.
- Never pretend to know something you do not know.
- Do not claim to have live information unless verified.

User's question:
${String(question).slice(0, 5000)}
`;

    const result = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1200
          }
        })
      }
    );

    const resultData = await result.json();

    if (!result.ok) {
      console.error("Gemini API error:", resultData);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: "Gemini could not answer. Check your API key, model access or usage limits."
        })
      };
    }

    const answer = resultData.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      throw new Error("Gemini returned an empty answer.");
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        answer: answer,
        response: answer,
        text: answer
      })
    };

  } catch (error) {
    console.error("AURA error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "AURA encountered an error. Please try again."
      })
    };
  }
};
