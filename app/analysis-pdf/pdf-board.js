import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.worker.min.mjs";

/* ==================================================
   PDF → PGN SCANNER (FULLY ISOLATED JS)
================================================== */
(() => {

  document.addEventListener("DOMContentLoaded", () => {

    /* ---------- DOM ---------- */
    const pdfInput   = document.getElementById("pdfInput");
    const thumbs     = document.getElementById("boardThumbs");
    const overlay    = document.getElementById("floatingBoard");
    const canvas     = document.getElementById("boardCanvas");
    const ctx        = canvas.getContext("2d");
    const copyBtn    = document.getElementById("copyFenBtn");
    const closeBtn   = document.getElementById("closeBoardBtn");

    /* ---------- CONSTANTS ---------- */
    const SIZE = 8;
   let SQ = canvas.width / SIZE;


    const PIECES = [
      null,
      "p","n","b","r","q","k",
      "P","N","B","R","Q","K"
    ];

    /* ---------- STATE ---------- */
    let board = Array.from({ length: 8 }, () => Array(8).fill(null));
    let bgImage = null;

    /* ---------- PDF LOAD ---------- */
    pdfInput.addEventListener("change", async e => {
      const file = e.target.files[0];
      if (!file) return;

      thumbs.innerHTML = "";

      const pdf = await pdfjsLib
        .getDocument(URL.createObjectURL(file))
        .promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });

        const temp = document.createElement("canvas");
        temp.width = viewport.width;
        temp.height = viewport.height;

        await page.render({
          canvasContext: temp.getContext("2d"),
          viewport
        }).promise;

        const img = document.createElement("img");
        img.src = temp.toDataURL();

        const box = document.createElement("div");
        box.className = "board-thumb";
        box.appendChild(img);
       box.onclick = () => {
  openBoard(img)
 window.parent.postMessage({ type: "OPEN_FEN_EDITOR" }, "*")

}


        thumbs.appendChild(box);
      }
    });

    /* ---------- OPEN / CLOSE ---------- */
    function setupCanvasAndDraw(img) {
  const maxSize = 560;
  const ratio = img.naturalWidth / img.naturalHeight;

  if (ratio >= 1) {
    canvas.width = maxSize;
    canvas.height = Math.round(maxSize / ratio);
  } else {
    canvas.height = maxSize;
    canvas.width = Math.round(maxSize * ratio);
  }

  SQ = canvas.width / 8;

  board = Array.from({ length: 8 }, () => Array(8).fill(null));

  draw();
}

function openBoard(img) {
  overlay.style.display = "flex";

  img.decode().then(() => {
    bgImage = img;
    setupCanvasAndDraw(img);
  });

  bgImage = img;

  // Fit canvas to image ratio
  const maxSize = 560;
  const ratio = img.naturalWidth / img.naturalHeight;

  if (ratio >= 1) {
    canvas.width = maxSize;
    canvas.height = Math.round(maxSize / ratio);
  } else {
    canvas.height = maxSize;
    canvas.width = Math.round(maxSize * ratio);
  }

  SQ = canvas.width / 8;

  board = Array.from({ length: 8 }, () => Array(8).fill(null));

  draw();
}



    closeBtn.onclick = () => {
      overlay.style.display = "none";
    };

    /* ---------- DRAW ---------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!bgImage) return;

  ctx.drawImage(
    bgImage,
    0,
    0,
    canvas.width,
    canvas.height
  );

  // ❌ Removed grid for clean PDF view
  // drawGrid();

  drawPieces();
}




    function drawGrid() {
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      for (let i = 0; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(i * SQ, 0);
        ctx.lineTo(i * SQ, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * SQ);
        ctx.lineTo(canvas.width, i * SQ);
        ctx.stroke();
      }
    }

    function drawPieces() {
      ctx.font = "28px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (!p) continue;
          ctx.fillText(
            pieceChar(p),
            c * SQ + SQ / 2,
            r * SQ + SQ / 2
          );
        }
      }
    }

    /* ---------- CLICK TO PLACE ---------- */
    canvas.addEventListener("click", e => {
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor((e.clientX - rect.left) / SQ);
      const row = Math.floor((e.clientY - rect.top) / SQ);

      const cur = board[row][col];
      const idx = PIECES.indexOf(cur);
      board[row][col] = PIECES[(idx + 1) % PIECES.length];

      draw();
    });

    /* ---------- FEN ---------- */
    function generateFEN() {
      return board.map(rank => {
        let out = "";
        let empty = 0;

        rank.forEach(sq => {
          if (!sq) empty++;
          else {
            if (empty) {
              out += empty;
              empty = 0;
            }
            out += sq;
          }
        });

        if (empty) out += empty;
        return out;
      }).join("/") + " w - - 0 1";
    }

    copyBtn.onclick = () => {
      const fen = generateFEN();
      navigator.clipboard.writeText(fen);
      alert("FEN copied:\n" + fen);
    };

    /* ---------- UTILS ---------- */
    function pieceChar(p) {
      return {
        p:"♟", n:"♞", b:"♝", r:"♜", q:"♛", k:"♚",
        P:"♙", N:"♘", B:"♗", R:"♖", Q:"♕", K:"♔"
      }[p];
    }

  });

})();
