/* =========================================================
   OLYMPUS AI — CHAT INTERFACE
   Self-contained UI. Does not rewrite or reorder the navbar.
   ========================================================= */

import {
  OLYMPUS_AI_CONFIG,
  OLYMPUS_AI_QUICK_PROMPTS
} from "./ai-config.js";
import { processUserMessage } from "./ai-engine.js";
import { getFeatureCatalog } from "./ai-catalog.js";
import { openFeature } from "./ai-navigation.js";

const ROOT_ID = "olympusAiRoot";

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function initOlympusAI() {
  if (document.getElementById(ROOT_ID)) return;

 const root = createElement("div", "oai-root");
root.id = ROOT_ID;

// Hide Olympus AI until the welcome gate is passed.
root.hidden = !window.__OLYMPUS_WELCOME_GATE_PASSED__;

// Reveal it only after the user clicks "Let's Begin".
window.addEventListener(
  "olympus:welcome-gate-passed",
  () => {
    root.hidden = false;
  },
  { once: true }
);

  const launcher = createElement("button", "oai-launcher", "✨ Olympus AI");
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open Olympus AI assistant");
  launcher.setAttribute("aria-expanded", "false");

  const panel = createElement("section", "oai-panel");
  panel.setAttribute("aria-label", "Olympus AI assistant");
  panel.setAttribute("aria-hidden", "true");

  const header = createElement("div", "oai-header");
  const headingWrap = createElement("div", "oai-heading-wrap");
  headingWrap.append(
    createElement("div", "oai-title", "✦ Olympus AI"),
    createElement("div", "oai-subtitle", "Your academy dashboard assistant")
  );

  const close = createElement("button", "oai-close", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Close Olympus AI");
  header.append(headingWrap, close);

  const messages = createElement("div", "oai-messages");
  messages.setAttribute("aria-live", "polite");

  const quickArea = createElement("div", "oai-quick-prompts");
  const inputArea = createElement("form", "oai-input-area");
  const input = createElement("input", "oai-input");
  input.type = "text";
  input.placeholder = "Ask me where to find something…";
  input.autocomplete = "off";
  input.maxLength = 300;

  const send = createElement("button", "oai-send", "Send");
  send.type = "submit";
  inputArea.append(input, send);

  panel.append(header, messages, quickArea, inputArea);
  root.append(launcher, panel);
  document.body.appendChild(root);

  function setOpen(open) {
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    launcher.setAttribute("aria-expanded", String(open));
    launcher.textContent = open ? "✦ Close AI" : "✦ Olympus AI";
    if (open) input.focus();
  }

  function addMessage(text, role = "assistant") {
    const row = createElement("div", `oai-message oai-${role}`);
    row.textContent = text;
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function addFeatureButton(feature, parent = messages) {
    const button = createElement("button", "oai-feature", feature.label);
    button.type = "button";
    button.addEventListener("click", () => {
      const result = openFeature(feature.tab);
      addMessage(result.message, "assistant");
      if (result.ok) setOpen(false);
    });
    parent.appendChild(button);
  }

  function renderFeatureList(features, limit = 30) {
    const list = createElement("div", "oai-feature-list");
    for (const feature of features.slice(0, limit)) addFeatureButton(feature, list);
    messages.appendChild(list);
    messages.scrollTop = messages.scrollHeight;
  }



function handleMessage(message) {

  addMessage(message, "user");

  const result = processUserMessage(message);

  addMessage(result.text, "assistant");

  if (result.type === "catalog") {

    renderFeatureList(result.features);

  } else if (result.suggestions?.length) {

    renderFeatureList(
      result.suggestions,
      OLYMPUS_AI_CONFIG.maxSuggestions
    );

  }

}




function renderQuickPrompts() {

  quickArea.replaceChildren();

  // ==========================================
  // OLYMPUS AI CATEGORY MENUS
  // ==========================================

  const categories = [
    {
      name: "Training",
      icon: "📗",
      tabs: [
        "chessBaseLiveTactics", "puzzlerush",
        "puzzletrainer", "quiz", "chessPlayerQuiz",
        "boardfreeze", "guessElo", "pathHunter",
        "captureChallenge", "impossibleCheck",
        "chessMaze", "findDifferences", "emojiMemory",
        "memoryMatch", "queenChallenge"
      ]
    },
    {
      name: "Games",
      icon: "🕹️",
      tabs: [
        "snakes", "dotConnect", "chessCraftGo",
        "chessduko", "chesscrush", "chessAssassin",
        "chessTraffic", "color", "memory",
        "kingmath", "flashqueen", "pathfinder", "iqtrainer"
      ]
    },
    {
      name: "Knight Games",
      icon: "🐴",
      tabs: [
        "knightTour", "knightfog", "knightdefense",
        "knightpath", "knightmonster", "colorchaos",
        "knightescape", "knightspeed", "knightlava",
        "knightgps"
      ]
    },
    {
      name: "Community",
      icon: "🌍",
      tabs: [
        "todayChessNews", "lichessTV", "chessBaseLive",
        "chessBaseTournament", "chessLegends",
        "gallery", "xp-casino", "worldClock"
      ]
    }
  ];

  const catalogue = getFeatureCatalog();

  // ==========================================
  // CATEGORY BUTTONS
  // ==========================================

  for (const category of categories) {

    const button = createElement(
      "button",
      "oai-quick",
      `${category.icon} ${category.name}`
    );

    button.type = "button";

    button.addEventListener("click", () => {

      const availableFeatures = catalogue.filter(feature =>
        category.tabs.includes(feature.tab)
      );

      addMessage(
        `Show me the ${category.name} section.`,
        "user"
      );

      if (!availableFeatures.length) {
        addMessage(
          `No verified ${category.name} features are currently available.`,
          "assistant"
        );
        return;
      }

      addMessage(
        `Here are the available ${category.name} features. Click one to open it:`,
        "assistant"
      );

      renderFeatureList(availableFeatures);

    });

    quickArea.appendChild(button);
  }

  // ==========================================
  // KEEP EXISTING QUICK PROMPTS
  // ==========================================

  for (const prompt of OLYMPUS_AI_QUICK_PROMPTS) {

    const button = createElement("button", "oai-quick", prompt);

    button.type = "button";

    button.addEventListener("click", () => handleMessage(prompt));

    quickArea.appendChild(button);
  }

}


  launcher.addEventListener("click", () => {
    setOpen(!panel.classList.contains("is-open"));
  });

  close.addEventListener("click", () => setOpen(false));

  inputArea.addEventListener("submit", event => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    input.value = "";
    handleMessage(value);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && panel.classList.contains("is-open")) {
      setOpen(false);
    }
  });

  renderQuickPrompts();
  addMessage(OLYMPUS_AI_CONFIG.welcomeMessage);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOlympusAI, { once: true });
} else {
  initOlympusAI();
}
