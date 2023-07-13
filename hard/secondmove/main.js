// Game Constants
let flag = 1;
const ROWS = 6;
const COLS = 7;
const PLAYER1_COLOR = 'red';
const PLAYER2_COLOR = 'yellow';
const sleep = async (ms) => {
    return new Promise(
        (resolve, reject) => setTimeout(
            () => resolve(), ms * 1000));
};
const _awaitUnlock = async (mutex) => {
    // 잠금 상태가 아님 -> 즉시 resolve
    if (!mutex._locked) {
        return Promise.resolve()
    }
    return new Promise((resolve) => {
        // 0.1초 후에 다시 확인
        setTimeout(() => {
            _awaitUnlock(mutex).then(() => resolve())
        }, 100)
    })
}
class Mutex {
    constructor() {
        this._locked = false
    }
    async lock() {
        // 잠금 상태가 풀릴 때 까지 대기
        await _awaitUnlock(this)
        this._locked = true
    }
    // 잠금 해제는 별도의 제약을 주지 않음.
    unlock() {
        this._locked = false
    }
}
let board = [];
let currentPlayer = 2;
const mutex = new Mutex()
// Create the game board
const boardElement = document.querySelector('.board');
for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('data-row', row);
        cell.setAttribute('data-col', col);
        boardElement.appendChild(cell);
    }
}
// Add event listener to cells
const cells = document.querySelectorAll('.cell');
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
flag = 0;
async function cpu_turn() {
    let col;
    try {
        const response = await axios({
            method: "POST",
            url: 'http://pwnable.co.kr:10004/get_next_action/',
            data: {
                "list": board,
                "difficulty":"hard"
            },
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            }
        });
        col = response.data; // Assuming the response contains the assigned column value
        console.log(col); // Do something with the received response
    } catch (error) {
        console.error('Error:', error);
    }
    // Find the lowest available row in the selected column
    let row = ROWS - 1;
    while (row >= 0 && board[row][col]) {
        row--;
    }
    // Fall all the way down if there is no stone underneath
    if (row < 0) {
        row = 0;
        while (row < ROWS && board[row][col]) {
            row++;
        }
    }
    // Update the game board
    board[row][col] = currentPlayer;
    // Update the cell color
    const color = currentPlayer === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
    //clickedCell.style.backgroundColor = color;
    // Reflect the changes on the screen
    const rowCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    rowCell.style.backgroundColor = color;
    await sleep(0.2);
    // Check for a win
    if (checkWin(row, col)) {
        const winner = currentPlayer === 1 ? 'Player 1' : 'Player 2';
        alert(`${winner} wins!`);
        resetGame();
        return;
    }
    // Switch players
    currentPlayer = 2;
    mutex.unlock()
}
// Handle cell click event
async function handleCellClick(e) {
    await mutex.lock()
    currentPlayer = 1;
    const clickedCell = e.target;
    const col = parseInt(clickedCell.getAttribute('data-col'));
    // Find the lowest available row in the selected column
    let row = ROWS - 1;
    while (row >= 0 && board[row][col]) {
        row--;
    }
    // Fall all the way down if there is no stone underneath
    if (row < 0) {
        row = 0;
        while (row < ROWS && board[row][col]) {
            row++;
        }
    }
    // Update the game board
    board[row][col] = currentPlayer;
    // Update the cell color
    const color = currentPlayer === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
    //clickedCell.style.backgroundColor = color;
    // Reflect the changes on the screen
    const rowCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    rowCell.style.backgroundColor = color;
    //setTimeout(() => {}, 1000);
    await sleep(0.2);
    // Check for a win
    if (checkWin(row, col)) {
        const winner = currentPlayer === 1 ? 'Player 1' : 'Player 2';
        alert(`${winner} wins!`);
        resetGame();
        return;
    }
    // Switch players
    currentPlayer = 2;
    cpu_turn();
}
// Check for a win
function checkWin(row, col) {
    const color = currentPlayer === 1 ? PLAYER1_COLOR : PLAYER2_COLOR;
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            if (board[i][j] == currentPlayer) {
                // horizontal
                if ((j + 3 < COLS) && (board[i][j + 1] == currentPlayer) && (board[i][j + 2] == currentPlayer) && (board[i][j + 3] == currentPlayer)) {
                    console.log(1)
                    console.log("i")
                    console.log(i)
                    console.log("j")
                    console.log(j)
                    return true;
                }
                // vertical
                if ((i + 3 < ROWS) && (board[i + 1][j] == currentPlayer) && (board[i + 2][j] == currentPlayer) && (board[i + 3][j] == currentPlayer)) {
                    console.log(2)
                    return true;
                }
                // diagonal (down right)
                if ((i + 3 < ROWS) && (j + 3 < COLS) && (board[i + 1][j + 1] == currentPlayer) && (board[i + 2][j + 2] == currentPlayer) && (board[i + 3][j + 3] == currentPlayer)) {
                    console.log(3)
                    return true;
                }
                // diagonal (up right)
                if ((i - 3 >= 0) && (j + 3 < COLS) && (board[i - 1][j + 1] == currentPlayer) && (board[i - 2][j + 2] == currentPlayer) && (board[i - 3][j + 3] == currentPlayer)) {
                    console.log(4)
                    return true;
                }
            }
        }
    }
    return false;
}
// Reset the game
function resetGame() {
    board = [];
    currentPlayer = 1;
    cells.forEach(cell => {
        cell.style.backgroundColor = 'lightblue';
    });
    location.reload()
}
// Initialize the game board
function initializeBoard() {
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
}
initializeBoard();