export const MAX_WORDS = 100;
export const MIN_CHARS = 3;

/**
 * Validate user input. Returns { valid, message } — message is empty when valid.
 */
export function validateInput(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: "Please describe the gift you're looking for." };
  }
  if (trimmed.length < MIN_CHARS) {
    return { valid: false, message: `Add a few more details (at least ${MIN_CHARS} characters).` };
  }
  return { valid: true, message: "" };
}

/**
 * Auto-resize textarea to fit content
 */
export function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export function countWords(text) {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/**
 * Truncate text to at most maxWords words, preserving original whitespace
 * (newlines, indentation) by walking through the input rather than splitting.
 */
export function truncateToWords(text, maxWords) {
  if (countWords(text) <= maxWords) return text;
  const wordRegex = /\S+/g;
  let match;
  let count = 0;
  let endIndex = 0;
  while ((match = wordRegex.exec(text)) !== null) {
    count += 1;
    endIndex = match.index + match[0].length;
    if (count === maxWords) break;
  }
  return text.slice(0, endIndex);
}

export function enforceWordLimit(textarea, counterEl, maxWords = MAX_WORDS) {
  let count = countWords(textarea.value);
  if (count > maxWords) {
    textarea.value = truncateToWords(textarea.value, maxWords);
    count = maxWords;
  }
  if (counterEl) {
    counterEl.textContent = `${count} / ${maxWords} words`;
    counterEl.classList.toggle("at-limit", count >= maxWords);
  }
  return count;
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

/**
 * Show the output container immediately (for streaming feedback)
 */
export function showStream() {
  const outputContainer = document.getElementById("output-container");
  outputContainer.classList.remove("hidden");
  outputContainer.classList.add("visible");
}
