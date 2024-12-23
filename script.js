const message = document.getElementById("message");
const restartButton = document.getElementById("restart");
const twoPlayerMode = document.getElementById("twoPlayerMode");
const aiMode = document.getElementById("aiMode");
const difficultySelect = document.getElementById("difficulty");
const playerXName = document.getElementById("playerX");
const playerOName = document.getElementById("playerO");
const undoButton = document.getElementById("undo");
const saveGameButton = document.getElementById("saveGame");
const loadGameButton = document.getElementById("loadGame");

let board = Array(9).fill("");
let currentPlayer = "X";
let gameMode = "twoPlayer";
let gameActive = true;
let scoreX = 0;
let scoreO = 0;
let moveHistory = [];
const winningCombos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

function initGame() {
    board = Array(9).fill("");
    currentPlayer = "X";
    gameActive = true;
    moveHistory = [];
    createBoard();
    updateMessage();
}

function createBoard() {
    const boardElement = document.querySelector(".board");
    boardElement.innerHTML = "";
    boardElement.style.gridTemplateColumns = `repeat(3, 100px)`;
    boardElement.style.gridTemplateRows = `repeat(3, 100px)`;

    for (let i = 0; i < board.length; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.setAttribute("data-index", i);
        cell.addEventListener("click", handleCellClick);
        boardElement.appendChild(cell);
    }
}

function handleCellClick(e) {
    const index = e.target.getAttribute("data-index");
    if (!gameActive || board[index]) return;

    makeMove(index, currentPlayer);
    if (gameMode === "ai" && gameActive) {
        setTimeout(aiMove, 500);
    }
}

function makeMove(index, player) {
    board[index] = player;
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.textContent = player;
    moveHistory.push({ index, player });

    if (checkWinner(player)) {
        message.textContent = `${player === "X" ? playerXName.value || "Spelare X" : playerOName.value || "Spelare O"} vinner!`;
        updateScore(player);
        highlightWinningCells();
        gameActive = false;
        return;
    }

    if (!board.includes("")) {
        message.textContent = "Oavgjort!";
        gameActive = false;
        return;
    }

    currentPlayer = player === "X" ? "O" : "X";
    updateMessage();
}

function checkWinner(player) {
    return winningCombos.some((combo) =>
        combo.every((index) => board[index] === player)
    );
}

function highlightWinningCells() {
    winningCombos.forEach((combo) => {
        if (combo.every((index) => board[index] === currentPlayer)) {
            combo.forEach((index) => {
                const cell = document.querySelector(`.cell[data-index="${index}"]`);
                cell.classList.add("winner");
            });
        }
    });
}

function aiMove() {
    const difficulty = difficultySelect.value;
    let index;

    if (difficulty === "easy") {
        const emptyIndices = getEmptyIndices();
        index = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    } else if (difficulty === "medium") {
        index = getBestMoveMedium();
    } else {
        index = getBestMove(board, currentPlayer).index;
    }

    makeMove(index, currentPlayer);
}

function getEmptyIndices() {
    return board.map((val, idx) => (val === "" ? idx : null)).filter((val) => val !== null);
}

function getBestMoveMedium() {
    const emptyIndices = getEmptyIndices();
    return emptyIndices.find((idx) => testWin(idx, "O") || testWin(idx, "X")) || emptyIndices[0];
}

function testWin(index, player) {
    const testBoard = [...board];
    testBoard[index] = player;
    return checkWinner(player);
}

function getBestMove(newBoard, player) {
    const availSpots = getEmptyIndices(newBoard);

    if (checkWinner("X", newBoard)) return { score: -10 };
    if (checkWinner("O", newBoard)) return { score: 10 };
    if (availSpots.length === 0) return { score: 0 };

    const moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === "O") {
            const result = getBestMove(newBoard, "X");
            move.score = result.score;
        } else {
            const result = getBestMove(newBoard, "O");
            move.score = result.score;
        }

        newBoard[availSpots[i]] = "";
        moves.push(move);
    }

    let bestMove;
    if (player === "O") {
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove];
}

function updateScore(player) {
    if (player === "X") {
        scoreX++;
        document.getElementById("scoreX").textContent = scoreX;
    } else {
        scoreO++;
        document.getElementById("scoreO").textContent = scoreO;
    }
}

function updateMessage() {
    message.textContent = `Det är ${currentPlayer === "X" ? playerXName.value || "Spelare X" : playerOName.value || "Spelare O"}'s tur`;
}

function restartGame() {
    initGame();
    message.textContent = "Välj ett läge och börja spela!";
}

function undoMove() {
    if (!moveHistory.length) return;

    const lastMove = moveHistory.pop();
    board[lastMove.index] = "";
    const cell = document.querySelector(`.cell[data-index="${lastMove.index}"]`);
    cell.textContent = "";
    currentPlayer = lastMove.player;
    gameActive = true;
    updateMessage();
}

function saveGame() {
    const gameState = {
        board,
        currentPlayer,
        gameMode,
        scoreX,
        scoreO,
        moveHistory,
    };
    localStorage.setItem("tikTakToeGameState", JSON.stringify(gameState));
    message.textContent = "Spelet sparat!";
}

function loadGame() {
    const gameState = JSON.parse(localStorage.getItem("tikTakToeGameState"));
    if (!gameState) {
        message.textContent = "Inget sparat spel hittades!";
        return;
    }

    board = gameState.board;
    currentPlayer = gameState.currentPlayer;
    gameMode = gameState.gameMode;
    scoreX = gameState.scoreX;
    scoreO = gameState.scoreO;
    moveHistory = gameState.moveHistory;

    createBoard();
    updateBoardUI();
    updateMessage();
    updateScores();
    gameActive = true;
}

function updateBoardUI() {
    const boardElement = document.querySelector(".board");
    for (let i = 0; i < board.length; i++) {
        const cell = document.querySelector(`.cell[data-index="${i}"]`);
        cell.textContent = board[i];
    }
}

function updateScores() {
    document.getElementById("scoreX").textContent = scoreX;
    document.getElementById("scoreO").textContent = scoreO;
}

twoPlayerMode.addEventListener("click", () => {
    gameMode = "twoPlayer";
    restartGame();
    message.textContent = "2 Spelare läge aktiverat!";
});

aiMode.addEventListener("click", () => {
    gameMode = "ai";
    restartGame();
    message.textContent = "Spela mot AI läge aktiverat!";
});

restartButton.addEventListener("click", restartGame);
undoButton.addEventListener("click", undoMove);
saveGameButton.addEventListener("click", saveGame);
loadGameButton.addEventListener("click", loadGame);

initGame();
