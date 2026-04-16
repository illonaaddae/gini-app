/**
 * Auto-resize textarea to fit content
 */
export function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

/**
 * Toggle loading state for the request lifecycle.
 * When entering loading state: resets textarea, hides output, animates lamp.
 * When exiting: restores lamp to compact state.
 */
export function setLoading(isLoading) {
  const lampButton = document.getElementById("lamp-button");
  const lampText = document.querySelector(".lamp-text");
  const userInput = document.getElementById("user-input");
  const outputContainer = document.getElementById("output-container");

  lampButton.disabled = isLoading;

  if (isLoading) {
    // Reset textarea and hide previous output
    userInput.style.height = "auto";
    outputContainer.classList.add("hidden");
    outputContainer.classList.remove("visible");

    // Animate lamp
    lampButton.classList.remove("compact");
    lampButton.classList.add("loading");
    lampText.textContent = "Summoning Gift Ideas...";
  } else {
    // Restore lamp to compact state
    outputContainer.classList.remove("hidden");
    outputContainer.classList.add("visible");
    lampButton.classList.remove("loading");
    lampButton.classList.add("compact");
    lampText.textContent = "Ask the Genie";
  }
}

export function checkEnvironment() {
  const aiUrl = process.env.AI_URL || import.meta.env.VITE_AI_URL;
  const aiModel = process.env.AI_MODEL || import.meta.env.VITE_AI_MODEL;
  const aiKey = process.env.AI_KEY || import.meta.env.VITE_AI_KEY;

  if (!aiUrl) {
    throw new Error(
      "Missing AI_URL. This tells us which AI provider you're using.",
    );
  }

  if (!aiModel) {
    throw new Error("Missing AI_MODEL. The AI request needs a model name.");
  }

  if (!aiKey) {
    throw new Error("Missing AI_KEY. Your API key is not being picked up.");
  }

  if (aiUrl.includes("openrouter.ai") && !aiKey.startsWith("sk-or-v1-")) {
    throw new Error(
      "OpenRouter URL detected, but the key does not look like an OpenRouter key (expected prefix: sk-or-v1-).",
    );
  }

  console.log("AI provider URL:", aiUrl);
  console.log("AI model:", aiModel);
}

/**
 * Show the output container immediately (for streaming feedback)
 */
export function showStream() {
  const outputContainer = document.getElementById("output-container");
  outputContainer.classList.remove("hidden");
  outputContainer.classList.add("visible");
}
