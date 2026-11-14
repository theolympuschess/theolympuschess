/* =========================================================
   OLYMPUS AI — SHORT-TERM CONVERSATION CONTEXT
   In-memory only. Stores bounded intent/topic context, a short
   last-question cue and entity ids; never a complete transcript.
   Expires after inactivity.
   ========================================================= */

import { OLYMPUS_AI_CONFIG } from "./ai-config.js";

/* Lower-case, strip accents, drop apostrophes (im, whats, youre),
   turn other punctuation into spaces. */
export function normalizeChat(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(text) {
  const value = String(text || "").trim();
  return value ? value.split(/\s+/).length : 0;
}

export function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

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

function freshContext() {
  return {
    history: [],          // recent intent names only
    lastIntent: null,
    lastAsk: null,        // e.g. "country" | "profile" | "rating"
    pending: null,        // e.g. { type: "joke" }
    lastMore: null,       // text for "tell me more"
    entities: { player: null, place: null, feature: null, topic: null },
    recentEntities: [],   // bounded ids/names only; never raw messages
    lastTopic: null,
    lastQuestion: null,
    lastFeatures: [],     // [{ tab, label }] from the verified live catalogue
    lastFeaturesTurn: 0,
    lastSuccessfulNavigation: null,
    used: {},             // last variant index per response pool
    turns: 0,
    lastTime: Date.now()
  };
}

let ctx = freshContext();

function expireIfIdle() {
  const limit = OLYMPUS_AI_CONFIG.conversation.sessionTimeoutMs;
  if (Date.now() - ctx.lastTime > limit) ctx = freshContext();
}

export function getContext() {
  expireIfIdle();
  return ctx;
}

export function resetContext() {
  ctx = freshContext();
}

/* Record that an intent was answered. pending and lastMore are
   cleared unless the caller provides them again. */
export function recordIntent(intent, extra = {}) {
  expireIfIdle();

  const { pending = null, lastMore = null, entities, ...rest } = extra;
  const max = OLYMPUS_AI_CONFIG.conversation.maxHistory;

  ctx.turns += 1;
  ctx.lastIntent = intent;
  ctx.pending = pending;
  ctx.lastMore = lastMore;
  Object.assign(ctx, rest);
  if (Object.prototype.hasOwnProperty.call(rest, "lastFeatures")) {
    ctx.lastFeaturesTurn = ctx.turns;
  }

  if (entities) {
    ctx.entities = { ...ctx.entities, ...entities };
    for (const [kind, value] of Object.entries(entities)) {
      if (!value) continue;
      ctx.recentEntities = ctx.recentEntities.filter(item =>
        !(item.kind === kind && item.value === value)
      );
      ctx.recentEntities.unshift({ kind, value });
    }
    ctx.recentEntities = ctx.recentEntities.slice(
      0,
      OLYMPUS_AI_CONFIG.conversation.maxRecentEntities || 6
    );
  }

  if (Array.isArray(ctx.lastFeatures)) {
    ctx.lastFeatures = ctx.lastFeatures
      .filter(item => item && typeof item.tab === "string")
      .slice(0, OLYMPUS_AI_CONFIG.conversation.maxRememberedFeatures || 8);
  }

  ctx.history.push(intent);
  while (ctx.history.length > max) ctx.history.shift();

  ctx.lastTime = Date.now();
  return ctx;
}

/* Pick a variant without repeating the previous one. */
export function pick(key, options) {
  if (!options.length) return "";
  if (options.length === 1) return options[0];

  let index;
  do {
    index = Math.floor(Math.random() * options.length);
  } while (index === ctx.used[key]);

  ctx.used[key] = index;
  return options[index];
}

/* Remember only verified catalogue identifiers and display labels. */
export function rememberFeatureResults(features, question = null) {
  const safe = (Array.isArray(features) ? features : [])
    .filter(feature => feature && typeof feature.tab === "string")
    .slice(0, OLYMPUS_AI_CONFIG.conversation.maxRememberedFeatures || 8)
    .map(feature => ({ tab: feature.tab, label: String(feature.label || feature.tab).slice(0, 80) }));

  return recordIntent("feature-discovery", {
    lastFeatures: safe,
    lastQuestion: typeof question === "string" ? question.slice(0, 180) : null,
    lastTopic: "feature-discovery",
    entities: safe.length === 1 ? { feature: safe[0].tab } : undefined
  });
}

export function getRecentFeatureChoices() {
  const current = getContext();
  if (!Array.isArray(current.lastFeatures)) return [];
  // Choices are deliberately short-lived so "open it" cannot target
  // an unrelated feature from much earlier in the same session.
  if (current.turns - (current.lastFeaturesTurn || 0) > 3) return [];
  return current.lastFeatures.slice(0, OLYMPUS_AI_CONFIG.conversation.maxRememberedFeatures || 8);
}

export function rememberNavigation(feature) {
  if (!feature || typeof feature.tab !== "string") return getContext();
  return recordIntent("feature-navigation", {
    lastSuccessfulNavigation: feature.tab,
    lastFeatures: [{ tab: feature.tab, label: String(feature.label || feature.tab).slice(0, 80) }],
    lastTopic: "feature-navigation",
    entities: { feature: feature.tab }
  });
}
