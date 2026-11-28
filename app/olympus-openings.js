/* ============================================================
   OLYMPUS OPENING RECOGNITION ENGINE — ROBUST EDITION
   ------------------------------------------------------------
   Local, on-demand ECO classifier for The Olympus Chess Academy.

   Improvements:
   - Supports both chess.js 0.x (load_pgn) and 1.x (loadPgn) APIs.
   - Accepts PGN WITH move numbers and plain SAN sequences such as
     "Nc3 Nf6" (the format visible in the supplied archives).
   - Adds exact SAN-prefix matching as a reliable fallback when a
     chess.js constructor is not exposed to a classic script.
   - Keeps board-position matching for transpositions when chess.js
     is available.
   - Reports real catalogue-index and per-game classification progress.
   - Loads the local olympus-opening-data.js only on Opening Report.
   ============================================================ */
(function (global) {
  "use strict";

  let injectedChessConstructor = null;
  let dataScriptPromise = null;
  let loadPromise = null;
  let ready = false;
  let positionIndex = new Map();
  let sequenceIndex = new Map();
  let entryCount = 0;
  let validEntryCount = 0;
  let skippedEntryCount = 0;
  let maxSequenceLength = 0;
  let sourceLabel = "Lichess chess-openings (CC0)";

  function configureChess(Ctor) {
    if (typeof Ctor === "function") injectedChessConstructor = Ctor;
    return typeof injectedChessConstructor === "function";
  }

  function chessConstructor(required) {
    const Ctor = injectedChessConstructor || global.Chess || (global.chess && global.chess.Chess);
    if (typeof Ctor === "function") return Ctor;
    if (required) throw new Error("chess.js is not available. Sequence matching will still work; position/transposition matching needs the MainUI Chess constructor.");
    return null;
  }

  function report(progress, payload) {
    if (typeof progress !== "function") return;
    try { progress(payload); } catch (_) {}
  }

  function loadDataScript(progress) {
    const existingData = global.OLYMPUS_OPENING_DATA;
    if (existingData && Array.isArray(existingData.openings) && existingData.openings.length) {
      report(progress, { phase: "download", current: 1, total: 1, complete: true });
      return Promise.resolve(existingData);
    }
    if (dataScriptPromise) return dataScriptPromise;

    report(progress, { phase: "download", current: 0, total: 1, complete: false });
    dataScriptPromise = new Promise((resolve, reject) => {
      const alreadyAdded = document.querySelector('script[data-olab-opening-data="true"]');
      if (alreadyAdded) alreadyAdded.remove();

      const script = document.createElement("script");
      script.src = new URL("./olympus-opening-data.js", document.baseURI).href;
      script.async = true;
      script.dataset.olabOpeningData = "true";
      script.onload = () => {
        const data = global.OLYMPUS_OPENING_DATA;
        if (data && Array.isArray(data.openings) && data.openings.length) {
          report(progress, { phase: "download", current: 1, total: 1, complete: true });
          resolve(data);
        } else {
          reject(new Error("olympus-opening-data.js loaded but did not expose a non-empty OLYMPUS_OPENING_DATA.openings array."));
        }
      };
      script.onerror = () => {
        script.remove();
        reject(new Error("Could not load ./olympus-opening-data.js. Confirm the file is beside MainUI.html and the filename uses the exact lowercase spelling."));
      };
      document.head.appendChild(script);
    }).catch((error) => {
      dataScriptPromise = null;
      throw error;
    });
    return dataScriptPromise;
  }

  function stripPgnCommentsAndVariations(text) {
    let body = String(text || "");
    body = body.replace(/^\s*\[[^\r\n]*\]\s*$/gm, " ");
    body = body.replace(/\{[^}]*\}/gs, " ");
    body = body.replace(/;[^\r\n]*/g, " ");

    // Remove nested parenthesized variations safely.
    let out = "";
    let depth = 0;
    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      if (ch === "(") { depth++; continue; }
      if (ch === ")" && depth > 0) { depth--; continue; }
      if (depth === 0) out += ch;
    }
    return out;
  }

  function sanTokens(raw) {
    const body = stripPgnCommentsAndVariations(raw)
      .replace(/\$\d+/g, " ")
      .replace(/\uFEFF/g, " ");
    const rawTokens = body.split(/\s+/).filter(Boolean);
    const tokens = [];

    for (let rawToken of rawTokens) {
      let token = String(rawToken).trim();
      if (!token) continue;

      // A move number can be attached to its SAN: 1.e4 or 1...e5.
      token = token.replace(/^\d+\.(?:\.\.)?/, "");
      if (!token || /^\d+\.{1,3}$/.test(token)) continue;
      if (/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)) continue;
      if (/^(e\.p\.|ep)$/i.test(token)) continue;
      if (/^[!?]+$/.test(token)) continue;

      token = token.replace(/^[!?]+|[!?]+$/g, "");
      token = token.replace(/[+#]+$/g, "");
      token = token.replace(/\u2026/g, "");
      if (!token) continue;

      // Normalize zero-based castling notation to SAN letter O.
      token = token.replace(/^0-0-0$/, "O-O-O").replace(/^0-0$/, "O-O");

      // Strip a stray punctuation delimiter, but preserve SAN capture,
      // promotion, disambiguation and file/rank characters.
      token = token.replace(/[;,]+$/g, "");
      if (token) tokens.push(token);
    }
    return tokens;
  }

  function playSan(game, token) {
    if (!game || !token) return null;
    const san = String(token);
    const attempts = [
      () => game.move(san, { sloppy: true }), // chess.js 0.x
      () => game.move(san, { strict: false }),
      () => game.move(san)
    ];
    for (const attempt of attempts) {
      try {
        const move = attempt();
        if (move) return move;
      } catch (_) {}
    }

    // Optional UCI-like fallback, e.g. e2e4 or e7e8q.
    const uci = san.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/i);
    if (uci) {
      try { return game.move({ from: uci[1].toLowerCase(), to: uci[2].toLowerCase(), promotion: uci[3] && uci[3].toLowerCase() }); } catch (_) {}
    }
    return null;
  }

  function positionKey(chess) {
    const fields = String(chess.fen()).trim().split(/\s+/);
    if (fields.length < 4) return "";

    let ep = fields[3] || "-";
    if (ep !== "-") {
      let legalEnPassant = false;
      try {
        const moves = chess.moves({ verbose: true }) || [];
        legalEnPassant = moves.some((move) => String(move.flags || "").includes("e"));
      } catch (_) {}
      if (!legalEnPassant) ep = "-";
    }
    return [fields[0], fields[1], fields[2], ep].join(" ");
  }

  function candidateFor(entry, ply, method, pgn) {
    return {
      eco: String(entry.eco || "").toUpperCase(),
      name: String(entry.name || ""),
      ply: Number(ply || 0),
      pgn: String(entry.pgn || pgn || ""),
      method: method || "SAN move-sequence match"
    };
  }

  function preferCandidate(candidate, existing) {
    return !existing || candidate.ply > existing.ply ||
      (candidate.ply === existing.ply && candidate.name.length > existing.name.length) ||
      (candidate.ply === existing.ply && candidate.name.length === existing.name.length && candidate.name.localeCompare(existing.name) < 0);
  }

  function indexEntry(Chess, entry) {
    const tokens = sanTokens(entry.pgn);
    if (!tokens.length) return false;

    const sequence = tokens.join(" ");
    const sequenceCandidate = candidateFor(entry, tokens.length, "SAN move-sequence match");
    const existingSequence = sequenceIndex.get(sequence);
    if (preferCandidate(sequenceCandidate, existingSequence)) sequenceIndex.set(sequence, sequenceCandidate);
    maxSequenceLength = Math.max(maxSequenceLength, tokens.length);

    // Position indexing enables transpositions. It is optional: exact SAN
    // prefix matching remains available if no Chess constructor is exposed.
    // Only the FINAL position of each catalogue line is indexed. Indexing every
    // intermediate position made e.g. 1.e4 c5 inherit a long sub-variation name.
    if (Chess) {
      try {
        const game = new Chess();
        let complete = true;
        for (let i = 0; i < tokens.length; i++) {
          if (!playSan(game, tokens[i])) { complete = false; break; }
        }
        const key = complete ? positionKey(game) : "";
        if (key) {
          const candidate = candidateFor(entry, tokens.length, "Board-position match");
          const existing = positionIndex.get(key);
          // Same position from two entries: keep the first catalogue entry.
          if (!existing || candidate.ply > existing.ply) positionIndex.set(key, candidate);
        }
      } catch (_) {
        // The SAN sequence entry is still valid even if a particular
        // chess.js build cannot replay this catalogue line.
      }
    }
    return true;
  }

  async function buildCatalogue(progress) {
    const data = await loadDataScript(progress);
    const entries = Array.isArray(data.openings) ? data.openings : [];
    if (!entries.length) throw new Error("The local opening data file contains no opening entries.");

    const Chess = chessConstructor(false);
    positionIndex = new Map();
    sequenceIndex = new Map();
    entryCount = entries.length;
    validEntryCount = 0;
    skippedEntryCount = 0;
    maxSequenceLength = 0;
    sourceLabel = String(data.source || "Lichess chess-openings (CC0)");

    report(progress, { phase: "index", current: 0, total: entries.length, percent: 0, chessAvailable: !!Chess });
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry && entry.eco && entry.name && entry.pgn && indexEntry(Chess, entry)) validEntryCount++;
      else skippedEntryCount++;

      if (i === entries.length - 1 || (i + 1) % 35 === 0) {
        report(progress, {
          phase: "index",
          current: i + 1,
          total: entries.length,
          percent: Math.round(((i + 1) / entries.length) * 100),
          chessAvailable: !!Chess
        });
        await new Promise((resolve) => global.setTimeout(resolve, 0));
      }
    }

    if (!sequenceIndex.size && !positionIndex.size) {
      throw new Error("No opening entries could be indexed. Check olympus-opening-data.js format and contents.");
    }
    ready = true;
    return getStatus();
  }

  function getStatus() {
    return {
      ready,
      entryCount,
      validEntryCount,
      skippedEntryCount,
      positionCount: positionIndex.size,
      sequenceCount: sequenceIndex.size,
      maxSequenceLength,
      chessAvailable: !!chessConstructor(false),
      source: sourceLabel
    };
  }

  function readHeaders(pgn) {
    const headers = {};
    String(pgn || "").replace(/^\s*\[([A-Za-z0-9_]+)\s+"((?:\\.|[^"\\])*)"\]\s*$/gm, (_, key, value) => {
      headers[key] = String(value || "").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      return "";
    });
    return headers;
  }

  function longestSequenceMatch(tokens) {
    const limit = Math.min(tokens.length, maxSequenceLength);
    for (let len = limit; len >= 1; len--) {
      const candidate = sequenceIndex.get(tokens.slice(0, len).join(" "));
      if (candidate) return candidate;
    }
    return null;
  }

  function classifyOnePgn(pgn) {
    if (!ready || !pgn) return null;
    const headers = readHeaders(pgn);
    const variant = String(headers.Variant || "").trim().toLowerCase();
    const standardVariants = new Set(["", "standard", "chess", "normal"]);
    if (!standardVariants.has(variant)) return null;
    if (headers.FEN || String(headers.SetUp || "") === "1") return null;

    const tokens = sanTokens(pgn);
    if (!tokens.length) return null;

    // Fast, robust fallback: exact opening-line prefix. This handles the
    // actual archive format seen in Olympus, including plain "Nc3 Nf6"
    // strings without PGN headers or move numbers.
    let best = longestSequenceMatch(tokens);

    // Upgrade the result using board positions when chess.js is available.
    const Chess = chessConstructor(false);
    if (Chess) {
      try {
        const game = new Chess();
        for (let i = 0; i < tokens.length; i++) {
          const played = playSan(game, tokens[i]);
          if (!played) break;
          const candidate = positionIndex.get(positionKey(game));
          if (candidate && (!best || candidate.ply > best.ply || (candidate.ply === best.ply && candidate.name.length > best.name.length))) {
            best = Object.assign({}, candidate, { method: "Board-position match (transposition-aware)" });
          }
        }
      } catch (_) {}
    }

    if (!best) return null;
    return {
      eco: best.eco,
      name: best.name,
      ply: best.ply,
      matchedMoves: best.pgn,
      method: best.method || "SAN move-sequence match"
    };
  }

  async function classifyPgns(pgnList, progress) {
    const list = Array.isArray(pgnList) ? pgnList : [];
    const results = [];
    const total = list.length;
    report(progress, { phase: "classify", current: 0, total, percent: 0, classified: 0 });

    for (let i = 0; i < total; i++) {
      const match = classifyOnePgn(list[i]);
      results.push(match);
      if (i === total - 1 || (i + 1) % 5 === 0) {
        report(progress, {
          phase: "classify",
          current: i + 1,
          total,
          percent: total ? Math.round(((i + 1) / total) * 100) : 100,
          classified: results.filter(Boolean).length
        });
        await new Promise((resolve) => global.setTimeout(resolve, 0));
      }
    }
    if (total === 0) report(progress, { phase: "classify", current: 0, total: 0, percent: 100, classified: 0 });
    return results;
  }

  global.OlympusOpenings = Object.freeze({
    configureChess,
    load(progress) {
      if (ready) {
        report(progress, { phase: "index", current: entryCount, total: entryCount, percent: 100, chessAvailable: !!chessConstructor(false), ready: true });
        return Promise.resolve(getStatus());
      }
      if (loadPromise) return loadPromise;
      loadPromise = buildCatalogue(progress).catch((error) => {
        loadPromise = null;
        ready = false;
        positionIndex = new Map();
        sequenceIndex = new Map();
        throw error;
      });
      return loadPromise;
    },
    classifyPgns,
    classifyPgn: classifyOnePgn,
    getStatus
  });
})(window);