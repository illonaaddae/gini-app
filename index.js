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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Server error ${response.status}`);
    }

    const html = marked.parse(data.message);
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "pre",
        "code",
        "blockquote",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "img",
        "a",
      ],
      ALLOWED_ATTR: ["href", "target", "rel"],
      ALLOWED_PROTOCOLS: ["http:", "https:", "mailto:"]
  });

    outputContent.innerHTML = sanitizedHtml;
  } catch (error) {
    console.error(error);
    outputContent.textContent =
     ` Ooops Genie encountered ${error} while processing your request. Check the console.`;
  } finally {
    setLoading(false);
  }
}

start();

