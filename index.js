import { autoResizeTextarea, setLoading, showStream } from "./utils.js";
import {marked} from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";

// Get UI elements
const giftForm = document.getElementById("gift-form");
const userInput = document.getElementById("user-input");
const outputContent = document.getElementById("output-content");

function start() {
  userInput.addEventListener("input", () => autoResizeTextarea(userInput));
  giftForm.addEventListener("submit", handleGiftRequest);
}

async function handleGiftRequest(e) {
  e.preventDefault();

  const userPrompt = userInput.value.trim();
  if (!userPrompt) return;

  setLoading(true);
  showStream();
  outputContent.innerHTML = '<span class="status-msg">Thinking<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>';

  try {
    const response = await fetch("/api/gift", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userPrompt }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server error ${response.status}: ${errText.slice(0, 200)}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let assistantResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop(); // keep any incomplete line for next iteration

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") break;

        const { content } = JSON.parse(payload);
        assistantResponse += content;

        const html = marked.parse(assistantResponse);
        outputContent.innerHTML = DOMPurify.sanitize(html, {
          ALLOWED_TAGS: ["p","h1","h2","h3","h4","h5","h6","ul","ol","li","pre","code","blockquote","a","strong","em"],
          ALLOWED_ATTR: ["href", "target", "rel"],
          ALLOWED_PROTOCOLS: ["http:", "https:", "mailto:"],
        });
      }
    }
  } catch (error) {
    console.error(error);
    outputContent.textContent =
     ` Ooops Genie encountered ${error} while processing your request. Check the console.`;
  } finally {
    setLoading(false);
  }
}

start();

