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

You have access to a web search tool. Use it proactively to ground your suggestions in real, current information:
  * Search for current prices at major retailers before quoting a cost range — do not guess.
  * If a location is mentioned, search for local stores, regional retailers, or location-specific delivery options.
  * If an occasion or trend is mentioned (e.g. "Mother's Day 2025", "graduation gift for a gamer"), search for what is trending or popular right now.
  * If a product or brand is mentioned, search for its current availability and whether it is in stock.
  * Prefer linking to real product pages or store listings over generic descriptions.

Rules:
  * Give 3 to 5 gift ideas unless the user asks for fewer or more.
  * If they mention a budget constraint, ensure all suggestions fit within it.
  * If they mention a time constraint (urgent, last-minute, future date), adapt accordingly — search for same-day or expedited options if needed.
  * If they mention an event or occasion, tailor suggestions to that context.
  * Include where to find it (online, local stores, specialty shops) with real links when available.
  * Include current, searched price ranges — not estimates.
  * Include timeline to acquire it (same-day, next-day, pre-order) based on what you find.
  * Include preparation or customization steps when useful.
  * Keep the response concise and easy to scan.

  Markdown Formatting (CRITICAL):
  - Each gift starts with ## heading: ## Gift 1: [Name]
  - Under each gift, always include these ### subheadings in this order:
    * ### Why it works (brief explanation)
    * ### How to Get It (where to find, current price, timeline, and a link if available)
  - End with ## Questions for you (with 2-4 bullet-point questions)
  - Use ##/### for ALL section headings. Never use plain text or bold instead.`;

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
    outputContent.innerHTML = '<span class="status-msg">Thinking<span class="dots"></span></span>';

    for await (const chunk of response) {
      if (chunk.type === "response.web_search_call.in_progress") {
        outputContent.innerHTML = '<span class="status-msg">Searching the web<span class="dots"></span></span>';
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
