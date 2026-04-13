import OpenAI from "openai";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { autoResizeTextarea, checkEnvironment, setLoading } from "./utils.js";
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
    content: `You are the Gift Genie!
    Make your gift suggestions thoughtful and practical.
    Your response must be under 100 words. 
    Skip intros and conclusions. 
    Only output gift suggestions.`,
  },
];

async function handleGiftRequest(e) {
  // Prevent default form submission
  e.preventDefault();

  // Get user input, trim whitespace, exit if empty
  const userPrompt = userInput.value.trim();
  if (!userPrompt) return;

  // Set loading state to start the animation
  setLoading(true);

  messages.push({
    role: "user",
    content: userPrompt,
  });

  
  try {
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL,
      messages,
    });

    // Extract the model's generated text from the response
    const assistantResponse = response.choices[0].message.content;
    const responseHTML = marked.parse(assistantResponse);
    const safeHTML = DOMPurify.sanitize(responseHTML)

    outputContent.innerHTML = safeHTML;
  } catch (error) {
    console.log(error);
    outputContent.textContent = `Ooops Genie encounted ${error} while processing your request.`;
  } finally {
    // Clear loading state
    setLoading(false);
  }
  
}

start();
