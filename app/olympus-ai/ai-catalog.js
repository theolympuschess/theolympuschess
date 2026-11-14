
/* =========================================================
   OLYMPUS AI — LIVE FEATURE CATALOGUE
   Reads the real navigation controls from MainUI.html.

   Supports:
   1. Normal dashboard sections using data-tab
   2. Standalone games using data-lock-tab

   Does not invent destinations or alter the navbar.
   ========================================================= */

import { OLYMPUS_AI_CONFIG } from "./ai-config.js";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isExplicitlyHidden(element) {
  if (!element || element.hidden) return true;
  if (element.getAttribute("aria-hidden") === "true") return true;
  if (element.style && element.style.display === "none") return true;
  return false;
}

/* =========================================================
   STANDALONE GAME DEFINITIONS
========================================================= */

const STANDALONE_GAMES = Object.freeze([
  {
    buttonId: "legalMoveGameBtn",
    tab: "legalMove",
    label: "Legal Moves Challenge",
    aliases: [
      "legal moves",
      "legal move challenge",
      "legal move game",
      "move challenge"
    ]
  },
  {
    buttonId: "legalChecksGameBtn",
    tab: "legalChecks",
    label: "Legal Checks Challenge",
    aliases: [
      "legal checks",
      "legal check challenge",
      "check challenge",
      "checks game"
    ]
  },
  {
    buttonId: "chessFnafGameBtn",
    tab: "chessFnaf",
    label: "5 Nights at Olympus Office",
    aliases: [
      "5 nights",
      "five nights",
      "fnaf",
      "chess fnaf",
      "olympus office",
      "horror game",
      "night survival game"
    ]
  },
  {
    buttonId: "ironSightGameBtn",
    tab: "ironSight",
    label: "Olympus Strike - GO",
    aliases: [
      "olympus strike",
      "olympus strike go",
      "strike go",
      "iron sight",
      "ironsight",
      "fps game",
      "shooting game",
      "counter strike",
      "cs go",
      "csgo"
    ]
  },
  {
    buttonId: "cardClashGameBtn",
    tab: "cardClash",
    label: "Chess Card Clash",
    aliases: [
      "card clash",
      "chess card clash",
      "card game",
      "chess cards"
    ]
  },
  {
    buttonId: "hiddenDeckGameBtn",
    tab: "hiddenDeck",
    label: "Hidden Chess Deck",
    aliases: [
      "hidden deck",
      "chess deck",
      "hidden chess",
      "deck game"
    ]
  }
]);

/* =========================================================
   NORMAL DASHBOARD FEATURES
========================================================= */

function getDashboardFeatures() {
  const selector = OLYMPUS_AI_CONFIG.selectors.navigationButton;
  const buttons = Array.from(document.querySelectorAll(selector));

  const seen = new Set();
  const features = [];

  for (const button of buttons) {
    const tab = cleanText(button.dataset.tab);

    if (!tab || seen.has(tab) || isExplicitlyHidden(button)) {
      continue;
    }

    const sectionId =
      `${tab}${OLYMPUS_AI_CONFIG.selectors.sectionSuffix}`;

    const section = document.getElementById(sectionId);

    // Only expose a destination when both real UI elements exist.
    if (!section) continue;

    const label =
      cleanText(button.innerText || button.textContent) || tab;

    const aliases = OLYMPUS_AI_CONFIG.aliases[tab] || [];

    seen.add(tab);

    features.push(Object.freeze({
      kind: "dashboard",
      tab,
      sectionId,
      buttonId: button.id || null,
      label,
      aliases: [...aliases],
      searchableText: cleanText([
        tab,
        label,
        ...aliases
      ].join(" "))
    }));
  }

  return features;
}

/* =========================================================
   STANDALONE GAME FEATURES
========================================================= */

function getStandaloneGameFeatures() {
  const features = [];

  for (const game of STANDALONE_GAMES) {
    const button = document.getElementById(game.buttonId);

    // Do not invent a game if its real button is absent.
    if (!button || isExplicitlyHidden(button)) continue;

    // Confirm that the real button has the expected identifier.
    if (cleanText(button.dataset.lockTab) !== game.tab) {
      continue;
    }

    if (button.disabled) continue;

    const actualLabel =
      cleanText(button.innerText || button.textContent);

    features.push(Object.freeze({
      kind: "standalone",
      tab: game.tab,
      sectionId: null,
      buttonId: game.buttonId,
      label: actualLabel || game.label,
      aliases: [...game.aliases],
      searchableText: cleanText([
        game.tab,
        game.label,
        actualLabel,
        ...game.aliases
      ].join(" "))
    }));
  }

  return features;
}

/* =========================================================
   PUBLIC CATALOGUE API
========================================================= */

export function getFeatureCatalog() {
  return [
    ...getDashboardFeatures(),
    ...getStandaloneGameFeatures()
  ];
}

export function findFeatureByTab(tab) {
  return getFeatureCatalog().find(
    feature => feature.tab === tab
  ) || null;
}

export function getFeatureSummary() {
  return getFeatureCatalog().map(feature => ({
    tab: feature.tab,
    label: feature.label,
    kind: feature.kind
  }));
}
