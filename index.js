import { autoResizeTextarea, setLoading, showStream, enforceWordLimit, validateInput } from "./utils.js";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Get UI elements
const giftForm = document.getElementById("gift-form");
const userInput = document.getElementById("user-input");
const outputContent = document.getElementById("output-content");
const lampBtn = document.getElementById("lamp-button");
const wordCounter = document.getElementById("word-counter");
const inputError = document.getElementById("input-error");

let activeController = null;

function isLoading() {
  return lampBtn.classList.contains("loading");
}

function refreshInputState() {
  const hasContent = userInput.value.trim().length > 0;
  lampBtn.classList.toggle("typing", hasContent);
  lampBtn.disabled = !hasContent;
}

function showError(message) {
  inputError.textContent = message;
  inputError.classList.add("visible");
  userInput.classList.add("error");
  userInput.setAttribute("aria-invalid", "true");
}

function clearError() {
  inputError.textContent = "";
  inputError.classList.remove("visible");
  userInput.classList.remove("error");
  userInput.removeAttribute("aria-invalid");
}

function resetInput() {
  userInput.value = "";
  autoResizeTextarea(userInput);
  enforceWordLimit(userInput, wordCounter);
  refreshInputState();
}

function start() {
  refreshInputState();

  userInput.addEventListener("input", () => {
    enforceWordLimit(userInput, wordCounter);
    autoResizeTextarea(userInput);
    refreshInputState();
    if (inputError.classList.contains("visible")) clearError();
  });

  // Enter submits, Shift+Enter inserts a newline. Esc cancels in-flight stream.
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (isLoading() || lampBtn.disabled) return;
      giftForm.requestSubmit();
      return;
    }
    if (e.key === "Escape" && activeController) {
      e.preventDefault();
      activeController.abort();
    }
  });

  giftForm.addEventListener("submit", handleGiftRequest);
}

async function handleGiftRequest(e) {
  e.preventDefault();
  if (isLoading()) return;

  const userPrompt = userInput.value.trim();
  const { valid, message } = validateInput(userPrompt);
  if (!valid) {
    showError(message);
    userInput.focus();
    return;
  }
  clearError();

  activeController = new AbortController();
  setLoading(true);
  showStream();
  outputContent.innerHTML = '<span class="status-msg">Thinking<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>';

  try {
    const response = await fetch("/api/gift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userPrompt }),
      signal: activeController.signal,
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
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") break;

        try {
          const { content } = JSON.parse(payload);
          assistantResponse += content;
          outputContent.innerHTML = DOMPurify.sanitize(marked.parse(assistantResponse), {
            ALLOWED_TAGS: ["p","h1","h2","h3","h4","h5","h6","ul","ol","li","pre","code","blockquote","a","strong","em"],
            ALLOWED_ATTR: ["href", "target", "rel"],
            ALLOWED_PROTOCOLS: ["http:", "https:", "mailto:"],
          });
        } catch {
          // skip malformed SSE chunks
        }
      }
    }
    resetInput();
  } catch (error) {
    if (error.name === "AbortError") {
      outputContent.innerHTML += '<p class="status-msg"><em>— cancelled</em></p>';
    } else {
      console.error(error);
      outputContent.textContent = ` Ooops Genie encountered ${error} while processing your request. Check the console.`;
    }
  } finally {
    activeController = null;
    setLoading(false);
    refreshInputState();
  }
}

start();
