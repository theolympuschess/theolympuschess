/* =====================================================================
   OLYMPUS AI 4.2.0 — STUDENT-FRIENDLY COMMAND LIBRARY
   ---------------------------------------------------------------------
   Commands are written as things students and coaches want to do or know.
   Internal DOM names, technical control labels and duplicate synonyms are
   intentionally not exposed in the chat command pills.
   Each pill uses the normal Olympus AI message pipeline.
   ===================================================================== */

export const OLYMPUS_AI_COMMAND_GROUPS = Object.freeze([
  {
    id: "account-rating",
    title: "My Rating & Profile",
    icon: "👤",
    description: "Check your Olympus Rating, rating breakdown and level.",
   openByDefault: false,
    commands: [
      { id: "current-elo", label: "My Olympus Rating", prompt: "What's my current Olympus rating?" },
      { id: "rating-breakdown", label: "My Rating Breakdown", prompt: "Show my rating breakdown." },
      { id: "current-level", label: "My Current Level", prompt: "Show my current level." },
      { id: "full-student-report", label: "My Full Student Report", prompt: "Show my full student report with all the information available to my account." }
    ]
  },
  {
    id: "leaderboard",
    title: "Rankings & Leaderboard",
    icon: "🏆",
    description: "See the leading players and check your position.",
    commands: [
      { id: "ranking-list", label: "Full Leaderboard", prompt: "Show the full current Olympus leaderboard." },
      { id: "top-10", label: "Top 10 Players", prompt: "Show the top 10 players." },
      { id: "top-20", label: "Top 20 Players", prompt: "Show the top 20 players." },
      { id: "my-rank", label: "My Position", prompt: "What's my current rank on the leaderboard?" },
      { id: "number-one", label: "Top-Ranked Player", prompt: "Who is the number one player?" }
    ]
  },
  {
    id: "vs-computer",
    title: "Play Against the Computer",
    icon: "🤖",
    description: "Review your computer games, results and favourite difficulty.",
    commands: [
      { id: "bot-month", label: "My Games This Month", prompt: "How many games have I played against the computer this month?" },
      { id: "bot-month-results", label: "My Wins, Losses & Draws", prompt: "Show my wins, losses and draws against the computer this month." },
      { id: "bot-all-time", label: "My Total Computer Games", prompt: "Show my total games against the computer all time." },
      { id: "bot-recent", label: "My 10 Recent Games", prompt: "Show my 10 most recent games against the computer." },
      { id: "bot-difficulty", label: "My Favourite Difficulty", prompt: "Which computer difficulty do I play most often?" }
    ]
  },
  {
    id: "mini-game-scores",
    title: "My Game Records",
    icon: "🎮",
    description: "See your best scores across the academy's mini-games.",
    commands: [
      { id: "all-mini-scores", label: "All My Best Scores", prompt: "Show all my mini-game high scores." },
      { id: "pawn-practice", label: "My Pawn Practice Best", prompt: "What's my best Pawn Practice score?" },
      { id: "knight-practice", label: "My Knight Practice Best", prompt: "What's my best Knight Practice score?" },
      { id: "bishop-practice", label: "My Bishop Practice Best", prompt: "What's my best Bishop Practice score?" },
      { id: "rook-practice", label: "My Rook Practice Best", prompt: "What's my best Rook Practice score?" },
      { id: "iq-hunt", label: "My IQ Hunt Best", prompt: "What's my best IQ Hunt score?" },
      { id: "board-recall", label: "My Board Recall Best", prompt: "What's my best Board Recall score?" },
      { id: "knight-fog", label: "My Knight Fog Quest Best", prompt: "What's my best Knight Fog Quest score?" },
      { id: "chess-math", label: "My Chess Math Best", prompt: "What's my best Chess Math score?" },
      { id: "puzzle-rush", label: "My Puzzle Rush Best", prompt: "What's my best Puzzle Rush score?" },
      { id: "queen-practice", label: "My Queen Practice Best", prompt: "What's my best Queen Practice score?" },
      { id: "king-practice", label: "My King Practice Best", prompt: "What's my best King Practice score?" },
      { id: "lab-hunt", label: "My Lab Hunt Best", prompt: "What's my best Lab Hunt score?" },
      { id: "iq-trainer", label: "My IQ Trainer Best", prompt: "What's my best IQ Trainer score?" },
      { id: "defend-the-king", label: "My Defend The King Best", prompt: "What's my best Defend The King score?" },
      { id: "knight-path", label: "My Knight Path Best", prompt: "What's my best Knight Path score?" },
      { id: "knight-vs-monster", label: "My Knight vs Monster Best", prompt: "What's my best Knight vs Monster score?" },
      { id: "escape", label: "My Escape Best", prompt: "What's my best Escape score?" },
      { id: "speed-run", label: "My Speed Run Best", prompt: "What's my best Speed Run score?" },
      { id: "lava-knight", label: "My Lava Knight Best", prompt: "What's my best Lava Knight score?" },
      { id: "knight-gps", label: "My Knight GPS Best", prompt: "What's my best Knight GPS score?" },
      { id: "rainbow-mania", label: "My Rainbow Mania Best", prompt: "What's my best Rainbow Mania score?" },
      { id: "find-the-queen", label: "My Find The Queen Best", prompt: "What's my best Find The Queen score?" },
      { id: "reach-home", label: "My Reach Home Best", prompt: "What's my best Reach Home score?" },
      { id: "quiz", label: "My Quiz Best", prompt: "What's my best Quiz score?" },
      { id: "board-coordinates", label: "My Board Coordinates Best", prompt: "What's my best Board Coordinates score?" },
      { id: "puzzle-battle-score", label: "My Puzzle Battle Best", prompt: "What's my best Puzzle Battle high score?" }
    ]
  },
  {
    id: "xp-progress",
    title: "My XP & Progress",
    icon: "📈",
    description: "Follow the experience points and progress you've earned.",
    commands: [
      { id: "xp-month", label: "XP I Earned This Month", prompt: "How much XP did I earn this month?" },
      { id: "xp-all-time", label: "My Total XP", prompt: "How much XP have I earned all time?" },
      { id: "xp-history", label: "My Recent XP Activity", prompt: "Show my recent XP history." }
    ]
  },
  {
    id: "assignments",
    title: "My Assignments & Homework",
    icon: "📝",
    description: "Check your work, submissions and due dates.",
    commands: [
      { id: "pending-assignments", label: "My Pending Assignments", prompt: "How many assignments are pending for me?" },
      { id: "submitted-homework", label: "My Submitted Homework", prompt: "Show my submitted homework." },
      { id: "overdue-assignments", label: "My Overdue Assignments", prompt: "Show my overdue assignments." },
      { id: "active-assignments", label: "All My Active Assignments", prompt: "Show all my active assignments." }
    ]
  },
  {
    id: "attendance-classroom",
    title: "My Attendance & Practice",
    icon: "🏫",
    description: "Review your class attendance and classroom puzzle activity.",
    commands: [
      { id: "attendance-month", label: "My Classes This Month", prompt: "How many class days did I attend this month?" },
      { id: "attendance-dates", label: "My Attendance History", prompt: "Show my recorded classroom attendance dates." },
      { id: "classroom-puzzles-month", label: "My Puzzles This Month", prompt: "How many classroom puzzles did I solve this month?" },
      { id: "classroom-puzzles-all", label: "My Classroom Practice History", prompt: "Show my live classroom puzzle activity all time." }
    ]
  },
  {
    id: "schedule-batch",
    title: "My Classes & Batch",
    icon: "🗓️",
    description: "See your timetable, batch and remaining class allocation.",
    commands: [
      { id: "class-timetable", label: "My Timetable & Batch", prompt: "Show my class timetable and batch." },
      { id: "class-report", label: "My Complete Class Report", prompt: "Give me my complete class report with batch, schedule, attendance and remaining classes." },
      { id: "subscription-classes", label: "My Remaining Classes", prompt: "How many subscription classes do I have remaining?" }
    ]
  },
  {
    id: "matches-battles",
    title: "My Online Games & Battles",
    icon: "⚔️",
    description: "Review your multiplayer games and Puzzle Battle results.",
    commands: [
      { id: "live-match-record", label: "My Multiplayer Record", prompt: "Show my live multiplayer match record." },
      { id: "live-match-recent", label: "My 10 Recent Online Games", prompt: "Show my 10 most recent live multiplayer games." },
      { id: "puzzle-battle-record", label: "My Puzzle Battle Results", prompt: "Show my Puzzle Battle record and performance." }
    ]
  },
  {
    id: "payments-notices",
    title: "My Fees & Academy Updates",
    icon: "📣",
    description: "Check your recorded payments and the latest academy news.",
    commands: [
      { id: "payment-history", label: "My Payment History", prompt: "Show my payment history and total paid." },
      { id: "fee-report", label: "My Fee Report", prompt: "Show my complete fee and payment report." },
      { id: "academy-announcement", label: "Latest Academy Update", prompt: "Show the latest academy announcement." }
    ]
  },
  {
    id: "app-explore",
    title: "Explore My App",
    icon: "🔎",
    description: "Explore your academy, assignments, attendance and rankings.",
    commands: [
      { id: "app-sections", label: "Explore App Sections", prompt: "Show me all the available sections in my app." },
      { id: "show-attendance", label: "Show My Attendance", prompt: "Show me my attendance history." },
      { id: "show-assignments", label: "Show My Assignments", prompt: "Show me all my assignments and their status." },
      { id: "show-leaderboard", label: "Show Leaderboard", prompt: "Show me the current Olympus leaderboard." },
      { id: "show-puzzle-battle", label: "My Puzzle Battle Stats", prompt: "Show me my Puzzle Battle statistics and performance." }
    ]
  },
  {
    id: "data-capabilities",
    title: "What Can You Help Me With?",
    icon: "✨",
    description: "See the information Olympus AI can show from your account.",
    commands: [
      { id: "account-capabilities", label: "Show What You Can Do", prompt: "What can you show me about my account and progress?" }
    ]
  }
]);

// Guard against accidental duplicate command IDs or equivalent prompts.
const commandIds = new Set();
const commandPrompts = new Set();
for (const group of OLYMPUS_AI_COMMAND_GROUPS) {
  for (const command of group.commands) {
    if (commandIds.has(command.id)) throw new Error(`Duplicate Olympus AI command id: ${command.id}`);
    const canonical = command.prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (commandPrompts.has(canonical)) throw new Error(`Duplicate Olympus AI command prompt: ${command.prompt}`);
    commandIds.add(command.id);
    commandPrompts.add(canonical);
  }
}

export const OLYMPUS_AI_COMMAND_COUNT = commandIds.size;
