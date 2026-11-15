/* =====================================================================
   OLYMPUS AI 4.1.3 — READ-ONLY, AUTHENTICATED DATA TOOLS
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
  { id: "schedule", label: "My timetable and batch", examples: ["Show my class timetable", "Which batch am I in?"] },
  { id: "live-puzzles", label: "My classroom practice activity", examples: ["How many classroom puzzles did I solve?"] },
  { id: "puzzle-battle", label: "My Puzzle Battle results", examples: ["How many puzzle battles have I played?"] },
  { id: "payments", label: "My recorded fee payments", examples: ["Show my payment history", "How much have I paid?"] },
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
    const date = new Date(row.started_at);
    if (Number.isNaN(date.getTime())) return;
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
  if (!profile.username) return "I can’t match a class schedule to your profile yet. Please ask an academy administrator to check your account details.";

  if (/\bsubscription classes?\b/.test(normalize(question))) {
    const { data, error } = await supabase.from("student_subscriptions")
      .select("username, total_classes")
      .eq("username", profile.username);
    if (error) throw error;
    const totalClasses = data?.[0]?.total_classes;
    return totalClasses === undefined || totalClasses === null
      ? "Your subscription class allocation is not recorded in the available student subscription data."
      : `Your recorded subscription allocation is **${formatNumber(totalClasses)} class(es)**.`;
  }

  const [scheduleResult, batchResult] = await Promise.all([
    supabase.from("student_class_schedule")
      .select("username, weekday, class_time")
      .eq("username", profile.username)
      .order("weekday", { ascending: true })
      .order("class_time", { ascending: true }),
    supabase.from("student_batches")
      .select("username, batch_name")
      .eq("username", profile.username)
  ]);
  if (scheduleResult.error) throw scheduleResult.error;
  const schedule = scheduleResult.data || [];
  const batch = batchResult.error ? null : batchResult.data?.[0]?.batch_name;
  return [
    "**Your Olympus class details**",
    "",
    `• Username: **${escapeMarkdown(profile.username)}**`,
    `• Batch: **${escapeMarkdown(batch || "Not recorded")}**`,
    "",
   "**Class schedule (Indian Standard Time)**",
"",
...(schedule.length
  ? schedule.map(row =>
      `• ${formatScheduleWeekday(row.weekday)} • ${formatScheduleTime(row.class_time)}`
    )
  : ["No individual class schedule rows were found."])
  ].join("\n");
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

async function getPaymentAnswer() {
  const { supabase, user, profile } = await getIdentity();
  const { data, error } = await supabase
    .from("student_payments")
    .select("id, amount, payment_type, batch_name, payment_date, classes")
    .eq("student_id", user.id)
    .order("payment_date", { ascending: false });
  if (error) throw error;
  const rows = data || [];
  const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const totalClasses = rows.reduce((sum, row) => sum + Number(row.classes || 0), 0);
  if (!rows.length) return "No payment records are visible for your own student account. This does not necessarily mean no payment was made; the payment data may be maintained separately by the academy.";

  return [
    "**Your recorded payment history**",
    "",
    `• Recorded payments: **${formatNumber(rows.length)}**`,
    `• Total amount recorded: **₹${formatNumber(totalAmount)}**`,
    `• Total class units recorded in payment rows: **${formatNumber(totalClasses)}**`,
    "",
    "**Recent records**",
    ...rows.slice(0, 10).map((row, i) => `${i + 1}. ${formatDate(row.payment_date)} — ₹${formatNumber(row.amount)} (${escapeMarkdown(row.payment_type || "Payment")}${row.batch_name ? `, ${escapeMarkdown(row.batch_name)}` : ""})`),
    "",
    "These figures come only from payment rows linked to your authenticated student ID. Please confirm fee balances with the academy; this list does not calculate outstanding dues."
  ].join("\n");
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

function classifyDataQuestion(question) {
  const q = normalize(question);
  if (!q) return null;
  if (/\b(what can you show|what data can you access|what can you tell me about my account|what do you know about my progress|available data)\b/.test(q)) return "capabilities";

  const bot = /\b(bot|computer|engine|vs computer|vs bot|against ai|against the ai|artificial intelligence opponent)\b/.test(q);
  const pvp = /\b(live match|multiplayer|pvp|player versus player|online match|opponent)\b/.test(q);
  if (bot && /\b(game|games|played|play|win|wins|loss|losses|draw|history|record|difficulty|how many|count|statistics|stats|this month|last month|recent|latest)\b/.test(q)) return "vs-bot";
  if (pvp && /\b(game|games|played|win|wins|loss|losses|draw|history|record|how many|count|statistics|stats|recent|latest)\b/.test(q)) return "live-match";
  if (/\b(leaderboard|ranking list|current ranking|top players|top \d+|who is (?:the )?number one(?: player)?|who is number 1|who is #?1|my rank|my current rank|my ranking|my position|where do i rank|rank am i|standing)\b/.test(q)) return "leaderboard";
  if (/\b(elo|rating|rated|my score|current score|rating breakdown|rating points|tier|level)\b/.test(q) && /\b(my|i|current|whats|what is|show|tell|check|profile|rating|elo|score|rank)\b/.test(q)) return "profile-rating";
  if (
    /\b(mini ?games?|high ?scores?|best scores?|personal records?|game records?)\b/.test(q) ||
    /\b(best|highest)\b.*\bscore\b/.test(q) ||
    /\bscore\b.*\b(pawn|knight|bishop|rook|queen|king|iq hunt|board recall|knight fog quest|chess math|puzzle rush)\b/.test(q)
  ) return "mini-games";
  if (/\b(xp|experience points|rating history|points earned|earned points|rating events)\b/.test(q)) return "xp-history";
  if (/\b(assignment|assignments|homework|submitted work|pending work|overdue work)\b/.test(q)) return "assignments";
  if (/\b(attendance|attended|present days|class days|attendance record)\b/.test(q)) return "attendance";
  if (/\b(class schedule|class timetable|my timetable|batch am i|which batch|subscription classes)\b/.test(q)) return "schedule";
  if (/\b(live classroom puzzle|classroom puzzle|live puzzle attempts|puzzles did i solve|puzzle attempts)\b/.test(q)) return "live-puzzles";
  if (/\b(puzzle battle|puzzle battles|battle record|battle stats)\b/.test(q)) return "puzzle-battle";
  if (/\b(payment history|my payments|how much have i paid|payments i made|fee payment|fees paid)\b/.test(q)) return "payments";
  if (/\b(announcement|announcements|academy notice|academy notices|broadcast message|any notice)\b/.test(q)) return "announcements";
  return null;
}

export function getOlympusAIDataCapabilities() {
  return DATA_CAPABILITIES.map(item => ({ ...item, examples: [...item.examples] }));
}

export async function answerOlympusDataQuestion(question) {
  const intent = classifyDataQuestion(question);
  if (!intent) return null;

  if (intent === "capabilities") {
    return {
      type: "data",
      text: [
        "I can currently show you the following information from your academy account, depending on your access:",
        "",
        ...DATA_CAPABILITIES.map((item, i) => `${i + 1}. **${item.label}**`),
        "",
        "Try asking: ‘What's my ELO?’, ‘Show the top 10 players’, or ‘How many games did I play against the bot this month?’"
      ].join("\n")
    };
  }

  try {
    let text;
    switch (intent) {
      case "profile-rating": text = await getMyRatingAnswer(); break;
      case "leaderboard": text = await getLeaderboardAnswer(question); break;
      case "vs-bot": text = await getVsBotAnswer(question); break;
      case "live-match": text = await getLiveMatchAnswer(question); break;
      case "mini-games": text = await getMiniGameAnswer(question); break;
      case "xp-history": text = await getXPHistoryAnswer(question); break;
      case "assignments": text = await getAssignmentsAnswer(question); break;
      case "attendance": text = await getAttendanceAnswer(question); break;
      case "schedule": text = await getScheduleAnswer(question); break;
      case "live-puzzles": text = await getLivePuzzleAnswer(question); break;
      case "puzzle-battle": text = await getPuzzleBattleAnswer(); break;
      case "payments": text = await getPaymentAnswer(); break;
      case "announcements": text = await getAnnouncementAnswer(); break;
      default: return null;
    }
    return { type: "data", text };
  } catch (error) {
    console.error("Olympus AI data query failed:", error);
    const labels = {
      "profile-rating": "your profile and rating",
      leaderboard: "the rating leaderboard",
      "vs-bot": "your VS Computer history",
      "live-match": "your live multiplayer archive",
      "mini-games": "your mini-game scores",
      "xp-history": "your XP history",
      assignments: "your assignments and submissions",
      attendance: "your classroom attendance records",
      schedule: "your class schedule",
      "live-puzzles": "your live classroom puzzle records",
      "puzzle-battle": "your Puzzle Battle records",
      payments: "your payment history",
      announcements: "the current academy announcements"
    };
    return { type: "data-error", text: niceError(error, labels[intent] || "that data") };
  }
}
