import OpenAI from "openai";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  autoResizeTextarea,
  checkEnvironment,
  setLoading,
  showStream,
} from "./utils.js";

checkEnvironment();

// Initialize an OpenAI client for your provider using env vars
const openai = new OpenAI({
  apiKey: process.env.AI_KEY,
  baseURL: process.env.AI_URL,
  dangerouslyAllowBrowser: true,
});

// Get UI elements
const giftForm = document.getElementById("gift-form");
const userInput = document.getElementById("user-input");
const outputContent = document.getElementById("output-content");

function start() {
  userInput.addEventListener("input", () => autoResizeTextarea(userInput));
  giftForm.addEventListener("submit", handleGiftRequest);
}

const systemPrompt = `Your job is to suggest thoughtful, practical, and useful gift ideas based on the user's request. You are context-aware and adapt your suggestions based on location, budget, time constraints, and other contextual clues.

Web search — use it only when it adds real value, and at most once per request:
  * A specific city, country, or region is mentioned → search for local stores or region-specific options.
  * A specific product or brand is mentioned → search to verify availability and price.
  * User asks about same-day or next-day delivery → search for current options.
  * Skip searching for general gift ideas you already know well — answer from your knowledge to keep responses fast.

Rules:
  * Give 3 to 5 gift ideas unless the user asks for fewer or more.
  * If they mention a budget, keep all suggestions within it.
  * If they mention an occasion or recipient, tailor suggestions to that context.
  * Include where to find it and a realistic price range.
  * Keep responses concise and easy to scan.

Markdown Formatting (CRITICAL):
  - Each gift: ## Gift 1: [Name]
  - Under each gift, in this order:
    * ### Why it works
    * ### How to Get It (where, price, timeline)
  - End with ## Questions for you (2-4 bullet points)
  - Use ##/### for ALL headings — never plain text or bold instead.`;

// Handle form submission
async function handleGiftRequest(e) {
  e.preventDefault();

  const userPrompt = userInput.value.trim();
  if (!userPrompt) return;

  setLoading(true);

  try {
    const response = await openai.responses.create({
      model: process.env.AI_MODEL,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],

      tools: [
        {
          type: "web_search_preview",
        },
      ],
      max_output_tokens: 1500,
      stream: true,
    });

    let assistantResponse = "";
    showStream();
    outputContent.innerHTML = '<span class="status-msg">Thinking<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>';

    for await (const chunk of response) {
      if (chunk.type === "response.web_search_call.in_progress") {
        outputContent.innerHTML = '<span class="status-msg">Searching the web<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>';
      }

      if (chunk.type === "response.output_text.delta") {
        assistantResponse += chunk.delta;

        const responseHTML = marked.parse(assistantResponse);
        const safeHTML = DOMPurify.sanitize(responseHTML, {
          ALLOWED_TAGS: [
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "p",
            "br",
            "strong",
            "em",
            "u",
            "ul",
            "ol",
            "li",
            "a",
          ],
          ALLOWED_ATTR: ["href", "title"],
        });

        outputContent.innerHTML = safeHTML;
      }
    }

  } catch (error) {
    console.error("Genie error:", error);
    const isRateLimit = error?.message?.includes("Rate limit");
    outputContent.textContent = isRateLimit
      ? "The Genie is overwhelmed — too many wishes at once! Wait a few seconds and try again."
      : `Ooops Genie encountered ${error} while processing your request.`;
  } finally {
    setLoading(false);
  }
}

start();
