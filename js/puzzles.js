/**
 * ZYRON - Alien Energy Circuit Puzzle (Koinot Jumboqlari)
 * Interactive circuit connection mini-game to unlock ancient alien vaults and earn coins
 */

class AlienPuzzleGame {
    constructor() {
        this.size = 3; // 3x3 grid
        this.grid = [];
        this.solved = false;
        this.currentReward = 300;
        this.timer = 0;
        this.timerInterval = null;
    }

    // Directions: 0: Up, 1: Right, 2: Down, 3: Left
    // Pipe types:
    // 'line': connects [0, 2] (vertical) or [1, 3] (horizontal)
    // 'corner': connects [0, 1], [1, 2], [2, 3], [3, 0]
    // 'tee': connects 3 sides
    // 'cross': connects all 4 sides
    initPuzzle(size = 3) {
        this.size = size;
        this.solved = false;
        this.currentReward = 200 + this.size * 50 + Math.floor(Math.random() * 80);
        this.grid = [];
        this.timer = 0;

        // Generate guaranteed solvable path from (0,0) to (size-1, size-1)
        const path = this.generateSolvablePath(this.size);
        
        // Populate grid based on the solution
        for (let r = 0; r < this.size; r++) {
            const row = [];
            for (let c = 0; c < this.size; c++) {
                const requiredConnections = path.connections[`${r},${c}`] || [];
                let tile;

                if (requiredConnections.length === 0) {
                    // Random filler tile
                    tile = this.createRandomTile();
                } else if (requiredConnections.length === 1) {
                    // Start or End node
                    const dir = requiredConnections[0];
                    tile = {
                        type: 'line',
                        connections: [(dir + 2) % 4, dir],
                        rotation: dir % 2 === 0 ? 0 : 1
                    };
                } else if (requiredConnections.length === 2) {
                    const [d1, d2] = requiredConnections;
                    if (Math.abs(d1 - d2) === 2) {
                        tile = { type: 'line', connections: [0, 2], rotation: 0 };
                    } else {
                        tile = { type: 'corner', connections: [0, 1], rotation: 0 };
                    }
                } else {
                    tile = { type: 'tee', connections: [0, 1, 2], rotation: 0 };
                }

                // Scramble rotation (0, 1, 2, or 3 rotations)
                const scramble = Math.floor(Math.random() * 4);
                this.rotateTileData(tile, scramble);

                row.push(tile);
            }
            this.grid.push(row);
        }

        // Render to UI
        this.render();
        this.startTimer();
    }

    createRandomTile() {
        const types = ['line', 'corner', 'corner', 'tee'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        let connections = [];
        if (chosen === 'line') connections = [0, 2];
        else if (chosen === 'corner') connections = [0, 1];
        else if (chosen === 'tee') connections = [0, 1, 2];
        else connections = [0, 1, 2, 3];
        return { type: chosen, connections: connections, rotation: 0 };
    }

    generateSolvablePath(size) {
        // Simple random walk from (0,0) to (size-1, size-1)
        const connections = {};
        let cr = 0, cc = 0;
        const visited = new Set();
        visited.add(`0,0`);

        while (cr < size - 1 || cc < size - 1) {
            const moves = [];
            if (cr < size - 1) moves.push({ dr: 1, dc: 0, dir: 2 }); // Down
            if (cc < size - 1) moves.push({ dr: 0, dc: 1, dir: 1 }); // Right
            // Occasionally up or left if room and not visited
            const chosen = moves[Math.floor(Math.random() * moves.length)];
            const nr = cr + chosen.dr;
            const nc = cc + chosen.dc;

            const fromKey = `${cr},${cc}`;
            const toKey = `${nr},${nc}`;

            connections[fromKey] = connections[fromKey] || [];
            connections[toKey] = connections[toKey] || [];

            connections[fromKey].push(chosen.dir);
            connections[toKey].push((chosen.dir + 2) % 4);

            cr = nr;
            cc = nc;
            visited.add(toKey);
        }

        // Add start and end pins
        // Start enters from left (3) or up (0)
        connections['0,0'] = connections['0,0'] || [];
        if (!connections['0,0'].includes(3)) connections['0,0'].push(3); // In from West
        
        // End exits to right (1) or down (2)
        const endKey = `${size - 1},${size - 1}`;
        connections[endKey] = connections[endKey] || [];
        if (!connections[endKey].includes(1)) connections[endKey].push(1); // Out to East

        return { connections };
    }

    rotateTileData(tile, count = 1) {
        for (let i = 0; i < count; i++) {
            tile.connections = tile.connections.map(d => (d + 1) % 4);
            tile.rotation = (tile.rotation + 1) % 4;
        }
    }

    rotateTile(r, c) {
        if (this.solved) return;
        const tile = this.grid[r][c];
        this.rotateTileData(tile, 1);
        if (window.soundEngine) window.soundEngine.playClick();
        this.render();
        this.checkSolved();
    }

    checkSolved() {
        // Breadth-first search from (0,0) entering at dir 3 (West)
        const size = this.size;
        const startTile = this.grid[0][0];
        if (!startTile.connections.includes(3)) return false;

        const queue = [{ r: 0, c: 0, inDir: 3 }];
        const visited = new Set();
        const poweredTiles = new Set();
        poweredTiles.add(`0,0`);

        let reachedEnd = false;

        while (queue.length > 0) {
            const { r, c } = queue.shift();
            const key = `${r},${c}`;
            visited.add(key);
            poweredTiles.add(key);

            if (r === size - 1 && c === size - 1 && this.grid[r][c].connections.includes(1)) {
                reachedEnd = true;
            }

            const current = this.grid[r][c];
            // Check all outgoing connections
            for (const outDir of current.connections) {
                let nr = r, nc = c;
                let neededInDir = (outDir + 2) % 4;

                if (outDir === 0) nr--; // Up
                else if (outDir === 1) nc++; // Right
                else if (outDir === 2) nr++; // Down
                else if (outDir === 3) nc--; // Left

                if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                    const nextTile = this.grid[nr][nc];
                    const nextKey = `${nr},${nc}`;
                    if (nextTile.connections.includes(neededInDir) && !visited.has(nextKey)) {
                        queue.push({ r: nr, c: nc, inDir: neededInDir });
                    }
                }
            }
        }

        // Highlight energized wires
        document.querySelectorAll('.puzzle-tile').forEach(el => {
            const r = parseInt(el.dataset.r);
            const c = parseInt(el.dataset.c);
            if (poweredTiles.has(`${r},${c}`)) {
                el.classList.add('powered');
            } else {
                el.classList.remove('powered');
            }
        });

        if (reachedEnd && !this.solved) {
            this.handleSolveSuccess();
            return true;
        }

        return false;
    }

    handleSolveSuccess() {
        this.solved = true;
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (window.soundEngine) window.soundEngine.playSuccess();

        const reward = this.currentReward;
        window.gameStorage.addCoins(reward);
        window.gameStorage.recordStat('puzzlesSolved', 1);

        const statusEl = document.getElementById('puzzle-status-text');
        const claimBtn = document.getElementById('puzzle-claim-btn');

        if (statusEl) {
            statusEl.innerHTML = `<span style="color:#00ff88; font-weight:bold;">🎉 JUMBOQ YECHILDI! +${reward} 💰 Tanga hisobingizga qo'shildi!</span>`;
        }
        if (claimBtn) {
            claimBtn.classList.remove('hidden');
        }
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const timerEl = document.getElementById('puzzle-timer');
        this.timerInterval = setInterval(() => {
            this.timer++;
            if (timerEl) {
                const m = Math.floor(this.timer / 60).toString().padStart(2, '0');
                const s = (this.timer % 60).toString().padStart(2, '0');
                timerEl.textContent = `${m}:${s}`;
            }
        }, 1000);
    }

    render() {
        const board = document.getElementById('puzzle-board');
        if (!board) return;

        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const tile = this.grid[r][c];
                const tileDiv = document.createElement('div');
                tileDiv.className = 'puzzle-tile';
                tileDiv.dataset.r = r;
                tileDiv.dataset.c = c;

                // SVG Conduit Graphics
                tileDiv.innerHTML = this.getTileSvg(tile, r, c);
                tileDiv.onclick = () => this.rotateTile(r, c);

                board.appendChild(tileDiv);
            }
        }
    }

    getTileSvg(tile, r, c) {
        const isStart = (r === 0 && c === 0);
        const isEnd = (r === this.size - 1 && c === this.size - 1);

        let linesSvg = '';
        // Draw lines from center (50, 50) to connected edges
        for (const dir of tile.connections) {
            let x2 = 50, y2 = 50;
            if (dir === 0) { x2 = 50; y2 = 0; }
            else if (dir === 1) { x2 = 100; y2 = 50; }
            else if (dir === 2) { x2 = 50; y2 = 100; }
            else if (dir === 3) { x2 = 0; y2 = 50; }
            linesSvg += `<line x1="50" y1="50" x2="${x2}" y2="${y2}" class="conduit-line" stroke-width="12" stroke-linecap="round"/>`;
        }

        let badge = '';
        if (isStart) badge = `<circle cx="50" cy="50" r="16" fill="#00f0ff" /><text x="50" y="55" text-anchor="middle" font-size="14" fill="#000" font-weight="bold">IN</text>`;
        else if (isEnd) badge = `<circle cx="50" cy="50" r="16" fill="#ffd700" /><text x="50" y="55" text-anchor="middle" font-size="13" fill="#000" font-weight="bold">OUT</text>`;
        else badge = `<circle cx="50" cy="50" r="8" fill="#1b2a4a" stroke="#00d4ff" stroke-width="2"/>`;

        return `
            <svg viewBox="0 0 100 100" class="tile-svg">
                <rect width="100" height="100" rx="8" fill="#0b1329" stroke="rgba(0,240,255,0.25)" stroke-width="2" />
                ${linesSvg}
                ${badge}
            </svg>
        `;
    }
}

window.AlienPuzzleGame = AlienPuzzleGame;
window.alienPuzzle = new AlienPuzzleGame();
