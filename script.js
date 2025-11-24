document.addEventListener('DOMContentLoaded', function() {
    // constants
    const GRID_SIZE = 4;
    const CELL_COUNT = GRID_SIZE * GRID_SIZE;
    
    // state
    let grid = [];
    let score = 0;
    let bestScore = 0;
    let gameOver = false;
    let gameWon = false;
    let previousState = null;
    
    // DOM elements
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('best-score');
    const newGameButton = document.getElementById('new-game');
    const undoButton = document.getElementById('undo');
    const gameOverModal = document.getElementById('game-over-modal');
    const finalScoreElement = document.getElementById('final-score');
    const playerNameInput = document.getElementById('player-name');
    const saveScoreButton = document.getElementById('save-score');
    const scoreSavedElement = document.getElementById('score-saved');
    const tryAgainButton = document.getElementById('try-again');
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const showLeaderboardButton = document.getElementById('show-leaderboard');
    const closeLeaderboardButton = document.getElementById('close-leaderboard');
    const leaderboardBody = document.getElementById('leaderboard-body');
    const mobileControls = document.getElementById('mobile-controls');
    const upButton = document.getElementById('up');
    const downButton = document.getElementById('down');
    const leftButton = document.getElementById('left');
    const rightButton = document.getElementById('right');
    const nameInputContainer = document.getElementById('name-input-container');
    
    // start
    function init() {
        loadBestScore();
        loadLeaderboard();
        createGrid();
        setupEventListeners();
        startGame();
        
        // for mobile devices
        if (isMobileDevice()) {
            mobileControls.style.display = 'grid';
        }
    }
    
    // create
    function createGrid() {
        // clear
        while (gameBoard.firstChild) {
            gameBoard.removeChild(gameBoard.firstChild);
        }
        
        // create empty cells
        for (let i = 0; i < CELL_COUNT; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            gameBoard.appendChild(cell);
        }
        
        // grid array
        grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    }
    
    // event listeners
    function setupEventListeners() {
        // keyboard
        document.addEventListener('keydown', handleKeyPress);
        
        // button
        newGameButton.addEventListener('click', startGame);
        undoButton.addEventListener('click', undoMove);
        saveScoreButton.addEventListener('click', saveScore);
        tryAgainButton.addEventListener('click', startGame);
        showLeaderboardButton.addEventListener('click', showLeaderboard);
        closeLeaderboardButton.addEventListener('click', hideLeaderboard);
        
        // mobile
        upButton.addEventListener('click', () => moveTiles('up'));
        downButton.addEventListener('click', () => moveTiles('down'));
        leftButton.addEventListener('click', () => moveTiles('left'));
        rightButton.addEventListener('click', () => moveTiles('right'));
        
        // swipe
        let touchStartX, touchStartY;
        
        gameBoard.addEventListener('touchstart', function(e) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });
        
        gameBoard.addEventListener('touchend', function(e) {
            if (!touchStartX || !touchStartY) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            
            // precision
            if (Math.abs(diffX) > 20 || Math.abs(diffY) > 20) {
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    // H
                    if (diffX > 0) {
                        moveTiles('left');
                    } else {
                        moveTiles('right');
                    }
                } else {
                    // Ve
                    if (diffY > 0) {
                        moveTiles('up');
                    } else {
                        moveTiles('down');
                    }
                }
            }
            
            touchStartX = null;
            touchStartY = null;
            e.preventDefault();
        }, { passive: false });
    }
    
    // new game
    function startGame() {
        // reset game state
        grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
        score = 0;
        gameOver = false;
        gameWon = false;
        previousState = null;
        
        // update
        updateScore();
        hideGameOverModal();
        
        // clear the board
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());
        
        // add initial tiles
        addRandomTile();
        addRandomTile();
        
        // save initial state for undo
        saveState();
    }
    
    // add a random tile (2 or 4) to an empty cell
    function addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        // if there are empty cells, add a tile
        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            // 90% chance for 2, 10% chance for 4
            const value = Math.random() < 0.9 ? 2 : 4;
            grid[randomCell.row][randomCell.col] = value;
            
            // create tile element
            createTileElement(randomCell.row, randomCell.col, value);
        }
    }
    
    // create a tile element and add it to the board
    function createTileElement(row, col, value, isNew = true) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        const textNode = document.createTextNode(value.toString());
        tile.appendChild(textNode);
        
        tile.dataset.row = row;
        tile.dataset.col = col;
        tile.dataset.value = value;
        
        // position the tile
        const cellSize = (gameBoard.offsetWidth - 75) / GRID_SIZE;
        tile.style.width = `${cellSize}px`;
        tile.style.height = `${cellSize}px`;
        tile.style.top = `${15 + row * (cellSize + 15)}px`;
        tile.style.left = `${15 + col * (cellSize + 15)}px`;
        
        // add animation for new tiles
        if (isNew) {
            tile.style.transform = 'scale(0)';
            setTimeout(() => {
                tile.style.transform = 'scale(1)';
            }, 50);
        }
        
        gameBoard.appendChild(tile);
        return tile;
    }
    
    // keyboard input
    function handleKeyPress(e) {
        if (gameOver) return;
        
        switch(e.key) {
            case 'ArrowUp':
                moveTiles('up');
                break;
            case 'ArrowDown':
                moveTiles('down');
                break;
            case 'ArrowLeft':
                moveTiles('left');
                break;
            case 'ArrowRight':
                moveTiles('right');
                break;
        }
    }
    
    // move tiles
    function moveTiles(direction) {
        if (gameOver) return;
        saveState();
        
        let moved = false;
        let pointsEarned = 0;
        const newGrid = JSON.parse(JSON.stringify(grid));
        
        // movement based on direction
        switch(direction) {
            case 'up':
                for (let col = 0; col < GRID_SIZE; col++) {
                    const column = [];
                    for (let row = 0; row < GRID_SIZE; row++) {
                        column.push(newGrid[row][col]);
                    }
                    const { merged, points } = mergeTiles(column);
                    pointsEarned += points;
                    for (let row = 0; row < GRID_SIZE; row++) {
                        newGrid[row][col] = merged[row];
                    }
                }
                break;
            case 'down':
                for (let col = 0; col < GRID_SIZE; col++) {
                    const column = [];
                    for (let row = GRID_SIZE - 1; row >= 0; row--) {
                        column.push(newGrid[row][col]);
                    }
                    const { merged, points } = mergeTiles(column);
                    pointsEarned += points;
                    for (let row = 0; row < GRID_SIZE; row++) {
                        newGrid[GRID_SIZE - 1 - row][col] = merged[row];
                    }
                }
                break;
            case 'left':
                for (let row = 0; row < GRID_SIZE; row++) {
                    const { merged, points } = mergeTiles(newGrid[row]);
                    pointsEarned += points;
                    newGrid[row] = merged;
                }
                break;
            case 'right':
                for (let row = 0; row < GRID_SIZE; row++) {
                    const reversed = [...newGrid[row]].reverse();
                    const { merged, points } = mergeTiles(reversed);
                    pointsEarned += points;
                    newGrid[row] = merged.reverse();
                }
                break;
        }
        
        // check if the grid changed
        moved = !arraysEqual(grid, newGrid);
        
        if (moved) {
            grid = newGrid;
            score += pointsEarned;
            updateScore();
            updateTiles();
            addRandomTile();

            if (isGameOver()) {
                endGame();
            }
        }
    }
    
    // merge tiles in a row/column
    function mergeTiles(line) {
        let filtered = line.filter(val => val !== 0);
        let points = 0;

        for (let i = 0; i < filtered.length - 1; i++) {
            if (filtered[i] === filtered[i + 1]) {
                filtered[i] *= 2;
                points += filtered[i];
                filtered.splice(i + 1, 1);
            }
        }

        while (filtered.length < GRID_SIZE) {
            filtered.push(0);
        }
        
        return { merged: filtered, points };
    }
    
    // update tiles on the board after movement
    function updateTiles() {
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());

        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] !== 0) {
                    createTileElement(row, col, grid[row][col], false);
                }
            }
        }
    }
    
    // check if the game is over
    function isGameOver() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === 0) {
                    return false;
                }
            }
        }
        
        // check for possible merges
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const value = grid[row][col];
                
                if (col < GRID_SIZE - 1 && grid[row][col + 1] === value) {
                    return false;
                }
                
                if (row < GRID_SIZE - 1 && grid[row + 1][col] === value) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // end the game
    function endGame() {
        gameOver = true;
        showGameOverModal();

        if (score > bestScore) {
            bestScore = score;
            saveBestScore();
            updateScore();
        }
    }
    
    // save
    function saveState() {
        previousState = {
            grid: JSON.parse(JSON.stringify(grid)),
            score: score
        };
        
        // undo button
        undoButton.disabled = false;
    }
    
    // undo the last move
    function undoMove() {
        if (!previousState || gameOver) return;
        
        grid = previousState.grid;
        score = previousState.score;
        previousState = null;
        
        updateScore();
        updateTiles();
        undoButton.disabled = true;
    }
    
    // update score
    function updateScore() {
        scoreElement.textContent = score;
        bestScoreElement.textContent = bestScore;
    }
    
    function showGameOverModal() {
        finalScoreElement.textContent = score;
        gameOverModal.style.display = 'flex';
        scoreSavedElement.classList.add('hidden');
        nameInputContainer.style.display = 'block';
        playerNameInput.value = '';
    }

    function hideGameOverModal() {
        gameOverModal.style.display = 'none';
    }
    
    // save score to leaderboard
    function saveScore() {
        const playerName = playerNameInput.value.trim();
        
        if (playerName === '') {
            alert('Please enter your name');
            return;
        }
        
        // current leaderboard
        let leaderboard = JSON.parse(localStorage.getItem('2048-leaderboard') || '[]');
        
        // add new score
        leaderboard.push({
            name: playerName,
            score: score,
            date: new Date().toLocaleDateString()
        });

        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10);
        
        // localStorage
        localStorage.setItem('2048-leaderboard', JSON.stringify(leaderboard));

        nameInputContainer.style.display = 'none';
        scoreSavedElement.classList.remove('hidden');
        
        // reload leaderboard
        loadLeaderboard();
    }
    
    // leaderboard from localStorage
    function loadLeaderboard() {
        const leaderboard = JSON.parse(localStorage.getItem('2048-leaderboard') || '[]');
        
        // clear leaderboard body
        while (leaderboardBody.firstChild) {
            leaderboardBody.removeChild(leaderboardBody.firstChild);
        }
        
        if (leaderboard.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 4;
            cell.textContent = 'No scores yet';
            row.appendChild(cell);
            leaderboardBody.appendChild(row);
            return;
        }
        
        leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // rank cell
            const rankCell = document.createElement('td');
            rankCell.textContent = (index + 1).toString();
            row.appendChild(rankCell);
            
            // name cell
            const nameCell = document.createElement('td');
            nameCell.textContent = entry.name;
            row.appendChild(nameCell);
            
            // score cell
            const scoreCell = document.createElement('td');
            scoreCell.textContent = entry.score.toString();
            row.appendChild(scoreCell);
            
            // date cell (taken from device time)
            const dateCell = document.createElement('td');
            dateCell.textContent = entry.date;
            row.appendChild(dateCell);
            
            leaderboardBody.appendChild(row);
        });
    }
    
    // show leaderboard
    function showLeaderboard() {
        loadLeaderboard(); // Refresh leaderboard data
        leaderboardModal.style.display = 'flex';
    }
    
    // hide leaderboard
    function hideLeaderboard() {
        leaderboardModal.style.display = 'none';
    }
    
    // load best score from localStorage
    function loadBestScore() {
        bestScore = parseInt(localStorage.getItem('2048-best-score') || '0');
        updateScore();
    }
    
    // save best score to localStorage
    function saveBestScore() {
        localStorage.setItem('2048-best-score', bestScore.toString());
    }
    
    // Check if device is mobile
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // comp
    function arraysEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (a.length !== b.length) return false;
        
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < a[i].length; j++) {
                if (a[i][j] !== b[i][j]) return false;
            }
        }
        
        return true;
    }
    
    // start
    init();
});