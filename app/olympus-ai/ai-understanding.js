/* =========================================================
   OLYMPUS AI — LIGHTWEIGHT LANGUAGE UNDERSTANDING

   Deterministic, offline interpretation layer. This is not a
   cloud language model: it combines phrase patterns, safe chat
   normalization, intent signals, contextual cues and bounded
   semantic hints while keeping the original catalogue authoritative.
   ========================================================= */

import { OLYMPUS_AI_CONFIG } from "./ai-config.js";

const TYPO_CORRECTIONS = Object.freeze({
  assigment: "assignment",
  assigments: "assignments",
  challange: "challenge",
  challanges: "challenges",
  caluclation: "calculation",
  calculaton: "calculation",
  knigt: "knight",
  knigth: "knight",
  knite: "knight",
  opn: "open",
  shw: "show",
  sho: "show",
  ned: "need",
  asignment: "assignment",
  puzzlerush: "puzzle rush",
  practis: "practice",
  practize: "practice",
  puzzel: "puzzle",
  puzzels: "puzzles",
  puzle: "puzzle",
  puzles: "puzzles",
  somthing: "something",
  smthing: "something",
  somethin: "something",
  wner: "where",
  wher: "where",
  teh: "the",
  thier: "their",
  freind: "friend",
  freinds: "friends",
  anaylsis: "analysis",
  analisys: "analysis",
  assignd: "assigned"
});

const TOKEN_REPLACEMENTS = Object.freeze({
  da: "the",
  dis: "this",
  dat: "that",
  pls: "please",
  plz: "please",
  sum: "some",
  smth: "something",
  u: "you",
  wanna: "want to",
  wna: "want to",
  gimme: "give me",
  lemme: "let me",
  gotta: "got to",
  rn: "right now"
});

const NEGATION_RE = /\b(?:not|never|cannot|cant|dont|no longer|hardly|without)\b/;
const INFO_LEAD_RE = /\b(?:what is|what are|whats|who is|who was|whos|why|how does|how do|how can|how should|how many|how to|which|define|meaning of|explain|describe|teach me|tell me about|show me how|can you explain|could you explain|give me an example of)\b/;
const NAVIGATION_RE = /^(?:please )?(?:(?:can|could|would) you (?:please )?)?(?:open|launch|start|enter|navigate to|go to|take me to|bring me to|send me to|head to|show me|show)\b|\b(?:i want to|i would like to|id like to) (?:open|launch|visit|go to|enter)\b|\b(?:lets|let us) go to\b|\b(?:can|could|would) you (?:please )?(?:take|bring|send) me to\b/;
const NEGATIVE_NAVIGATION_RE = /\b(?:do not|dont|never|please dont)\s+(?:open|launch|start|enter|navigate|show|find|locate|take me to|bring me to|go to)\b/;
const NEGATIVE_DESIRE_RE = /\b(?:do not|dont|never|no longer)\s+(?:want|need|like|wish to|feel like)\b|\b(?:not interested in|not looking for|not in the mood for|not in mood for)\b/;
const PAST_DESIRE_RE = /\b(?:i wanted|i was looking for|i used to want|i needed|i tried to find|i was trying to find)\b|\b(?:wanted|needed|looking for)\b.*\b(?:earlier|before|yesterday)\b/;
const FOLLOW_UP_RE = /^(?:tell me more|more|more please|go on|continue|another|another one|one more|next|example|example please|show me an example|give me an example|can you give me an example|explain simply|explain it simply|explain that simply|more simply|simpler|in simple words|easier words|i still do not get it|i still do not understand|what about him|what about her|what about it|open it|open that|launch it|launch that|show me that|take me there|go there|the first one|the second one|the third one|first one|second one|third one|that one|the other one)$/;


export function normalizeForUnderstanding(input) {
  let text = String(input || "").slice(0, 1000).toLowerCase();

  // Expand common contractions before punctuation is removed.
  const contractions = [
    [/\bcan't\b/g, "cannot"], [/\bcannot\b/g, "cannot"],
    [/\bdon't\b/g, "do not"], [/\bdoesn't\b/g, "does not"],
    [/\bdidn't\b/g, "did not"], [/\bwon't\b/g, "will not"],
    [/\bwouldn't\b/g, "would not"], [/\bshouldn't\b/g, "should not"],
    [/\bcouldn't\b/g, "could not"], [/\bisn't\b/g, "is not"],
    [/\baren't\b/g, "are not"], [/\bwasn't\b/g, "was not"],
    [/\bweren't\b/g, "were not"], [/\bhaven't\b/g, "have not"],
    [/\bhasn't\b/g, "has not"], [/\bhadn't\b/g, "had not"],
    [/\bi'm\b/g, "i am"], [/\byou're\b/g, "you are"],
    [/\bwe're\b/g, "we are"], [/\bthey're\b/g, "they are"],
    [/\bhe's\b/g, "he is"], [/\bshe's\b/g, "she is"],
    [/\bit's\b/g, "it is"], [/\bwhat's\b/g, "what is"],
    [/\bwho's\b/g, "who is"], [/\bwhere's\b/g, "where is"],
    [/\bthere's\b/g, "there is"], [/\bthat's\b/g, "that is"],
    [/\bhere's\b/g, "here is"]
  ];
  for (const [pattern, replacement] of contractions) {
    text = text.replace(pattern, replacement);
  }

  // Common chat forms; keep potentially ambiguous "ur" contextual.
  text = text.replace(/\bur\b(?=\s+(?:awesome|amazing|great|smart|cool|helpful|brilliant|funny|nice|kind)\b)/g, "you are");
  text = text.replace(/\bur\b/g, "your");
  text = text.replace(/\bim\b/g, "i am");
  text = text.replace(/\bdont\b/g, "do not");

  // Compress exaggerated typing (sooooo -> soo, heyyyy -> heyy).
  text = text.replace(/([a-z])\1{2,}/g, "$1$1");
  text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  text = text.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  const tokens = text.split(" ").filter(Boolean).map(token => {
    if (TYPO_CORRECTIONS[token]) return TYPO_CORRECTIONS[token];
    if (TOKEN_REPLACEMENTS[token]) return TOKEN_REPLACEMENTS[token];
    return token;
  });

  let normalized = tokens.join(" ").replace(/\s+/g, " ").trim();
  // Short acronyms are expanded only in a command-shaped phrase to avoid
  // treating ordinary mentions of "PR" or "KT" as feature requests.
  normalized = normalized.replace(/^(please )?(open|launch|start|show|find) pr$/, "$1$2 puzzle rush");
  normalized = normalized.replace(/^(please )?(open|launch|start|show|find|play) kt$/, "$1$2 knight tour");
  return normalized;
}

export function splitMessageClauses(input, maxClauses = 3) {
  const raw = String(input || "").slice(0, 1000);
  const separated = raw
    .replace(/\b(?:and then|then|also|plus)\b/gi, "|")
    .replace(/\s+and\s+(?=(?:open|launch|start|show|find|locate|tell|explain|teach|quiz|play|take me to|bring me to|go to|i want|i need|i would like|i feel like|i am in the mood|who|what|why|how|when|where|which)\b)/gi, "|")
    .replace(/,\s*(?=(?:open|launch|start|show|find|locate|tell|explain|teach|quiz|play|take me to|bring me to|go to)\b)/gi, "|");

  const parts = separated
    .split(/[.!?;\n|]+/)
    .map(part => normalizeForUnderstanding(part))
    .filter(Boolean);

  const unique = [];
  for (const part of parts) {
    if (!unique.length || unique[unique.length - 1] !== part) unique.push(part);
    if (unique.length >= Math.max(1, maxClauses)) break;
  }
  return unique;
}

function detectGoals(text) {
  const goals = [];

  if (/\b(?:calculation|calculate|calculating|visuali[sz]e variations|think ahead|candidate moves)\b/.test(text)) {
    goals.push("calculation");
  }
  if (/\b(?:tactics?|puzzles?|combinations?|sharpen my (?:brain|mind)|train my brain|exercise my brain|brain workout|brain training|test myself|test my skills|something challenging|challenging activity|quiz me|brain teaser|a challenge|some challenge)\b/.test(text)) {
    goals.push("tactical-training");
  }
  if (/\b(?:improve|get better|become(?: a)? better|become stronger|develop|strengthen|master|train|practice|practise|work on|learn)\b.*\b(?:chess|tactics?|calculation|memory|skills?|endgames?|openings?|playing|player|something new)\b|\b(?:need|want) (?:some )?(?:practice|practise|training)|(?:something|some work) for (?:practice|practise)\b/.test(text)) {
    goals.push("improvement");
  }
  if (!/\b(?:not|never|no longer)\s+(?:really\s+)?bored\b/.test(text) &&
      /\b(?:bored|nothing to do|have no plans|kill some time|pass the time|have some fun|something fun|something interesting|exciting|in the mood for a game|tired of (?:doing )?(?:the )?same thing|same old thing|need a break)\b/.test(text)) {
    goals.push("entertainment");
  }
  if (/\b(?:play|playing|game|games|mini game|something to play|challenge me|give me a challenge|something challenging|quiz me|a challenge)\b/.test(text)) {
    goals.push("games");
  }
  if (/\b(?:with my friends|with friends|together|against someone|another player|online opponent|play someone|multiplayer)\b/.test(text)) {
    goals.push("multiplayer");
  }
  if (/\b(?:old games|previous games|my games|last game|review my game|analyse my game|analyze my game|what went wrong)\b/.test(text)) {
    goals.push("game-review");
  }
  if (/\b(?:knight|horse) games?\b|\bknight tour\b/.test(text) && !/\bnight games?\b/.test(text)) {
    goals.push("knight-games");
  }
  if (/\b(?:improve|train|practice|practise|strengthen|work on)\b.*\bmemory\b|\bmemory training\b/.test(text)) {
    goals.push("memory-training");
  }
  if (/\b(?:assignment|homework|task|tasks)\b/.test(text)) goals.push("assignments");
  if (/\b(?:class|lesson)\b.*\b(?:time|when|schedule|timetable)\b|\bwhen is my class\b/.test(text)) goals.push("schedule");

  return [...new Set(goals)];
}

export function analyzeMessage(input) {
  const normalized = normalizeForUnderstanding(input);
  const clauses = splitMessageClauses(input, OLYMPUS_AI_CONFIG.understanding?.maxClauses || 3);
  const goals = detectGoals(normalized);
  const negatedNavigation = NEGATIVE_NAVIGATION_RE.test(normalized);
  const negativeDesire = NEGATIVE_DESIRE_RE.test(normalized);
  const pastDesire = PAST_DESIRE_RE.test(normalized) && !/\b(?:now|today|currently|still)\b/.test(normalized);
  const explicitNavigation = NAVIGATION_RE.test(normalized) ||
    /^(?:please )?(?:take|bring|send) me\b/.test(normalized);
  const informationQuestion = INFO_LEAD_RE.test(normalized) || /\?$/.test(String(input || "").trim());
  const followUp = FOLLOW_UP_RE.test(normalized);
  const hasActionVerb = /\b(?:open|launch|start|enter|navigate|show|find|locate|play|take me|bring me|go to)\b/.test(normalized);
  const wantsSomething = /\b(?:i want|i need|i would like|id like|give me|show me|lets|let us|can you|could you|please find|looking for|i am in the mood)\b/.test(normalized);
  const compound = clauses.length > 1;
  const nightVsKnightAmbiguous = /\bnight games?\b/.test(normalized) && !/\bknight games?\b/.test(normalized);
  const hasFeatureGoal = goals.length > 0;
  const hasSpecificGoal = goals.some(goal => !["entertainment", "games"].includes(goal));

  let primaryIntent = "general";
  if (negatedNavigation || negativeDesire) primaryIntent = "negative-preference";
  else if (followUp) primaryIntent = "follow-up";
  else if (explicitNavigation) primaryIntent = "navigation";
  else if (informationQuestion) primaryIntent = "information";
  else if (goals.includes("improvement") || goals.includes("calculation") || goals.includes("tactical-training")) primaryIntent = "learning";
  else if (goals.includes("games") || goals.includes("entertainment")) primaryIntent = "entertainment";
  else if (wantsSomething) primaryIntent = "discovery";

  const negated = NEGATION_RE.test(normalized);

  return Object.freeze({
    normalized,
    clauses,
    goals,
    secondaryIntents: goals,
    entities: Object.freeze({
      featureTarget: (normalized.match(/^(?:please )?(?:open|launch|start|enter|navigate to|go to|take me to|bring me to|send me to|head to|show me|show) (.+)$/) || [])[1] || null,
      pronouns: /\b(?:he|she|they|it|this|that|these|those|the first one|the second one|the other one)\b/.test(normalized)
    }),
    negated,
    negatedNavigation,
    negativeDesire,
    pastDesire,
    explicitNavigation,
    informationQuestion,
    followUp,
    nightVsKnightAmbiguous,
    hasFeatureGoal,
    hasSpecificGoal,
    hasActionVerb,
    wantsSomething,
    compound,
    primaryIntent,
    confidenceBand: explicitNavigation && !negatedNavigation ? "high" :
      (goals.length || informationQuestion ? "medium" : "low")
  });
}

export function isClearInformationQuestion(input) {
  const text = normalizeForUnderstanding(input);
  return INFO_LEAD_RE.test(text) && !/\b(?:show|open|launch|find|locate|take me to)\b/.test(text);
}

export function getFeatureIntentHints(analysis) {
  const goals = new Set(analysis?.goals || []);
  const hints = new Set();
  if (goals.has("calculation") || goals.has("tactical-training") || goals.has("improvement")) {
    ["puzzle", "tactic", "training", "trainer", "quiz", "challenge", "calculation", "guess elo"].forEach(v => hints.add(v));
  }
  if (goals.has("entertainment") || goals.has("games")) {
    ["game", "arcade", "fun", "challenge", "battle", "maze", "memory", "computer", "play online", "live match"].forEach(v => hints.add(v));
  }
  if (goals.has("multiplayer")) {
    ["multiplayer", "online", "live match", "pairing", "opponent"].forEach(v => hints.add(v));
  }
  if (goals.has("game-review")) {
    ["review", "analysis", "game review", "study"].forEach(v => hints.add(v));
  }
  if (goals.has("knight-games")) {
    ["knight", "horse", "tour"].forEach(v => hints.add(v));
  }
  if (goals.has("memory-training")) {
    ["memory", "recall", "sequence"].forEach(v => hints.add(v));
  }
  if (goals.has("assignments")) ["assignment", "homework", "task"].forEach(v => hints.add(v));
  if (goals.has("schedule")) ["schedule", "timetable", "class", "attendance"].forEach(v => hints.add(v));
  return [...hints];
}

export function describeTone(input) {
  const text = normalizeForUnderstanding(input);
  if (/\b(?:not|never|no longer)\s+(?:really\s+)?(?:bored|sad|upset|angry|frustrated|annoyed|confused)\b/.test(text)) return "neutral";
  if (/\b(?:terrible day|rough day|bad day|sad|upset|down|lonely|lost again|keep losing)\b/.test(text)) return "low";
  if (/\b(?:frustrated|annoyed|angry|irritated|fed up|stuck|difficult|hard)\b/.test(text)) return "frustrated";
  if (/\b(?:excited|thrilled|pumped|finally won|i won|amazing)\b/.test(text)) return "positive";
  if (/\b(?:bored|nothing to do|tired of doing the same thing|same old thing)\b/.test(text)) return "bored";
  if (/\b(?:confused|do not understand|do not get it|mind is not working|cannot figure it out)\b/.test(text)) return "confused";
  return "neutral";
}
