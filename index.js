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
  // Setup UI event listeners
  userInput.addEventListener("input", () => autoResizeTextarea(userInput));
  giftForm.addEventListener("submit", handleGiftRequest);
}

// Initialize messages array with system prompt
const messages = [
  {
    role: "system",
    content: `You are the Gift Genie.

Your job is to suggest thoughtful, practical, and useful gift ideas based on the user's request. You are context-aware and adapt your suggestions based on location, budget, time constraints, and other contextual clues.

Rules:
  * If they mention a location (city, country, region), suggest gifts available or popular there.
  * If they mention a budget constraint, ensure all suggestions fit within it.
  * If they mention a time constraint (urgent, last-minute, future date), adapt accordingly.
  * If they mention an event or occasion, tailor suggestions to that context.
  * Where to find it (online, local stores, specialty shops).
  * Estimated cost range if not already mentioned.
  * Timeline to acquire it (same-day, next-day, pre-order).
  * Any preparation or customization steps if needed.

async function handleGiftRequest(e) {

  // Get user input, trim whitespace, exit if empty
  // Set loading state to start the animation
  setLoading(true);

  messages.push({
    content: userPrompt,
  });

  try {
      stream: true,
    });

    let assistantResponse = "";

    // Show output container immediately for streaming feedback
    showStream();

    for await (const chunk of response) {
      const chunkContent = chunk.choices[0]?.delta?.content ?? "";
      assistantResponse += chunkContent;

      // Convert Markdown to HTML
      const responseHTML = marked.parse(assistantResponse);

      // Sanitize the HTML (allow heading tags)
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
  } catch (error) {
    outputContent.textContent = `Ooops Genie encounted ${error} while processing your request.`;
  } finally {
    // Clear loading state
    setLoading(false);
  }
}

start();
