/* =====================================================================
   OLYMPUS AI 4.2.1 — EXPANDED NATURAL-LANGUAGE, READ-ONLY DATA INTELLIGENCE
   ---------------------------------------------------------------------
   Designed for the uploaded Olympus MainUI codebase.

   IMPORTANT:
   - Reuses window.supabaseClient, which MainUI already exposes.
   - Does not create a client, change Supabase settings, or require SQL.
   - READ-ONLY: this module contains SELECT queries only.
   - Every personal query is scoped to the authenticated user's id or
     username. Public leaderboard follows the existing MainUI rules.
   - Existing Supabase RLS policies remain the final authority.
   ===================================================================== */

import { normalizeForUnderstanding } from "./ai-understanding.js";
import { resolveIntentsWithVocabulary } from "./ai-data-vocabulary.js";

const PAGE_SIZE = 500;
const MAX_PAGES = 20; // up to 10,000 rows for a single user's history
const IST = "Asia/Kolkata";
const HIDDEN_LEADERBOARD_NAMES = new Set(["admin", "biplab", "dona"]);

const GAME_NAMES = Object.freeze({
  pawn: "Pawn Practice",
  knight: "Knight Practice",
  bishop: "Bishop Practice",
  rook: "Rook Practice",
  queen: "Queen Practice",
  king: "King Practice",
  memory: "IQ Hunt",
  boardfreeze: "Board Recall",
  color: "Lab Hunt",
  knightfog: "Knight Fog Quest",
  iqtrainer: "IQ Trainer",
  knightdefense: "Defend The King",
  knightpath: "Knight Path",
  knightmonster: "Knight vs Monster",
  knightescape: "Escape",
  knightspeed: "Speed Run",
  knightlava: "Lava Knight",
  knightgps: "Knight GPS",
  kingmath: "Chess Math",
  colorchaos: "Rainbow Mania",
  flashqueen: "Find The Queen",
  pathfinder: "Reach Home",
  puzzlerush: "Puzzle Rush",
  quiz: "Quiz",
  coordtrain: "Board Coordinates",
  puzzlebattle: "Puzzle Battle"
});

const DATA_CAPABILITIES = Object.freeze([
  { id: "profile-rating", label: "My Olympus profile and rating", examples: ["What's my ELO?", "Show my rating breakdown"] },
  { id: "leaderboard", label: "Olympus player rankings", examples: ["Show the top 10 players", "What's my current rank?"] },
  { id: "vs-bot", label: "My games against the computer", examples: ["How many games did I play against the computer this month?", "Show my wins and losses against the computer"] },
  { id: "live-match", label: "My online multiplayer games", examples: ["Show my live match record", "How many PvP games have I played?"] },
  { id: "mini-games", label: "My mini-game records", examples: ["Show my mini-game records", "What is my best Knight score?"] },
  { id: "xp-history", label: "My XP and progress history", examples: ["How much XP did I earn this month?", "Show my recent XP history"] },
  { id: "assignments", label: "My assignments and homework", examples: ["How many assignments are pending?", "Show my submitted homework"] },
  { id: "attendance", label: "My class attendance", examples: ["How many class days did I attend this month?"] },
  { id: "schedule", label: "My classes, timetable and batch", examples: ["Show my class report", "What batch am I in?", "When are my classes?"] },
  { id: "live-puzzles", label: "My classroom practice activity", examples: ["How many classroom puzzles did I solve?"] },
  { id: "puzzle-battle", label: "My Puzzle Battle results", examples: ["How many puzzle battles have I played?"] },
  { id: "payments", label: "My fees and recorded payments", examples: ["Show my payment history", "How much have I paid?", "Show my fee details"] },
  { id: "announcements", label: "Latest academy updates", examples: ["Any new academy announcement?"] }
]);

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeMarkdown(value) {
  return clean(value).replace(/[\r\n]+/g, " ");
}

// ======================================================
// 📅 FORMAT CLASS SCHEDULE — MATCH MAINUI CALENDAR
// ======================================================

const SCHEDULE_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

function formatScheduleWeekday(value) {
  const raw = clean(value);

  if (!raw) return "Unknown";

  const day = Number(raw);

  if (
    Number.isInteger(day) &&
    day >= 0 &&
    day < SCHEDULE_WEEKDAYS.length
  ) {
    return SCHEDULE_WEEKDAYS[day];
  }

  return SCHEDULE_WEEKDAYS.find(
    name => name.toLowerCase() === raw.toLowerCase()
  ) || raw;
}

function formatScheduleTime(timeValue) {
  if (!timeValue) return "—";

  const parts = String(timeValue).trim().split(":");

  if (parts.length < 2) return timeValue;

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 || hour > 23 ||
    minute < 0 || minute > 59
  ) {
    return timeValue;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatDate(value, withTime = false) {
  if (!value) return "Date not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
  }).format(date);
}

function toISTDateOnly(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(date);
}

function parseSupabaseTimestamp(value) {
  if (!value) return null;
  const raw = String(value);
  // MainUI's attendance calendar treats timezone-less started_at values as UTC.
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw) ? raw : `${raw}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function istDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

// Convert a midnight in India (UTC+05:30) to its UTC ISO timestamp.
function istMidnightIso(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, -5, -30, 0, 0)).toISOString();
}

function addCalendarDays({ year, month, day }, amount) {
  const d = new Date(Date.UTC(year, month - 1, day + amount));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function getDateRangeFromQuestion(question, defaultToMonth = true) {
  const q = normalize(question);
  const now = istDateParts();
  const todayStart = istMidnightIso(now.year, now.month, now.day);
  const tomorrow = addCalendarDays(now, 1);
  const tomorrowStart = istMidnightIso(tomorrow.year, tomorrow.month, tomorrow.day);

  if (/\ball time\b|\bever\b|\boverall\b|\btotal\b/.test(q) && !/this month|this week|this year/.test(q)) {
    return { label: "all time", start: null, end: null };
  }
  if (/\btoday\b|\btodays\b/.test(q)) {
    return { label: "today", start: todayStart, end: tomorrowStart };
  }
  if (/\byesterday\b/.test(q)) {
    const yesterday = addCalendarDays(now, -1);
    return { label: "yesterday", start: istMidnightIso(yesterday.year, yesterday.month, yesterday.day), end: todayStart };
  }
  if (/\blast 7 days\b|\bpast 7 days\b|\bthis week\b/.test(q)) {
    const from = addCalendarDays(now, -6);
    return { label: "the last 7 days", start: istMidnightIso(from.year, from.month, from.day), end: null };
  }
  if (/\blast 30 days\b|\bpast 30 days\b|\blast month\b/.test(q)) {
    if (/\blast month\b/.test(q) && !/last 30 days|past 30 days/.test(q)) {
      const firstThisMonth = { year: now.year, month: now.month, day: 1 };
      const firstLastMonth = addCalendarDays(firstThisMonth, -1);
      const startParts = { year: firstLastMonth.year, month: firstLastMonth.month, day: 1 };
      return { label: "last month", start: istMidnightIso(startParts.year, startParts.month, 1), end: istMidnightIso(now.year, now.month, 1) };
    }
    const from = addCalendarDays(now, -29);
    return { label: "the last 30 days", start: istMidnightIso(from.year, from.month, from.day), end: null };
  }
  if (/\bthis year\b/.test(q)) {
    return { label: "this year", start: istMidnightIso(now.year, 1, 1), end: null };
  }
  if (/\bthis month\b|\bmonth\b/.test(q) || defaultToMonth) {
    const next = now.month === 12
      ? { year: now.year + 1, month: 1 }
      : { year: now.year, month: now.month + 1 };
    return {
      label: "this month",
      start: istMidnightIso(now.year, now.month, 1),
      end: istMidnightIso(next.year, next.month, 1)
    };
  }
  return { label: "all time", start: null, end: null };
}

function getRating(profile) {
  const puzzle = Number(profile?.puzzle_current_score || 0);
  const quiz = Number(profile?.quiz_current_score || 0);
  const game = Number(profile?.game_current_score || 0);
  const rawAverage = (puzzle + quiz + game) / 3;
  // Match the actual rating formula used by MainUI's leaderboard and profile UI.
  const rating = Math.floor(rawAverage / 10) * 10;
  const tier = rating >= 3000 ? "Olympus Immortal" : `Level-${Math.floor(Math.max(0, rating) / 100) + 1}`;
  return { puzzle, quiz, game, rawAverage, rating, tier };
}

async function getSupabaseClient() {
  // MainUI sets this global itself. No additional import or Supabase setup needed.
  for (let attempt = 0; attempt < 15; attempt++) {
    const client = window.supabaseClient;
    if (client?.auth?.getUser && typeof client.from === "function") return client;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("The existing MainUI Supabase client was not available. Confirm MainUI loads before the Olympus AI module.");
}

async function getIdentity() {
  const supabase = await getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData?.user;
  if (!user?.id) throw new Error("No authenticated student session was found. Please sign in again.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, role, active, puzzle_current_score, quiz_current_score, game_current_score")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) throw new Error("Your Olympus profile could not be found.");
  if (profile.active === false) throw new Error("This account is currently inactive. Please contact the academy administrator.");

  return { supabase, user, profile };
}

async function readPaged(makeQuery, maxPages = MAX_PAGES) {
  const rows = [];
  for (let page = 0; page < maxPages; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await makeQuery().range(from, to);
    if (error) throw error;
    const batch = Array.isArray(data) ? data : [];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}

function niceError(error, sourceLabel) {
  const message = clean(error?.message || error || "Unknown error");
  const code = clean(error?.code);
  if (code === "42501" || /permission denied|row-level security|not allowed/i.test(message)) {
    return `I can’t show ${sourceLabel} because your account does not currently have permission to view it. Your information has not been changed. Please ask your coach or an academy administrator if you think you should have access.`;
  }
  if (/does not exist|schema cache|column .* not found|could not find the/i.test(message)) {
    return `I couldn't read ${sourceLabel} because the saved information is not in the expected format. No information was changed. Please ask an academy administrator to check this.`;
  }
  return `I couldn’t load ${sourceLabel} just now. Please try again. If the problem continues, ask an academy administrator for help.`;
}

async function getMyRatingAnswer() {
  const { profile } = await getIdentity();
  const rating = getRating(profile);
  return [
    `Your current Olympus Rating is **${formatNumber(rating.rating)}** (${rating.tier}).`,
    "",
    "**Rating breakdown**",
    `• Puzzle Rating: ${formatNumber(rating.puzzle)}`,
    `• Quiz Rating: ${formatNumber(rating.quiz)}`,
    `• Game Rating: ${formatNumber(rating.game)}`,
    "",
    "This is the Olympus composite rating used by your academy dashboard; it is not an official FIDE rating."
  ].join("\n");
}

async function getLeaderboardRows(supabase) {
  const result = await readPaged(() => supabase
    .from("profiles")
    .select("id, username, puzzle_current_score, quiz_current_score, game_current_score, active")
    .eq("active", true)
    .order("username", { ascending: true }));

  const ranked = result.rows
    .filter(p => p.active === true && !HIDDEN_LEADERBOARD_NAMES.has(normalize(p.username)))
    .map(p => {
      const rating = getRating(p);
      return { id: p.id, username: clean(p.username || "Student"), rating: rating.rating, tier: rating.tier };
    })
    .sort((a, b) => b.rating - a.rating || a.username.localeCompare(b.username));

  return { ranked, truncated: result.truncated };
}

async function getLeaderboardAnswer(question) {
  const { supabase, profile } = await getIdentity();
  const { ranked, truncated } = await getLeaderboardRows(supabase);
  if (!ranked.length) return "The rating leaderboard returned no active, visible players.";

  const q = normalize(question);
  const personal = ranked.findIndex(row => row.id === profile.id);
  const isMyRank = /\bmy\b|\bwhere do i\b|\bwhere am i\b|\bwhat is my\b|\bwhats my\b|\bwhat position am i\b/.test(q) && /\b(rank|ranking|position|place|standing)\b/.test(q);
  const asksNumberOne = /\bwho is number one\b|\bwho is number 1\b|\bwho is #?1\b/.test(q);
  const topMatch = q.match(/\btop\s+(\d{1,3})\b/);
  const requestedCount = topMatch
    ? Math.max(1, Math.min(50, Number(topMatch[1])))
    : /\b(full|complete|entire|all)\b/.test(q) ? 50 : 10;

  if (asksNumberOne) {
    const leader = ranked[0];
    return `The current number one player is **${escapeMarkdown(leader.username)}** with an Olympus Rating of **${formatNumber(leader.rating)}** (${leader.tier}).`;
  }

  if (isMyRank && personal >= 0) {
    const row = ranked[personal];
    const ahead = ranked.slice(0, personal).filter(p => p.rating > row.rating).length;
    const competitionRank = personal + 1;
    return [
      `Your current leaderboard position is **#${competitionRank} of ${ranked.length} visible active players**.`,
      `Your Olympus Rating: **${formatNumber(row.rating)}** (${row.tier}).`,
      "",
      `There are ${formatNumber(ahead)} player(s) with a higher displayed rating than yours.${truncated ? " The ranking query reached its configured 10,000-row safety cap, so the total may be larger." : ""}`
    ].join("\n");
  }

  const fullListRequested = !topMatch && /\b(full|complete|entire|all)\b/.test(q);
  const heading = fullListRequested
    ? "**Full Olympus Rating Leaderboard**"
    : `**Olympus Rating Leaderboard — Top ${Math.min(requestedCount, ranked.length)}**`;
  const lines = [heading, ""];
  ranked.slice(0, requestedCount).forEach((p, index) => {
    lines.push(`${index + 1}. **${escapeMarkdown(p.username)}** — ${formatNumber(p.rating)} (${p.tier})`);
  });
  lines.push("");
  lines.push(`Showing ${Math.min(requestedCount, ranked.length)} of ${formatNumber(ranked.length)} visible active players.`);
  if (personal >= 0) lines.push(`Your position: **#${personal + 1}**.`);
  if (truncated) lines.push("Note: the leaderboard reached its 10,000-row safety cap; additional profiles may exist.");
  return lines.join("\n");
}

function resultBucket(value) {
  const v = normalize(value);
  if (["win", "won", "1-0", "0-1", "victory"].includes(v)) return "win";
  if (["draw", "drawn", "1 2-1 2", "1/2-1/2", "tie"].includes(v)) return "draw";
  if (["loss", "lost", "lose", "defeat"].includes(v)) return "loss";
  return "other";
}

async function getVsBotAnswer(question, wantsRecent = false) {
  const { supabase, user, profile } = await getIdentity();
  const period = getDateRangeFromQuestion(question, false);
  const result = await readPaged(() => {
    let query = supabase
      .from("vs_bot_games")
      .select("id, result, student_name, bot_name, difficulty, created_at, player_color")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });
    if (period.start) query = query.gte("created_at", period.start);
    if (period.end) query = query.lt("created_at", period.end);
    return query;
  });

  const rows = result.rows;
  const totals = { win: 0, draw: 0, loss: 0, other: 0 };
  rows.forEach(row => totals[resultBucket(row.result)]++);
  const winRate = rows.length ? (totals.win / rows.length) * 100 : 0;
  const titlePeriod = period.label === "this month" ? "this month" : period.label;
  const normalizedQuestion = normalize(question);

  // Difficulty questions are answered from the recorded difficulty field,
  // rather than guessing from the student's overall game count.
  if (/\bdifficulty\b/.test(normalizedQuestion)) {
    if (!rows.length) return `I couldn't find any VS Computer games for you ${titlePeriod}, so there is no recorded difficulty breakdown yet.`;
    const byDifficulty = new Map();
    rows.forEach(row => {
      const key = row.difficulty === null || row.difficulty === undefined || row.difficulty === ""
        ? "Not recorded"
        : String(row.difficulty);
      byDifficulty.set(key, (byDifficulty.get(key) || 0) + 1);
    });
    const rankedDifficulties = [...byDifficulty.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], undefined, { numeric: true }));
    return [
      `**Your VS Computer difficulty breakdown — ${titlePeriod}**`,
      "",
      `• Most-played difficulty: **${rankedDifficulties[0][0]}** (${formatNumber(rankedDifficulties[0][1])} game(s))`,
      "",
      ...rankedDifficulties.map(([difficulty, count]) => `• Difficulty ${difficulty}: **${formatNumber(count)}** game(s)`),
      "",
      `Based on ${formatNumber(rows.length)} recorded VS Computer game(s).`
    ].join("\n");
  }

  const asksCountOnly =
    (/\b(how many|number of|total games)\b/.test(normalizedQuestion) &&
      !/\b(win|wins|won|loss|losses|lost|draw|draws|statistics|stats|summary)\b/.test(normalizedQuestion));
  if (asksCountOnly) {
    return `You have played **${formatNumber(rows.length)} VS Computer game(s)** ${titlePeriod}.`;
  }

  if (wantsRecent || /\b(recent|latest|last few|last \d+|show.*games|list.*games|history)\b/.test(normalizedQuestion)) {
    if (!rows.length) return `I couldn't find any VS Computer games for you ${titlePeriod}.`;
    const recent = rows.slice(0, 10);
    const lines = [`**Your VS Computer games — ${titlePeriod}**`, ""];
    recent.forEach((game, i) => {
      lines.push(`${i + 1}. ${formatDate(game.created_at, true)} — **${escapeMarkdown(game.result || "Result not recorded")}** vs ${escapeMarkdown(game.bot_name || "Computer")}, difficulty ${game.difficulty ?? "not recorded"}`);
    });
    lines.push("");
    lines.push(`Showing ${recent.length} of ${formatNumber(rows.length)} games in this period.`);
    return lines.join("\n");
  }

  return [
    `**Your VS Computer summary — ${titlePeriod}**`,
    "",
    `• Games played: **${formatNumber(rows.length)}**`,
    `• Wins: **${formatNumber(totals.win)}**`,
    `• Losses: **${formatNumber(totals.loss)}**`,
    `• Draws: **${formatNumber(totals.draw)}**`,
    ...(totals.other ? [`• Other/unrecognised results: **${formatNumber(totals.other)}**`] : []),
    `• Win rate: **${winRate.toFixed(1)}%**`,
    rows.length ? `• Most recent game: ${formatDate(rows[0].created_at, true)} against ${escapeMarkdown(rows[0].bot_name || "Computer")}.` : "• No completed games were found in this period.",
    ...(result.truncated ? ["Note: the query reached its 10,000-row history cap."] : [])
  ].join("\n");
}

async function getLiveMatchAnswer(question) {
  const { supabase, user, profile } = await getIdentity();
  const [whiteResult, blackResult] = await Promise.all([
    readPaged(() => supabase.from("live_match_archive")
      .select("id, winner, white_id, black_id, white_name, black_name, ended_at")
      .eq("white_id", user.id)
      .order("ended_at", { ascending: false })),
    readPaged(() => supabase.from("live_match_archive")
      .select("id, winner, white_id, black_id, white_name, black_name, ended_at")
      .eq("black_id", user.id)
      .order("ended_at", { ascending: false }))
  ]);
  const map = new Map();
  [...whiteResult.rows, ...blackResult.rows].forEach(row => map.set(row.id, row));
  const rows = [...map.values()].sort((a, b) => new Date(b.ended_at || 0) - new Date(a.ended_at || 0));
  const stats = { win: 0, draw: 0, loss: 0 };
  rows.forEach(row => {
    const side = row.white_id === user.id ? "w" : "b";
    if (row.winner === "draw") stats.draw++;
    else if (row.winner === side) stats.win++;
    else stats.loss++;
  });
  const q = normalize(question);
  if (/\b(recent|latest|history|show.*games|list.*games)\b/.test(q)) {
    if (!rows.length) return "I couldn't find archived live multiplayer games linked to your authenticated student ID.";
    return [
      "**Your recent live multiplayer games**",
      "",
      ...rows.slice(0, 10).map((row, i) => {
        const side = row.white_id === user.id ? "white" : "black";
        const opponent = side === "white" ? row.black_name : row.white_name;
        const outcome = row.winner === "draw" ? "Draw" : row.winner === (side === "white" ? "w" : "b") ? "Win" : "Loss";
        return `${i + 1}. ${formatDate(row.ended_at, true)} — ${outcome} vs ${escapeMarkdown(opponent || "Opponent")}`;
      })
    ].join("\n");
  }
  return [
    "**Your archived live multiplayer record**",
    "",
    `• Games: **${formatNumber(rows.length)}**`,
    `• Wins: **${formatNumber(stats.win)}**`,
    `• Losses: **${formatNumber(stats.loss)}**`,
    `• Draws: **${formatNumber(stats.draw)}**`,
    "",
    "Only archived games with your authenticated user ID recorded in the white_id or black_id field are included.",
    ...(whiteResult.truncated || blackResult.truncated ? ["Note: the 10,000-row archive safety cap was reached."] : [])
  ].join("\n");
}

async function getMiniGameAnswer(question) {
  const { supabase, user } = await getIdentity();
  const { data, error } = await supabase
    .from("minigame_high_scores")
    .select("game_key, score")
    .eq("student_id", user.id)
    .order("score", { ascending: false });
  if (error) throw error;
  const rows = data || [];
  const q = normalize(question);
  if (!rows.length) return "You don't have any saved mini-game high scores yet.";

  const specificKey = Object.keys(GAME_NAMES).find(key => q.includes(normalize(GAME_NAMES[key])) || q.includes(key));
  if (specificKey) {
    const found = rows.find(row => row.game_key === specificKey);
    if (!found) return `I couldn't find a saved high score for ${GAME_NAMES[specificKey]}.`;
    return `Your best saved score in **${GAME_NAMES[specificKey]}** is **${formatNumber(found.score)}**.`;
  }
  return [
    "**Your mini-game best scores**",
    "",
    ...rows.slice(0, 20).map((row, i) => `${i + 1}. ${GAME_NAMES[row.game_key] || escapeMarkdown(row.game_key)} — **${formatNumber(row.score)}**`),
    "",
    `Showing ${Math.min(rows.length, 20)} saved game record(s).`
  ].join("\n");
}

async function getXPHistoryAnswer(question) {
  const { supabase, user } = await getIdentity();
  const period = getDateRangeFromQuestion(question, false);
  const result = await readPaged(() => {
    let query = supabase
      .from("rating_history")
      .select("source, reason, xp, created_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });
    if (period.start) query = query.gte("created_at", period.start);
    if (period.end) query = query.lt("created_at", period.end);
    return query;
  });
  const rows = result.rows;
  const totalXP = rows.reduce((sum, row) => sum + Number(row.xp || 0), 0);
  if (/\b(history|recent|show|list|last)\b/.test(normalize(question))) {
    if (!rows.length) return `No XP history entries were found for you ${period.label}.`;
    return [
      `**Your XP history — ${period.label}**`,
      `Total XP recorded in this result: **${formatNumber(totalXP)}**`,
      "",
      ...rows.slice(0, 15).map((row, i) => `${i + 1}. ${formatDate(row.created_at, true)} — **+${formatNumber(row.xp)} XP** (${escapeMarkdown(row.source || "Activity")}: ${escapeMarkdown(row.reason || "No details")})`),
      "",
      `Showing 15 of ${formatNumber(rows.length)} recorded entries.`,
      ...(result.truncated ? ["Note: the 10,000-row history safety cap was reached."] : [])
    ].join("\n");
  }
  return `You earned **${formatNumber(totalXP)} XP** across ${formatNumber(rows.length)} recorded XP event(s) ${period.label}.${result.truncated ? " The 10,000-row safety cap was reached, so additional events may exist." : ""}`;
}

async function getAssignmentsAnswer(question) {
  const { supabase, user } = await getIdentity();
  if (!user.id) throw new Error("Your signed-in student ID is unavailable.");
  const [assignmentResult, attemptResult] = await Promise.all([
    supabase.from("assignments")
      .select("id, title, description, task_type, due_at, created_at, status, is_public, is_bulk")
      .eq("status", "active")
      .or(`is_public.eq.true,assigned_to.cs.["${user.id}"]`),
    supabase.from("attempts")
      .select("assignment_id, is_correct, grade_letter, submitted_at")
      .eq("student_id", user.id)
      .order("submitted_at", { ascending: false })
  ]);
  if (assignmentResult.error) throw assignmentResult.error;
  if (attemptResult.error) throw attemptResult.error;
  const assignments = assignmentResult.data || [];
  const attempts = attemptResult.data || [];
  const latest = new Map();
  attempts.forEach(attempt => {
    const key = String(attempt.assignment_id);
    const old = latest.get(key);
    if (!old || new Date(attempt.submitted_at || 0) > new Date(old.submitted_at || 0)) latest.set(key, attempt);
  });
  const now = Date.now();
  const submitted = assignments.filter(a => latest.has(String(a.id)));
  const pending = assignments.filter(a => !latest.has(String(a.id)));
  const overdue = pending.filter(a => a.due_at && new Date(a.due_at).getTime() < now);
  const q = normalize(question);
  if (/\b(show|list|which|what are|details|homework)\b/.test(q)) {
    const view = /\boverdue\b/.test(q) ? overdue : /\bsubmitted|completed\b/.test(q) ? submitted : assignments;
    if (!view.length) return "There are no matching active assignments in the records visible to your account.";
    return [
      "**Your assignments**",
      "",
      ...view.slice(0, 15).map((a, i) => {
        const attempt = latest.get(String(a.id));
        const status = attempt ? `Submitted${attempt.grade_letter ? ` — Grade ${attempt.grade_letter}` : ""}` : a.due_at && new Date(a.due_at).getTime() < now ? "Overdue — not submitted" : "Pending";
        return `${i + 1}. **${escapeMarkdown(a.title || "Untitled assignment")}** — ${status}${a.due_at ? ` (Due ${formatDate(a.due_at)})` : ""}`;
      })
    ].join("\n");
  }
  return [
    "**Your assignment summary**",
    "",
    `• Active assignments: **${formatNumber(assignments.length)}**`,
    `• Submitted: **${formatNumber(submitted.length)}**`,
    `• Pending: **${formatNumber(pending.length)}**`,
    `• Overdue and not submitted: **${formatNumber(overdue.length)}**`
  ].join("\n");
}

async function getAttendanceAnswer(question) {
  const { supabase, profile } = await getIdentity();
  if (!profile.username) return "I can’t match your attendance records to your profile yet. Please ask an academy administrator to check your account details.";
  const period = getDateRangeFromQuestion(question, false);
  const result = await readPaged(() => {
    let query = supabase
      .from("live_puzzle_attempts")
      .select("started_at")
      .eq("username", profile.username)
      .not("started_at", "is", null)
      .order("started_at", { ascending: false });
    if (period.start) query = query.gte("started_at", period.start);
    if (period.end) query = query.lt("started_at", period.end);
    return query;
  });
  const daySet = new Set();
  result.rows.forEach(row => {
    const date = parseSupabaseTimestamp(row.started_at);
    if (!date) return;
    daySet.add(date.toLocaleDateString("en-CA", { timeZone: IST }));
  });
  const sortedDays = [...daySet].sort().reverse();
  return [
    `**Your recorded classroom attendance — ${period.label}**`,
    "",
    `• Distinct class dates recorded: **${formatNumber(sortedDays.length)}**`,
    sortedDays.length ? `• Most recent recorded date: **${formatDate(`${sortedDays[0]}T00:00:00+05:30`)}**` : "• No attendance dates were found in this period.",
    "",
    "These dates are based on recorded live-classroom activity. They may differ from a separately maintained attendance register."
  ].join("\n");
}

async function getScheduleAnswer(question = "") {
  const { supabase, profile } = await getIdentity();
  if (!profile.username) {
    return "I can’t match a class schedule to your profile yet. Please ask an academy administrator to check your account details.";
  }

  const [scheduleResult, batchResult, subscriptionResult] = await Promise.all([
    supabase.from("student_class_schedule")
      .select("username, weekday, class_time")
      .eq("username", profile.username)
      .order("weekday", { ascending: true })
      .order("class_time", { ascending: true }),
    supabase.from("student_batches")
      .select("username, batch_name")
      .eq("username", profile.username)
      .maybeSingle(),
    supabase.from("student_subscriptions")
      .select("username, total_classes")
      .eq("username", profile.username)
      .maybeSingle()
  ]);

  if (scheduleResult.error) throw scheduleResult.error;
  if (batchResult.error) throw batchResult.error;
  // MainUI logs a subscription read failure and uses 24 as its fallback.
  const subscriptionError = subscriptionResult.error;
  const subscription = subscriptionResult.data || null;
  const schedule = scheduleResult.data || [];
  const batch = batchResult.data?.batch_name || "Not assigned";
  const totalClasses = Number(subscription?.total_classes ?? 24);

  // Match MainUI's business rule: one completed class per unique IST
  // attendance day recorded in live_puzzle_attempts for this username.
  const attendanceResult = await readPaged(() => supabase
    .from("live_puzzle_attempts")
    .select("started_at")
    .eq("username", profile.username)
    .not("started_at", "is", null)
    .order("started_at", { ascending: true }));

  const attendanceDays = new Set();
  attendanceResult.rows.forEach(row => {
    if (!row.started_at) return;
    const date = parseSupabaseTimestamp(row.started_at);
    if (!date) return;
    attendanceDays.add(date.toLocaleDateString("en-CA", { timeZone: IST }));
  });

  const completedClasses = attendanceDays.size;
  const remainingClasses = Math.max(totalClasses - completedClasses, 0);
  const q = normalize(question);
  const wantsSubscriptionOnly = /\b(subscription|remaining classes|classes left|class allocation)\b/.test(q);
  const wantsBatchOnly = /\b(batch name|which batch|my batch|batch details)\b/.test(q);
  const lines = [
    wantsBatchOnly ? "**Your batch details**" : wantsSubscriptionOnly ? "**Your class allocation**" : "**Your Olympus class report**",
    "",
    `• Username: **${escapeMarkdown(profile.username)}**`,
    `• Batch: **${escapeMarkdown(batch)}**`
  ];

  if (!wantsBatchOnly) {
    lines.push("", "**📅 Scheduled Class (Indian Standard Time)**");
    if (schedule.length) {
      schedule.forEach(row => {
        lines.push(`• ${formatScheduleWeekday(row.weekday)} • ${formatScheduleTime(row.class_time)}`);
      });
    } else {
      lines.push("• No individual class schedule rows were found.");
    }

    lines.push(
      "",
      "**Class allocation & progress**",
      `• Total subscribed classes: **${formatNumber(totalClasses)}**${!subscription && !subscriptionError ? " (MainUI default)" : ""}`,
      `• Completed class days recorded: **${formatNumber(completedClasses)}**`,
      `• Remaining classes: **${formatNumber(remainingClasses)}**`,
      "",
      "Completed classes follow the MainUI rule: one class for each distinct date with a recorded live-classroom activity entry."
    );
    if (subscriptionError) {
      lines.push("", "Note: the saved subscription total could not be read, so the MainUI default of 24 classes was used.");
    }
    if (attendanceResult.truncated) {
      lines.push("The attendance history reached its configured safety limit; the completed/remaining count may be incomplete.");
    }
  }

  return lines.join("\n");
}

async function getLivePuzzleAnswer(question) {
  const { supabase, user } = await getIdentity();
  const period = getDateRangeFromQuestion(question, false);
  const result = await readPaged(() => {
    let query = supabase
      .from("live_puzzle_attempts")
      .select("user_id, username, correct, wrong_count, time_taken, solved_at")
      .eq("user_id", user.id)
      .order("solved_at", { ascending: false });
    if (period.start) query = query.gte("solved_at", period.start);
    if (period.end) query = query.lt("solved_at", period.end);
    return query;
  });
  const rows = result.rows;
  const correct = rows.filter(row => row.correct === true).length;
  const wrong = rows.reduce((sum, row) => sum + Number(row.wrong_count || 0), 0);
  const timed = rows.map(row => Number(row.time_taken)).filter(Number.isFinite);
  const avgTime = timed.length ? timed.reduce((a, b) => a + b, 0) / timed.length : null;
  return [
    `**Your live classroom puzzle activity — ${period.label}**`,
    "",
    `• Recorded attempts: **${formatNumber(rows.length)}**`,
    `• Correct attempts: **${formatNumber(correct)}**`,
    `• Wrong moves/answers recorded: **${formatNumber(wrong)}**`,
    `• Average recorded solving time: **${avgTime === null ? "Not available" : `${avgTime.toFixed(1)} seconds`}**`
  ].join("\n");
}

async function getPuzzleBattleAnswer() {
  const { supabase, user } = await getIdentity();
  const { data: playerRows, error: playerError } = await supabase
    .from("puzzle_battle_players")
    .select("room_id, player_id, score, lives")
    .eq("player_id", user.id);
  if (playerError) throw playerError;
  const rows = playerRows || [];
  if (!rows.length) return "I couldn't find any Puzzle Battle participation records for your account.";

  const roomIds = [...new Set(rows.map(row => row.room_id).filter(Boolean))];
  if (!roomIds.length) {
    return `I found ${formatNumber(rows.length)} Puzzle Battle player record(s), but the associated room IDs were not available to verify completed results.`;
  }

  const { data: rooms, error: roomError } = await supabase
    .from("puzzle_battle_rooms")
    .select("id, status, result, winner_id")
    .in("id", roomIds);
  if (roomError) throw roomError;

  const roomMap = new Map((rooms || []).map(room => [room.id, room]));
  const completed = roomIds.map(id => roomMap.get(id)).filter(room => room && normalize(room.status) === "finished");
  const wins = completed.filter(room => room.winner_id === user.id || normalize(room.result) === "win").length;
  const draws = completed.filter(room => normalize(room.result) === "draw").length;
  const losses = Math.max(0, completed.length - wins - draws);
  const totalScore = rows.reduce((sum, row) => sum + Number(row.score || 0), 0);
  const bestScore = rows.reduce((best, row) => Math.max(best, Number(row.score || 0)), 0);

  return [
    "**Your Puzzle Battle summary**",
    "",
    `• Recorded battles: **${formatNumber(roomIds.length)}**`,
    `• Completed battles: **${formatNumber(completed.length)}**`,
    `• Wins: **${formatNumber(wins)}**`,
    `• Losses: **${formatNumber(losses)}**`,
    `• Draws: **${formatNumber(draws)}**`,
    `• Combined recorded puzzle score: **${formatNumber(totalScore)}**`,
    `• Best recorded battle score: **${formatNumber(bestScore)}**`
  ].join("\n");
}

async function getPaymentAnswer(question = "") {
  const { supabase, user } = await getIdentity();
  const period = getDateRangeFromQuestion(question, false);
  let query = supabase
    .from("student_payments")
    .select("id, amount, payment_type, batch_name, payment_date, classes")
    .eq("student_id", user.id)
    .order("payment_date", { ascending: false });

  // payment_date is stored as a calendar date in MainUI. Apply date-only
  // bounds so phrases such as "this month" and "last month" work correctly.
  if (period.start) query = query.gte("payment_date", toISTDateOnly(period.start));
  if (period.end) query = query.lt("payment_date", toISTDateOnly(period.end));

  const { data, error } = await query;
  if (error) throw error;
  const rows = data || [];
  const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalClasses = rows.reduce((sum, row) => sum + Number(row.classes || 0), 0);
  const q = normalize(question);
  const asksDue = /\b(due|dues|outstanding|balance|remaining fee|fee balance)\b/.test(q);

  if (!rows.length) {
    return `No payment records are visible for your own student account ${period.label === "all time" ? "" : `for ${period.label} `}. This does not necessarily mean no payment was made; payment information may be maintained separately by the academy.`.trim();
  }

  const lines = [
    `**Your recorded fee & payment report — ${period.label}**`,
    "",
    `• Recorded payments: **${formatNumber(rows.length)}**`,
    `• Total amount recorded as paid: **₹${formatNumber(totalAmount)}**`,
    `• Classes included in these payment records: **${formatNumber(totalClasses)}**`,
    "",
    "**Payment history**",
    ...rows.slice(0, 15).map((row, i) => `${i + 1}. ${formatDate(row.payment_date)} — **₹${formatNumber(row.amount)}** (${escapeMarkdown(row.payment_type || "Payment")}${row.batch_name ? ` • ${escapeMarkdown(row.batch_name)}` : ""} • ${formatNumber(row.classes)} class(es))`)
  ];

  if (rows.length > 15) lines.push("", `Showing 15 of ${formatNumber(rows.length)} recorded payment(s).`);
  if (asksDue) {
    lines.push(
      "",
      "**About your outstanding balance**",
      "The available payment records show amounts paid, but they do not provide a verified total fee payable or an outstanding-balance field. I won’t guess how much is still due. Please confirm your balance with the academy."
    );
  } else {
    lines.push("", "These figures include only payment rows linked to your authenticated student ID.");
  }
  return lines.join("\n");
}

async function getAnnouncementAnswer() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("app_broadcasts")
    .select("message, is_active, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.message) return "There is no active academy-wide announcement in the current broadcast feed.";
  return [
    "**Current academy announcement**",
    "",
    escapeMarkdown(data.message),
    "",
    data.updated_at ? `Last updated: ${formatDate(data.updated_at, true)}` : ""
  ].filter(Boolean).join("\n");
}

// --------------------------------------------------------------
// NATURAL-LANGUAGE VOCABULARY
// --------------------------------------------------------------
// Keep this matcher intentionally broad: students often use short,
// informal or imperfect phrases instead of the exact database names.
// The UI still sends the original question to each verified handler.
const FULL_REPORT_RE = /\b(?:my full report|full student report|complete student report|overall student report|my complete report|my account report|my account summary|my report|my academy report|student report|my personal details|all my data|all my account data|all my details|all my information|all my records|everything about my account|everything about me|everything you know about my progress|show me everything about me|my overall stats|my complete stats|my full details|account overview|student overview|profile summary|my report card)\b/;

const CLASS_REPORT_RE = /\b(?:my class(?:es)?(?: report| details| information| info| schedule| timetable| timings?)?|class report|class details|class information|class info|class schedule|class timetable|class timing|class timings|my batch|which batch|what batch|batch name|batch details|batch information|subscription classes|class allocation|classes remaining|classes left|remaining classes|remaining sessions|sessions left|class credits|class progress|class progress report|when is my class|when are my classes|when is my next class|next class|my lesson(?:s)?|lesson schedule|coaching schedule|coaching time|my coaching|one on one class|one to one class|1 on 1 class|1 on 1 schedule|weekly classes|weekly timetable|class package|class plan|my subscription|subscription details|subscription status|weekly session|class slots|remaining slots|my class credits|my lesson plan|class count|number of classes|how many classes do i have|my weekly class|my class days|my coaching classes|my subscription classes|class subscription|class renewal)\b/;

const PAYMENT_RE = /\b(?:payment|payments|paid|pay|fee|fees|tuition|transaction|transactions|receipt|receipts|invoice|invoices|dues|due amount|outstanding|balance|owe|owing|installment|installments|fee status|fee details|payment details|payment record|payment records|money paid|amount paid|amount i paid|how much did i pay|how much have i paid|what have i paid|what did i pay|money i spent|how much did i spend|how much have i spent|my spending|bill|bills|proof of payment|fee receipt|fee receipts|fee statement|payment statement|payment summary|payment proof|amount paid by me|money i paid|paid amount|fees i paid|fees paid by me|how much was paid|how much is paid)\b/;

const ATTENDANCE_RE = /\b(?:attendance|attended|attend|present|absent|absence|absences|missed class|missed classes|miss any class|miss any classes|did i miss|did not attend|didnt attend|skipped class|skipped classes|class absence|class days|days attended|days present|days absent|attendance record|attendance records|attendance history|attendance percentage|attendance percent|presence|class participation|how many classes did i attend|how often did i attend|classes i attended|my presence|class attendance|attendance for|attendance this|attendance last|class absences|classes missed|my missed classes|missed lessons|lessons attended|days i attended|how many times was i present|was i present|was i absent)\b/;

const ASSIGNMENT_RE = /\b(?:assignment|assignments|homework|home work|task|tasks|coursework|classwork|submitted work|pending work|overdue work|work due|work to submit|submission|submissions|submitted|submission status|my tasks|my work|homework status|unfinished work|incomplete work|to do list|todo list|pending tasks|work pending|school work|my pending assignment|my completed assignment|my submitted assignment|assignments due|work due soon|work not submitted|homework due|homework submitted)\b/;

const CLASSROOM_PUZZLE_RE = /\b(?:live classroom puzzle|classroom puzzle|live puzzle attempts|puzzles? (?:did i|have i) solved|puzzle attempts|puzzle solving attempts|classroom tactics|live class puzzle activity)\b/;

const GAME_REPORT_RE = /\b(?:my games|show (?:me )?(?:my )?games|my game report|game report|gaming report|game history|my gaming history|all my games|my game summary|games have i played|how many games(?: have i played| did i play| did i win| did i lose| did i draw)?|all games played by me|my game stats|my match history|my matches|games record|game records|gaming activity|games i played|what games did i play|my playing history|my recent games|my wins|my losses|my draws|my win rate|my game results|my overall game record|my gaming record)\b/;

const PROGRESS_REPORT_RE = /\b(?:my progress|progress report|how am i doing|how am i performing|how is my progress|my performance|my performance report|my learning progress|my activity report|my overall progress|my growth|my training report|my learning report|my chess progress|report card|my stats|my overall performance|how well am i doing|my practice progress|my development report|my improvement report|my chess development)\b/;

const PUZZLE_REPORT_RE = /\b(?:my puzzle report|puzzle report|puzzle stats|puzzle performance|my puzzle activity|my tactics report|tactics stats|puzzle solving stats|my solving history|puzzles solved|how many puzzles solved|puzzle accuracy|tactics performance|my puzzle records|practice report|tactics training report|puzzles completed|puzzle completion|solving performance)\b/;

function legacyClassifyDataQuestion(question) {
  // Apply typo, contraction and informal-chat normalization before matching.
  const q = normalize(normalizeForUnderstanding(question));
  if (!q) return null;

  if (/\b(what can you show|what data can you access|what can you tell me about my account|what do you know about my progress|available data|what can you do for me|what all can you show|what information do you have|what can i ask you)\b/.test(q)) return ["capabilities"];
  if (FULL_REPORT_RE.test(q)) return ["student-report"];
  if (PROGRESS_REPORT_RE.test(q)) return ["progress-report"];

  // Specific game modes take priority over broad phrases such as "my games".
  const hasBotPhrase = /\b(bot|computer|engine|vs computer|vs bot|against ai|against the ai|artificial intelligence opponent|computer opponent|chess computer|stockfish|solo game|solo games|play against ai|with ai|with the ai|against computer|against the computer|versus ai|vs ai)\b/.test(q);
  const hasPvPPhrase = /\b(live match|multiplayer|pvp|player versus player|online match|online game|online games|opponent|versus player|vs player|friend match|games with friends|match history|match results|my match record|my pvp record|online chess matches|ranked games)\b/.test(q);
  if (GAME_REPORT_RE.test(q) && !hasBotPhrase && !hasPvPPhrase) return ["games-report"];
  if (PUZZLE_REPORT_RE.test(q)) return ["puzzle-report"];

  const intents = [];
  const add = intent => { if (!intents.includes(intent)) intents.push(intent); };

  const bot = hasBotPhrase;
  const pvp = hasPvPPhrase && (!bot || /\b(live|online|multiplayer|pvp|player versus player|friend)\b/.test(q));
  const leaderboard = /\b(leaderboard|rankings?|ranking list|current ranking|top players|top \d+|who is (?:the )?number one(?: player)?|who is number 1|who is #?1|my rank|my current rank|my ranking|my position|where do i rank|rank am i|standing|place on leaderboard|position in leaderboard|who leads|top of the table)\b/.test(q);
  const rating = /\b(elo|rating|rated|my score|current score|rating breakdown|rating points|skill rating|olympus score|olympus rating|strength rating|chess rating|skill level|my points|olympus points|tier|level|profile)\b/.test(q);
  const miniGames = /\b(mini ?games?|high ?scores?|best scores?|personal records?|game records?|my scores|arcade scores|practice game scores|best record)\b/.test(q) || /\b(best|highest|maximum|personal best)\b.*\b(score|record)\b/.test(q) || /\b(score|record)\b.*\b(pawn|knight|bishop|rook|queen|king|iq hunt|board recall|knight fog quest|chess math|puzzle rush|memory|coordinates)\b/.test(q);
  const xp = /\b(xp|experience points|experience|rating history|points earned|earned points|points collected|xp history|xp gained|level points|progress points)\b/.test(q);
  const puzzleBattle = /\b(puzzle battle|puzzle battles|battle record|battle stats|puzzle duel|puzzle duels|battle history|battles played)\b/.test(q);
  const announcements = /\b(announcement|announcements|academy notice|academy notices|broadcast message|any notice|latest update|academy news|academy updates|school notice|important notice|latest news from academy)\b/.test(q);

  if (leaderboard) add("leaderboard");
  if (rating && /\b(my|i|current|what|whats|show|tell|check|profile|rating|elo|score|rank|level|how|olympus|personal|skill)\b/.test(q)) add("profile-rating");
  if (bot && /\b(game|games|played|play|playing|win|wins|won|loss|losses|lost|draw|draws|history|record|records|difficulty|how many|count|statistics|stats|this month|last month|recent|latest|my|total|match|matches|result|results|winning|win rate|winning percentage)\b/.test(q)) add("vs-bot");
  if (pvp && /\b(game|games|played|play|playing|win|wins|won|loss|losses|lost|draw|draws|history|record|records|how many|count|statistics|stats|recent|latest|my|total|match|matches|result|results|winning|win rate|winning percentage)\b/.test(q)) add("live-match");
  if (miniGames) add("mini-games");
  if (xp) add("xp-history");
  if (ASSIGNMENT_RE.test(q)) add("assignments");
  if (ATTENDANCE_RE.test(q)) add("attendance");
  if (CLASSROOM_PUZZLE_RE.test(q)) add("live-puzzles");
  if (puzzleBattle) add("puzzle-battle");
  if (/\b(classroom|live class|online classroom|class practice)\b/.test(q) && /\b(activity|stats|records|history|attempts|puzzles?|performance|solved|score)\b/.test(q) && !CLASSROOM_PUZZLE_RE.test(q)) add("live-puzzles");
  if (PAYMENT_RE.test(q) || /\b(money|spent|spending)\b/.test(q) && /\b(my|i|paid|pay|fee|fees|tuition|account)\b/.test(q)) add("payments");
  if (announcements) add("announcements");

  // Everyday class, lesson, session and coaching language. Avoid treating
  // classroom puzzle activity as a request for the timetable.
  const classMention = /\b(class|classes|batch|batches|lesson|lessons|timetable|schedule|session|sessions|coaching)\b/.test(q);
  const attendanceFocused = ATTENDANCE_RE.test(q) || CLASSROOM_PUZZLE_RE.test(q);
  const classroomActivityOnly = /\b(classroom puzzle|live classroom|class practice)\b/.test(q);
  const explicitClassRequest = CLASS_REPORT_RE.test(q) || /\b(my class(?:es)?|my lesson(?:s)?|batch|batches|timetable|schedule|session|sessions|coaching|next class|classes left|classes remaining)\b/.test(q);
  const classMentionInCombinedRequest = classMention && intents.length > 0 && /\b(and|also|plus)\b/.test(q);
  if (!classroomActivityOnly && (explicitClassRequest || classMentionInCombinedRequest)) {
    add("class-report");
  } else if (/\b(schedule|timetable|batch|session|sessions|coaching)\b/.test(q) && !attendanceFocused) {
    add("schedule");
  }

  // General games wording versus a specifically named game mode.
  if (!bot && !pvp && !miniGames && /\b(my games|game stats|games played|gaming activity|my matches|gameplay history|how many did i play)\b/.test(q)) {
    add("games-report");
  }

  // Common loose requests for personal summaries.
  if (/\b(my account|my profile|my details|my records|my information|my overall details|my personal report)\b/.test(q) && intents.length === 0) {
    add("student-report");
  }

  return intents.length ? intents : null;
}

// ======================================================
// 🗣️ OLYMPUS AI 4.2.2 — VOCABULARY LAYER (classification only)
// The 4.2.1 classifier above is unchanged (renamed legacyClassifyDataQuestion).
// ai-data-vocabulary.js recognises more ways of asking for the SAME existing
// data. Query handlers, Supabase access and report expansion are untouched.
// ======================================================
function classifyDataQuestion(question) {
  const legacy = legacyClassifyDataQuestion(question);
  if (Array.isArray(legacy) && legacy.includes("capabilities")) return legacy;
  return resolveIntentsWithVocabulary({
    rawText: normalize(question),
    understoodText: normalize(normalizeForUnderstanding(question)),
    legacy
  });
}

const REPORT_EXPANSIONS = Object.freeze({
  "class-report": ["schedule", "attendance"],
  "progress-report": ["profile-rating", "xp-history", "mini-games", "live-puzzles", "attendance"],
  "games-report": ["vs-bot", "live-match", "mini-games", "puzzle-battle"],
  "puzzle-report": ["live-puzzles", "mini-games", "puzzle-battle"],
  "student-report": [
    "profile-rating", "schedule", "attendance", "payments", "assignments",
    "vs-bot", "live-match", "mini-games", "xp-history", "live-puzzles", "puzzle-battle"
  ]
});

const INTENT_LABELS = Object.freeze({
  "profile-rating": "Your Olympus rating & profile",
  leaderboard: "Olympus leaderboard",
  "vs-bot": "Your games against the computer",
  "live-match": "Your online multiplayer record",
  "mini-games": "Your mini-game records",
  "xp-history": "Your XP & progress history",
  assignments: "Your assignments & homework",
  attendance: "Your attendance history",
  schedule: "Your classes, batch & timetable",
  "live-puzzles": "Your classroom puzzle activity",
  "puzzle-battle": "Your Puzzle Battle results",
  payments: "Your fees & payment history",
  announcements: "Academy announcements"
});

async function runDataIntent(intent, question) {
  switch (intent) {
    case "profile-rating": return getMyRatingAnswer();
    case "leaderboard": return getLeaderboardAnswer(question);
    case "vs-bot": return getVsBotAnswer(question);
    case "live-match": return getLiveMatchAnswer(question);
    case "mini-games": return getMiniGameAnswer(question);
    case "xp-history": return getXPHistoryAnswer(question);
    case "assignments": return getAssignmentsAnswer(question);
    case "attendance": return getAttendanceAnswer(question);
    case "schedule": return getScheduleAnswer(question);
    case "live-puzzles": return getLivePuzzleAnswer(question);
    case "puzzle-battle": return getPuzzleBattleAnswer();
    case "payments": return getPaymentAnswer(question);
    case "announcements": return getAnnouncementAnswer();
    default: return null;
  }
}

function expandReportIntents(intents) {
  const expanded = [];
  for (const intent of intents) {
    const items = REPORT_EXPANSIONS[intent] || [intent];
    for (const item of items) if (!expanded.includes(item)) expanded.push(item);
  }
  return expanded;
}

async function answerMultiIntentQuestion(intents, question) {
  const results = await Promise.allSettled(
    intents.map(intent => runDataIntent(intent, question))
  );
  const sections = [];
  results.forEach((result, index) => {
    const intent = intents[index];
    const label = INTENT_LABELS[intent] || intent;
    if (result.status === "fulfilled" && result.value) {
      sections.push(`### ${label}\n\n${result.value}`);
    } else {
      const errorText = result.status === "rejected"
        ? niceError(result.reason, label.toLowerCase())
        : "No matching information was returned for this section.";
      sections.push(`### ${label}\n\n${errorText}`);
    }
  });

  return {
    type: "data",
    text: [
      "## Your Olympus information",
      "Here are the matching records I could retrieve for your signed-in account:",
      "",
      sections.join("\n\n---\n\n"),
      "",
      "*Only information visible to your signed-in account is included. If a section is unavailable, its access or source data may need to be checked.*"
    ].join("\n")
  };
}

export function getOlympusAIDataCapabilities() {
  return DATA_CAPABILITIES.map(item => ({ ...item, examples: [...item.examples] }));
}

// Exported for the lightweight route tests and diagnostics; it does not read data.
export function classifyOlympusDataQuestion(question) {
  return classifyDataQuestion(question);
}

export async function answerOlympusDataQuestion(question) {
  const detected = classifyDataQuestion(question);
  if (!detected) return null;

  if (detected.includes("capabilities")) {
    return {
      type: "data",
      text: [
        "## What I can show you",
        "I can retrieve the following records from your signed-in academy account, subject to your existing access permissions:",
        "",
        ...DATA_CAPABILITIES.map(item => `• **${item.label}**`),
        "",
        "You can ask naturally, for example: ‘show my fee details’, ‘what batch am I in?’, ‘give me my class report’, or ‘show all my records’."
      ].join("\n")
    };
  }

  const intents = expandReportIntents(detected);
  if (intents.length > 1) return answerMultiIntentQuestion(intents, question);

  try {
    const text = await runDataIntent(intents[0], question);
    return text ? { type: "data", text } : null;
  } catch (error) {
    console.error("Olympus AI data query failed:", error);
    return {
      type: "data-error",
      text: niceError(error, (INTENT_LABELS[intents[0]] || "that information").toLowerCase())
    };
  }
}
