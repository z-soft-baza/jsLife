const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');

const cols = 60;
const rows = 40;
const totalCells = cols * rows;
const cellSize = Math.floor(canvas.width / cols);
const colors = ['#334155', '#22d3ee', '#f97316', '#a78bfa', '#facc15', '#4ade80'];

let grid = createGrid();
let running = false;
let intervalId = null;
let selectedColor = 1;

const startBtn = document.getElementById('startBtn');
const stepBtn = document.getElementById('stepBtn');
const clearBtn = document.getElementById('clearBtn');
const randomBtn = document.getElementById('randomBtn');
const randomCountInput = document.getElementById('randomCountInput');
const speedInput = document.getElementById('speedInput');
const colorButtons = Array.from(document.querySelectorAll('.color-btn'));

function createGrid() {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      ctx.fillStyle = colors[grid[row][col]];
      ctx.fillRect(col * cellSize, row * cellSize, cellSize - 1, cellSize - 1);
    }
  }
}

function getNeighborsByColor(row, col) {
  const counts = [0, 0, 0, 0, 0, 0];

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;

      const r = (row + dr + rows) % rows;
      const c = (col + dc + cols) % cols;
      const color = grid[r][c];

      if (color !== 0) {
        counts[color] += 1;
      }
    }
  }

  return counts;
}

function pickBirthColor(neighborCounts) {
  for (let color = 1; color <= 5; color += 1) {
    if (neighborCounts[color] === 3) {
      return color;
    }
  }

  return 0;
}

function nextGeneration() {
  const next = createGrid();

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const currentColor = grid[row][col];
      const neighborsByColor = getNeighborsByColor(row, col);

      if (currentColor !== 0) {
        const ownColorNeighbors = neighborsByColor[currentColor];

        if (ownColorNeighbors === 2 || ownColorNeighbors === 3) {
          next[row][col] = currentColor;
        }
      } else {
        next[row][col] = pickBirthColor(neighborsByColor);
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

function getRandomCount() {
  const rawValue = Number(randomCountInput.value);

  if (!Number.isFinite(rawValue)) {
    return 1;
  }

  return Math.max(1, Math.min(totalCells, Math.floor(rawValue)));
}

function addRandomCells(count) {
  const emptyCells = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (grid[row][col] === 0) {
        emptyCells.push([row, col]);
      }
    }
  }

  const available = emptyCells.length;
  const toPlace = Math.min(count, available);

  for (let i = 0; i < toPlace; i += 1) {
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const [row, col] = emptyCells.splice(randomIndex, 1)[0];
    grid[row][col] = Math.floor(Math.random() * 5) + 1;
  }
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

function setSelectedColor(color) {
  selectedColor = color;

  colorButtons.forEach((button) => {
    const isActive = Number(button.dataset.color) === color;
    button.classList.toggle('active', isActive);
  });
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
  addRandomCells(getRandomCount());
  drawGrid();
});

speedInput.addEventListener('input', () => {
  if (running) {
    clearInterval(intervalId);
    intervalId = setInterval(tick, getIntervalMs());
  }
});

randomCountInput.addEventListener('change', () => {
  randomCountInput.value = String(getRandomCount());
});

colorButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setSelectedColor(Number(button.dataset.color));
  });
});

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const col = Math.floor(x / (rect.width / cols));
  const row = Math.floor(y / (rect.height / rows));

  grid[row][col] = grid[row][col] === selectedColor ? 0 : selectedColor;
  drawGrid();
});

setSelectedColor(selectedColor);
randomCountInput.value = String(getRandomCount());
drawGrid();
