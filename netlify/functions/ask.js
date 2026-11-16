
exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const question = String(body.question || body.message || "").trim();

    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ answer: "Please ask a question." })
      };
    }

    const query = encodeURIComponent(
      "CBSE Class 11 NCERT " + question
    );

    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${query}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    if (!response.ok) {
      throw new Error("Search service unavailable");
    }

    const html = await response.text();

    const clean = (text) =>
      text
        .replace(/<[^>]*>/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();

    const results = [];
    const regex =
      /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

    let match;

    while ((match = regex.exec(html)) !== null && results.length < 5) {
      results.push({
        title: clean(match[2]),
        link: match[1],
        snippet: clean(match[3])
      });
    }

    if (!results.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          answer: "I couldn't find reliable results for that question. Try rephrasing it or including the NCERT chapter name."
        })
      };
    }

    const answer = results.map((item, index) =>
      `${index + 1}. ${item.title}\n${item.snippet}\nSource: ${item.link}`
    ).join("\n\n");

    return {
      statusCode: 200,
      body: JSON.stringify({
        answer: "Here are NCERT Class 11-related search results. These are source summaries, not verified textbook solutions:\n\n" + answer
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        answer: "AURA couldn't search right now. Please try again."
      })
    };
  }
};
