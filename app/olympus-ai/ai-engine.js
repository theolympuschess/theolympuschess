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
import {
  normalizeChat, recordIntent, getContext, getRecentFeatureChoices,
  rememberFeatureResults, rememberNavigation
} from "./ai-context.js";
import { answerChessKnowledge, answerCountryQuestion } from "./ai-knowledge.js";
import { answerTimeQuestion } from "./ai-world-time.js";
import { analyzeMessage, normalizeForUnderstanding, getFeatureIntentHints, describeTone } from "./ai-understanding.js";
import { openFeature } from "./ai-navigation.js";
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
    "knight", "knights", "horse", "knight games"
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

function semanticFeatureBonus(feature, analysis) {
  if (!analysis) return 0;
  if (analysis.nightVsKnightAmbiguous && /knight/i.test(`${feature.tab} ${feature.label}`)) return 0;

  const target = normalize(`${feature.tab} ${feature.label} ${feature.searchableText}`);
  const hints = getFeatureIntentHints(analysis);
  if (!hints.length) return 0;

  let matches = 0;
  for (const hint of hints) {
    const phrase = normalize(hint);
    if (!phrase) continue;
    if (target.includes(phrase) || words(phrase).every(token => target.split(" ").includes(token))) {
      matches += 1;
    }
  }

  const cap = OLYMPUS_AI_CONFIG.understanding?.semanticBonus || 7;
  return Math.min(cap, matches * 2);
}

function rankFeatures(query, features, analysis = null) {
  return features
    .map(feature => ({
      feature,
      score: scoreFeature(query, feature) + semanticFeatureBonus(feature, analysis)
    }))
    .filter(item => item.score >= OLYMPUS_AI_CONFIG.minimumMatchScore)
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

  // "Night games" is not a synonym for chess "Knight Games".
  if (/\bnight games?\b/.test(text) && !/\bknight games?\b/.test(text)) return null;

  // The internal category key is retained for compatibility, but
  // only explicit knight/horse language selects it.
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

function isExplicitCategoryBrowse(query) {
  const value = normalize(query);
  return /^(?:(?:show|browse|list|explore) (?:me )?(?:all )?(?:the )?)?(?:games|training|community|knight games)(?: features)?$/.test(value) ||
    /^(?:show|browse|list|explore) (?:me )?(?:all )?(?:the )?(?:games|training|community|knight games)$/.test(value);
}

/* =========================================================
   10. VERIFIED FEATURE SEARCH (existing behaviour)
========================================================= */

function searchFeatures(query, analysis = analyzeMessage(query)) {

  const features = getFeatureCatalog();

  if (analysis.nightVsKnightAmbiguous) {
    return {
      type: "choices",
      text: "Just checking: did you mean chess Knight Games, or games you can play at night?",
      suggestions: []
    };
  }

  // General list request
  if (isListRequest(query)) {
    return {
      type: "catalog",
      text: "Of course! Here are the available Olympus dashboard features.",
      features
    };
  }

  // A simple category browse is useful when the user has not
  // expressed a narrower goal such as multiplayer or calculation.
  const category = detectCategory(query);
  const hasSpecificGoal = analysis.goals.some(goal =>
    ["multiplayer", "game-review", "knight-games", "memory-training", "assignments", "schedule", "calculation", "improvement", "tactical-training"].includes(goal)
  );

  if (category && isExplicitCategoryBrowse(query)) {

    const categoryAliases = {
      training: "Training",
      games: "Games",
      nightGames: "Knight Games",
      community: "Community"
    };

    const categoryFeatures = features.filter(feature => {
      const text = normalize(`${feature.tab} ${feature.label} ${feature.searchableText}`);
      const categoryWords = CATEGORY_TERMS[category];
      if (category === "games" && feature.kind === "standalone") return true;
      if (category === "games" && /\b(?:game|games|arcade|puzzle|quiz|challenge|battle|maze|memory|rush|computer)\b/.test(text)) return true;
      return categoryWords.some(term => termInText(text, term));
    });

    if (categoryFeatures.length) {
      rememberFeatureResults(categoryFeatures, query);
      return {
        type: "choices",
        text: `Here are the available ${categoryAliases[category]} features.`,
        suggestions: categoryFeatures.slice(0, OLYMPUS_AI_CONFIG.maxSuggestions)
      };
    }
  }

  // Remove command framing for confidence scoring: "open Puzzle Rush"
  // should be scored against "Puzzle Rush", not the word "open".
  const targetQuery = query
    .replace(/^(?:please )?(?:(?:can|could|would) you (?:please )?)?(?:open|launch|start|enter|navigate to|go to|take me to|bring me to|send me to|head to|show me|show)\s+/, "")
    .replace(/\s+(?:please|for me)$/, "")
    .trim() || query;

  let ranked = rankFeatures(targetQuery, features, analysis);

  // A broad entertainment request should not surface administration or
  // post-game analysis just because those labels contain the word "game".
  if ((analysis.goals.includes("games") || analysis.goals.includes("entertainment")) &&
      !analysis.goals.includes("game-review")) {
    ranked = ranked.filter(item => !/\b(?:game review|review game|analysis board|post game analysis)\b/i.test(
      `${item.feature.label} ${item.feature.tab} ${item.feature.searchableText}`
    ));
  }

  if (!ranked.length) {
    return {
      type: "no-match",
      text: analysis.primaryIntent === "learning"
        ? "I understand you're looking to improve. I couldn't find a clearly matching activity in the available dashboard features. Try describing the skill you want to practise, such as tactics, calculation or openings."
        : OLYMPUS_AI_CONFIG.noMatchMessage,
      suggestions: []
    };
  }

  const topScore = ranked[0].score;
  const relevantRanked = ranked.filter((item, index) =>
    index === 0 || topScore - item.score <= 8
  );
  const suggestions = relevantRanked
    .slice(0, OLYMPUS_AI_CONFIG.maxSuggestions)
    .map(item => item.feature);

  rememberFeatureResults(suggestions, query);

  if (analysis.explicitNavigation && !analysis.negatedNavigation) {
    const best = ranked[0];
    const second = ranked[1];
    const margin = best.score - (second?.score || 0);
    const confident = best.score >= (OLYMPUS_AI_CONFIG.understanding?.highConfidenceScore || 18) &&
      (!second || margin >= (OLYMPUS_AI_CONFIG.understanding?.minimumConfidenceMargin || 5));

    if (confident) {
      const result = openFeature(best.feature.tab);
      if (result.ok) {
        rememberNavigation(best.feature);
        return {
          type: "message",
          text: result.message,
          closeAssistant: true
        };
      }
      return { type: "message", text: result.message };
    }

    return {
      type: "choices",
      text: `I found a few possible destinations. Which one did you mean?`,
      suggestions
    };
  }

  const top = ranked[0];
  const soleClear = relevantRanked.length === 1 || top.score - (relevantRanked[1]?.score || 0) >= 7;
  const prefix = analysis.primaryIntent === "learning"
    ? "Let's work on that. Here are the closest training options:"
    : analysis.primaryIntent === "entertainment"
      ? "Let's find something enjoyable. Here are a few options:"
      : soleClear
        ? `I found ${top.feature.label}. Select it below to open it.`
        : "I found a few possible matches. Which one would you like?";

  return {
    type: "choices",
    text: prefix,
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

  const raw = normalizeForUnderstanding(query);

  // International time
  const time = answerTimeQuestion(query);

  if (time) {
    recordIntent("world-time", {
      lastAsk: "time",
      lastTopic: "world-time",
      lastQuestion: query.slice(0, 180),
      entities: time.place ? { place: time.place } : undefined
    });
    return { type: "knowledge", text: time.text };
  }

  // Countries, capitals, currencies, languages
  const country = answerCountryQuestion(query);

  if (country) {
    recordIntent("country-info", { lastAsk: "country", lastTopic: "country-info", lastQuestion: query.slice(0, 180) });
    return { type: "knowledge", text: country.text };
  }

  if (NAVIGATION_LEAD.test(raw)) return null;

  // Chess players
  const player = answerPlayerQuestion(query);

  if (player) {

    recordIntent("player-info", {
      lastAsk: player.askType || "profile",
      lastMore: player.more || null,
      lastTopic: "player-info",
      lastQuestion: query.slice(0, 180),
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
      lastMore: knowledge.more || null,
      lastTopic: knowledge.topic || "chess-knowledge",
      lastQuestion: query.slice(0, 180)
    });
    return { type: "knowledge", text: knowledge.text };
  }

  return null;
}

/* =========================================================
   12. MAIN MESSAGE PROCESSORS
========================================================= */

function executeRememberedFeature(message, analysis) {
  const text = analysis.normalized;
  const choices = getRecentFeatureChoices();
  const indexMatch = text.match(/\b(?:the )?(first|second|third|1st|2nd|3rd|other) one\b/);
  const wantsOpenReference = /^(?:(?:open|launch|start) )?(?:it|that|this|that one|the first one|the second one|the third one|first one|second one|third one|the other one|other one|take me there|go there)$/.test(text);
  if (!wantsOpenReference) return null;

  if (!choices.length) {
    return { type: "message", text: "Which feature are you referring to? Tell me its name and I'll find the verified dashboard destination." };
  }

  let selected = null;
  if (indexMatch) {
    const names = { first: 0, "1st": 0, second: 1, "2nd": 1, third: 2, "3rd": 2, other: 1 };
    selected = choices[names[indexMatch[1]]];
  } else if (choices.length === 1) {
    selected = choices[0];
  }

  const liveCatalog = getFeatureCatalog();
  const verified = selected && liveCatalog.find(item => item.tab === selected.tab);
  if (verified) {
    const result = openFeature(verified.tab);
    if (result.ok) {
      rememberNavigation(verified);
      return { type: "message", text: result.message, closeAssistant: true };
    }
    return { type: "message", text: result.message };
  }

  const verifiedChoices = liveCatalog.filter(item => choices.some(choice => choice.tab === item.tab));
  if (verifiedChoices.length > 1) {
    rememberFeatureResults(verifiedChoices, message);
    return {
      type: "choices",
      text: "Which one should I open? Choose a feature below, or say the first or second one.",
      suggestions: verifiedChoices.slice(0, OLYMPUS_AI_CONFIG.maxSuggestions)
    };
  }

  return { type: "message", text: "I couldn't verify that destination in the dashboard, so I haven't opened anything." };
}


function handleContextualKnowledgeFollowUp(message) {
  const text = normalizeForUnderstanding(message);
  const context = getContext();
  const wantsExample = /^(?:example|example please|show me an example|give me an example|can you give me an example)$/.test(text);
  const wantsSimpler = /^(?:explain simply|explain it simply|explain that simply|more simply|simpler|in simple words|easier words|i still do not get it|i still do not understand)$/.test(text);
  if (!wantsExample && !wantsSimpler) return null;

  const examples = {
    fork: "For example, a knight can give check while also attacking an enemy rook. The opponent must deal with the check first, so the rook may be lost. That is a fork.",
    pin: "Imagine a knight in front of its king, with an enemy bishop lined up behind it. Moving the knight would expose the king to check, so the knight is pinned.",
    skewer: "Imagine a rook checking the king while a queen sits directly behind it. The king must move, and then the rook can capture the exposed queen. That is a skewer.",
    castling: "Think of castling as a king-safety move: the king moves two squares toward a rook, and that rook moves to the square beside the king. It is allowed only when the pieces have not moved, the path is clear, and the king does not cross an attacked square.",
    "en-passant": "For example, if a white pawn is on e5 and a black pawn moves from d7 to d5 in one jump, the white pawn may capture it by moving to d6. This special capture is available only immediately on the next move.",
    checkmate: "A simple example is a king trapped in the corner: an enemy queen gives check, and the king has no safe square, cannot capture the queen, and cannot block the attack. That is checkmate.",
    stalemate: "Imagine the king is not in check, but every legal move is blocked or illegal. Because it is that player's turn and there is no legal move, the result is a draw.",
    promotion: "For example, when a pawn reaches the last rank, it can become a queen, rook, bishop or knight. Choosing a queen is common, but a knight can sometimes give a useful check immediately.",
    "knight-move": "Place a knight on a central square. It can jump to up to eight L-shaped destinations: two squares one way and one square sideways. Pieces in between do not stop it."
  };

  const simple = {
    fork: "A fork is one move that attacks two or more enemy pieces at the same time.",
    pin: "A pin is when a piece cannot safely move because something valuable behind it—often the king—would be exposed.",
    skewer: "A skewer attacks a valuable piece first. When that piece moves away, a second piece behind it can be captured.",
    castling: "Castling moves your king two squares toward a rook and brings the rook next to the king. You can do it only when the path is clear, neither piece has moved, and the king is not in check or crossing an attacked square.",
    "en-passant": "En passant is a special pawn capture. If an enemy pawn moves two squares and lands beside your pawn, you may capture it as though it had moved only one square—but only on your very next move.",
    checkmate: "Checkmate means the king is in check and there is no legal way to escape. The game ends.",
    stalemate: "Stalemate means the king is not in check, but that player has no legal move. The game is a draw.",
    promotion: "Promotion happens when a pawn reaches the far end of the board. It must become a queen, rook, bishop or knight.",
    "knight-move": "A knight moves in an L-shape: two squares in one direction, then one square sideways. It can jump over pieces."
  };

  const topic = context.lastTopic;
  let answer = wantsExample ? examples[topic] : simple[topic];
  if (!answer && context.lastQuestion) {
    const previous = answerChessKnowledge(context.lastQuestion);
    if (previous) {
      answer = wantsExample
        ? `I don't have a stored board position for that example, but the key idea is: ${previous.answer || previous.text}`
        : `In simpler words: ${previous.answer || previous.text}`;
    }
  }
  if (!answer) {
    return {
      type: "conversation",
      text: wantsExample
        ? "Sure—which chess idea should I give an example for?"
        : "Of course. Which part should I explain more simply?"
    };
  }

  recordIntent("knowledge-follow-up", {
    lastAsk: context.lastAsk,
    lastTopic: topic,
    lastQuestion: context.lastQuestion,
    lastMore: context.lastMore
  });
  return { type: "knowledge", text: answer };
}

function empatheticPrefix(tone) {
  switch (tone) {
    case "low": return "That sounds like a rough moment. Let's take it one step at a time. ";
    case "frustrated": return "I can see why that would be frustrating. Let's make it easier. ";
    case "confused": return "No problem—let's break it down clearly. ";
    case "positive": return "That's great to hear! ";
    case "bored": return "Let's switch things up. ";
    default: return "";
  }
}

function handleNegativeOrRetrospective(query, analysis) {
  if (analysis.negatedNavigation) {
    return { type: "message", text: "No problem—I won't open or show that." };
  }
  if (analysis.negativeDesire && analysis.hasFeatureGoal) {
    return { type: "conversation", text: "Got it. I won't steer you toward that. What would you prefer instead?" };
  }
  if (analysis.pastDesire && !analysis.explicitNavigation) {
    return { type: "conversation", text: "Sounds like you were looking for that earlier. Are you still looking for it now?" };
  }
  return null;
}

function processSingleMessage(original, inheritedAnalysis = null) {
  const query = String(original || "").trim().slice(0, 300);
  if (!query) return { type: "message", text: "I'm listening! What would you like to find?" };

  const analysis = inheritedAnalysis || analyzeMessage(query);
  const normalized = normalizeForUnderstanding(query);

  const blocked = handleNegativeOrRetrospective(query, analysis);
  if (blocked) return blocked;

  const rememberedAction = executeRememberedFeature(query, analysis);
  if (rememberedAction) return rememberedAction;

  const contextualKnowledge = handleContextualKnowledgeFollowUp(query);
  if (contextualKnowledge) return contextualKnowledge;

  // A player or chess follow-up must be allowed to use the remembered entity.
  const info = getInformationResponse(normalized);
  if (info) return info;

  // Preserve the established conversation pools for direct social requests
  // (jokes, facts and riddles) even when they begin with an action phrase
  // such as "give me". A real navigation/action request still takes priority.
  const tone = describeTone(query);
  const casual = getConversationResponse(normalized);

  // A bored user benefits from concrete, verified options even when their
  // wording is too organic for one of the older exact emotion patterns.
  if (tone === "bored" && !analysis.explicitNavigation && !analysis.hasActionVerb && !analysis.hasSpecificGoal) {
    const suggestions = rankFeatures("games", getFeatureCatalog(), analysis)
      .slice(0, OLYMPUS_AI_CONFIG.maxSuggestions)
      .map(item => item.feature);
    if (suggestions.length) {
      rememberFeatureResults(suggestions, query);
      const opening = casual?.text || "Let's switch things up! 😄";
      return {
        type: "conversation",
        text: `${opening} Here are a few activities too:`,
        suggestions
      };
    }
  }

  const safeConversationTurn = Boolean(casual) &&
    !analysis.explicitNavigation && !analysis.hasActionVerb && !analysis.hasSpecificGoal;
  if (safeConversationTurn) return casual;

  // The tone detector also catches expressions the original exact patterns miss.
  const pureSocial = !analysis.explicitNavigation && !analysis.hasActionVerb &&
    !analysis.informationQuestion && !analysis.wantsSomething && !analysis.hasSpecificGoal;
  if (pureSocial && tone !== "neutral") {
    const socialText = tone === "positive"
      ? /\b(?:won|solved|checkmated|did it|beat|new record|high score)\b/.test(normalized)
        ? "That's a result worth celebrating! Well done. Want to keep the momentum going with another challenge?"
        : "That's great to hear! What made it a good moment?"
      : tone === "low"
        ? "That sounds like a rough day. You don't have to solve everything at once. Would a light distraction or a little help with chess feel more useful right now?"
        : tone === "frustrated"
          ? "That sounds frustrating. Let's slow it down and tackle one thing at a time. What part is giving you trouble?"
          : tone === "confused"
            ? "That's okay. We can approach it another way. What part should I explain first?"
            : "Let's switch things up. Would you like a puzzle, a game or a quick riddle?";
    return { type: "conversation", text: socialText };
  }

  // Short neutral social turns retain the original conversation matcher.
  if (pureSocial && casual) return casual;

  // Keep unsupported general-information prompts from being mistaken for
  // a similarly named feature. "Night games" is clarified in searchFeatures;
  // other terms are handled by the knowledge module above.
  const search = searchFeatures(normalized, analysis);
  if (tone !== "neutral" && search?.text && ["choices", "no-match"].includes(search.type)) {
    const prefix = empatheticPrefix(tone);
    return { ...search, text: `${prefix}${search.text}` };
  }
  return search;
}

function combineCompoundResults(results) {
  const usable = results.filter(Boolean);
  if (!usable.length) return { type: "no-match", text: OLYMPUS_AI_CONFIG.noMatchMessage };
  if (usable.length === 1) return usable[0];

  const text = usable.map(result => result.text).filter(Boolean).join("\n\n");
  const suggestions = [];
  const seen = new Set();
  for (const result of usable) {
    const entries = result.suggestions || result.features || [];
    for (const feature of entries) {
      if (feature?.tab && !seen.has(feature.tab)) {
        seen.add(feature.tab);
        suggestions.push(feature);
      }
    }
  }

  const acted = usable.some(result => result.closeAssistant);
  return {
    type: acted ? "message" : "conversation",
    text,
    ...(suggestions.length ? { suggestions: suggestions.slice(0, OLYMPUS_AI_CONFIG.maxSuggestions) } : {}),
    ...(acted ? { closeAssistant: true } : {})
  };
}

export function processUserMessage(message) {
  const query = String(message || "").trim().slice(0, 300);
  if (!query) return { type: "message", text: "I'm listening! What would you like to find?" };

  try {
    const analysis = analyzeMessage(query);

    if (analysis.compound && analysis.clauses.length > 1) {
      const results = analysis.clauses.map(clause => processSingleMessage(clause));
      return combineCompoundResults(results);
    }

    return processSingleMessage(query, analysis);
  } catch (error) {
    console.error("Olympus AI processing error:", error);
    // Preserve the safe legacy fallback if a new interpretation stage fails.
    try {
      const normalized = normalizeChat(query);
      return getConversationResponse(normalized) || getInformationResponse(normalized) || searchFeatures(normalized);
    } catch (fallbackError) {
      console.error("Olympus AI fallback error:", fallbackError);
      return { type: "no-match", text: OLYMPUS_AI_CONFIG.noMatchMessage };
    }
  }
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