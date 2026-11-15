/* =========================================================
   OLYMPUS AI — CONFIGURATION
   Local-only assistant. No API key or backend required.
   ========================================================= */

export const OLYMPUS_AI_IDENTITY = Object.freeze({
  name: "Olympus AI",
  academy: "The Olympus Chess Academy",
  tagline: "Your Friendly Chess Academy Companion",
  personality: "friendly, confident, encouraging and playful"
});

export const OLYMPUS_AI_CONFIG = Object.freeze({
  name: "Olympus AI",
  version: "4.2.1",
  launcherLabel: "Ask Olympus AI",
  welcomeMessage:
    "Hello! 👋 I’m Olympus AI, your academy companion. Ask naturally about your fees, payments, batch, classes, assignments, attendance, games, rating or progress. I’ll look for the relevant records available to your account. You can also choose a topic below to get started!",
  noMatchMessage:
    "I’m not quite sure what you need yet. 😊 Tell me what you’re trying to do, or choose one of the topics below and I’ll help you from there.",
  maxSuggestions: 4,
  minimumMatchScore: 3,

  // Short-term, in-memory conversation settings (never persisted).
  conversation: Object.freeze({
    sessionTimeoutMs: 20 * 60 * 1000,
    maxHistory: 12,
    maxRememberedFeatures: 8,
    maxRecentEntities: 6
  }),

  // Heuristic thresholds are decision bands, not calibrated probabilities.
  understanding: Object.freeze({
    maxClauses: 3,
    highConfidenceScore: 18,
    minimumConfidenceMargin: 5,
    semanticBonus: 7,
    contextualBonus: 5
  }),

  // Optional live chess-information provider.
  // Disabled by default: the assistant works fully offline.
  // Only used by processUserMessageAsync(); no API keys are needed
  // for the public Lichess endpoint, and none may ever be put here.
  playerProvider: Object.freeze({
    enabled: false,
    timeoutMs: 5000,
    cacheMs: 10 * 60 * 1000
  }),

  selectors: Object.freeze({
    navigationButton: ".nav-btn[data-tab]",
    sectionSuffix: "-section"
  }),

  // Aliases are search hints only. A destination is usable only when
  // its real navigation button AND matching section exist in MainUI.html.
  aliases: Object.freeze({
    assignments: ["homework", "tasks", "my tasks", "assigned work"],
    attempts: ["check homework", "submitted homework", "student submissions"],
    assignmentStatus: ["homework status", "submission status"],
    livePuzzle: ["live class", "classroom", "live classroom", "puzzle classroom"],
    classSchedule: ["schedule", "class timetable", "my timetable"],
    attendance: ["attendance manager", "attendance records"],
    myAttendance: ["my schedule", "my attendance", "my classes"],
    study: ["openings", "opening study", "analysis study", "chess studies"],
    editor: ["board editor", "fen editor", "position editor"],
    livematch: ["multiplayer", "play online", "standard multiplayer", "live match"],
    puzzlerush: ["puzzle rush", "rush", "tactics rush"],
    puzzlebattle: ["puzzle battle", "battle puzzles"],
    puzzletrainer: ["trainer", "puzzle trainer", "tactics trainer"],
    quiz: ["chess quiz", "quiz challenge", "chess questions"],
    computer: ["play computer", "play against computer", "computer game", "engine game"],
    board: ["analysis board", "chess board", "board analysis"],
    pairing: ["swiss pairing", "pair players"],
    scoreboard: ["live scoreboard", "scores"],
    gallery: ["gallery", "diagrams", "chess images"],
    students: ["admin", "admin console", "student management", "manage students"],
    chess3d: ["3d chess", "olympus chess ai", "three dimensional chess"],
    gamereview: ["game review", "review game", "analyse my game", "analyze my game"]
  })
});

export const OLYMPUS_AI_QUICK_PROMPTS = Object.freeze([
  "Show my assignments",
  "Open My Analysis Board",
  "Play Puzzle Rush"
]);