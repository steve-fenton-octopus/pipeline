/**
 * Pipeline: The Undersea Maze
 * Core Game Logic
 */

// --- Configuration ---
const config = {
    gridSize: 20,
    cellSize: 100,
    playerSpeed: 5,
    playerRadius: 10,
    mazeWidth: 20,
    mazeHeight: 20
};

const SVG_NS = "http://www.w3.org/2000/svg";
const ONE_SECOND = 1000;
const TIME_PENALTY = 3000;

// --- Game State ---
const state = {
    player: { x: 50, y: 50 },
    keys: {},
    targets: [
        { id: 'dev', label: 'Dev', reached: false, x: 0, y: 0 },
        { id: 'test', label: 'Test', reached: false, x: 0, y: 0 },
        { id: 'prod', label: 'Production', reached: false, x: 0, y: 0 }
    ],
    currentTargetIndex: 0,
    maze: null,
    isVictory: false,
    victoryTime: 0,
    level: 1,
    startTime: null,
    levelStartTime: null,
    score: 0,
    highScore: parseInt(localStorage.getItem('pipeline-high-score')) || 0,
    touch: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    },
    showCompass: false
};

// --- DOM Elements ---
const svg = document.getElementById('game-svg');
const worldLayer = document.getElementById('world-layer');
const mazeLayer = document.getElementById('maze-layer');
const targetLayer = document.getElementById('target-layer');
const playerEl = document.getElementById('player');
const telescope = document.getElementById('compass-telescope');
const container = document.getElementById('game-container');
const victoryOverlay = document.getElementById('victory-overlay');

// --- Maze Generation (Recursive Backtracker) ---

/**
 * Generates a maze using recursive backtracking algorithm.
 */
function generateMaze(width, height) {
    const maze = Array.from({ length: height }, () =>
        Array.from({ length: width }, () => ({
            visited: false,
            walls: { top: true, right: true, bottom: true, left: true }
        }))
    );

    const stack = [];
    const startNode = { x: 0, y: 0 };
    maze[0][0].visited = true;
    stack.push(startNode);

    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = getUnvisitedNeighbors(current, maze, width, height);

        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            removeWall(current, next, maze);
            maze[next.y][next.x].visited = true;
            stack.push(next);
        } else {
            stack.pop();
        }
    }
    return maze;
}

function getUnvisitedNeighbors(node, maze, width, height) {
    const neighbors = [];
    const { x, y } = node;

    if (y > 0 && !maze[y - 1][x].visited) neighbors.push({ x, y: y - 1, dir: 'top' });
    if (x < width - 1 && !maze[y][x + 1].visited) neighbors.push({ x: x + 1, y, dir: 'right' });
    if (y < height - 1 && !maze[y + 1][x].visited) neighbors.push({ x, y: y + 1, dir: 'bottom' });
    if (x > 0 && !maze[y][x - 1].visited) neighbors.push({ x: x - 1, y, dir: 'left' });

    return neighbors;
}

function removeWall(current, next, maze) {
    const dx = next.x - current.x;
    const dy = next.y - current.y;

    if (dx === 1) {
        maze[current.y][current.x].walls.right = false;
        maze[next.y][next.x].walls.left = false;
    } else if (dx === -1) {
        maze[current.y][current.x].walls.left = false;
        maze[next.y][next.x].walls.right = false;
    } else if (dy === 1) {
        maze[current.y][current.x].walls.bottom = false;
        maze[next.y][next.x].walls.top = false;
    } else if (dy === -1) {
        maze[current.y][current.x].walls.top = false;
        maze[next.y][next.x].walls.bottom = false;
    }
}

// --- Rendering ---

/**
 * Renders the maze structure as pipes in the SVG.
 */
function renderMaze(maze) {
    const s = config.cellSize;
    let d = "";
    for (let y = 0; y < config.mazeHeight; y++) {
        for (let x = 0; x < config.mazeWidth; x++) {
            const cell = maze[y][x];
            const cx = x * s;
            const cy = y * s;

            if (!cell.walls.right) {
                d += `M ${cx + s / 2} ${cy + s / 2} L ${cx + s + s / 2} ${cy + s / 2} `;
            }
            if (!cell.walls.bottom) {
                d += `M ${cx + s / 2} ${cy + s / 2} L ${cx + s / 2} ${cy + s + s / 2} `;
            }
        }
    }

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("stroke", "var(--pipe-color)");
    path.setAttribute("stroke-width", "40");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("fill", "none");
    mazeLayer.appendChild(path);

    const glowPath = path.cloneNode();
    glowPath.setAttribute("stroke", "var(--pipe-glow)");
    glowPath.setAttribute("stroke-width", "42");
    glowPath.setAttribute("opacity", "0.1");
    mazeLayer.appendChild(glowPath);
}

/**
 * Initializes target nodes for the current level.
 */
function initTargets() {
    const s = config.cellSize;
    targetLayer.innerHTML = "";

    const activeTargetCount = Math.min(state.level, 3);
    const activeTargets = state.targets.slice(0, activeTargetCount);

    const getRandPos = () => ({
        x: Math.floor(Math.random() * (config.mazeWidth - 2) + 1) * s + s / 2,
        y: Math.floor(Math.random() * (config.mazeHeight - 2) + 1) * s + s / 2
    });

    activeTargets.forEach((t, i) => {
        const pos = getRandPos();
        t.x = pos.x;
        t.y = pos.y;
        t.reached = false;

        const group = document.createElementNS(SVG_NS, "g");
        group.id = `target-obj-${t.id}`;
        group.setAttribute("transform", `translate(${t.x}, ${t.y})`);

        const animGroup = document.createElementNS(SVG_NS, "g");
        animGroup.classList.add('target-node');
        group.appendChild(animGroup);

        let el;
        if (t.id === 'prod') {
            el = document.createElementNS(SVG_NS, "path");
            el.setAttribute("d", "M -10 -10 L 10 -10 L 10 -2 L 0 10 L -10 -2 Z");
            el.setAttribute("fill", "var(--prod-color)");
        } else {
            el = document.createElementNS(SVG_NS, "rect");
            el.setAttribute("x", "-15");
            el.setAttribute("y", "-15");
            el.setAttribute("width", "30");
            el.setAttribute("height", "30");
            el.setAttribute("rx", "4");
            el.setAttribute("fill", t.id === 'dev' ? 'var(--dev-color)' : 'var(--test-color)');
        }

        el.setAttribute("filter", "url(#glow)");
        animGroup.appendChild(el);

        const text = document.createElementNS(SVG_NS, "text");
        text.textContent = t.label;
        text.setAttribute("y", "35");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "white");
        text.setAttribute("font-size", "12");
        text.setAttribute("font-weight", "bold");
        animGroup.appendChild(text);

        targetLayer.appendChild(group);
        if (i > 0) group.setAttribute("opacity", "0.2");
    });

    updateUI();
}

// --- UI Management ---

function updateUI() {
    const levelEl = document.getElementById('level-num');
    if (levelEl) levelEl.textContent = state.level;

    const highScoreEl = document.getElementById('high-score-val');
    if (highScoreEl) highScoreEl.textContent = state.highScore.toLocaleString();

    const currentScoreEl = document.getElementById('current-score-val');
    if (currentScoreEl) currentScoreEl.textContent = state.score.toLocaleString();

    const activeTargetCount = Math.min(state.level, 3);

    state.targets.forEach((t, i) => {
        const chip = document.getElementById(`status-${t.id}`);
        const obj = document.getElementById(`target-obj-${t.id}`);

        if (!chip) return;

        if (i >= activeTargetCount) {
            chip.style.display = "none";
            return;
        }
        chip.style.display = "flex";

        chip.style.opacity = "0.2";
        chip.style.textDecoration = "none";
        chip.classList.remove('active');
        if (obj) obj.setAttribute("opacity", "0.2");

        if (t.reached) {
            chip.style.opacity = "0.4";
            chip.style.textDecoration = "line-through";
            if (obj) obj.setAttribute("opacity", "0.3");
        } else if (i === state.currentTargetIndex) {
            chip.style.opacity = "1";
            chip.classList.add('active');
            if (obj) obj.setAttribute("opacity", "1");
        }
    });
}

// --- Input Handling ---

// Keyboard
window.addEventListener('keydown', e => state.keys[e.code] = true);
window.addEventListener('keyup', e => state.keys[e.code] = false);

// Touch/Drag for Movement
container.addEventListener('touchstart', e => {
    if (state.isVictory) return;
    const touch = e.touches[0];
    state.touch.active = true;
    state.touch.startX = touch.clientX;
    state.touch.startY = touch.clientY;
    state.touch.currentX = touch.clientX;
    state.touch.currentY = touch.clientY;
}, { passive: false });

container.addEventListener('touchmove', e => {
    if (!state.touch.active) return;
    const touch = e.touches[0];
    state.touch.currentX = touch.clientX;
    state.touch.currentY = touch.clientY;
    e.preventDefault();
}, { passive: false });

container.addEventListener('touchend', () => {
    state.touch.active = false;
});

// Tap Octopus to Toggle Compass
playerEl.addEventListener('touchstart', e => {
    state.showCompass = !state.showCompass;
    e.stopPropagation();
}, { passive: false });

playerEl.addEventListener('click', e => {
    state.showCompass = !state.showCompass;
    e.stopPropagation();
});

// Victory Screen Interaction
const handleVictoryInteraction = () => {
    if (state.isVictory && Date.now() - state.victoryTime > ONE_SECOND) {
        hideVictory();
    }
};
victoryOverlay.addEventListener('touchstart', handleVictoryInteraction);
victoryOverlay.addEventListener('click', handleVictoryInteraction);

// --- Movement and Collision ---

/**
 * Checks if the player can move to the given SVG coordinates.
 */
function canMoveTo(x, y) {
    const s = config.cellSize;
    const r = config.playerRadius;
    const pw = 40;
    const margin = (pw / 2) - r + 5;

    const cellX = Math.floor(x / s);
    const cellY = Math.floor(y / s);

    if (cellX < 0 || cellX >= config.mazeWidth || cellY < 0 || cellY >= config.mazeHeight) return false;

    const cell = state.maze[cellY][cellX];
    const centerX = cellX * s + s / 2;
    const centerY = cellY * s + s / 2;

    const distToCenter = Math.hypot(x - centerX, y - centerY);
    if (distToCenter < margin) return true;

    if (!cell.walls.right && x > centerX && Math.abs(y - centerY) < margin && x < (cellX + 1) * s + s / 2) return true;
    if (cellX > 0 && !state.maze[cellY][cellX - 1].walls.right && x < centerX && Math.abs(y - centerY) < margin && x > (cellX - 1) * s + s / 2) return true;

    if (!cell.walls.bottom && y > centerY && Math.abs(x - centerX) < margin && y < (cellY + 1) * s + s / 2) return true;
    if (cellY > 0 && !state.maze[cellY - 1][cellX].walls.bottom && y < centerY && Math.abs(x - centerX) < margin && y > (cellY - 1) * s + s / 2) return true;

    return false;
}

/**
 * Updates player position based on input and checks for target collisions.
 */
function updatePlayer() {
    if (state.isVictory) {
        if (state.keys['Space'] && Date.now() - state.victoryTime > ONE_SECOND) {
            hideVictory();
        }
        return;
    }

    let dx = 0;
    let dy = 0;

    // Keyboard Input
    if (state.keys['ArrowUp'] || state.keys['KeyW']) dy -= config.playerSpeed;
    if (state.keys['ArrowDown'] || state.keys['KeyS']) dy += config.playerSpeed;
    if (state.keys['ArrowLeft'] || state.keys['KeyA']) dx -= config.playerSpeed;
    if (state.keys['ArrowRight'] || state.keys['KeyD']) dx += config.playerSpeed;

    // Touch/Drag Input
    if (state.touch.active) {
        const tx = state.touch.currentX - state.touch.startX;
        const ty = state.touch.currentY - state.touch.startY;
        const dist = Math.hypot(tx, ty);
        const threshold = 10;

        if (dist > threshold) {
            dx = (tx / dist) * config.playerSpeed;
            dy = (ty / dist) * config.playerSpeed;
        }
    }

    const nextX = state.player.x + dx;
    const nextY = state.player.y + dy;

    if (state.level === 1 && !state.startTime && (dx !== 0 || dy !== 0)) {
        state.startTime = Date.now();
    }

    if (canMoveTo(nextX, nextY)) {
        state.player.x = nextX;
        state.player.y = nextY;
    } else if (canMoveTo(state.player.x + dx, state.player.y)) {
        state.player.x += dx;
    } else if (canMoveTo(state.player.x, state.player.y + dy)) {
        state.player.y += dy;
    }

    playerEl.setAttribute("x", state.player.x - 10);
    playerEl.setAttribute("y", state.player.y - 10);

    // Compass Logic
    if (state.keys['Space'] || state.showCompass) {
        const target = state.targets[state.currentTargetIndex];
        if (target) {
            telescope.setAttribute("opacity", "1");
            const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
            const deg = angle * 180 / Math.PI;
            telescope.setAttribute("transform", `translate(${state.player.x}, ${state.player.y}) rotate(${deg})`);
        }
    } else {
        telescope.setAttribute("opacity", "0");
    }

    // Check Target Reached
    const activeTargetCount = Math.min(state.level, 3);
    const currentTarget = state.targets[state.currentTargetIndex];
    if (currentTarget && state.currentTargetIndex < activeTargetCount) {
        const dist = Math.hypot(state.player.x - currentTarget.x, state.player.y - currentTarget.y);
        if (dist < 30) {
            currentTarget.reached = true;
            state.currentTargetIndex++;
            updateUI();

            if (state.currentTargetIndex >= activeTargetCount) {
                showVictory();
            }
        }
    }

    // Viewbox Camera Follow
    const vw = 800;
    const vh = 600;
    const vx = state.player.x - vw / 2;
    const vy = state.player.y - vh / 2;
    svg.setAttribute("viewBox", `${vx} ${vy} ${vw} ${vh}`);
}

// --- Level and Game Life Cycle ---

function showVictory() {
    state.isVictory = true;
    state.victoryTime = Date.now();
    const scoreDisplay = document.getElementById('score-display');
    const accumulatedDisplay = document.getElementById('total-score-display');

    let levelScore = 20000;
    if (state.level === 3) {
        const seconds = (Date.now() - state.startTime) / ONE_SECOND;
        levelScore = Math.max(0, 1000000 - Math.floor(seconds * TIME_PENALTY));
    } else if (state.level > 3) {
        const seconds = (Date.now() - state.levelStartTime) / ONE_SECOND;
        levelScore = Math.max(0, 500000 - Math.floor(seconds * TIME_PENALTY));
    }

    if (levelScore > 0) {
        state.score += levelScore;
        document.getElementById('final-score').textContent = levelScore.toLocaleString();
        document.getElementById('accumulated-score').textContent = state.score.toLocaleString();
        scoreDisplay.style.display = 'block';
        accumulatedDisplay.style.display = 'block';

        if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem('pipeline-high-score', state.score);
        }
        updateUI();
    } else {
        scoreDisplay.style.display = 'none';
        accumulatedDisplay.style.display = 'none';
    }

    victoryOverlay.style.display = 'flex';
}

function hideVictory() {
    state.isVictory = false;
    victoryOverlay.style.display = 'none';
    state.level++;
    state.levelStartTime = Date.now();
    resetGame();
}

function resetGame() {
    state.currentTargetIndex = 0;
    state.player = { x: 50, y: 50 };
    state.showCompass = false;

    mazeLayer.innerHTML = "";
    state.maze = generateMaze(config.mazeWidth, config.mazeHeight);
    renderMaze(state.maze);

    initTargets();
}

function gameLoop() {
    updatePlayer();
    requestAnimationFrame(gameLoop);
}

// --- Initialize ---
function init() {
    state.maze = generateMaze(config.mazeWidth, config.mazeHeight);
    renderMaze(state.maze);
    initTargets();
    gameLoop();
}

init();
