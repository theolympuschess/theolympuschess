/* =========================================================
   OLYMPUS AI — CONVERSATIONAL ENGINE (ORCHESTRATOR)

   Order of processing:
   1. Conversation (greetings, emotions, brand, jokes, follow-ups)
   2. Information (time, countries, chess players, chess knowledge)
   3. Verified feature search (existing ranking, unchanged)

   Response contract (unchanged for ai-ui.js):
   { type, text, suggestions?, features? }
   Types: conversation | knowledge | external-info | message |
          catalog | choices | no-match

   No external API or API key required.
   ========================================================= */

import { OLYMPUS_AI_CONFIG } from "./ai-config.js";
import { getFeatureCatalog } from "./ai-catalog.js";
import { getConversationResponse } from "./ai-conversation.js";
import { normalizeChat, recordIntent } from "./ai-context.js";
import { answerChessKnowledge, answerCountryQuestion } from "./ai-knowledge.js";
import { answerTimeQuestion } from "./ai-world-time.js";
import {
  answerPlayerQuestion,
  fetchLiveRatings,
  formatLiveRatings
} from "./ai-player-info.js";

/* =========================================================
   1. STOP WORDS
========================================================= */

const STOP_WORDS = new Set([
  "a", "an", "the", "to", "for", "of", "in", "on",
  "at", "my", "me", "i", "want", "would", "like",
  "please", "can", "could", "you", "help", "with",
  "where", "how", "do", "open", "show", "take",
  "go", "navigate", "find", "get", "need", "into",
  "up", "is", "are", "and", "something", "anything",
  "some", "give", "let", "lets", "display", "search"
]);

/* =========================================================
   2. SYNONYMS
========================================================= */

const SYNONYMS = {

  homework: [
    "assignment", "assignments", "task", "tasks",
    "work", "classwork", "schoolwork"
  ],

  knight: [
    "horse", "horsie", "knights"
  ],

  horse: [
    "knight", "knights"
  ],

  tactics: [
    "tactic", "puzzle", "puzzles", "combination",
    "calculation", "calculate"
  ],

  puzzle: [
    "tactics", "tactic", "puzzles", "brain",
    "problem", "problems"
  ],

  game: [
    "games", "play", "playing", "challenge"
  ],

  robot: [
    "computer", "bot", "engine", "ai"
  ],

  computer: [
    "bot", "robot", "engine", "ai"
  ],

  multiplayer: [
    "online", "opponent", "friends", "players",
    "match", "matches"
  ],

  online: [
    "multiplayer", "live", "internet"
  ],

  memory: [
    "remember", "memorize", "memorise",
    "sequence", "recall"
  ],

  attendance: [
    "present", "absent", "presence", "classes"
  ],

  schedule: [
    "timetable", "routine", "timing", "calendar"
  ],

  analysis: [
    "analyse", "analyze", "review", "evaluation"
  ],

  review: [
    "analysis", "analyse", "analyze"
  ],

  score: [
    "scores", "result", "results", "points"
  ],

  news: [
    "updates", "headlines", "latest"
  ],

  learn: [
    "learning", "study", "education", "lesson"
  ],

  training: [
    "practice", "practise", "improve", "train"
  ],

  difficult: [
    "hard", "advanced", "challenging"
  ],

  easy: [
    "beginner", "simple"
  ]

};

/* =========================================================
   3. CATEGORY SEARCH TERMS
========================================================= */

const CATEGORY_TERMS = {

  training: [
    "training", "practice", "practise", "tactics",
    "puzzles", "improve", "exercise", "challenge",
    "train", "skill", "brain training"
  ],

  games: [
    "games", "fun", "bored", "arcade",
    "mini games", "play something"
  ],

  nightGames: [
    "knight", "knights", "horse", "night games",
    "knight games"
  ],

  community: [
    "community", "news", "gallery", "live tv",
    "tournaments", "world clock", "updates"
  ]

};

/* =========================================================
   4. TEXT NORMALIZATION (feature search)
========================================================= */

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text) {
  return normalize(text)
    .split(" ")
    .filter(word => word && !STOP_WORDS.has(word));
}

/* =========================================================
   5. TYPO TOLERANCE — LEVENSHTEIN DISTANCE
========================================================= */

function editDistance(a, b) {

  if (a === b) return 0;

  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from(
    { length: b.length + 1 },
    (_, i) => i
  );

  for (let i = 1; i <= a.length; i++) {

    let previous = row[0];
    row[0] = i;

    for (let j = 1; j <= b.length; j++) {

      const old = row[j];

      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1)
      );

      previous = old;
    }
  }

  return row[b.length];
}

function similarWord(a, b) {

  if (a === b) return true;

  if (Math.min(a.length, b.length) < 4) {
    return false;
  }

  const distance = editDistance(a, b);

  const allowed =
    Math.max(a.length, b.length) >= 8 ? 2 : 1;

  return distance <= allowed;
}

/* =========================================================
   6. EXPAND SEARCH WORDS
========================================================= */

function expandTokens(tokens) {

  const expanded = new Set(tokens);

  for (const token of tokens) {

    for (const [key, synonyms] of Object.entries(SYNONYMS)) {

      if (key === token || synonyms.includes(token)) {

        expanded.add(key);

        synonyms.forEach(word => expanded.add(word));
      }
    }
  }

  return expanded;
}

/* =========================================================
   7. FEATURE SCORING (unchanged)
========================================================= */

function scoreFeature(query, feature) {

  const queryText = normalize(query);
  const label = normalize(feature.label);
  const targetText = normalize(feature.searchableText);

  const queryTokens = [...expandTokens(words(query))];
  const targetTokens = [...expandTokens(words(targetText))];

  let score = 0;

  // Exact full-name match
  if (label === queryText) score += 25;

  // Feature name appears inside the query
  if (queryText.includes(label) && label.length > 2) {
    score += 15;
  }

  // Full phrase match
  if (targetText.includes(queryText) && queryText.length > 2) {
    score += 12;
  }

  // Individual keyword matches
  for (const token of queryTokens) {

    if (targetTokens.includes(token)) {
      score += 4;
      continue;
    }

    // Partial word matching
    const partialMatch = targetTokens.some(target =>
      target.length >= 4 &&
      token.length >= 4 &&
      (
        target.startsWith(token) ||
        token.startsWith(target)
      )
    );

    if (partialMatch) {
      score += 2;
      continue;
    }

    // Typo-tolerant matching
    const fuzzyMatch = targetTokens.some(target =>
      similarWord(token, target)
    );

    if (fuzzyMatch) score += 2;
  }

  // Strong preference for actual aliases
  for (const alias of feature.aliases || []) {

    const aliasText = normalize(alias);

    if (aliasText === queryText) {
      score += 20;
    } else if (
      aliasText.length > 2 &&
      queryText.includes(aliasText)
    ) {
      score += 10;
    }
  }

  return score;
}

function rankFeatures(query, features) {
  return features
    .map(feature => ({
      feature,
      score: scoreFeature(query, feature)
    }))
    .filter(item =>
      item.score >= OLYMPUS_AI_CONFIG.minimumMatchScore
    )
    .sort((a, b) => b.score - a.score);
}

/* =========================================================
   8. CATEGORY DETECTION
   Same order and terms as before, but matched as whole words
   (so "fun" no longer matches "function" and "train" no
   longer matches "strain").
========================================================= */

function termInText(text, term) {
  const value = normalize(term);
  return new RegExp(`(?:^|\\s)${value}s?(?:\\s|$)`).test(text);
}

function detectCategory(query) {

  const text = normalize(query);

  // Check Knight Games first to avoid confusing
  // "knight games" with the general Games category.
  const order = [
    "nightGames",
    "training",
    "games",
    "community"
  ];

  for (const category of order) {

    const terms = CATEGORY_TERMS[category];

    if (terms.some(term => termInText(text, term))) {
      return category;
    }
  }

  return null;
}

/* =========================================================
   9. GENERAL LIST REQUEST
========================================================= */

function isListRequest(text) {

  const value = normalize(text);

  return [
    "available sections",
    "show sections",
    "what features",
    "list features",
    "show features",
    "what is available",
    "all sections",
    "show everything"
  ].some(phrase => value.includes(phrase));
}

/* =========================================================
   10. VERIFIED FEATURE SEARCH (existing behaviour)
========================================================= */

function searchFeatures(query) {

  const features = getFeatureCatalog();

  // General list request
  if (isListRequest(query)) {
    return {
      type: "catalog",
      text: "Of course! 😊 Here are the available Olympus dashboard features.",
      features
    };
  }

  // Category search
  const category = detectCategory(query);

  if (category) {

    const categoryAliases = {
      training: "Training",
      games: "Games",
      nightGames: "Knight Games",
      community: "Community"
    };

    const categoryFeatures = features.filter(feature => {

      const text = normalize(
        `${feature.tab} ${feature.label} ${feature.searchableText}`
      );

      const categoryWords = CATEGORY_TERMS[category];

      return categoryWords.some(term =>
        text.includes(normalize(term))
      );
    });

    if (categoryFeatures.length) {

      return {
        type: "choices",
        text: `Here are the available ${categoryAliases[category]} features.`,
        suggestions: categoryFeatures.slice(
          0,
          OLYMPUS_AI_CONFIG.maxSuggestions
        )
      };
    }
  }

  // Rank all verified features
  const ranked = rankFeatures(query, features);

  if (!ranked.length) {
    return {
      type: "no-match",
      text: OLYMPUS_AI_CONFIG.noMatchMessage,
      suggestions: []
    };
  }

  const suggestions = ranked
    .slice(0, OLYMPUS_AI_CONFIG.maxSuggestions)
    .map(item => item.feature);

  return {
    type: "choices",
    text: `I found ${ranked.length} possible matching feature${ranked.length === 1 ? "" : "s"}. 😊 Which one would you like?`,
    suggestions
  };
}

/* =========================================================
   11. INFORMATION: TIME, COUNTRIES, PLAYERS, CHESS KNOWLEDGE
========================================================= */

/* Explicit navigation commands are never treated as questions. */
const NAVIGATION_LEAD = /^(?:open|launch|start|go to|take me|navigate)\b/;

function withFeatureSuggestions(result, query) {

  if (!query) return result;

  const matches = rankFeatures(query, getFeatureCatalog())
    .slice(0, 2)
    .map(item => item.feature);

  return matches.length
    ? { ...result, suggestions: matches }
    : result;
}

function getInformationResponse(query) {

  const raw = normalizeChat(query);

  // International time
  const time = answerTimeQuestion(query);

  if (time) {
    recordIntent("world-time", {
      lastAsk: "time",
      entities: time.place ? { place: time.place } : undefined
    });
    return { type: "knowledge", text: time.text };
  }

  // Countries, capitals, currencies, languages
  const country = answerCountryQuestion(query);

  if (country) {
    recordIntent("country-info", { lastAsk: "country" });
    return { type: "knowledge", text: country.text };
  }

  if (NAVIGATION_LEAD.test(raw)) return null;

  // Chess players
  const player = answerPlayerQuestion(query);

  if (player) {

    recordIntent("player-info", {
      lastAsk: player.askType || "profile",
      lastMore: player.more || null,
      entities: player.playerId ? { player: player.playerId } : undefined
    });

    const result = withFeatureSuggestions(
      { type: "knowledge", text: player.text },
      player.suggestQuery
    );

    if (player.live) result.live = player.live;

    return result;
  }

  // Chess rules, terms and learning tips
  const knowledge = answerChessKnowledge(query);

  if (knowledge) {
    recordIntent("chess-knowledge", {
      lastAsk: "knowledge",
      lastMore: knowledge.more || null
    });
    return { type: "knowledge", text: knowledge.text };
  }

  return null;
}

/* =========================================================
   12. MAIN MESSAGE PROCESSORS
========================================================= */

export function processUserMessage(message) {

  const query = String(message || "").trim().slice(0, 300);

  if (!query) {
    return {
      type: "message",
      text: "I'm listening! 😊 What would you like to find?"
    };
  }

  try {

    // FIRST: normal conversation
    const casual = getConversationResponse(query);
    if (casual) return casual;

    // SECOND: time, countries, players and chess knowledge
    const info = getInformationResponse(query);
    if (info) return info;

  } catch (error) {
    // A conversation failure must never block feature search.
    console.error("Olympus AI conversation error:", error);
  }

  // THIRD: verified dashboard features
  return searchFeatures(query);
}

/* Optional: only needed if a live provider is enabled in
   ai-config.js and ai-ui.js is updated to await this function. */
export async function processUserMessageAsync(message) {

  const result = processUserMessage(message);

  if (
    result &&
    result.live &&
    OLYMPUS_AI_CONFIG.playerProvider.enabled
  ) {

    const live = await fetchLiveRatings(result.live.playerId);

    if (live) {
      return {
        ...result,
        type: "external-info",
        text: `${result.text}\n\n${formatLiveRatings(live)}`
      };
    }

    return {
      ...result,
      text: `${result.text}\n\nI couldn't reach a live rating source just now, so I can't verify a current number.`
    };
  }

  return result;
}