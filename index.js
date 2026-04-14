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

const messages = [
  {
    role: "system",
    content: `Your job is to suggest thoughtful, practical, and useful gift ideas based on the user's request. You are context-aware and adapt your suggestions based on location, budget, time constraints, and other contextual clues.

Rules:
  * If they mention a location (city, country, region), suggest gifts available or popular there.
  * If they mention a budget constraint, ensure all suggestions fit within it.
  * If they mention a time constraint (urgent, last-minute, future date), adapt accordingly.
  Markdown Formatting (CRITICAL):
  - Each gift starts with ## heading: ## Gift 1: [Name]
  - Under each gift, always include these ### subheadings in this order:
    * ### Why it works (brief explanation)
    * ### How to Get It (where to find, cost, timeline, customization)
  - End with ## Questions for you (with 2-4 bullet-point questions)
  - Use ##/### for ALL section headings. Never use plain text or bold instead.

  * If they mention an event or occasion, tailor suggestions to that context.
    * Give 3 to 5 gift ideas unless the user asks for fewer or more.
    * If they mention a location (city, country, region), suggest gifts available or popular there.
    * If they mention a budget constraint, ensure all suggestions fit within it.
    * If they mention a time constraint (urgent, last-minute, future date), adapt accordingly.
    * If they mention an event or occasion, tailor suggestions to that context.
    * Include where to find it (online, local stores, specialty shops).
    * Include estimated cost range when possible.
    * Include timeline to acquire it (same-day, next-day, pre-order).
    * Include preparation or customization steps when useful.
    * Keep the response concise and easy to scan.
    * Ask 2 to 4 short follow-up questions in the final section.`,
  },

  {
    role: "user",
    content:
      "dubai airport. last minute gifts for niece (arts & crafts) and nephew who loves football",
  },
  {
    role: "assistant",
    content: `
### Travel Art Kit for Niece (Compact & Portable)

A small, kid-friendly arts & crafts item that's easy to pack and perfect for a quick creative distraction during travel.

**How to get it:**
1. Head to Dubai International Airport (DXB) and proceed to Terminal 3 Departures.
2. Visit Dubai Duty Free or a nearby WHSmith that carries kids’ stationery.
3. Ask for compact arts & crafts kits or a coloring book with pencils.
4. Choose a lightweight option suitable for carry-on.
5. Request gift wrapping if available.

---

### Mini Football Keychain for Nephew

A light, inexpensive football-themed souvenir that’s easy to carry and perfect for an airport purchase.

**How to get it:**
1. Visit Dubai Duty Free or a souvenir shop near the gates.
2. Ask for football-themed keychains or small sports souvenirs.
3. Check toy or sports sections if needed.
4. Purchase and pack securely.

---

## Questions for you
1. What are the ages of your niece and nephew?
2. Do you have a budget per gift?
3. Are you departing from Terminal 3?
4. Does your nephew support a specific team?
`,
  },
  {
    role: "user",
    content:
      "need birthday gifts in london for my sister who loves coffee and journaling. budget is 25 to 40 pounds each. i need them by tomorrow",
  },
  {
    role: "assistant",
    content: `
### Specialty Coffee Beans + Small Tasting Notebook

A fresh bag of specialty beans paired with a compact notebook gives her a practical coffee ritual she can actually use right away.

**How to get it:**
1. Check nearby specialty coffee shops in London (for example, Monmouth, Origin, or local roasters).
2. Ask for a 250g bag in your budget range and add a pocket notebook from a nearby stationery shop.
3. Most central shops can be visited and purchased same-day.

---

### Guided Journal + Fine Liner Pen Set

A guided journal makes writing easier to stick with, and a smooth pen set makes it feel more enjoyable for daily use.

**How to get it:**
1. Visit Paperchase, Waterstones, or WHSmith for guided journals and pen sets.
2. Choose one journal around 15 to 25 pounds and pens around 10 to 15 pounds.
3. Use click-and-collect if a nearby branch has low stock for tomorrow pickup.

---

### Reusable Coffee Cup + Cafe Gift Card

This gives her both a useful everyday item and immediate value she can enjoy on her next coffee run.

**How to get it:**
1. Pick up a quality reusable cup from John Lewis, M&S, or a coffee chain branch.
2. Add a gift card from her favorite cafe brand to stay within your 25 to 40 pounds target.
3. Both items are typically available same-day across central London.

---

## Questions for you
1. Does she prefer filter coffee, espresso, or pods at home?
2. Would you like gifts that feel more practical or more sentimental?
3. Do you want all items bought in-store only, or is click-and-collect okay?
4. Should I prioritize brands near a specific London area?
`,
  },
];

// Handle form submission
async function handleGiftRequest(e) {
  e.preventDefault();

  const userPrompt = userInput.value.trim();
  if (!userPrompt) return;

  setLoading(true);

  messages.push({
    role: "user",
    content: userPrompt,
  });

  try {
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL,
      messages,
      stream: true,
    });

    let assistantResponse = "";
    showStream();

    for await (const chunk of response) {
      const chunkContent = chunk.choices[0]?.delta?.content ?? "";
      assistantResponse += chunkContent;

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

    messages.push({ role: "assistant", content: assistantResponse });
  } catch (error) {
    outputContent.textContent = `Ooops Genie encountered ${error} while processing your request.`;
  } finally {
    setLoading(false);
  }
}

start();
