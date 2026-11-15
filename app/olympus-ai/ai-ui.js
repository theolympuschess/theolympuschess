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
import { getContext, resetContext } from "./ai-context.js";
import { answerOlympusDataQuestion } from "./ai-data-tools.js";
import { answerMainUIQuestion } from "./ai-app-intelligence.js";
import { OLYMPUS_AI_COMMAND_GROUPS, OLYMPUS_AI_COMMAND_COUNT } from "./ai-command-library.js";

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

  const launcher = createElement("button", "oai-launcher", "✦ Olympus AI");
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
    createElement("div", "oai-subtitle", "Your academy intelligence assistant")
  );

  const headerActions = createElement("div", "oai-header-actions");

  const clearChatButton = createElement("button", "oai-clear-chat", "Clear");
  clearChatButton.type = "button";
  clearChatButton.setAttribute("aria-label", "Clear chat conversation");
  clearChatButton.title = "Clear this conversation";

  const close = createElement("button", "oai-close", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Close Olympus AI");

  headerActions.append(clearChatButton, close);
  header.append(headingWrap, headerActions);

  const messages = createElement("div", "oai-messages");
  messages.setAttribute("aria-live", "polite");

  // Small floating shortcut: when the transcript is scrolled down,
  // students can jump straight back to the ready-made command library.
  const commandTopButton = createElement("button", "oai-command-top", "↑");
  commandTopButton.type = "button";
  commandTopButton.hidden = true;
  commandTopButton.setAttribute("aria-label", "Go to the command list at the top of the chat");
  commandTopButton.title = "Back to command list";

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

  panel.append(header, messages, quickArea, inputArea, commandTopButton);
  root.append(launcher, panel);
  document.body.appendChild(root);

  let commandHub = null;
  // Incremented whenever the transcript is cleared so a slow in-flight
  // request cannot write an old answer back into the fresh conversation.
  let chatGeneration = 0;

  function updateCommandTopButton() {
    commandTopButton.hidden = messages.scrollTop < 140;
  }

  function scrollToCommandLibrary() {
    if (!commandHub) return;



    const targetTop = Math.max(
      0,
      commandHub.getBoundingClientRect().top -
        messages.getBoundingClientRect().top +
        messages.scrollTop - 8
    );
    messages.scrollTo({ top: targetTop, behavior: "smooth" });
  }

  messages.addEventListener("scroll", updateCommandTopButton, { passive: true });
  commandTopButton.addEventListener("click", scrollToCommandLibrary);

  function setOpen(open) {
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    launcher.setAttribute("aria-expanded", String(open));
    launcher.textContent = open ? "✦ Close AI" : "✦ Olympus AI";
    if (open) input.focus();
  }

  function renderMessageText(row, text, role = "assistant") {
    row.replaceChildren();
    const value = String(text ?? "");
    if (role !== "assistant") {
      row.textContent = value;
      return;
    }

    // Safe, tiny formatter: line breaks + **bold** only. No HTML is injected.
    const lines = value.split("\n");
    lines.forEach((line, lineIndex) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      parts.forEach(part => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          const strong = document.createElement("strong");
          strong.textContent = part.slice(2, -2);
          row.appendChild(strong);
        } else if (part) {
          row.appendChild(document.createTextNode(part));
        }
      });
      if (lineIndex < lines.length - 1) row.appendChild(document.createElement("br"));
    });
  }

  function addMessage(text, role = "assistant") {
    const row = createElement("div", `oai-message oai-${role}`);
    renderMessageText(row, text, role);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function clearChat() {
    const confirmed = window.confirm(
      "Clear this conversation? The chat messages and short-term conversation context will be reset. Your account data, ratings, assignments and saved records will not be changed."
    );
    if (!confirmed) return;

    // Invalidate any pending async reply before removing the transcript.
    chatGeneration += 1;
    resetContext();
    messages.replaceChildren();
    commandHub = null;
    input.value = "";

    // Restore the normal starting view with the full command library.
    addMessage(OLYMPUS_AI_CONFIG.welcomeMessage);
    renderCommandLibrary();
    messages.scrollTop = 0;
    updateCommandTopButton();
    input.focus();
  }

  clearChatButton.addEventListener("click", clearChat);

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

  // Build ready-made follow-up prompts from the topic and pending interaction.
  // The permanent category shortcuts remain in the bottom quick-prompt row.
  function getContextualPrompts(message, result) {
    if (!result || result.closeAssistant) return [];

    const ctx = getContext();
    const question = String(ctx.lastQuestion || message || "").toLowerCase();
    const topic = String(ctx.lastTopic || "").toLowerCase();
    const pieceMatch = question.match(/\b(pawn|knight|bishop|rook|queen|king)\b/);
    const piece = pieceMatch?.[1] || "";

    const make = (label, prompt = label) => ({ label, prompt });
    const entertainment = [
      make("Tell me a joke", "Tell me a chess joke"),
      make("Chess fun fact", "Give me a chess fact"),
      make("Try a riddle", "Give me a chess riddle"),
      make("Browse games", "Show me Games")
    ];

    // Continue an unfinished joke, fact, riddle or entertainment choice.
    if (ctx.pending?.type === "riddle") {
      return [
        make("Reveal answer", "Give up"),
        make("Another riddle", "Another")
      ];
    }
    if (ctx.pending?.type === "joke" || ctx.lastIntent === "joke") {
      return [
        make("Another joke", "Another joke"),
        make("Chess fun fact", "Give me a chess fact"),
        make("Try a riddle", "Give me a chess riddle")
      ];
    }
    if (ctx.pending?.type === "fact" || ctx.lastIntent === "fact") {
      return [
        make("Another fact", "Another"),
        make("Tell me a joke", "Tell me a chess joke"),
        make("Try a riddle", "Give me a chess riddle")
      ];
    }
    if (ctx.pending?.type === "entertain") return entertainment;

    // Piece-specific follow-ups. These prompts map to existing knowledge
    // entries or verified catalogue search; no new destination is invented.
    if (topic === "piece-move" && piece === "pawn") {
      return [
        make("Pawn promotion", "What is promotion?"),
        make("En passant", "What is en passant?"),
        make("Piece values", "What are chess piece values?"),
        make("Try a riddle", "Give me a chess riddle")
      ];
    }
    if (topic === "piece-move" && piece === "knight") {
      return [
        make("Knight forks", "What is a fork?"),
        make("Piece values", "What are chess piece values?"),
        make("Knight Games", "Show Knight Games"),
        make("Try a riddle", "Give me a chess riddle")
      ];
    }
    if (topic === "piece-move" && piece === "bishop") {
      return [
        make("Piece values", "What are chess piece values?"),
        make("Pins", "What is a pin?"),
        make("Skewers", "What is a skewer?"),
        make("Chess tactics", "Show me chess tactics")
      ];
    }
    if (topic === "piece-move" && piece === "rook") {
      return [
        make("Piece values", "What are chess piece values?"),
        make("Castling", "How does castling work?"),
        make("Skewers", "What is a skewer?"),
        make("Chess tactics", "Show me chess tactics")
      ];
    }
    if (topic === "piece-move" && piece === "queen") {
      return [
        make("Piece values", "What are chess piece values?"),
        make("Checkmate", "What is checkmate?"),
        make("Chess tactics", "Show me chess tactics"),
        make("Try a riddle", "Give me a chess riddle")
      ];
    }
    if (topic === "piece-move" && piece === "king") {
      return [
        make("Checkmate", "What is checkmate?"),
        make("Stalemate", "What is stalemate?"),
        make("Castling", "How does castling work?"),
        make("Try a riddle", "Give me a chess riddle")
      ];
    }

    // Topic-specific learning paths.
    const topicPrompts = {
      promotion: [make("En passant", "What is en passant?"), make("Piece values", "What are chess piece values?"), make("Pawn movement", "How does a pawn move?")],
      "en-passant": [make("Pawn movement", "How does a pawn move?"), make("Pawn promotion", "What is promotion?"), make("Piece values", "What are chess piece values?")],
      castling: [make("Can I castle in check?", "Can I castle while in check?"), make("Checkmate", "What is checkmate?")],
      checkmate: [make("Stalemate", "What is stalemate?"), make("Castling", "How does castling work?"), make("Try a riddle", "Give me a chess riddle")],
      stalemate: [make("Checkmate", "What is checkmate?"), make("Chess draws", "What are the rules for a draw?"), make("Try a riddle", "Give me a chess riddle")],
      draw: [make("Stalemate", "What is stalemate?"), make("Checkmate", "What is checkmate?"), make("Chess draws", "What is a draw in chess?")],
      fork: [make("Pins", "What is a pin?"), make("Skewers", "What is a skewer?"), make("Chess tactics", "Show me chess tactics")],
      pin: [make("Forks", "What is a fork?"), make("Skewers", "What is a skewer?"), make("Chess tactics", "Show me chess tactics")],
      skewer: [make("Pins", "What is a pin?"), make("Forks", "What is a fork?"), make("Chess tactics", "Show me chess tactics")],
      calculation: [make("Avoid blunders", "How can I avoid blunders?"), make("Chess tactics", "Show me chess tactics"), make("Improve at chess", "How can I improve at chess?")],
      blunders: [make("Calculation", "How can I improve my calculation?"), make("Chess tactics", "Show me chess tactics"), make("Improve at chess", "How can I improve at chess?")],
      improve: [make("Calculation", "How can I improve my calculation?"), make("Endgames", "How can I improve at endgames?"), make("Opening ideas", "What makes a good opening?")],
      "good-opening": [make("Opening ideas", "What is a good opening?"), make("Chess strategy", "What is chess strategy?"), make("Castling", "How does castling work?")],
      "piece-values": [make("Forks", "What is a fork?"), make("Pins", "What is a pin?"), make("Skewers", "What is a skewer?")]
    };
    if (topicPrompts[topic]) return topicPrompts[topic].slice(0, 4);

    if (topic === "player-info") {
      const playerPrompts = [
        make("Player's rating", "What about their rating?"),
        make("Player's age", "How old are they?")
      ];
      if (ctx.lastMore) playerPrompts.unshift(make("Tell me more", "Tell me more"));
      return playerPrompts;
    }
    if (topic === "world-time") {
      return [
        make("Time in London", "What time is it in London?"),
        make("Time in Tokyo", "What time is it in Tokyo?"),
        make("Time in New York", "What time is it in New York?")
      ];
    }
    // Feature discovery and broad navigation results.
    if (result.type === "catalog" || result.type === "choices") {
      return [
        make("Training", "Show me Training"),
        make("Games", "Show me Games"),
        make("Knight Games", "Show Knight Games"),
        make("All sections", "Show the available sections")
      ];
    }

    if (result.type === "no-match") {
      return [
        make("Browse Training", "Show me Training"),
        make("Browse Games", "Show me Games"),
        make("All sections", "Show the available sections"),
        make("Try a riddle", "Give me a chess riddle")
      ];
    }

    if (result.type === "knowledge") {
      const knowledgePrompts = [
        make("Chess fun fact", "Give me a chess fact"),
        make("Try a riddle", "Give me a chess riddle")
      ];
      if (ctx.lastMore) knowledgePrompts.unshift(make("Tell me more", "Tell me more"));
      return knowledgePrompts;
    }

    if (result.type === "conversation") {
      return [
        make("Training", "Show me Training"),
        make("Games", "Show me Games"),
        make("Chess fun fact", "Give me a chess fact"),
        make("Try a riddle", "Give me a chess riddle")
      ];
    }

    return [];
  }

  // A permanent, grouped command library lives inside the chat transcript.
  // Each pill submits one distinct natural-language request via handleMessage.
  function renderCommandLibrary() {
    const hub = createElement("section", "oai-command-hub");
    hub.setAttribute("aria-label", "Olympus AI quick command library");

    const heading = createElement("div", "oai-command-hub-title", "Explore Olympus AI");
    const intro = createElement(
      "div",
      "oai-command-hub-intro",
      `${OLYMPUS_AI_COMMAND_COUNT} quick questions to help you check your rating, games, assignments and progress. Open a topic and tap a pill to see your results.`
    );
    hub.append(heading, intro);

    for (const group of OLYMPUS_AI_COMMAND_GROUPS) {
      const details = document.createElement("details");
      details.className = "oai-command-group";
      details.dataset.commandGroup = group.id;
      if (group.openByDefault) details.open = true;

      const summary = document.createElement("summary");
      const summaryName = createElement("span", "oai-command-group-name", `${group.icon} ${group.title}`);
      const count = createElement("span", "oai-command-group-count", String(group.commands.length));
      summary.append(summaryName, count);

      const description = createElement("div", "oai-command-group-description", group.description || "");
      const pills = createElement("div", "oai-command-pills");
      pills.setAttribute("aria-label", `${group.title} commands`);

      for (const command of group.commands) {
        const pill = createElement("button", "oai-command-pill", command.label);
        pill.type = "button";
        pill.dataset.commandId = command.id;
        pill.title = command.prompt;
        pill.setAttribute("aria-label", command.prompt);
        pill.addEventListener("click", () => handleMessage(command.prompt));
        pills.appendChild(pill);
      }

      details.append(summary, description, pills);
      hub.appendChild(details);
    }

    commandHub = hub;
    messages.appendChild(hub);
    return hub;
  }

  function renderContextualPrompts(prompts) {
    if (!Array.isArray(prompts) || !prompts.length) return;

    const wrap = createElement("div", "oai-contextual-wrap");
    const label = createElement("div", "oai-contextual-label", "Try next");
    const row = createElement("div", "oai-contextual-prompts");
    row.setAttribute("aria-label", "Suggested follow-up questions");

    for (const item of prompts.slice(0, 4)) {
      const button = createElement("button", "oai-contextual-prompt", item.label);
      button.type = "button";
      button.title = item.prompt;
      button.setAttribute("aria-label", item.prompt);
      button.addEventListener("click", () => handleMessage(item.prompt));
      row.appendChild(button);
    }

    wrap.append(label, row);
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  async function handleMessage(message) {
    const requestGeneration = chatGeneration;
    addMessage(message, "user");
    const responseRow = addMessage("Checking your Olympus information…", "assistant");

    try {
      // 1) Live, authenticated, read-only database answers have priority.
      const dataResult = await answerOlympusDataQuestion(message);
      if (requestGeneration !== chatGeneration || !messages.contains(responseRow)) return;
      if (dataResult) {
        renderMessageText(responseRow, dataResult.text, "assistant");
        messages.scrollTop = messages.scrollHeight;
        return;
      }

      // 2) Help the student discover available areas of the academy app.
      const appResult = answerMainUIQuestion(message);
      if (requestGeneration !== chatGeneration || !messages.contains(responseRow)) return;
      if (appResult) {
        renderMessageText(responseRow, appResult.text, "assistant");
        messages.scrollTop = messages.scrollHeight;
        return;
      }

      // 3) Preserve all existing offline conversation, chess knowledge,
      //    feature discovery and verified navigation behaviour.
      const result = processUserMessage(message);
      if (requestGeneration !== chatGeneration || !messages.contains(responseRow)) return;
      renderMessageText(responseRow, result.text, "assistant");

      if (result.type === "catalog") {
        renderFeatureList(result.features);
      } else if (result.suggestions?.length) {
        renderFeatureList(
          result.suggestions,
          OLYMPUS_AI_CONFIG.maxSuggestions
        );
      }

      renderContextualPrompts(getContextualPrompts(message, result));

      // Feature navigation still uses the original verified app navigation.
      if (result.closeAssistant) setOpen(false);
    } catch (error) {
      console.error("Olympus AI message handling failed:", error);
      if (requestGeneration !== chatGeneration || !messages.contains(responseRow)) return;
      renderMessageText(
        responseRow,
        "I couldn’t complete that request just now. Your account information hasn’t been changed. Please try again.",
        "assistant"
      );
    }

    messages.scrollTop = messages.scrollHeight;
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
    },
    {
      name: "My Progress",
      icon: "📊",
      tabs: [],
      action: "show-command-library"
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

      if (category.action === "show-command-library") {
        if (commandHub) {
          const firstDataGroup = commandHub.querySelector('[data-command-group="account-rating"]');
          if (firstDataGroup) firstDataGroup.open = true;
          commandHub.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }

      const availableFeatures = catalogue.filter(feature =>
        category.tabs.includes(feature.tab)
      );

      addMessage(
        `Show me the ${category.name} section.`,
        "user"
      );

      if (!availableFeatures.length) {
        addMessage(
          `There are no ${category.name} activities available to your account right now.`,
          "assistant"
        );
        return;
      }

      addMessage(
        `Here are your available ${category.name} activities. Choose one to open it:`,
        "assistant"
      );

      renderFeatureList(availableFeatures);

    });

    quickArea.appendChild(button);
  }

  // ==========================================
  // KEEP EXISTING QUICK PROMPTS
  // ==========================================

  const alreadyCoveredQuickPrompts = /\b(assignments?\b|available sections\b)/i;
  for (const prompt of OLYMPUS_AI_QUICK_PROMPTS) {
    if (alreadyCoveredQuickPrompts.test(prompt)) continue;

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
  renderCommandLibrary();
  // Start at the greeting and first command group; the rest are available
  // by scrolling or opening a topic in the command library.
  messages.scrollTop = 0;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOlympusAI, { once: true });
} else {
  initOlympusAI();
}
