/* =========================================================
   OLYMPUS AI — INTERNATIONAL TIME
   Uses the browser's Intl API and IANA time zones.
   Daylight saving is handled automatically; offsets are
   never hardcoded.
   ========================================================= */

import { normalizeChat } from "./ai-context.js";

const US_CITIES = ["New York", "Chicago", "Denver", "Los Angeles"];

/* kind: "city" | "country"; ambiguous places have no tz. */
const PLACES = [
  { keys: ["london", "uk", "united kingdom", "england", "britain", "great britain"], tz: "Europe/London", name: "London", country: "United Kingdom" },
  { keys: ["paris", "france"], tz: "Europe/Paris", name: "Paris", country: "France" },
  { keys: ["berlin", "germany"], tz: "Europe/Berlin", name: "Berlin", country: "Germany" },
  { keys: ["madrid", "spain"], tz: "Europe/Madrid", name: "Madrid", country: "Spain" },
  { keys: ["rome", "italy"], tz: "Europe/Rome", name: "Rome", country: "Italy" },
  { keys: ["amsterdam", "netherlands", "holland"], tz: "Europe/Amsterdam", name: "Amsterdam", country: "Netherlands" },
  { keys: ["zurich", "switzerland"], tz: "Europe/Zurich", name: "Zurich", country: "Switzerland" },
  { keys: ["oslo", "norway"], tz: "Europe/Oslo", name: "Oslo", country: "Norway" },
  { keys: ["stockholm", "sweden"], tz: "Europe/Stockholm", name: "Stockholm", country: "Sweden" },
  { keys: ["moscow"], tz: "Europe/Moscow", name: "Moscow", country: "Russia" },
  { keys: ["istanbul", "turkey"], tz: "Europe/Istanbul", name: "Istanbul", country: "Turkey" },
  { keys: ["dubai", "uae", "united arab emirates", "abu dhabi"], tz: "Asia/Dubai", name: "Dubai", country: "United Arab Emirates" },
  { keys: ["cairo", "egypt"], tz: "Africa/Cairo", name: "Cairo", country: "Egypt" },
  { keys: ["johannesburg", "south africa", "cape town"], tz: "Africa/Johannesburg", name: "Johannesburg", country: "South Africa" },
  { keys: ["lagos", "nigeria"], tz: "Africa/Lagos", name: "Lagos", country: "Nigeria" },
  { keys: ["nairobi", "kenya"], tz: "Africa/Nairobi", name: "Nairobi", country: "Kenya" },
  { keys: ["india", "delhi", "new delhi", "mumbai", "kolkata", "calcutta", "chennai", "bangalore", "bengaluru", "hyderabad"], tz: "Asia/Kolkata", name: "India", country: "India" },
  { keys: ["karachi", "pakistan", "islamabad"], tz: "Asia/Karachi", name: "Pakistan", country: "Pakistan" },
  { keys: ["dhaka", "bangladesh"], tz: "Asia/Dhaka", name: "Dhaka", country: "Bangladesh" },
  { keys: ["kathmandu", "nepal"], tz: "Asia/Kathmandu", name: "Kathmandu", country: "Nepal" },
  { keys: ["bangkok", "thailand"], tz: "Asia/Bangkok", name: "Bangkok", country: "Thailand" },
  { keys: ["singapore"], tz: "Asia/Singapore", name: "Singapore", country: "Singapore" },
  { keys: ["jakarta"], tz: "Asia/Jakarta", name: "Jakarta", country: "Indonesia" },
  { keys: ["beijing", "shanghai", "china"], tz: "Asia/Shanghai", name: "China", country: "China" },
  { keys: ["hong kong"], tz: "Asia/Hong_Kong", name: "Hong Kong", country: "China (Hong Kong)" },
  { keys: ["tokyo", "japan"], tz: "Asia/Tokyo", name: "Tokyo", country: "Japan" },
  { keys: ["seoul", "south korea", "korea"], tz: "Asia/Seoul", name: "Seoul", country: "South Korea" },
  { keys: ["sydney"], tz: "Australia/Sydney", name: "Sydney", country: "Australia" },
  { keys: ["melbourne"], tz: "Australia/Melbourne", name: "Melbourne", country: "Australia" },
  { keys: ["auckland", "new zealand"], tz: "Pacific/Auckland", name: "Auckland", country: "New Zealand" },
  { keys: ["honolulu", "hawaii"], tz: "Pacific/Honolulu", name: "Honolulu", country: "United States" },
  { keys: ["new york", "nyc", "boston", "washington dc"], tz: "America/New_York", name: "New York", country: "United States" },
  { keys: ["chicago"], tz: "America/Chicago", name: "Chicago", country: "United States" },
  { keys: ["denver"], tz: "America/Denver", name: "Denver", country: "United States" },
  { keys: ["los angeles", "san francisco", "seattle"], tz: "America/Los_Angeles", name: "Los Angeles", country: "United States" },
  { keys: ["toronto"], tz: "America/Toronto", name: "Toronto", country: "Canada" },
  { keys: ["vancouver"], tz: "America/Vancouver", name: "Vancouver", country: "Canada" },
  { keys: ["mexico city", "mexico"], tz: "America/Mexico_City", name: "Mexico City", country: "Mexico" },
  { keys: ["sao paulo"], tz: "America/Sao_Paulo", name: "Sao Paulo", country: "Brazil" },
  { keys: ["buenos aires", "argentina"], tz: "America/Argentina/Buenos_Aires", name: "Buenos Aires", country: "Argentina" },

  /* Countries with several time zones: ask for a city. */
  { keys: ["usa", "united states", "america", "us time"], ambiguous: US_CITIES, name: "the USA" },
  { keys: ["canada"], ambiguous: ["Toronto", "Vancouver"], name: "Canada" },
  { keys: ["australia"], ambiguous: ["Sydney", "Melbourne"], name: "Australia" },
  { keys: ["russia"], ambiguous: ["Moscow"], name: "Russia" },
  { keys: ["brazil"], ambiguous: ["Sao Paulo"], name: "Brazil" }
];

const INDEX = PLACES
  .flatMap(place => place.keys.map(key => ({ key, place })))
  .sort((a, b) => b.key.length - a.key.length);

const COUNTRY_KEYS = new Set([
  "uk", "united kingdom", "england", "britain", "great britain", "france", "germany", "spain", "italy",
  "netherlands", "holland", "switzerland", "norway", "sweden", "turkey", "uae", "united arab emirates",
  "egypt", "south africa", "nigeria", "kenya", "india", "pakistan", "bangladesh", "nepal", "thailand",
  "china", "japan", "south korea", "korea", "new zealand", "mexico", "argentina", "usa", "united states",
  "america", "canada", "australia", "russia", "brazil", "singapore"
]);

/* Returns places found in the text, in order of appearance. */
function locate(text) {
  const hits = [];
  const taken = [];

  for (const { key, place } of INDEX) {
    const re = new RegExp(`(?:^|\\s)${key}(?=\\s|$)`, "g");
    let match;

    while ((match = re.exec(text))) {
      const start = match.index + (match[0].startsWith(" ") ? 1 : 0);
      const end = start + key.length;

      if (taken.some(([a, b]) => start < b && end > a)) continue;

      taken.push([start, end]);
      hits.push({ start, place, key });
    }
  }

  hits.sort((a, b) => a.start - b.start);

  const seen = new Set();
  return hits.filter(hit => {
    const id = hit.place.tz || hit.place.name;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/* Used by the knowledge module for "which country is Tokyo in?" */
export function findPlace(message) {
  const hits = locate(normalizeChat(message));
  const first = hits[0];
  if (!first) return null;

  return {
    ...first.place,
    kind: COUNTRY_KEYS.has(first.key) ? "country" : "city"
  };
}

/* ---------- Intl helpers ---------- */

function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function findIana(message) {
  const match = String(message || "").match(
    /\b([A-Z][A-Za-z]+\/[A-Z][A-Za-z_]+(?:\/[A-Z][A-Za-z_]+)?)\b/
  );
  if (!match || !isValidTimeZone(match[1])) return null;

  if (typeof Intl.supportedValuesOf === "function") {
    try {
      if (!Intl.supportedValuesOf("timeZone").includes(match[1])) {
        /* Some valid aliases are not listed; Intl accepted it, so keep it. */
      }
    } catch { /* ignore */ }
  }

  return { tz: match[1], name: match[1].split("/").pop().replace(/_/g, " ") };
}

function localZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

function offsetMinutes(timeZone, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric"
  }).formatToParts(date);

  const v = Object.fromEntries(
    parts.filter(p => p.type !== "literal").map(p => [p.type, Number(p.value)])
  );

  const asUtc = Date.UTC(
    v.year, v.month - 1, v.day,
    v.hour === 24 ? 0 : v.hour, v.minute, v.second
  );

  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

function describeTime(timeZone, date = new Date()) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone, hour: "numeric", minute: "2-digit", hour12: true
  }).format(date);

  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZoneName: "short"
  }).format(date);

  return { time, day };
}

function formatGap(minutes) {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const parts = [];
  if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m) parts.push(`${m} minutes`);
  return parts.join(" ") || "0 hours";
}

function ambiguousReply(place) {
  return `${place.name} has several time zones. 🌎 Which city do you mean? For example: ${place.ambiguous.join(", ")}.`;
}

/* ---------- public API ---------- */

const DIFF_RE = /\btime (?:difference|gap)\b|\bdifference in time\b|\b(?:hours?|hrs?) (?:ahead|behind|apart|difference)\b/;
const ASK_TIME_RE = /\b(?:what time is it|whats the time|what is the time|current time|local time|time now|time right now|time (?:in|at|of|for))\b/;
const NON_TIME_CONTEXT = /\b(?:class|lesson|schedule|timetable|assignment|homework|attendance|game|move|clock|puzzle)\b/;

export function answerTimeQuestion(message) {

  const raw = normalizeChat(message);
  const isDiff = DIFF_RE.test(raw);
  const asksTime = ASK_TIME_RE.test(raw);

  if (!isDiff && !asksTime) return null;

  const iana = findIana(message);
  const hits = locate(raw).map(h => h.place);

  const places = iana ? [iana, ...hits.filter(p => p.tz !== iana.tz)] : hits;

  /* Ask for a city when only a multi-zone country was named. */
  const ambiguous = places.find(p => p.ambiguous);
  if (ambiguous && places.filter(p => !p.ambiguous).length < (isDiff ? 2 : 1)) {
    return { text: ambiguousReply(ambiguous) };
  }

  const usable = places.filter(p => p.tz && isValidTimeZone(p.tz));

  /* Time difference between two places ---------------------- */

  if (isDiff) {
    let first = usable[0];
    let second = usable[1];

    if (first && !second) {
      const zone = localZone();
      if (!zone || zone === first.tz) {
        return { text: "Which two places should I compare? 😊 For example: \"time difference between India and Japan\"." };
      }
      second = first;
      first = { tz: zone, name: "your device's time zone" };
    }

    if (!first || !second) {
      return { text: "Which two places should I compare? 😊 For example: \"time difference between India and Germany\"." };
    }

    const now = new Date();
    const gap = offsetMinutes(second.tz, now) - offsetMinutes(first.tz, now);

    const text = gap === 0
      ? `${second.name} and ${first.name} are on the same time right now. 🕒`
      : `${second.name} is ${formatGap(gap)} ${gap > 0 ? "ahead of" : "behind"} ${first.name} right now. 🕒 Daylight saving can change this during the year.`;

    return { text, place: second.name };
  }

  /* A single time --------------------------------------------- */

  if (usable.length) {
    const place = usable[0];
    const { time, day } = describeTime(place.tz);
    return {
      text: `🕒 It's ${time} in ${place.name} (${day}).`,
      place: place.name
    };
  }

  if (NON_TIME_CONTEXT.test(raw)) return null;

  /* A place was asked for, but not recognised. */
  if (/\btime (?:in|at|of|for)\b/.test(raw)) {
    return {
      text: "Hmm, I'm not sure about that place's time zone. 🤔 Try a major city or country, like London, Tokyo or New York."
    };
  }

  /* "What time is it?" with no place: use the device's zone. */
  const zone = localZone();
  if (zone && isValidTimeZone(zone)) {
    const { time, day } = describeTime(zone);
    return { text: `🕒 On your device it's ${time} (${day}), in the ${zone.replace(/_/g, " ")} time zone.` };
  }

  return null;
}