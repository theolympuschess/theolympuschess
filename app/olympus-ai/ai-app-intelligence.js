/* =====================================================================
   OLYMPUS AI 4.1.3 — APP DISCOVERY INDEX
   ---------------------------------------------------------------------
   Builds a read-only searchable index from the rendered MainUI DOM.
   It indexes interface labels and identifiers, NOT form values, passwords,
   tokens, private text typed by students, or arbitrary JavaScript.

   This helps Olympus AI locate visible controls and explain where a
   control lives. A label alone is not proof of a control's full behaviour.
   ===================================================================== */

import { getMainUIViewerRole, isRoleRestrictedElement } from "./ai-role-visibility.js";

const EXCLUDED_SELECTOR = [
  "script", "style", "template", "noscript", "svg", "path",
  ".oai-root", "[aria-hidden='true']", "[hidden]",
  // Do not expose the internal live-classroom student invitation search.
  "#lpInviteStudentSearch"
].join(",");

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "where", "what", "which", "how",
  "can", "could", "please", "me", "my", "i", "you", "find", "show",
  "tell", "about", "do", "does", "this", "that", "button", "control",
  "field", "menu", "section", "tab", "dashboard", "mainui"
]);

let cachedIndex = null;
let cachedAt = 0;
let cachedRole = "unknown";
const CACHE_MS = 8000;

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return clean(value).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]/g, " ")
    .replace(/\s+/g, " ").trim();
}

function isVisibleEnough(element) {
  if (!element || element.closest(EXCLUDED_SELECTOR)) return false;
  // Respect MainUI role restrictions without excluding controls merely because
  // their dashboard section is currently inactive/collapsed.
  if (isRoleRestrictedElement(element)) return false;
  if (element.hidden || element.getAttribute("aria-hidden") === "true") return false;
  if (element.disabled) return false;
  const type = (element.getAttribute("type") || "").toLowerCase();
  if (["password", "hidden", "file"].includes(type)) return false;
  return true;
}

function associatedLabel(element) {
  const pieces = [];
  if (element.id) {
    const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (label) pieces.push(label.textContent);
  }
  const wrappingLabel = element.closest("label");
  if (wrappingLabel) pieces.push(wrappingLabel.textContent);
  return clean(pieces.join(" "));
}

function getSectionFor(element) {
  const section = element.closest(".section[id], section[id$='-section'], [id$='-section']");
  if (section) {
    const heading = section.querySelector("h1, h2, h3, h4");
    return {
      id: section.id || "",
      label: clean(heading?.textContent || section.getAttribute("aria-label") || section.id)
    };
  }
  const nav = element.closest(".nav-btn[data-tab]");
  if (nav?.dataset?.tab) {
    const target = document.getElementById(`${nav.dataset.tab}-section`);
    const heading = target?.querySelector("h1, h2, h3, h4");
    return {
      id: target?.id || `${nav.dataset.tab}-section`,
      label: clean(heading?.textContent || nav.textContent || nav.dataset.tab)
    };
  }
  return { id: "", label: "Your academy app" };
}

function buildIndex() {
  const records = [];
  const viewerRole = getMainUIViewerRole();
  const sections = Array.from(document.querySelectorAll(".section[id], section[id$='-section'], [id$='-section']"));
  const seenSections = new Set();

  for (const section of sections) {
    if (!section.id || seenSections.has(section.id)) continue;
    if (isRoleRestrictedElement(section, viewerRole)) continue;
    seenSections.add(section.id);
    const heading = section.querySelector("h1, h2, h3, h4");
    const nav = document.querySelector(`.nav-btn[data-tab="${CSS.escape(section.id.replace(/-section$/, ""))}"]`);
    records.push({
      kind: "section",
      id: section.id,
      label: clean(heading?.textContent || nav?.textContent || section.getAttribute("aria-label") || section.id),
      section: clean(heading?.textContent || nav?.textContent || section.id),
      sectionId: section.id,
      detail: clean(section.getAttribute("aria-label") || "Dashboard section")
    });
  }

  const controls = Array.from(document.querySelectorAll(
    "button, input, select, textarea, [role='button'], a[href], [data-tab], [data-lock-tab]"
  ));

  for (const element of controls) {
    if (!isVisibleEnough(element)) continue;
    const type = (element.getAttribute("type") || "").toLowerCase();
    const label = clean([
      associatedLabel(element),
      element.getAttribute("aria-label"),
      element.getAttribute("title"),
      element.getAttribute("placeholder"),
      element.innerText || element.textContent
    ].filter(Boolean).join(" ")).slice(0, 180);
    const id = clean(element.id);
    const name = clean(element.getAttribute("name"));
    const tab = clean(element.dataset?.tab || element.dataset?.lockTab);
    const section = getSectionFor(element);
    if (!label && !id && !name && !tab) continue;

    records.push({
      kind: element.tagName.toLowerCase() === "button" || element.getAttribute("role") === "button" ? "button" : element.tagName.toLowerCase(),
      id,
      name,
      label: label || id || name || tab,
      section: section.label,
      sectionId: section.id,
      type,
      placeholder: clean(element.getAttribute("placeholder")),
      tab,
      keywords: normalize([label, id, name, tab, section.label].join(" "))
    });
    if (records.length >= 6000) break;
  }

  return {
    generatedAt: Date.now(),
    viewerRole,
    sectionCount: seenSections.size,
    controlCount: records.filter(r => r.kind !== "section").length,
    records
  };
}

export function getMainUIIndex({ force = false } = {}) {
  const role = getMainUIViewerRole();
  // A role transition invalidates the cached index immediately.
  if (!force && cachedIndex && cachedRole === role && Date.now() - cachedAt < CACHE_MS) return cachedIndex;
  cachedIndex = buildIndex();
  cachedAt = Date.now();
  cachedRole = role;
  return cachedIndex;
}

function scoreRecord(record, tokens, normalizedQuery) {
  const haystack = normalize([
    record.label, record.id, record.name, record.tab,
    record.section, record.sectionId, record.placeholder, record.keywords
  ].join(" "));
  let score = 0;
  if (normalizedQuery && haystack.includes(normalizedQuery)) score += 12;
  for (const token of tokens) {
    if (token.length < 2 || STOP_WORDS.has(token)) continue;
    if (haystack.includes(token)) score += 3;
    if (normalize(record.label) === token) score += 5;
  }
  return score;
}

export function searchMainUI(query, limit = 6) {
  const normalizedQuery = normalize(query);
  const tokens = normalizedQuery.split(" ").filter(Boolean);
  const index = getMainUIIndex();
  return index.records
    .map(record => ({ record, score: scoreRecord(record, tokens, normalizedQuery) }))
    .filter(item => item.score >= 4)
    .sort((a, b) => b.score - a.score || a.record.label.localeCompare(b.record.label))
    .slice(0, Math.max(1, Math.min(12, limit)))
    .map(item => ({ ...item.record, matchScore: item.score }));
}

export function answerMainUIQuestion(question) {
  const q = normalize(question);
  if (!q) return null;

  const asksOverview = /\b(what sections|available sections|all sections|what features|available features|what is in this dashboard|what is in my app|what can i do in this app|what does this app contain|explore app sections|show app sections)\b/.test(q);
  if (asksOverview) {
    const index = getMainUIIndex();
    const sections = index.records
      .filter(record => record.kind === "section")
      .map(record => record.label)
      .filter((label, i, all) => label && all.indexOf(label) === i)
      .slice(0, 45);
    if (!sections.length) return null;
    return {
      type: "app-knowledge",
      text: [
        "Here are the main areas available in your Olympus app:",
        "",
        ...sections.map((label, i) => `${i + 1}. ${label}`),
        "",
        "You can ask me about your rating, games, assignments, attendance, classes and progress. I will show information available to your signed-in account."
      ].join("\n")
    };
  }

  // Keep this as a fallback for a student who asks where an app feature is,
  // but present the answer as helpful guidance rather than DOM terminology.
  const asksForLocation = /\b(button|dropdown|select|input|field|filter|tab|menu|setting|section|where is|where can i find|which section|find the|locate|take me to|open the)\b/.test(q);
  if (!asksForLocation) return null;

  const results = searchMainUI(question, 5);
  if (!results.length) return null;
  const lines = ["Here is where you can access the matching part of your app:", ""];
  const seen = new Set();
  for (const item of results) {
    const key = `${normalize(item.label)}|${normalize(item.section)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(`• **${item.label}**${item.section ? ` — in **${item.section}**` : ""}`);
  }
  lines.push("");
  lines.push("You can open the relevant area from your app navigation. What you can use depends on your account permissions.");
  return { type: "app-knowledge", text: lines.join("\n") };
}
