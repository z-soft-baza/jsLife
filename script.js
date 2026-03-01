const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');

const cols = 60;
const rows = 40;
const cellSize = Math.floor(canvas.width / cols);

let grid = createGrid();
let running = false;
let intervalId = null;

const startBtn = document.getElementById('startBtn');
const stepBtn = document.getElementById('stepBtn');
const clearBtn = document.getElementById('clearBtn');
const randomBtn = document.getElementById('randomBtn');
const speedInput = document.getElementById('speedInput');

function createGrid(fillRandom = false) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (fillRandom ? (Math.random() > 0.75 ? 1 : 0) : 0)),
  );
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      ctx.fillStyle = grid[row][col] ? '#22d3ee' : '#334155';
      ctx.fillRect(col * cellSize, row * cellSize, cellSize - 1, cellSize - 1);
    }
  }
}

function getNeighbors(row, col) {
  let count = 0;

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;

      const r = (row + dr + rows) % rows;
      const c = (col + dc + cols) % cols;
      count += grid[r][c];
    }
  }

  return count;
}

function nextGeneration() {
  const next = createGrid();

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const alive = grid[row][col] === 1;
      const neighbors = getNeighbors(row, col);

      if (alive && (neighbors === 2 || neighbors === 3)) {
        next[row][col] = 1;
      } else if (!alive && neighbors === 3) {
        next[row][col] = 1;
      }
    }
  }

  grid = next;
}

function tick() {
  nextGeneration();
  drawGrid();
}

function getIntervalMs() {
  const stepsPerSecond = Number(speedInput.value);
  return Math.max(40, Math.floor(1000 / stepsPerSecond));
}

function setRunning(nextState) {
  running = nextState;

  if (running) {
    startBtn.textContent = 'Пауза';
    intervalId = setInterval(tick, getIntervalMs());
  } else {
    startBtn.textContent = 'Старт';
    clearInterval(intervalId);
  }
}

startBtn.addEventListener('click', () => {
  setRunning(!running);
});

stepBtn.addEventListener('click', () => {
  if (!running) {
    tick();
  }
});

clearBtn.addEventListener('click', () => {
  grid = createGrid();
  drawGrid();
});

randomBtn.addEventListener('click', () => {
  grid = createGrid(true);
  drawGrid();
});

speedInput.addEventListener('input', () => {
  if (running) {
    clearInterval(intervalId);
    intervalId = setInterval(tick, getIntervalMs());
  }
});

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const col = Math.floor(x / (rect.width / cols));
  const row = Math.floor(y / (rect.height / rows));

  grid[row][col] = grid[row][col] ? 0 : 1;
  drawGrid();
});

drawGrid();
