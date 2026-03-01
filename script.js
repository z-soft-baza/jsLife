const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const chartCanvas = document.getElementById('historyChart');
const chartCtx = chartCanvas.getContext('2d');

const cols = 60;
const rows = 40;
const totalCells = cols * rows;
const cellSize = Math.floor(canvas.width / cols);
const colors = ['#334155', '#22d3ee', '#f97316', '#a78bfa', '#facc15', '#4ade80'];
const axisColor = '#94a3b8';
const lineColors = colors.slice(1, 6);

let grid = createGrid();
let running = false;
let intervalId = null;
let selectedColor = 1;
let stepCount = 0;
const addedCounts = [0, 0, 0, 0, 0, 0];
const lifetimeSeen = [new Set(), new Set(), new Set(), new Set(), new Set(), new Set()];
const stepHistory = [];

const startBtn = document.getElementById('startBtn');
const stepBtn = document.getElementById('stepBtn');
const clearBtn = document.getElementById('clearBtn');
const randomBtn = document.getElementById('randomBtn');
const randomCountInput = document.getElementById('randomCountInput');
const speedInput = document.getElementById('speedInput');
const colorButtons = Array.from(document.querySelectorAll('.color-btn'));
const stepCountElement = document.getElementById('stepCount');

function getCellsByColor() {
  const counts = [0, 0, 0, 0, 0, 0];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const color = grid[row][col];

      if (color !== 0) {
        counts[color] += 1;
      }
    }
  }

  return counts;
}

function syncStepHistory() {
  const currentCounts = getCellsByColor();

  stepHistory[stepCount] = currentCounts;
  stepHistory.length = stepCount + 1;

  drawHistoryChart();
}

function drawHistoryChart() {
  chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

  const width = chartCanvas.width;
  const height = chartCanvas.height;
  const padding = { top: 20, right: 24, bottom: 40, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxStep = Math.max(stepHistory.length - 1, 0);
  const maxCountInHistory = Math.max(
    1,
    ...stepHistory.flatMap((counts) => counts.slice(1, 6)),
  );

  chartCtx.lineWidth = 1;
  chartCtx.strokeStyle = axisColor;
  chartCtx.fillStyle = axisColor;
  chartCtx.font = '12px Inter, system-ui, sans-serif';

  chartCtx.beginPath();
  chartCtx.moveTo(padding.left, padding.top);
  chartCtx.lineTo(padding.left, padding.top + chartHeight);
  chartCtx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  chartCtx.stroke();

  const yTicks = 4;

  for (let i = 0; i <= yTicks; i += 1) {
    const ratio = i / yTicks;
    const y = padding.top + chartHeight - ratio * chartHeight;
    const value = Math.round(ratio * maxCountInHistory);

    chartCtx.strokeStyle = 'rgb(71 85 105 / 35%)';
    chartCtx.beginPath();
    chartCtx.moveTo(padding.left, y);
    chartCtx.lineTo(padding.left + chartWidth, y);
    chartCtx.stroke();

    chartCtx.fillStyle = axisColor;
    chartCtx.fillText(String(value), 10, y + 4);
  }

  chartCtx.fillText('0', padding.left - 4, padding.top + chartHeight + 18);
  chartCtx.fillText(String(maxStep), padding.left + chartWidth - 8, padding.top + chartHeight + 18);
  chartCtx.fillText('шаги', padding.left + chartWidth - 40, height - 6);
  chartCtx.save();
  chartCtx.translate(14, padding.top + 8);
  chartCtx.rotate(-Math.PI / 2);
  chartCtx.fillText('клетки', 0, 0);
  chartCtx.restore();

  lineColors.forEach((lineColor, index) => {
    const color = index + 1;

    chartCtx.beginPath();
    chartCtx.lineWidth = 2;
    chartCtx.strokeStyle = lineColor;

    stepHistory.forEach((counts, step) => {
      const x = padding.left + (maxStep === 0 ? 0 : (step / maxStep) * chartWidth);
      const y = padding.top + chartHeight - (counts[color] / maxCountInHistory) * chartHeight;

      if (step === 0) {
        chartCtx.moveTo(x, y);
      } else {
        chartCtx.lineTo(x, y);
      }
    });

    chartCtx.stroke();
  });
}

function updateLifetimeSeen() {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const color = grid[row][col];

      if (color !== 0) {
        lifetimeSeen[color].add(`${row}-${col}`);
      }
    }
  }
}

function updateStats() {
  const currentCounts = getCellsByColor();
  const addedTotal = addedCounts.slice(1).reduce((sum, count) => sum + count, 0);
  const currentTotal = currentCounts.slice(1).reduce((sum, count) => sum + count, 0);
  const lifetimeCounts = lifetimeSeen.map((positions) => positions.size);
  const lifetimeTotal = lifetimeCounts.slice(1).reduce((sum, count) => sum + count, 0);

  stepCountElement.textContent = String(stepCount);

  for (let color = 1; color <= 5; color += 1) {
    document.getElementById(`added-${color}`).textContent = String(addedCounts[color]);
    document.getElementById(`current-${color}`).textContent = String(currentCounts[color]);
    document.getElementById(`lifetime-${color}`).textContent = String(lifetimeCounts[color]);
  }

  document.getElementById('added-total').textContent = String(addedTotal);
  document.getElementById('current-total').textContent = String(currentTotal);
  document.getElementById('lifetime-total').textContent = String(lifetimeTotal);
}

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
  stepCount += 1;
  drawGrid();
  updateLifetimeSeen();
  syncStepHistory();
  updateStats();
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
    const color = Math.floor(Math.random() * 5) + 1;
    grid[row][col] = color;
    addedCounts[color] += 1;
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
  stepCount = 0;

  for (let color = 1; color <= 5; color += 1) {
    addedCounts[color] = 0;
    lifetimeSeen[color].clear();
  }

  drawGrid();
  syncStepHistory();
  updateStats();
});

randomBtn.addEventListener('click', () => {
  addRandomCells(getRandomCount());
  drawGrid();
  updateLifetimeSeen();
  syncStepHistory();
  updateStats();
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

  if (grid[row][col] === selectedColor) {
    grid[row][col] = 0;
  } else {
    if (grid[row][col] === 0) {
      addedCounts[selectedColor] += 1;
    }

    grid[row][col] = selectedColor;
  }

  drawGrid();
  updateLifetimeSeen();
  syncStepHistory();
  updateStats();
});

setSelectedColor(selectedColor);
randomCountInput.value = String(getRandomCount());
drawGrid();
updateLifetimeSeen();
syncStepHistory();
updateStats();
