/* =========================================================
   OLYMPUS AI — CHESS PLAYER INFORMATION
   1. Verified static knowledge (works offline, historical facts).
   2. Optional live provider adapter (Lichess public API),
      disabled by default, used only via processUserMessageAsync.

   Never invents ratings, titles or tournament results.
   ========================================================= */

import { OLYMPUS_AI_CONFIG } from "./ai-config.js";
import { normalizeChat, wordCount, getContext } from "./ai-context.js";

/* ---------- static, historical facts ---------- */

const PLAYERS = [
  {
    id: "carlsen", name: "Magnus Carlsen", flag: "🇳🇴", country: "Norway",
    aliases: ["magnus carlsen", "carlsen", "magnus"],
    summary: "a Norwegian grandmaster born in 1990. He became a grandmaster at 13 and was World Champion from 2013 until 2023, when he chose not to defend his title. His peak classical rating of 2882 in 2014 is the highest in history.",
    more: "He is also known for his strength in rapid and blitz chess and for his practical, endgame-focused style.",
    peakNote: "His peak classical rating (a historical record) was 2882 in 2014.",
    lichess: "DrNykterstein"
  },
  {
    id: "nakamura", name: "Hikaru Nakamura", flag: "🇺🇸", country: "the United States",
    aliases: ["hikaru nakamura", "nakamura", "hikaru"],
    summary: "an American grandmaster born in 1987 in Hirakata, Japan. He became a grandmaster in 2003, has won the US Championship several times, and is one of the strongest speed-chess players and best-known chess streamers.",
    more: "His online speed-chess and streaming have helped introduce many new fans to chess."
  },
  {
    id: "anand", name: "Viswanathan Anand", flag: "🇮🇳", country: "India",
    aliases: ["viswanathan anand", "vishy anand", "anand", "vishy", "viswanathan"],
    summary: "an Indian grandmaster born in 1969 in Chennai. He became India's first grandmaster in 1988 and is a five-time World Champion, winning the title in 2000 and again from 2007 to 2013.",
    more: "He is nicknamed the 'Lightning Kid' for his fast play and is widely credited with inspiring a generation of Indian players."
  },
  {
    id: "kasparov", name: "Garry Kasparov", flag: "", country: null,
    countryText: "Garry Kasparov was born in Baku and played for the Soviet Union and later Russia. He later became a citizen of Croatia.",
    aliases: ["garry kasparov", "kasparov", "garry"],
    summary: "the 13th World Champion, who held the title from 1985 to 2000. Born in Baku in 1963, he retired from professional chess in 2005. In 1997 he lost a famous match to IBM's Deep Blue computer.",
    more: "Many consider him one of the greatest players ever. After retiring he became a writer and a political activist."
  },
  {
    id: "gukesh", name: "Gukesh Dommaraju", flag: "🇮🇳", country: "India",
    aliases: ["gukesh dommaraju", "gukesh", "gukesh d"],
    summary: "an Indian grandmaster born in 2006. In December 2024, at age 18, he became the youngest undisputed World Chess Champion by beating Ding Liren.",
    more: "He became a grandmaster at 12 years old and is one of the leading players of the new generation."
  },
  {
    id: "fischer", name: "Bobby Fischer", flag: "🇺🇸", country: "the United States",
    aliases: ["bobby fischer", "fischer", "bobby"],
    summary: "an American champion (1943 to 2008) who became the 11th World Champion in 1972 by beating Boris Spassky in the famous Reykjavik match.",
    more: "His 1972 victory ended a long period of Soviet dominance of the title and brought huge attention to chess."
  },
  {
    id: "karpov", name: "Anatoly Karpov", flag: "🇷🇺", country: "Russia (earlier the Soviet Union)",
    aliases: ["anatoly karpov", "karpov"],
    summary: "the 12th World Champion, who held the title from 1975 to 1985. He is famous for his smooth positional style and won a very large number of tournaments.",
    more: "His long rivalry with Garry Kasparov produced some of the most famous matches in chess history."
  },
  {
    id: "caruana", name: "Fabiano Caruana", flag: "🇺🇸", country: "the United States",
    aliases: ["fabiano caruana", "caruana", "fabiano"],
    summary: "an American grandmaster born in Miami in 1992. He challenged Magnus Carlsen in the 2018 World Championship match, which ended in twelve draws before Carlsen won the rapid tiebreak.",
    more: "He earlier represented Italy before returning to represent the United States."
  },
  {
    id: "firouzja", name: "Alireza Firouzja", flag: "🇫🇷", country: "France",
    aliases: ["alireza firouzja", "firouzja", "alireza"],
    summary: "a grandmaster born in Iran in 2003 who now represents France. He rose to the world's top players as a teenager.",
    more: "He's known for aggressive, creative play and for his strength in blitz and bullet."
  },
  {
    id: "ding", name: "Ding Liren", flag: "🇨🇳", country: "China",
    aliases: ["ding liren", "ding"],
    summary: "a Chinese grandmaster who became the 17th World Champion in 2023 by beating Ian Nepomniachtchi. He held the title until December 2024.",
    more: "He was the first Chinese player to become the men's World Chess Champion."
  },
  {
    id: "pragg", name: "Praggnanandhaa", flag: "🇮🇳", country: "India",
    aliases: ["praggnanandhaa", "pragg", "pragga", "rameshbabu praggnanandhaa"],
    summary: "an Indian grandmaster born in 2005 who became a grandmaster at the age of 12. He reached the final of the 2023 Chess World Cup.",
    more: "He and his sister Vaishali are both grandmasters."
  },
  {
    id: "polgar", name: "Judit Polgár", flag: "🇭🇺", country: "Hungary",
    aliases: ["judit polgar", "polgar", "judit"],
    summary: "a Hungarian grandmaster widely considered the strongest female player in history. She became a grandmaster at 15 in 1991 and beat several world champions.",
    more: "She played in the open (men's) events against the world's best and reached the world's top ten."
  },
  {
    id: "capablanca", name: "José Raúl Capablanca", flag: "🇨🇺", country: "Cuba",
    aliases: ["jose raul capablanca", "capablanca"],
    summary: "a Cuban chess genius who was World Champion from 1921 to 1927. He was famous for his natural, simple style and for rarely losing games.",
    more: "He was a child prodigy who learned chess at about four years old."
  }
];

const ALIAS_INDEX = PLAYERS
  .flatMap(player => player.aliases.map(alias => ({ alias: normalizeChat(alias), player })))
  .sort((a, b) => b.alias.length - a.alias.length);

function findPlayer(text) {
  for (const { alias, player } of ALIAS_INDEX) {
    if (new RegExp(`(?:^|\\s)${alias}s?(?=\\s|$)`).test(text)) return player;
  }
  return null;
}

/* ---------- answers ---------- */

const LEAD = /\b(?:who is|who was|whos|tell me about|about|info on|information on|profile of|what do you know about)\b/;

function askType(text) {
  if (/\b(?:country|nationality|represent|represents|federation|flag)\b|\bwhere (?:is|was) .* from\b|\bfrom which country\b/.test(text)) {
    return "country";
  }
  if (/\b(?:rating|elo|fide|rated)\b/.test(text)) return "rating";
  return "profile";
}

function buildAnswer(player, type) {

  if (type === "country") {
    const text = player.countryText
      || `${player.country}! ${player.flag} ${player.name} represents ${player.country}.`;
    return { text, more: player.more, playerId: player.id, askType: "country" };
  }

  if (type === "rating") {
    const note = player.peakNote ? ` ${player.peakNote}` : "";
    return {
      text: `Ratings change every month, and I don't have a verified live rating for ${player.name} offline, so I won't guess a number.${note} Official FIDE ratings are published at ratings.fide.com.`,
      more: player.more,
      playerId: player.id,
      askType: "rating",
      live: player.lichess ? { playerId: player.id } : null
    };
  }

  const flag = player.flag ? `${player.flag} ` : "";
  return {
    text: `${flag}${player.name} is ${player.summary}`,
    more: player.more,
    playerId: player.id,
    askType: "profile",
    suggestQuery: "chess legends"
  };
}

export function answerPlayerQuestion(message) {

  const text = normalizeChat(message);
  const ctx = getContext();

  /* Current world champion ---------------------------------- */
  if (/\b(?:current|reigning|present|latest|new)\b.*\bworld (?:chess )?champion\b|\bwho (?:is|are) the (?:current )?world (?:chess )?champion\b|\bworld champion (?:now|today)\b/.test(text)) {
    return {
      text: "🏆 As far as my built-in knowledge goes, Gukesh Dommaraju of India won the World Championship in December 2024 and was the reigning champion then. Titles can change with each championship match, so I can't verify who holds it today. Please check FIDE's official site (fide.com) for the latest.",
      more: "I can tell you more about past champions like Kasparov, Anand, Carlsen or Fischer if you'd like!",
      playerId: "gukesh",
      askType: "profile",
      suggestQuery: "chess news"
    };
  }

  /* Youngest grandmaster ------------------------------------ */
  if (/\byoungest (?:grandmaster|gm)\b/.test(text)) {
    return {
      text: "As far as I know, the youngest grandmaster is Abhimanyu Mishra of the USA, who earned the title in 2021 at 12 years, 4 months and 25 days. Records can be broken, so it's worth verifying if you need it for a project. 🌟",
      more: null,
      askType: "profile"
    };
  }

  /* Latest tournament results ------------------------------- */
  if (/\b(?:latest|recent|last|current)\b.*\b(?:tournament|winner|champion|results?)\b|\bwho won the (?:latest|last|recent)\b/.test(text) && /\bchess|tournament|grandmaster|candidates|olympiad\b/.test(text)) {
    return {
      text: "I can't verify the latest tournament results offline, and I won't guess. 😊 For fresh results, try the chess news and live sections of the dashboard, or an official source like fide.com.",
      more: null,
      askType: "profile",
      suggestQuery: "chess news tournament"
    };
  }

  /* Follow-ups: "which country?" / "what about Anand?" ------- */
  const explicit = findPlayer(text);

  if (!explicit && ctx.entities.player) {
    const remembered = PLAYERS.find(p => p.id === ctx.entities.player);

    if (remembered) {
      if (/^(?:(?:which|what) (?:country|nationality)(?: (?:is|does) (?:he|she|that player|they))?(?: represent)?|where is (?:he|she|they) from)$/.test(text)) {
        return buildAnswer(remembered, "country");
      }

      if (/\b(?:rating|elo|fide|peak rating|classical rating)\b/.test(text) && /\b(?:his|her|their|that player|what about)\b/.test(text)) {
        return buildAnswer(remembered, "rating");
      }

      if (/^(?:how old is (?:he|she|they)|what is his age|what is her age|how old are they)$/.test(text)) {
        const yearMatch = remembered.summary.match(/\bborn in (\d{4})\b/i);
        if (yearMatch) {
          const birthYear = Number(yearMatch[1]);
          const currentYear = new Date().getFullYear();
          const ageLow = Math.max(0, currentYear - birthYear - 1);
          const ageHigh = Math.max(0, currentYear - birthYear);
          return {
            text: `${remembered.name} was born in ${birthYear}. In ${currentYear}, that makes their age ${ageLow === ageHigh ? `${ageHigh}` : `${ageLow} or ${ageHigh}`}, depending on whether their birthday has passed.`,
            more: remembered.more,
            playerId: remembered.id,
            askType: "profile"
          };
        }
      }

      if (/^(?:when did (?:he|she|they) become (?:world champion|a grandmaster)|when did (?:he|she|they) win (?:the )?(?:world championship|world title))$/.test(text)) {
        const summary = remembered.summary;
        if (/world champion|world championship/i.test(summary)) {
          return {
            text: `${remembered.name}: ${summary}`,
            more: remembered.more,
            playerId: remembered.id,
            askType: "profile"
          };
        }
      }

      if (/^(?:what about (?:him|her|them)|tell me more about (?:him|her|them))$/.test(text)) {
        return buildAnswer(remembered, "profile");
      }
    }
  }

  const aboutMatch = text.match(/^(?:what|how) about (.+)$/);
  if (aboutMatch && ctx.lastAsk) {
    const other = findPlayer(aboutMatch[1]);
    if (other) {
      const type = ["country", "rating", "profile"].includes(ctx.lastAsk) ? ctx.lastAsk : "profile";
      return buildAnswer(other, type);
    }
  }

  if (!explicit) return null;

  /* A named player ------------------------------------------ */
  const type = askType(text);

  if (type === "profile" && !LEAD.test(text) && wordCount(text) > 3) return null;

  return buildAnswer(explicit, type);
}

/* ---------- optional live provider (adapter + cache) ---------- */

const liveCache = new Map();

const lichessProvider = Object.freeze({
  id: "lichess",
  label: "Lichess public API",
  async fetchRatings(username, signal) {
    const response = await fetch(
      `https://lichess.org/api/user/${encodeURIComponent(username)}`,
      { signal, headers: { Accept: "application/json" } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const perfs = data && typeof data === "object" ? data.perfs || {} : {};

    const rating = key => {
      const value = perfs[key]?.rating;
      return Number.isFinite(value) ? value : null;
    };

    return {
      bullet: rating("bullet"),
      blitz: rating("blitz"),
      rapid: rating("rapid"),
      classical: rating("classical")
    };
  }
});

export async function fetchLiveRatings(playerId) {

  const config = OLYMPUS_AI_CONFIG.playerProvider;
  if (!config.enabled) return null;

  const player = PLAYERS.find(p => p.id === playerId);
  if (!player || !player.lichess) return null;

  const cached = liveCache.get(playerId);
  if (cached && Date.now() - cached.at < config.cacheMs) return cached.value;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const ratings = await lichessProvider.fetchRatings(player.lichess, controller.signal);
    if (!ratings) return null;

    const value = {
      source: lichessProvider.label,
      username: player.lichess,
      playerName: player.name,
      retrievedAt: new Date(),
      ratings
    };

    liveCache.set(playerId, { at: Date.now(), value });
    return value;

  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function formatLiveRatings(live) {
  const labels = [["classical", "Classical"], ["rapid", "Rapid"], ["blitz", "Blitz"], ["bullet", "Bullet"]];

  const parts = labels
    .filter(([key]) => live.ratings[key] !== null)
    .map(([key, label]) => `${label} ${live.ratings[key]}`);

  if (!parts.length) {
    return `I reached ${live.source}, but it had no ratings to show.`;
  }

  const time = live.retrievedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return `Live online ratings for ${live.playerName} (${live.source}, account "${live.username}", retrieved ${time}): ${parts.join(", ")}. These are online ratings, not official FIDE ratings.`;
}