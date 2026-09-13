// ---------------------------------------------------------------------------
// generator.js — talks to the Claude API and turns a user's idea into a
// complete, self-contained, mobile-first web app (one HTML file).
//
// Why a single HTML file? It keeps the prototype dead simple and reliable:
// no build step, instant "deploy" (we just save it and serve it at /a/<id>),
// works offline via a generic service worker, and is easy to regenerate.
// ---------------------------------------------------------------------------

const API_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are the app engine inside "Gurke", a tool that turns a plain-language idea into a small installable web app.

Output EXACTLY this, nothing else:
1. First line: an HTML comment with metadata:
   <!--GURKE_META {"name":"Short App Name","emoji":"⏱️","themeColor":"#618751"}-->
2. Then a complete HTML5 document: ONE self-contained file with inline <style> and <script>.

Hard rules for the generated app:
- Mobile-first: designed for a ~390px wide phone screen, touch-friendly targets (min 44px), works up to desktop widths.
- Fully self-contained: NO external scripts, stylesheets, fonts, images, or network requests of any kind. Use system fonts, emoji, and inline SVG — exception: the GURKE_REFERENCE_IMAGE_PLACEHOLDER token is allowed as an <img> src or CSS url() value when instructed.
- Persistence: save user data with localStorage under a single namespaced key like "gurke:<app-name>". Load it on start, handle missing/corrupt data gracefully (try/catch around JSON.parse).
- Include <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"> and <meta name="theme-color" content="...">.
- No <form> submissions that reload the page; wire buttons with addEventListener.
- Clean, commented, readable vanilla JS. No frameworks.
- Polished look: a clear header with the app name, generous spacing, rounded cards, one accent color, dark-mode support via prefers-color-scheme when it fits the app.
- Handle empty states with a friendly hint about what to do first.
- If the idea involves time (timers, reminders): keep timers accurate using timestamps (Date.now()), not just setInterval counting.
- Keep it focused: build the core feature really well instead of many half-features.

If the user asks to MODIFY an existing app, you will receive its current HTML. Return the full updated file (same output format), preserving the existing localStorage key so user data survives the update.`;

// Appended to SYSTEM_PROMPT whenever a reference image is attached.
// The model reads both the image and the prompt and decides how to treat it.
const REFERENCE_IMAGE_INSTRUCTION = `

A reference image is attached. Decide whether the user wants:
(a) their exact photo, logo, or image embedded and used directly as a visual asset — as a background, an icon, or a game sprite or character that moves — in which case output the exact string GURKE_REFERENCE_IMAGE_PLACEHOLDER as the src of an <img> tag or the url() value in a CSS background-image, wherever that asset belongs in the layout or game logic; or
(b) only the general style, palette, or mood of the image reflected in your own original design, in which case do not use the placeholder — design normally, inspired by what is in the photo.
Judge this from what the user's request implies about how the photographed content should actually appear or function, not from specific keywords.`;

/**
 * Ask Claude to generate (or update) an app.
 * @param {string} prompt              What the user wants.
 * @param {string|null} currentHtml    Existing app HTML when iterating.
 * @param {string|null} referenceImage Base64 data URL for aesthetic inspiration.
 * @returns {{name, emoji, themeColor, html}}
 */
export async function generateApp(prompt, currentHtml = null, referenceImage = null) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY. Copy .env.example to .env.local and add your key."
    );
  }

  const systemPrompt = referenceImage ? SYSTEM_PROMPT + REFERENCE_IMAGE_INSTRUCTION : SYSTEM_PROMPT;

  const textContent = currentHtml
    ? `Here is the current app:\n\n${currentHtml}\n\nPlease apply this change: ${prompt}`
    : prompt;

  const userContent = referenceImage
    ? [
        { type: "text", text: textContent },
        { type: "image_url", image_url: { url: referenceImage } },
      ]
    : textContent;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      max_completion_tokens: 16000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.choices[0].message.content;

  const result = parseGeneratedApp(text);
  if (referenceImage) {
    result.html = result.html.replaceAll("GURKE_REFERENCE_IMAGE_PLACEHOLDER", referenceImage);
  }
  return result;
}

/** Pull the GURKE_META comment + HTML document out of the model's reply. */
function parseGeneratedApp(text) {
  // Strip accidental markdown fences, just in case.
  const cleaned = text.replace(/^\s*```(?:html)?\s*/i, "").replace(/\s*```\s*$/, "");

  let meta = { name: "New app", emoji: "🌱", themeColor: "#618751" };
  const metaMatch = cleaned.match(/<!--GURKE_META\s*({[\s\S]*?})\s*-->/);
  if (metaMatch) {
    try {
      meta = { ...meta, ...JSON.parse(metaMatch[1]) };
    } catch {
      // Bad JSON in the comment — keep defaults rather than failing the run.
    }
  }

  const htmlStart = cleaned.search(/<!DOCTYPE html>/i);
  if (htmlStart === -1) {
    throw new Error("The model did not return a complete HTML document. Try again.");
  }

  return { ...meta, html: cleaned.slice(htmlStart) };
}
