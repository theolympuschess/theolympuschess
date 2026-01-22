/* ================================
   PDF FLOATING FEN EDITOR
   FULLY ISOLATED SYSTEM
================================ */

(() => {
  const APP = {}
  window.PDF_FEN_EDITOR = APP

  const PIECES = [
    null,
    "p","n","b","r","q","k",
    "P","N","B","R","Q","K"
  ]

  const UNICODE = {
    p:"♟", n:"♞", b:"♝", r:"♜", q:"♛", k:"♚",
    P:"♙", N:"♘", B:"♗", R:"♖", Q:"♕", K:"♔"
  }

  let board = Array.from({ length: 8 }, () => Array(8).fill(null))
  let canvas, ctx, SQ = 45

  let overlay, windowBox, turnSelect

  /* ================================
     INIT
  ================================ */
  document.addEventListener("DOMContentLoaded", () => {
    overlay = document.getElementById("pdfFenOverlay")
    windowBox = document.getElementById("pdfFenWindow")
    canvas = document.getElementById("pdfFenCanvas")
    ctx = canvas.getContext("2d")
    turnSelect = document.getElementById("pdfFenTurn")

    setupDrag()
    setupBoard()
    setupButtons()
  })

  /* ================================
     PUBLIC API
  ================================ */
APP.open = function() {
  const overlay = document.getElementById("pdfFenOverlay")
  const el = document.getElementById("pdfFenWindow")

  if (!overlay || !el) {
    console.error("PDF FEN Editor not found in DOM")
    return
  }

  // Force immune layout
  overlay.style.pointerEvents = "none"
  el.style.pointerEvents = "auto"

  el.style.display = "flex"
  el.style.top = "120px"
  el.style.left = "120px"
}

APP.close = function() {
  const el = document.getElementById("pdfFenWindow")
  if (!el) return

  el.style.display = "none"
}


  /* ================================
     BOARD
  ================================ */
  function setupBoard() {
  let dragPiece = null
  let fromRow = null
  let fromCol = null
  let isDragging = false
  let didDrag = false
  let copyMode = false

  const getSquare = e => {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      return null
    }

    return {
      col: Math.floor(x / SQ),
      row: Math.floor(y / SQ)
    }
  }

  // CLICK = CYCLE PIECE
  canvas.addEventListener("click", e => {
    if (didDrag) {
      didDrag = false
      return
    }

    const sq = getSquare(e)
    if (!sq) return

    const { row, col } = sq
    const cur = board[row][col]
    const idx = PIECES.indexOf(cur)
    board[row][col] = PIECES[(idx + 1) % PIECES.length]

    draw()
  })

  // RIGHT CLICK = CHANGE COLOR
  canvas.addEventListener("contextmenu", e => {
    e.preventDefault()

    const sq = getSquare(e)
    if (!sq) return

    const { row, col } = sq
    const p = board[row][col]
    if (!p) return

    board[row][col] =
      p === p.toUpperCase()
        ? p.toLowerCase()
        : p.toUpperCase()

    draw()
  })

  // DRAG START
  canvas.addEventListener("mousedown", e => {
    const sq = getSquare(e)
    if (!sq) return

    const { row, col } = sq
    const p = board[row][col]
    if (!p) return

    dragPiece = p
    fromRow = row
    fromCol = col
    isDragging = true
    didDrag = false
    copyMode = e.ctrlKey === true
  })

  // TRACK DRAG
  canvas.addEventListener("mousemove", () => {
    if (isDragging) {
      didDrag = true
    }
  })

  // DROP
  document.addEventListener("mouseup", e => {
    if (!isDragging) return

    const sq = getSquare(e)

    if (sq) {
      const { row, col } = sq

      if (!copyMode) {
        board[fromRow][fromCol] = null
      }

      board[row][col] = dragPiece
    }

    dragPiece = null
    fromRow = null
    fromCol = null
    isDragging = false
    copyMode = false

    draw()
  })

  draw()
}




  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    SQ = canvas.width / 8

    // Board
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        ctx.fillStyle = (r + c) % 2 ? "#b58863" : "#f0d9b5"
        ctx.fillRect(c * SQ, r * SQ, SQ, SQ)
      }
    }

    // Pieces
    ctx.font = `${SQ * 0.75}px serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c]
        if (!p) continue

        ctx.fillStyle = p === p.toUpperCase() ? "#fff" : "#000"
        ctx.fillText(
          UNICODE[p],
          c * SQ + SQ / 2,
          r * SQ + SQ / 2
        )
      }
    }
  }

  /* ================================
     FEN
  ================================ */
  function generateFEN() {
    const rows = board.map(rank => {
      let out = ""
      let empty = 0

      rank.forEach(sq => {
        if (!sq) empty++
        else {
          if (empty) {
            out += empty
            empty = 0
          }
          out += sq
        }
      })

      if (empty) out += empty
      return out
    })

    return `${rows.join("/")} ${turnSelect.value} - - 0 1`
  }

  /* ================================
     BUTTONS
  ================================ */
function setupButtons() {
  document.getElementById("pdfFenCopy").onclick = () => {
    const fen = generateFEN()
    navigator.clipboard.writeText(fen)
    alert("FEN Copied:\n" + fen)
  }

  document.getElementById("pdfFenClose").onclick = () => {
    APP.close()
  }

  document.getElementById("pdfFenClear").onclick = () => {
    // Clear board state
    board = Array.from({ length: 8 }, () => Array(8).fill(null))
    draw()
  }
}

  /* ================================
     DRAG WINDOW
  ================================ */
  function setupDrag() {
    const header = document.getElementById("pdfFenDrag")

    let isDown = false
    let offX = 0
    let offY = 0

    header.addEventListener("mousedown", e => {
      isDown = true
      offX = e.clientX - windowBox.offsetLeft
      offY = e.clientY - windowBox.offsetTop
      header.style.cursor = "grabbing"
    })

    document.addEventListener("mousemove", e => {
      if (!isDown) return
      windowBox.style.left = e.clientX - offX + "px"
      windowBox.style.top = e.clientY - offY + "px"
    })

    document.addEventListener("mouseup", () => {
      isDown = false
      header.style.cursor = "grab"
    })
  }

})()

