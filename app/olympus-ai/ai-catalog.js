
/* =========================================================
   OLYMPUS AI — LIVE FEATURE CATALOGUE
   Reads the real navigation controls from MainUI.html.

   Supports:
   1. Normal dashboard sections using data-tab
   2. Standalone games using data-lock-tab

   Does not invent destinations or alter the navbar.
   ========================================================= */

import { OLYMPUS_AI_CONFIG } from "./ai-config.js";
import { isRoleRestrictedElement } from "./ai-role-visibility.js";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isExplicitlyHidden(element) {
  if (!element || element.hidden) return true;
  if (isRoleRestrictedElement(element)) return true;
  if (element.getAttribute("aria-hidden") === "true") return true;
  if (element.style && element.style.display === "none") return true;
  return false;
}


/* =========================================================
   BLINDFOLD FEATURE METADATA
   These are normal dashboard tabs, not standalone games.
   A feature is included only when its real .nav-btn[data-tab]
   AND matching -section exist in MainUI.
========================================================= */

const BLINDFOLD_FEATURES = Object.freeze({
  squareColorZone: [
    "square color", "square colour", "square color challenge",
    "square colour challenge", "light and dark squares",
    "identify square colors", "identify square colours",
    "board square colors", "board square colours"
  ],
  diagonalQuiz: [
    "crazy diagonal", "diagonal quiz", "diagonal challenge",
    "bishop diagonal", "diagonal movement", "diagonal direction"
  ],
  moveQuiz: [
    "can it move", "can this piece move", "piece movement quiz",
    "legal move quiz", "is this move possible", "possible chess moves"
  ],
  routeQuiz: [
    "find the junction", "junction challenge", "junction quiz",
    "route quiz", "chess route puzzle", "find the route"
  ],
  attackDetection: [
    "attack detection", "detect attacks", "find attacked squares",
    "which square is attacked", "piece attack quiz",
    "square under attack", "attacked square challenge"
  ],
  attackRelations: [
    "attack relations", "attacking relations", "piece relations",
    "piece relationship quiz", "which piece attacks which",
    "attacker and defender relationships"
  ],
  // The visible button labels in the supplied markup are authoritative:
  // visualizeMovesHard is labelled Easy, while visualizeMoves is Hard.
  visualizeMovesHard: [
    "visualize moves easy", "visualise moves easy",
    "easy visualize moves", "easy visualise moves",
    "easy visualization", "easy visualisation",
    "easy blindfold visualization", "easy blindfold visualisation"
  ],
  visualizeMoves: [
    "visualize moves hard", "visualise moves hard",
    "hard visualize moves", "hard visualise moves",
    "hard visualization", "hard visualisation",
    "advanced visualization", "advanced visualisation",
    "hard blindfold visualization", "hard blindfold visualisation"
  ],
  gapCounting: [
    "gap counting", "count the gaps", "count gaps",
    "gap count challenge", "distance counting",
    "count squares between pieces", "squares between pieces"
  ],
  quadrantQuiz: [
    "quadrant anchors", "quadrant quiz", "board quadrants",
    "chessboard quadrants", "find the quadrant",
    "quadrant identification"
  ],
  coordtrain: [
    "coordinate training", "coordinate trainer", "square coordinates",
    "chess coordinates", "board coordinates training",
    "blindfold coordinates"
  ],
  boardfreeze: [
    "board freeze", "frozen board", "board memory freeze",
    "remember the board", "memorize the board position",
    "memorise the board position"
  ],
  findDifferences: [
    "find differences", "spot the difference", "board differences",
    "chessboard differences", "find the difference"
  ],
  emojiMemory: [
    "emoji memory", "emoji recall", "remember the emojis",
    "memorize emojis", "memorise emojis", "emoji matching memory"
  ],
  memoryMatch: [
    "memory match", "memory matching", "matching memory game",
    "match the pairs", "pair matching game", "memory pairs"
  ]
});

function getBlindfoldMetadata(tab) {
  const aliases = BLINDFOLD_FEATURES[tab] || [];
  return BLINDFOLD_FEATURES[tab]
    ? { group: "Blindfold", category: "blindfold", aliases }
    : { group: null, category: null, aliases: [] };
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

    const configuredAliases = OLYMPUS_AI_CONFIG.aliases[tab] || [];
    const blindfold = getBlindfoldMetadata(tab);
    const aliases = [...new Set([...configuredAliases, ...blindfold.aliases])];

    seen.add(tab);

    features.push(Object.freeze({
      kind: "dashboard",
      tab,
      sectionId,
      buttonId: button.id || null,
      label,
      group: blindfold.group,
      category: blindfold.category,
      aliases,
      searchableText: cleanText([
        tab,
        label,
        blindfold.group || "",
        blindfold.category || "",
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
