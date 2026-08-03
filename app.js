// ===== FALLBACK DATA =====
// Embedded snapshot for instant rendering. Overridden by data.json when available.
const FALLBACK_DATA = {
  lastUpdated: '2026-07-29',
  providers: {
    'DeepSeek':    { color: '#06b6d4' },
    'Z.ai':        { color: '#a855f7' },
    'MiniMax':     { color: '#ec4899' },
    'Meta':        { color: '#2563eb' },
    'OpenAI':      { color: '#059669' },
    'Google':      { color: '#60a5fa' },
    'Alibaba':     { color: '#f97316' },
    'Anthropic':   { color: '#d97757' },
    'Moonshot AI': { color: '#facc15' },
    'xAI':         { color: '#f43f5e' },
    'Thinking Machines': { color: '#78716c' },
  },
  models: [
    { provider: 'OpenAI',      model: 'GPT-5.6 Sol',            inputPrice: 5.0,    outputPrice: 30.0,   livebench: 81.05, aaScore: 59, open: false },
    { provider: 'OpenAI',      model: 'GPT-5.6 Terra',          inputPrice: 2.0,    outputPrice: 12.0,   livebench: 77.94, aaScore: 55, open: false },
    { provider: 'OpenAI',      model: 'GPT-5.6 Luna',           inputPrice: 0.2,    outputPrice: 1.2,    livebench: 73.56, aaScore: 51, open: false },
    { provider: "xAI",         model: "Grok 4.5",               inputPrice: 2.0,    outputPrice: 6.0,    livebench: 75.77, aaScore: 54, open: false },
    { provider: "Anthropic",   model: "Claude Sonnet 5",        inputPrice: 3.0,    outputPrice: 15.0,   livebench: 76.04, aaScore: 53, open: false },
    { provider: 'Alibaba',     model: 'Qwen 3.6 Plus',          inputPrice: 0.325,  outputPrice: 1.95,   livebench: 68.91, aaScore: 40, open: false },
    { provider: 'DeepSeek',    model: 'DeepSeek V4 Pro',        inputPrice: 0.435,  outputPrice: 0.87,   livebench: 71.57, aaScore: 44, open: true },
    { provider: 'Z.ai',        model: 'GLM 5.2',                inputPrice: 1.4,    outputPrice: 4.4,    livebench: 73.16, aaScore: 51, open: true },
    { provider: 'MiniMax',     model: 'MiniMax M3',             inputPrice: 0.3,    outputPrice: 1.2,    livebench: 67.26, aaScore: 44, open: true },
    { provider: 'DeepSeek',    model: 'DeepSeek V4 Flash',      inputPrice: 0.14,   outputPrice: 0.28,   livebench: 65.48, aaScore: 40, open: true },
    { provider: 'Google',      model: 'Gemini 3.5 Flash',       inputPrice: 1.5,    outputPrice: 9.0,    livebench: 74.64, aaScore: 50, open: false },
    { provider: 'Google',      model: 'Gemini 3.1 Pro',         inputPrice: 2.0,    outputPrice: 12.0,   livebench: 76.95, aaScore: 46, open: false },
    { provider: 'Alibaba',     model: 'Qwen 3.7 Max',           inputPrice: 1.475,  outputPrice: 4.425,  livebench: 73.14, aaScore: 46, open: false },
    { provider: 'Anthropic',   model: 'Claude Fable 5',         inputPrice: 10.0,   outputPrice: 50.0,   livebench: 82.97, aaScore: 60, open: false },
    { provider: 'Moonshot AI', model: 'Kimi K3',                inputPrice: 3.0,    outputPrice: 15.0,   livebench: 79.19, aaScore: 57, open: true },
    { provider: 'Meta',        model: 'Muse Spark 1.1',         inputPrice: 1.25,   outputPrice: 4.25,   livebench: 75.30, aaScore: 51, open: false },
    { provider: 'Thinking Machines', model: 'Inkling',          inputPrice: 1.0,    outputPrice: 4.05,   livebench: 71.92, aaScore: 41, open: true },
    { provider: 'Google',      model: 'Gemini 3.6 Flash',       inputPrice: 1.5,    outputPrice: 7.5,    livebench: 73.59, aaScore: 50, open: false },
    { provider: 'Google',      model: 'Gemini 3.5 Flash-Lite',  inputPrice: 0.3,    outputPrice: 2.5,    livebench: 63.94, aaScore: 36, open: false },
    { provider: 'Anthropic',   model: 'Claude Opus 5',          inputPrice: 5.0,    outputPrice: 25.0,   livebench: 80.08, aaScore: 61, open: false },
  ],
};

// ===== ACTIVE DATA (starts as fallback, replaced by fetched data) =====
let RAW_DATA = FALLBACK_DATA.models;
let PROVIDER_COLORS = {};
let ALL_PROVIDERS = [];
let GLOBAL_LOG_MIN = 0;
let GLOBAL_LOG_MAX = 0;
let DATA_LAST_UPDATED = FALLBACK_DATA.lastUpdated || '';

// ===== UTILITIES =====
function hexToRgb(hex) {
  hex = hex.replace(/^#/, '').toLowerCase();
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

function buildProviderColors(providers) {
  const colors = {};
  for (const [name, config] of Object.entries(providers)) {
    colors[name] = {
      bg: config.color,
      rgb: hexToRgb(config.color),
    };
  }
  return colors;
}

function deriveProviderList(models) {
  return [...new Set(models.map(d => d.provider))];
}

// ===== SCHEMA VALIDATION =====
function validateData(data) {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.models) || data.models.length === 0) return false;
  if (!data.providers || typeof data.providers !== 'object') return false;

  const requiredFields = ['provider', 'model', 'inputPrice', 'outputPrice', 'livebench', 'aaScore'];
  const numericFields = ['inputPrice', 'outputPrice', 'livebench', 'aaScore'];

  for (const model of data.models) {
    for (const field of requiredFields) {
      if (!(field in model)) return false;
    }
    for (const field of numericFields) {
      if (typeof model[field] !== 'number' || isNaN(model[field])) return false;
    }
  }
  return true;
}

// ===== TIMESTAMP FORMATTING =====
function formatLastUpdated(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const year = parts[0];
  const month = months[parseInt(parts[1], 10) - 1];
  const day = parseInt(parts[2], 10);
  return `${month} ${day}, ${year}`;
}

// ===== DATA LOADING =====
function applyData(data) {
  RAW_DATA = data.models;
  PROVIDER_COLORS = buildProviderColors(data.providers);
  ALL_PROVIDERS = deriveProviderList(data.models);
  DATA_LAST_UPDATED = data.lastUpdated || '';

  for (const name of Object.keys(data.providers)) {
    if (!ALL_PROVIDERS.includes(name)) {
      ALL_PROVIDERS.push(name);
    }
  }

  // Calculate global min/max log blended costs
  const blendedCosts = data.models.map(m => computeBlended(m.inputPrice, m.outputPrice));
  const floorCosts = blendedCosts.map(c => Math.max(c, 0.01));
  GLOBAL_LOG_MIN = Math.log10(Math.min(...floorCosts));
  GLOBAL_LOG_MAX = Math.log10(Math.max(...floorCosts));

  // Update dynamic subtitle
  const modelCountEl = document.getElementById('modelCountVal');
  const providerCountEl = document.getElementById('providerCountVal');
  const lastUpdatedEl = document.getElementById('lastUpdatedVal');
  if (modelCountEl) modelCountEl.textContent = RAW_DATA.length;
  if (providerCountEl) providerCountEl.textContent = ALL_PROVIDERS.length;
  if (lastUpdatedEl && data.lastUpdated) {
    lastUpdatedEl.textContent = `Data as of ${formatLastUpdated(data.lastUpdated)}`;
  }
}

function updateSliderBounds() {
  const allModels = computeAllMetrics(RAW_DATA, 0);
  const maxBlended = Math.max(...allModels.map(m => m.blended));
  const sliderMax = Math.ceil(maxBlended);

  const priceMinInput = document.getElementById('priceMin');
  const priceMaxInput = document.getElementById('priceMax');

  const oldMax = parseFloat(priceMaxInput.max) || 12;

  priceMinInput.max = sliderMax;
  priceMaxInput.max = sliderMax;

  if (state.priceMax >= oldMax || state.priceMax >= sliderMax) {
    state.priceMax = sliderMax;
    priceMaxInput.value = sliderMax;
    document.getElementById('priceMaxVal').textContent = sliderMax.toFixed(2);
  }

  updatePriceRangeSliderHighlight();
}

function reinitProviderPills(oldProvidersSet) {
  const container = document.getElementById('providerPills');
  container.innerHTML = '';

  ALL_PROVIDERS.forEach(p => {
    if (oldProvidersSet && !oldProvidersSet.has(p)) {
      state.activeProviders.add(p);
    }
  });

  for (const p of state.activeProviders) {
    if (!ALL_PROVIDERS.includes(p)) {
      state.activeProviders.delete(p);
    }
  }

  initProviderPills();
}

// Returns the fetched data object, or FALLBACK_DATA on failure.
async function loadData() {
  try {
    const response = await fetch('./data.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!validateData(data)) {
      console.warn('[LLM Analysis] Fetched data.json failed schema validation — using fallback data.');
      return FALLBACK_DATA;
    }

    return data;
  } catch (err) {
    if (window.location.protocol === 'file:') {
      console.warn(
        '[LLM Analysis] Cannot fetch data.json over file:// protocol. ' +
        'Use a local server (e.g., python3 -m http.server) for live data loading. ' +
        'The app is running normally with its embedded fallback data.'
      );
    } else {
      console.warn('[LLM Analysis] Failed to load data.json — using fallback data.', err.message);
    }
    return FALLBACK_DATA;
  }
}

// ===== STATE =====
const state = {
  p: 0.07,
  search: '',
  priceMin: 0,
  priceMax: 12,
  perfThreshold: 0,
  sourceFilter: 'all',
  activeProviders: new Set(),
  sortColumn: 'value',
  sortDirection: 'desc',
  barMetric: 'value',
  highlightedModel: null,
  compareSet: [],
  _barKeys: [],
  cardValues: {
    bestValue: 0,
    bestPerf: 0,
    cheapest: 0,
    expensive: 0,
  },
};

// ===== COMPUTATION =====
function computeBlended(inputPrice, outputPrice) {
  return 0.9573 * inputPrice + 0.0427 * outputPrice;
}

// Cache-read price; falls back to '—' when the model has no cache pricing.
function fmtCachePrice(v) {
  if (v == null) return '—';
  return '$' + (v < 0.01 ? v.toFixed(4) : v.toFixed(2));
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
}

// Dividing each benchmark by its own maximum pins the top of both scales to 1, but it
// leaves their spreads untouched — and spread, not the ceiling, is what decides how much
// a benchmark actually moves the composite. AA ranges over a much wider slice of its
// scale than LiveBench does (~1.9x the spread on current data), so a nominal 50/50 split
// really lands nearer 34/66 in favour of AA. Weighting each benchmark by the inverse of
// its spread cancels that out and gives both an equal say.
//
// The weights are derived from the loaded data rather than hard-coded so they stay
// correct as models are added and the two benchmarks' spreads drift apart.
function equalContributionWeights(lbNorm, aaNorm) {
  const lbSd = stdDev(lbNorm);
  const aaSd = stdDev(aaNorm);
  if (!(lbSd > 0) || !(aaSd > 0)) return { lb: 0.5, aa: 0.5 };
  return { lb: aaSd / (lbSd + aaSd), aa: lbSd / (lbSd + aaSd) };
}

// Last weights computed by computeAllMetrics, surfaced so the formula modal can show the
// numbers actually in play instead of a stale literal.
let perfWeights = { lb: 0.5, aa: 0.5 };

function computeAllMetrics(data, p) {
  const models = data.map(d => ({ ...d, blended: computeBlended(d.inputPrice, d.outputPrice) }));

  const lbMax = Math.max(...models.map(m => m.livebench));
  const aaMax = Math.max(...models.map(m => m.aaScore));

  const lbNorm = models.map(m => (lbMax === 0 ? 0 : m.livebench / lbMax));
  const aaNorm = models.map(m => (aaMax === 0 ? 0 : m.aaScore / aaMax));
  perfWeights = equalContributionWeights(lbNorm, aaNorm);

  models.forEach((m, i) => {
    m.performance = (perfWeights.lb * lbNorm[i] + perfWeights.aa * aaNorm[i]) * 100;
  });

  models.forEach(m => {
    m.value = m.blended > 0 && p > 0 ? m.performance / Math.pow(m.blended, p) : m.performance;
  });

  return models;
}

function getParetoFrontier(filtered) {
  if (filtered.length === 0) return [];
  const sorted = [...filtered].sort((a, b) => {
    if (a.blended === b.blended) return b.performance - a.performance;
    return a.blended - b.blended;
  });

  const frontier = [];
  let maxPerf = -1;

  for (const m of sorted) {
    if (m.performance > maxPerf) {
      frontier.push(m);
      maxPerf = m.performance;
    }
  }
  return frontier;
}

function getFilteredModels(allModels) {
  return allModels.filter(m =>
    state.activeProviders.has(m.provider) &&
    m.blended >= state.priceMin &&
    m.blended <= state.priceMax &&
    m.performance >= state.perfThreshold &&
    (state.sourceFilter === 'all' ||
     (state.sourceFilter === 'open' && m.open === true) ||
     (state.sourceFilter === 'closed' && m.open !== true)) &&
    (state.search === '' ||
     m.model.toLowerCase().includes(state.search.toLowerCase()) ||
     m.provider.toLowerCase().includes(state.search.toLowerCase()))
  );
}

// Highlight models from a filtered set: best value, best performance, cheapest, priciest.
// Returns model references (not formatted values) so both the summary cards and the
// chat tools can project them however they need.
function getSummaryStats(filtered) {
  if (filtered.length === 0) return null;
  return {
    bestValue: filtered.reduce((a, b) => (a.value > b.value ? a : b)),
    bestPerf: filtered.reduce((a, b) => (a.performance > b.performance ? a : b)),
    cheapest: filtered.reduce((a, b) => (a.blended < b.blended ? a : b)),
    expensive: filtered.reduce((a, b) => (a.blended > b.blended ? a : b)),
  };
}

// ===== UTILITIES =====
// Rounding helpers mirror the precision the table renders at, so numbers quoted by the
// chat assistant always match what the user sees on screen.
function round1(n) {
  return typeof n === 'number' && isFinite(n) ? Math.round(n * 10) / 10 : n;
}

function round2(n) {
  return typeof n === 'number' && isFinite(n) ? Math.round(n * 100) / 100 : n;
}

function clampInt(value, min, max, fallback) {
  const n = Math.floor(Number(value));
  if (!isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function lerp(a, b, t) { return a + (b - a) * t; }

function colorScale(value, min, max) {
  const t = (max - min) === 0 ? 0.5 : (value - min) / (max - min);
  if (t < 0.5) {
    const r = Math.round(lerp(248, 251, t * 2));
    const g = Math.round(lerp(113, 191, t * 2));
    const b = Math.round(lerp(113, 36, t * 2));
    return `rgb(${r},${g},${b})`;
  } else {
    const r = Math.round(lerp(251, 52, (t - 0.5) * 2));
    const g = Math.round(lerp(191, 211, (t - 0.5) * 2));
    const b = Math.round(lerp(36, 153, (t - 0.5) * 2));
    return `rgb(${r},${g},${b})`;
  }
}

function providerColor(provider) {
  return PROVIDER_COLORS[provider]?.bg || '#888';
}

function providerRgb(provider) {
  return PROVIDER_COLORS[provider]?.rgb || '136,136,136';
}

function modelKey(m) {
  return m.provider + '|' + m.model;
}

// ===== COMPARE SET =====
const COMPARE_MAX = 4;

function isCompared(key) {
  return state.compareSet.includes(key);
}

function toggleCompare(key) {
  if (!key) return;
  const idx = state.compareSet.indexOf(key);
  if (idx >= 0) {
    state.compareSet.splice(idx, 1);
  } else if (state.compareSet.length < COMPARE_MAX) {
    state.compareSet.push(key);
  } else {
    const tray = document.getElementById('compareTray');
    if (tray) {
      tray.classList.remove('shake');
      void tray.offsetWidth; // force reflow so the animation restarts on repeated rejections
      tray.classList.add('shake');
    }
    return;
  }
  updateCompareUI();
  syncCompareHash();
}

function clearCompare() {
  state.compareSet = [];
  updateCompareUI();
  syncCompareHash();
}

function getCompareModels() {
  const allModels = computeAllMetrics(RAW_DATA, state.p);
  const byKey = new Map(allModels.map(m => [modelKey(m), m]));
  return state.compareSet.map(k => byKey.get(k)).filter(Boolean);
}

function compareToggleHtml(m) {
  const k = modelKey(m);
  const active = isCompared(k);
  return `<button class="compare-toggle${active ? ' active' : ''}" data-key="${escapeHtml(k)}" aria-pressed="${active}" aria-label="Compare ${escapeHtml(m.model)}">${active ? '✓' : '+'}</button>`;
}

function openBadgeHtml(m) {
  return m.open === true ? '<span class="open-badge" title="Open model">OPEN</span>' : '';
}

// ===== CHARTS =====
let scatterChart, barChart, radarChart, compareRadarChart;

function renderChartsUnavailable() {
  document.querySelectorAll('.chart-canvas-wrap, .chart-canvas-wrap-scatter').forEach(wrap => {
    wrap.textContent = '';
    const message = document.createElement('div');
    message.className = 'empty-state';
    message.textContent = 'Charts are unavailable because Chart.js could not be loaded.';
    wrap.appendChild(message);
  });
}

function initCharts() {
  if (typeof Chart === 'undefined') {
    renderChartsUnavailable();
    console.warn('[LLM Analysis] Chart.js is unavailable. Charts are disabled, but the dashboard data and filters remain usable.');
    return false;
  }

  const tooltipStyle = {
    backgroundColor: 'rgba(15,15,26,0.95)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    titleColor: '#fff',
    bodyColor: 'rgba(255,255,255,0.8)',
    padding: 12,
    titleFont: { family: 'JetBrains Mono', weight: '600' },
    bodyFont: { family: 'JetBrains Mono' },
  };

  scatterChart = new Chart(document.getElementById('scatterChart'), {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Models',
          data: [],
          pointStyle: 'rect',
          pointRadius: 7,
          pointHoverRadius: 10,
          borderWidth: 1.5
        },
        {
          label: 'Pareto Frontier',
          type: 'line',
          data: [],
          fill: false,
          borderColor: 'rgba(255, 255, 255, 0.4)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0.15,
          showLine: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const datasetIndex = elements[0].datasetIndex;
          if (datasetIndex === 0) {
            const index = elements[0].index;
            const modelData = scatterChart.data.datasets[0].data[index];
            const key = modelData.provider + '|' + modelData.model;
            if (e.native && e.native.shiftKey) {
              toggleCompare(key);
            } else {
              toggleHighlight(key);
            }
          }
        } else {
          toggleHighlight(null);
        }
      },
      scales: {
        x: {
          type: 'category',
          offset: true,
          title: { display: true, text: 'Blended Cost ($/1M tokens)', color: 'rgba(255,255,255,0.7)', font: { family: 'JetBrains Mono' } },
          ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'JetBrains Mono', size: 10 } },
          grid: { color: 'rgba(255,255,255,0.06)' },
        },
        y: {
          title: { display: true, text: 'Performance Score', color: 'rgba(255,255,255,0.7)', font: { family: 'JetBrains Mono' } },
          ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'JetBrains Mono', size: 10 } },
          grid: { color: 'rgba(255,255,255,0.06)' },
          grace: '5%',
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            title: items => {
              if (items[0].datasetIndex === 1) return 'Pareto Frontier';
              return items[0].raw.model;
            },
            label: item => {
              if (item.datasetIndex === 1) {
                return 'Optimized cost/performance boundary';
              }
              return [
                `Provider: ${item.raw.provider}`,
                `Blended: $${item.raw.blended.toFixed(2)}`,
                `Performance: ${item.raw.y.toFixed(1)}`,
                `Value: ${item.raw.value.toFixed(1)}`,
              ];
            },
          },
        },
      },
    },
  });

  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: { labels: [], datasets: [{ data: [], borderWidth: 1, borderRadius: 0 }] },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 12
        }
      },
      onClick: (e, elements) => {
        if (elements.length > 0) {
          const index = elements[0].index;
          if (e.native && e.native.shiftKey) {
            toggleCompare(state._barKeys[index]);
          } else {
            toggleHighlight(state._barKeys[index]);
          }
        } else {
          toggleHighlight(null);
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Value Score', color: 'rgba(255,255,255,0.7)', font: { family: 'JetBrains Mono' } },
          ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'JetBrains Mono', size: 10 } },
          grid: { color: 'rgba(255,255,255,0.06)' },
        },
        y: {
          ticks: {
            color: 'rgba(255,255,255,0.7)',
            font: { family: 'JetBrains Mono', size: 10 },
            autoSkip: false
          },
          grid: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            title: items => (state._barLabelsFull && state._barLabelsFull[items[0].dataIndex]) || items[0].label,
            label: item => {
              const metricLabels = { value: 'Value', performance: 'Performance', blended: 'Blended Cost', livebench: 'LiveBench', aaScore: 'AA Score' };
              return `${metricLabels[state.barMetric]}: ${item.raw.toFixed(2)}`;
            },
          },
        },
      },
    },
  });

  radarChart = new Chart(document.getElementById('radarChart'), {
    type: 'radar',
    data: {
      labels: ['Value Score', 'Performance', 'Cost Efficiency', 'LiveBench (Norm)', 'AA Score (Norm)'],
      datasets: [
        {
          label: 'Filtered Average',
          data: [],
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderColor: 'rgba(99, 102, 241, 0.4)',
          borderWidth: 1.5,
          pointStyle: 'rect',
          pointRadius: 4,
        },
        {
          label: 'Highlighted Model',
          data: [],
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
          pointStyle: 'rectRot',
          pointRadius: 5,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.06)' },
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          pointLabels: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'JetBrains Mono', size: 9, weight: '500' } },
          ticks: {
            color: 'rgba(255, 255, 255, 0.4)',
            backdropColor: 'transparent',
            font: { family: 'JetBrains Mono', size: 8 },
            stepSize: 20
          },
          min: 0,
          max: 100
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'JetBrains Mono', size: 10 } }
        },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            label: item => `${item.dataset.label}: ${item.raw.toFixed(1)}`
          }
        }
      }
    }
  });

  compareRadarChart = new Chart(document.getElementById('compareRadarChart'), {
    type: 'radar',
    data: {
      labels: ['Value Score', 'Performance', 'Cost Efficiency', 'LiveBench (Norm)', 'AA Score (Norm)'],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: { color: 'rgba(255, 255, 255, 0.06)' },
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          pointLabels: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'JetBrains Mono', size: 9, weight: '500' } },
          ticks: {
            color: 'rgba(255, 255, 255, 0.4)',
            backdropColor: 'transparent',
            font: { family: 'JetBrains Mono', size: 8 },
            stepSize: 20
          },
          min: 0,
          max: 100
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'JetBrains Mono', size: 10 } }
        },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            label: item => `${item.dataset.label}: ${item.raw.toFixed(1)}`
          }
        }
      }
    }
  });

  return true;
}

// ===== VIEW UPDATE FUNCTIONS =====
function updateSummaryCards(filtered) {
  if (filtered.length === 0) {
    ['bestValueModel', 'bestPerfModel', 'cheapestModel', 'expensiveModel'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
    ['bestValueStat', 'bestPerfStat', 'cheapestStat', 'expensiveStat'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
    return;
  }

  const { bestValue, bestPerf, cheapest, expensive } = getSummaryStats(filtered);

  document.getElementById('bestValueModel').textContent = bestValue.model;
  document.getElementById('bestPerfModel').textContent = bestPerf.model;
  document.getElementById('cheapestModel').textContent = cheapest.model;
  document.getElementById('expensiveModel').textContent = expensive.model;

  animateValue(document.getElementById('bestValueStat'), state.cardValues.bestValue, bestValue.value, 400, false);
  animateValue(document.getElementById('bestPerfStat'), state.cardValues.bestPerf, bestPerf.performance, 400, false);
  animateValue(document.getElementById('cheapestStat'), state.cardValues.cheapest, cheapest.blended, 400, true);
  animateValue(document.getElementById('expensiveStat'), state.cardValues.expensive, expensive.blended, 400, true);

  state.cardValues.bestValue = bestValue.value;
  state.cardValues.bestPerf = bestPerf.performance;
  state.cardValues.cheapest = cheapest.blended;
  state.cardValues.expensive = expensive.blended;
}

let leaderboardExpanded = false;

function toggleLeaderboard() {
  leaderboardExpanded = !leaderboardExpanded;
  const btn = document.getElementById('leaderboardExpand');
  if (leaderboardExpanded) {
    btn.innerHTML = 'Show Top 10 <span class="arrow">▼</span>';
    btn.classList.add('expanded');
  } else {
    btn.innerHTML = 'Show All <span class="arrow">▼</span>';
    btn.classList.remove('expanded');
  }
  const allModels = computeAllMetrics(RAW_DATA, state.p);
  const filtered = getFilteredModels(allModels);
  updateLeaderboard(filtered);
}

function updateLeaderboard(filtered) {
  const list = document.getElementById('leaderboardList');
  const btn = document.getElementById('leaderboardExpand');
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No models match your filters</p>
        <button class="reset-btn" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    btn.style.display = 'none';
    return;
  }

  const sorted = [...filtered].sort((a, b) => b.performance - a.performance);
  const display = leaderboardExpanded ? sorted : sorted.slice(0, 10);

  btn.style.display = filtered.length > 10 ? 'flex' : 'none';

  list.innerHTML = display.map((m, i) => `
    <div class="leaderboard-row ${state.highlightedModel === modelKey(m) ? 'highlighted' : ''}" data-key="${escapeHtml(modelKey(m))}" data-model="${escapeHtml(m.model)}" tabindex="0" role="button">
      <span class="leaderboard-rank ${i < 3 ? 'top' : ''}">#${i + 1}</span>
      <span class="leaderboard-name">${escapeHtml(m.model)} <span class="leaderboard-provider">${escapeHtml(m.provider)}</span>${openBadgeHtml(m)}</span>
      <div class="leaderboard-bar-track">
        <div class="leaderboard-bar-fill" style="width:0%; background:${providerColor(m.provider)}" data-width="${m.performance.toFixed(1)}%"></div>
      </div>
      <span class="leaderboard-score">${m.performance.toFixed(1)}</span>
      ${compareToggleHtml(m)}
    </div>
  `).join('');

  requestAnimationFrame(() => {
    list.querySelectorAll('.leaderboard-bar-fill').forEach(fill => {
      fill.style.width = fill.dataset.width;
    });
  });
}

function updateScatterChart(filtered) {
  if (!scatterChart) return;

  if (filtered.length === 0) {
    scatterChart.data.datasets[0].data = [];
    if (scatterChart.data.datasets[1]) {
      scatterChart.data.datasets[1].data = [];
    }
    scatterChart.options.scales.x.labels = [];
    scatterChart.update();
    return;
  }

  const uniqueCosts = [...new Set(filtered.map(m => m.blended))].sort((a, b) => a - b);
  const labels = [...new Set(uniqueCosts.map(c => '$' + c.toFixed(2)))];

  scatterChart.options.scales.x.labels = labels;

  scatterChart.data.datasets[0].data = filtered.map(m => ({
    x: '$' + m.blended.toFixed(2),
    y: m.performance,
    model: m.model,
    provider: m.provider,
    value: m.value,
    blended: m.blended,
  }));

  if (scatterChart.data.datasets[1]) {
    const paretoFrontier = getParetoFrontier(filtered);
    scatterChart.data.datasets[1].data = paretoFrontier.map(m => ({
      x: '$' + m.blended.toFixed(2),
      y: m.performance
    }));
  }

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const highlightBorder = isLight ? '#0f172a' : '#ffffff';

  scatterChart.data.datasets[0].backgroundColor = filtered.map(m => {
    const isHighlighted = state.highlightedModel === modelKey(m);
    const baseColor = providerRgb(m.provider);
    if (state.highlightedModel) {
      return isHighlighted ? `rgba(${baseColor}, 0.85)` : `rgba(${baseColor}, 0.15)`;
    }
    return `rgba(${baseColor}, 0.6)`;
  });
  scatterChart.data.datasets[0].borderColor = filtered.map(m => {
    const isHighlighted = state.highlightedModel === modelKey(m);
    if (state.highlightedModel) {
      return isHighlighted ? highlightBorder : `rgba(${providerRgb(m.provider)}, 0.2)`;
    }
    return providerColor(m.provider);
  });
  scatterChart.data.datasets[0].pointRadius = filtered.map(m => state.highlightedModel === modelKey(m) ? 11 : 7);
  scatterChart.data.datasets[0].pointHoverRadius = filtered.map(m => state.highlightedModel === modelKey(m) ? 13 : 10);
  scatterChart.data.datasets[0].borderWidth = filtered.map(m => state.highlightedModel === modelKey(m) ? 3 : 1.5);

  scatterChart.update();
}

function updateBarChart(filtered) {
  if (!barChart) return;

  const metric = state.barMetric;
  const isAsc = metric === 'blended';
  const sorted = [...filtered].sort((a, b) => isAsc ? a[metric] - b[metric] : b[metric] - a[metric]);

  const metricLabels = { value: 'Value Score', performance: 'Performance', blended: 'Blended Cost ($/1M)', livebench: 'LiveBench', aaScore: 'AA Score' };
  barChart.options.scales.x.title.text = metricLabels[metric] || metric;

  const barHeight = Math.max(280, sorted.length * 22 + 50);
  document.getElementById('barChart').parentElement.style.height = barHeight + 'px';

  state._barKeys = sorted.map(m => modelKey(m));
  // Keep full names for the tooltip; on narrow screens truncate axis labels and
  // reserve a fixed label gutter so names render fully instead of clipping at
  // the left canvas edge (Chart.js under-measures the mono font otherwise).
  const narrow = window.matchMedia('(max-width: 640px)').matches;
  state._barLabelsFull = sorted.map(m => m.model);
  barChart.data.labels = narrow
    ? state._barLabelsFull.map(n => n.length > 18 ? n.slice(0, 17) + '…' : n)
    : state._barLabelsFull;
  barChart.options.scales.y.ticks.font.size = narrow ? 9 : 10;
  barChart.options.scales.y.afterFit = narrow ? (scale) => { scale.width = 112; } : null;
  barChart.options.layout.padding.left = narrow ? 2 : 12;
  barChart.data.datasets[0].data = sorted.map(m => m[metric]);

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const highlightBorder = isLight ? '#0f172a' : '#ffffff';

  barChart.data.datasets[0].backgroundColor = sorted.map(m => {
    const isHighlighted = state.highlightedModel === modelKey(m);
    const baseColor = providerRgb(m.provider);
    if (state.highlightedModel) {
      return isHighlighted ? `rgba(${baseColor}, 0.95)` : `rgba(${baseColor}, 0.15)`;
    }
    return `rgba(${baseColor}, 0.7)`;
  });
  barChart.data.datasets[0].borderColor = sorted.map(m => {
    const isHighlighted = state.highlightedModel === modelKey(m);
    if (state.highlightedModel) {
      return isHighlighted ? highlightBorder : `rgba(${providerRgb(m.provider)}, 0.2)`;
    }
    return providerColor(m.provider);
  });
  barChart.data.datasets[0].borderWidth = sorted.map(m => state.highlightedModel === modelKey(m) ? 2.5 : 1);

  barChart.resize();
  barChart.update();
}

function computeRadarAxes(m, lbMax, aaMax, maxValue) {
  const lbNorm = lbMax === 0 ? 0 : (m.livebench / lbMax) * 100;
  const aaNorm = aaMax === 0 ? 0 : (m.aaScore / aaMax) * 100;
  const valNorm = maxValue === 0 ? 0 : (m.value / maxValue) * 100;

  const logVal = Math.log10(Math.max(m.blended, 0.01));
  const costEff = (GLOBAL_LOG_MAX === GLOBAL_LOG_MIN)
    ? 100
    : ((GLOBAL_LOG_MAX - logVal) / (GLOBAL_LOG_MAX - GLOBAL_LOG_MIN)) * 100;

  return [valNorm, m.performance, costEff, lbNorm, aaNorm];
}

function updateRadarChart(filtered) {
  if (!radarChart) return;

  if (filtered.length === 0) {
    radarChart.data.datasets[0].data = [];
    radarChart.data.datasets[1].data = [];
    radarChart.update();
    return;
  }

  // 1. Calculate the Max/Min bounds in the filtered set for normalization
  const lbMax = Math.max(...RAW_DATA.map(m => m.livebench));
  const aaMax = Math.max(...RAW_DATA.map(m => m.aaScore));
  const maxValue = Math.max(...filtered.map(m => m.value));

  // 2. Calculate the averages of the filtered models
  let sumValue = 0, sumPerf = 0, sumCostEff = 0, sumLb = 0, sumAa = 0;
  filtered.forEach(m => {
    const [valNorm, perf, costEff, lbNorm, aaNorm] = computeRadarAxes(m, lbMax, aaMax, maxValue);
    sumValue += valNorm;
    sumPerf += perf;
    sumCostEff += costEff;
    sumLb += lbNorm;
    sumAa += aaNorm;
  });

  const count = filtered.length;
  const avgValue = sumValue / count;
  const avgPerf = sumPerf / count;
  const avgCostEff = sumCostEff / count;
  const avgLb = sumLb / count;
  const avgAa = sumAa / count;

  radarChart.data.datasets[0].data = [avgValue, avgPerf, avgCostEff, avgLb, avgAa];

  // 3. Highlighted Model dataset
  if (state.highlightedModel) {
    const match = filtered.find(m => modelKey(m) === state.highlightedModel);
    if (match) {
      radarChart.data.datasets[1].data = computeRadarAxes(match, lbMax, aaMax, maxValue);
      radarChart.data.datasets[1].label = match.model;

      const baseColor = providerRgb(match.provider);
      radarChart.data.datasets[1].backgroundColor = `rgba(${baseColor}, 0.2)`;
      radarChart.data.datasets[1].borderColor = `rgb(${baseColor})`;
      radarChart.data.datasets[1].hidden = false;
    } else {
      radarChart.data.datasets[1].data = [];
      radarChart.data.datasets[1].hidden = true;
    }
  } else {
    radarChart.data.datasets[1].data = [];
    radarChart.data.datasets[1].hidden = true;
  }

  radarChart.update();
}

function updateTable(filtered) {
  const tbody = document.getElementById('tableBody');
  const col = state.sortColumn;
  const dir = state.sortDirection;

  const sorted = [...filtered].sort((a, b) => {
    let va = a[col] ?? -Infinity, vb = b[col] ?? -Infinity; // null cachePrice sorts last
    if (typeof va === 'string') {
      return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return dir === 'asc' ? va - vb : vb - va;
  });

  const perfVals = filtered.map(m => m.performance);
  const valVals = filtered.map(m => m.value);
  const perfMin = perfVals.length > 0 ? Math.min(...perfVals) : 0;
  const perfMax = perfVals.length > 0 ? Math.max(...perfVals) : 100;
  const valMin = valVals.length > 0 ? Math.min(...valVals) : 0;
  const valMax = valVals.length > 0 ? Math.max(...valVals) : 100;

  if (sorted.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="empty-state">
          <p style="margin-bottom: 8px;">No models match your filters</p>
          <button class="reset-btn" onclick="resetFilters()">Reset Filters</button>
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = sorted.map(m => `
      <tr data-key="${escapeHtml(modelKey(m))}" data-model="${escapeHtml(m.model)}" class="${state.highlightedModel === modelKey(m) ? 'highlighted' : ''}" tabindex="0" role="row">
        <td><span class="provider-badge" style="color:${providerColor(m.provider)}; background:rgba(${providerRgb(m.provider)}, 0.08); border:1px solid rgba(${providerRgb(m.provider)}, 0.15);">${escapeHtml(m.provider)}</span></td>
        <td>${escapeHtml(m.model)}${openBadgeHtml(m)}</td>
        <td class="num">$${m.inputPrice.toFixed(2)}</td>
        <td class="num">$${m.outputPrice.toFixed(2)}</td>
        <td class="num">${fmtCachePrice(m.cachePrice)}</td>
        <td class="num">$${m.blended.toFixed(2)}</td>
        <td class="num">${m.livebench.toFixed(2)}</td>
        <td class="num">${m.aaScore}</td>
        <td class="num" style="color:${colorScale(m.performance, perfMin, perfMax)};font-weight:600">${m.performance.toFixed(1)}</td>
        <td class="num" style="color:${colorScale(m.value, valMin, valMax)};font-weight:600">${m.value.toFixed(1)}</td>
        <td class="compare-col">${compareToggleHtml(m)}</td>
      </tr>
    `).join('');
  }

  document.querySelectorAll('#modelTable th').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === col) {
      th.classList.add(dir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });

  updateTableScrollHints();
}

// Toggle scroll-hint classes so the sticky model column casts a shadow once
// scrolled, and the container shows a right-edge fade while more columns remain.
// (CSS scopes the visual effect to <=640px; running this everywhere is harmless.)
function updateTableScrollHints() {
  const wrap = document.querySelector('.table-wrapper');
  const container = document.getElementById('tableContainer');
  if (!wrap || !container) return;
  wrap.classList.toggle('scrolled-x', wrap.scrollLeft > 4);
  container.classList.toggle('more-x', wrap.scrollLeft < wrap.scrollWidth - wrap.clientWidth - 4);
}

// Same left-shadow cue for the Compare tab's side-by-side table, whose sticky
// column is the metric-label column.
function updateCompareScrollHint() {
  const wrap = document.getElementById('compareTableWrap');
  if (!wrap) return;
  wrap.classList.toggle('scrolled-x', wrap.scrollLeft > 4);
}

function initTableScrollHints() {
  const wrap = document.querySelector('.table-wrapper');
  if (wrap) {
    wrap.addEventListener('scroll', updateTableScrollHints, { passive: true });
    updateTableScrollHints();
  }
  const compareWrap = document.getElementById('compareTableWrap');
  if (compareWrap) {
    compareWrap.addEventListener('scroll', updateCompareScrollHint, { passive: true });
  }
  window.addEventListener('resize', () => {
    updateTableScrollHints();
    updateCompareScrollHint();
  }, { passive: true });
}

function updateFormulaP() {
  document.getElementById('formulaPVal').textContent = state.p.toFixed(2);
  const lbEl = document.getElementById('formulaWLive');
  const aaEl = document.getElementById('formulaWAa');
  if (lbEl) lbEl.textContent = perfWeights.lb.toFixed(3);
  if (aaEl) aaEl.textContent = perfWeights.aa.toFixed(3);
}

// ===== COMPARE VIEW =====
const COMPARE_ROWS = [
  { label: 'Provider', key: 'provider' },
  { label: 'Input $/1M', key: 'inputPrice', fmt: v => '$' + v.toFixed(2), best: 'min' },
  { label: 'Output $/1M', key: 'outputPrice', fmt: v => '$' + v.toFixed(2), best: 'min' },
  { label: 'Cache $/1M', key: 'cachePrice', fmt: fmtCachePrice, best: 'min' },
  { label: 'Blended $/1M', key: 'blended', fmt: v => '$' + v.toFixed(2), best: 'min' },
  { label: 'LiveBench', key: 'livebench', fmt: v => v.toFixed(2), best: 'max' },
  { label: 'AA Score', key: 'aaScore', fmt: v => String(v), best: 'max' },
  { label: 'Performance', key: 'performance', fmt: v => v.toFixed(1), best: 'max' },
  { label: 'Value', key: 'value', fmt: v => v.toFixed(1), best: 'max' },
];

const COMPARE_DASH_PATTERNS = [[], [6, 4], [2, 3], [10, 4, 2, 4]];
const COMPARE_POINT_STYLES = ['rect', 'rectRot', 'circle', 'triangle'];

function updateCompareTray() {
  const tray = document.getElementById('compareTray');
  const chips = document.getElementById('compareTrayChips');
  const badge = document.getElementById('compareCountBadge');
  if (!tray || !chips || !badge) return;

  const models = getCompareModels();
  tray.classList.toggle('hide', models.length === 0);
  badge.classList.toggle('hide', models.length === 0);
  badge.textContent = models.length;

  const mBadge = document.getElementById('compareCountBadgeMobile');
  if (mBadge) {
    mBadge.classList.toggle('hide', models.length === 0);
    mBadge.textContent = models.length;
  }

  chips.innerHTML = models.map(m => `
    <span class="compare-chip" style="border-color: rgba(${providerRgb(m.provider)}, 0.4);">
      <span class="compare-chip-dot" style="background:${providerColor(m.provider)}"></span>
      ${escapeHtml(m.model)}
      <button class="compare-chip-remove" data-key="${escapeHtml(modelKey(m))}" aria-label="Remove ${escapeHtml(m.model)} from comparison">×</button>
    </span>
  `).join('');
}

function updateCompareToggleButtons() {
  document.querySelectorAll('.compare-toggle[data-key]').forEach(btn => {
    const active = isCompared(btn.dataset.key);
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.textContent = active ? '✓' : '+';
  });
}

function updateCompareTable(models) {
  const wrap = document.getElementById('compareTableWrap');
  if (!wrap) return;

  const header = models.map(m => `
    <th>
      <span class="provider-badge" style="color:${providerColor(m.provider)}; background:rgba(${providerRgb(m.provider)}, 0.08); border:1px solid rgba(${providerRgb(m.provider)}, 0.15);">${escapeHtml(m.provider)}</span>
      <span class="compare-table-model">${escapeHtml(m.model)}</span>
      <button class="compare-col-remove" data-key="${escapeHtml(modelKey(m))}" aria-label="Remove ${escapeHtml(m.model)} from comparison">×</button>
    </th>
  `).join('');

  const rows = COMPARE_ROWS.map(row => {
    let bestVal = null;
    if (row.best) {
      const vals = models.map(m => m[row.key]);
      bestVal = row.best === 'min' ? Math.min(...vals) : Math.max(...vals);
    }
    const cells = models.map(m => {
      const v = m[row.key];
      const isBest = row.best !== undefined && v === bestVal;
      const text = row.fmt ? row.fmt(v) : escapeHtml(String(v));
      return `<td class="${isBest ? 'best-cell' : ''}">${text}</td>`;
    }).join('');
    return `<tr><th scope="row">${row.label}</th>${cells}</tr>`;
  }).join('');

  wrap.innerHTML = `
    <table class="compare-table">
      <thead><tr><th></th>${header}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  updateCompareScrollHint();
}

function updateCompareRadar(models) {
  if (!compareRadarChart) return;

  const lbMax = Math.max(...RAW_DATA.map(m => m.livebench));
  const aaMax = Math.max(...RAW_DATA.map(m => m.aaScore));
  const allModels = computeAllMetrics(RAW_DATA, state.p);
  const maxValue = Math.max(...allModels.map(m => m.value));

  const providerCounts = {};
  compareRadarChart.data.datasets = models.map((m, i) => {
    const dupIndex = providerCounts[m.provider] || 0;
    providerCounts[m.provider] = dupIndex + 1;
    const rgb = providerRgb(m.provider);
    return {
      label: m.model,
      data: computeRadarAxes(m, lbMax, aaMax, maxValue),
      backgroundColor: `rgba(${rgb}, ${dupIndex > 0 ? 0.08 : 0.15})`,
      borderColor: `rgb(${rgb})`,
      borderWidth: 2,
      borderDash: COMPARE_DASH_PATTERNS[dupIndex % COMPARE_DASH_PATTERNS.length],
      pointStyle: COMPARE_POINT_STYLES[i % COMPARE_POINT_STYLES.length],
      pointRadius: 4,
    };
  });
  compareRadarChart.update();
}

function updateCompareTab() {
  const emptyState = document.getElementById('compareEmptyState');
  const content = document.getElementById('compareContent');
  if (!emptyState || !content) return;

  const models = getCompareModels();
  if (models.length < 2) {
    emptyState.classList.remove('hide');
    content.classList.add('hide');
    document.getElementById('compareEmptyMsg').textContent = models.length === 1
      ? `1 model selected — add at least 1 more to compare (up to ${COMPARE_MAX}).`
      : `Select at least 2 models to compare (up to ${COMPARE_MAX}).`;
    return;
  }
  emptyState.classList.add('hide');
  content.classList.remove('hide');
  updateCompareTable(models);
  updateCompareRadar(models);
}

function updateCompareUI() {
  updateCompareTray();
  updateCompareToggleButtons();
  updateCompareTab();
}

// ===== COMPARE URL HASH SYNC =====
function syncCompareHash() {
  if (state.compareSet.length > 0) {
    history.replaceState(null, '', '#compare=' + state.compareSet.map(encodeURIComponent).join(','));
  } else if (location.hash.startsWith('#compare=')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

function restoreCompareFromHash() {
  const match = location.hash.match(/^#compare=(.+)$/);
  if (!match) return;

  const keys = [];
  match[1].split(',').forEach(token => {
    let key;
    try { key = decodeURIComponent(token); } catch (e) { return; }
    if (key && !keys.includes(key)) keys.push(key);
  });
  if (keys.length === 0) return;

  state.compareSet = keys.slice(0, COMPARE_MAX);
  updateCompareUI();
  switchTab('compare');
}

function revalidateCompareSet() {
  const validKeys = new Set(RAW_DATA.map(m => modelKey(m)));
  state.compareSet = state.compareSet.filter(k => validKeys.has(k));
  updateCompareUI();
  syncCompareHash();
}

// ===== MASTER UPDATE =====
function updateAll() {
  const allModels = computeAllMetrics(RAW_DATA, state.p);
  const filtered = getFilteredModels(allModels);
  updateSummaryCards(filtered);
  updateLeaderboard(filtered);
  updateScatterChart(filtered);
  updateBarChart(filtered);
  updateRadarChart(filtered);
  updateTable(filtered);
  updateFormulaP();
  updateFilterSummary();
  updateCompareTab();
}

// ===== PROVIDER PILLS STATE HELPERS =====
function setPillState(pill, p, active) {
  if (active) {
    pill.classList.add('active');
    pill.style.color = providerColor(p);
    pill.style.borderColor = `rgba(${providerRgb(p)}, 0.4)`;
    pill.style.background = `rgba(${providerRgb(p)}, 0.12)`;
  } else {
    pill.classList.remove('active');
    pill.style.color = 'var(--text-muted)';
    pill.style.borderColor = 'var(--glass-border)';
    pill.style.background = 'transparent';
  }
}

function updatePriceRangeSliderHighlight() {
  const minVal = state.priceMin;
  const maxVal = state.priceMax;
  const sliderMax = parseFloat(document.getElementById('priceMax').max) || 12;
  const minPercent = (minVal / sliderMax) * 100;
  const maxPercent = (maxVal / sliderMax) * 100;
  const highlight = document.getElementById('priceRangeHighlight');
  if (highlight) {
    highlight.style.left = minPercent + '%';
    highlight.style.width = (maxPercent - minPercent) + '%';
  }
}

function resetFilters() {
  const allModels = computeAllMetrics(RAW_DATA, 0);
  const maxBlended = Math.max(...allModels.map(m => m.blended));
  const sliderMax = Math.ceil(maxBlended);

  state.p = 0.07;
  state.search = '';
  state.priceMin = 0;
  state.priceMax = sliderMax;
  state.perfThreshold = 0;
  state.sourceFilter = 'all';
  state.activeProviders = new Set(ALL_PROVIDERS);

  document.getElementById('pSlider').value = 0.07;
  document.getElementById('pValue').textContent = '0.07';
  document.getElementById('searchInput').value = '';
  document.getElementById('priceMin').value = 0;
  document.getElementById('priceMax').value = sliderMax;
  document.getElementById('priceMinVal').textContent = '0.00';
  document.getElementById('priceMaxVal').textContent = sliderMax.toFixed(2);
  document.getElementById('perfThreshold').value = 0;
  document.getElementById('perfThresholdVal').textContent = '0';

  document.querySelectorAll('.source-seg').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.source === 'all');
  });

  document.querySelectorAll('.provider-pill').forEach(pill => {
    setPillState(pill, pill.dataset.provider, true);
  });

  updatePriceRangeSliderHighlight();
  updateAll();
}

// Apply a partial filter change, keeping `state` and the controls in sync the same way
// resetFilters does. Only the keys present in `patch` are touched. Values are rounded to
// each input's step so the slider thumb and the state can't drift apart.
function setDashboardFilters(patch) {
  if (patch.reset) resetFilters();

  const priceMaxEl = document.getElementById('priceMax');
  const sliderMax = (priceMaxEl && parseFloat(priceMaxEl.max)) || state.priceMax;

  if (Array.isArray(patch.providers)) {
    state.activeProviders = new Set(patch.providers);
    document.querySelectorAll('.provider-pill').forEach(pill => {
      setPillState(pill, pill.dataset.provider, state.activeProviders.has(pill.dataset.provider));
    });
  }

  if (patch.sourceFilter) {
    state.sourceFilter = patch.sourceFilter;
    document.querySelectorAll('.source-seg').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.source === state.sourceFilter);
    });
  }

  if (typeof patch.priceMin === 'number' || typeof patch.priceMax === 'number') {
    let lo = typeof patch.priceMin === 'number' ? patch.priceMin : state.priceMin;
    let hi = typeof patch.priceMax === 'number' ? patch.priceMax : state.priceMax;
    lo = Math.round(Math.min(Math.max(lo, 0), sliderMax) * 10) / 10;
    hi = Math.round(Math.min(Math.max(hi, 0), sliderMax) * 10) / 10;
    if (lo > hi) { const t = lo; lo = hi; hi = t; }

    state.priceMin = lo;
    state.priceMax = hi;
    const minEl = document.getElementById('priceMin');
    if (minEl) minEl.value = lo;
    if (priceMaxEl) priceMaxEl.value = hi;
    const minLabel = document.getElementById('priceMinVal');
    const maxLabel = document.getElementById('priceMaxVal');
    if (minLabel) minLabel.textContent = lo.toFixed(2);
    if (maxLabel) maxLabel.textContent = hi.toFixed(2);
    updatePriceRangeSliderHighlight();
  }

  if (typeof patch.perfThreshold === 'number') {
    const v = Math.round(Math.min(Math.max(patch.perfThreshold, 0), 100));
    state.perfThreshold = v;
    const el = document.getElementById('perfThreshold');
    if (el) el.value = v;
    const label = document.getElementById('perfThresholdVal');
    if (label) label.textContent = String(v);
  }

  if (typeof patch.search === 'string') {
    state.search = patch.search;
    const el = document.getElementById('searchInput');
    if (el) el.value = patch.search;
  }

  if (typeof patch.p === 'number') {
    const v = Math.round(Math.min(Math.max(patch.p, 0), 1) * 100) / 100;
    state.p = v;
    const el = document.getElementById('pSlider');
    if (el) el.value = v;
    const label = document.getElementById('pValue');
    if (label) label.textContent = v.toFixed(2);
  }

  updateAll();
}

// ===== FILTER PANEL (collapsible) =====
// Count how many filters differ from their defaults, for the slim-bar badge.
function countActiveFilters() {
  let n = 0;
  if (state.search.trim() !== '') n++;
  if (state.p !== 0.07) n++;
  const priceMaxEl = document.getElementById('priceMax');
  const sliderMax = priceMaxEl ? (parseFloat(priceMaxEl.max) || 12) : 12;
  if (state.priceMin > 0 || state.priceMax < sliderMax) n++;
  if (state.perfThreshold > 0) n++;
  if (state.sourceFilter !== 'all') n++;
  if (state.activeProviders.size !== ALL_PROVIDERS.length) n++;
  return n;
}

function updateFilterSummary() {
  const badge = document.getElementById('filterCountBadge');
  if (!badge) return;
  const n = countActiveFilters();
  badge.textContent = n;
  badge.classList.toggle('hide', n === 0);
}

function initFilterPanel() {
  const toggle = document.getElementById('filtersToggle');
  const panel = document.getElementById('filtersPanel');
  if (!toggle || !panel) return;
  toggle.addEventListener('click', () => {
    const willOpen = panel.hasAttribute('hidden');
    panel.toggleAttribute('hidden', !willOpen);
    toggle.setAttribute('aria-expanded', String(willOpen));
  });
  const barReset = document.getElementById('filtersBarReset');
  if (barReset) barReset.addEventListener('click', resetFilters);
}

// ===== SCORE FORMULA MODAL =====
let formulaModalLastFocus = null;
function openFormulaModal() {
  const modal = document.getElementById('formulaModal');
  if (!modal) return;
  formulaModalLastFocus = document.activeElement;
  modal.classList.remove('hide');
  const closeBtn = document.getElementById('formulaModalClose');
  if (closeBtn) closeBtn.focus();
}
function closeFormulaModal() {
  const modal = document.getElementById('formulaModal');
  if (!modal || modal.classList.contains('hide')) return;
  modal.classList.add('hide');
  if (formulaModalLastFocus && typeof formulaModalLastFocus.focus === 'function') {
    formulaModalLastFocus.focus();
  }
  formulaModalLastFocus = null;
}
function initFormulaModal() {
  document.querySelectorAll('.info-btn[data-modal="formula"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openFormulaModal();
    });
  });
  const closeBtn = document.getElementById('formulaModalClose');
  if (closeBtn) closeBtn.addEventListener('click', closeFormulaModal);
  const modal = document.getElementById('formulaModal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeFormulaModal();
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeFormulaModal();
  });
}

// ===== PROVIDER PILLS =====
function initProviderPills() {
  const container = document.getElementById('providerPills');
  ALL_PROVIDERS.forEach(p => {
    const pill = document.createElement('button');
    pill.className = 'provider-pill';
    pill.dataset.provider = p;
    pill.textContent = p;

    setPillState(pill, p, state.activeProviders.has(p));

    pill.addEventListener('click', () => {
      if (state.activeProviders.has(p)) {
        state.activeProviders.delete(p);
        setPillState(pill, p, false);
      } else {
        state.activeProviders.add(p);
        setPillState(pill, p, true);
      }
      updateAll();
    });

    container.appendChild(pill);
  });
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
  document.getElementById('pSlider').addEventListener('input', e => {
    state.p = parseFloat(e.target.value);
    document.getElementById('pValue').textContent = state.p.toFixed(2);
    updateAll();
  });

  document.getElementById('searchInput').addEventListener('input', debounce(e => {
    state.search = e.target.value;
    updateAll();
  }, 200));

  const priceMinInput = document.getElementById('priceMin');
  const priceMaxInput = document.getElementById('priceMax');

  priceMinInput.addEventListener('input', e => {
    let val = parseFloat(e.target.value);
    if (val > state.priceMax) val = state.priceMax;
    state.priceMin = val;
    e.target.value = val;
    document.getElementById('priceMinVal').textContent = val.toFixed(2);
    priceMinInput.style.zIndex = '10';
    priceMaxInput.style.zIndex = '9';
    updatePriceRangeSliderHighlight();
    updateAll();
  });

  priceMaxInput.addEventListener('input', e => {
    let val = parseFloat(e.target.value);
    if (val < state.priceMin) val = state.priceMin;
    state.priceMax = val;
    e.target.value = val;
    document.getElementById('priceMaxVal').textContent = val.toFixed(2);
    priceMinInput.style.zIndex = '9';
    priceMaxInput.style.zIndex = '10';
    updatePriceRangeSliderHighlight();
    updateAll();
  });

  document.querySelectorAll('.source-seg').forEach(btn => {
    btn.addEventListener('click', () => {
      state.sourceFilter = btn.dataset.source;
      document.querySelectorAll('.source-seg').forEach(b => {
        b.classList.toggle('active', b === btn);
      });
      updateAll();
    });
  });

  document.getElementById('providerSelectAll').addEventListener('click', () => {
    ALL_PROVIDERS.forEach(p => state.activeProviders.add(p));
    document.querySelectorAll('.provider-pill').forEach(pill => {
      setPillState(pill, pill.dataset.provider, true);
    });
    updateAll();
  });

  document.getElementById('providerClearAll').addEventListener('click', () => {
    state.activeProviders.clear();
    document.querySelectorAll('.provider-pill').forEach(pill => {
      setPillState(pill, pill.dataset.provider, false);
    });
    updateAll();
  });

  document.getElementById('perfThreshold').addEventListener('input', e => {
    state.perfThreshold = parseFloat(e.target.value);
    document.getElementById('perfThresholdVal').textContent = Math.round(state.perfThreshold);
    updateAll();
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('#modelTable th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (state.sortColumn === key) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortColumn = key;
        state.sortDirection = (key === 'provider' || key === 'model') ? 'asc' : 'desc';
      }
      updateAll();
    });
  });

  document.getElementById('barMetricSelect').addEventListener('change', e => {
    state.barMetric = e.target.value;
    updateAll();
  });

  // Table row click/keyboard highlighting
  document.getElementById('tableBody').addEventListener('click', e => {
    const btn = e.target.closest('.compare-toggle');
    if (btn) { toggleCompare(btn.dataset.key); return; }
    const tr = e.target.closest('tr');
    if (tr && tr.dataset.key) toggleHighlight(tr.dataset.key);
  });
  document.getElementById('tableBody').addEventListener('keydown', e => {
    if (e.target.closest('.compare-toggle')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      const tr = e.target.closest('tr');
      if (tr && tr.dataset.key) { e.preventDefault(); toggleHighlight(tr.dataset.key); }
    }
  });

  // Leaderboard row click/keyboard highlighting
  document.getElementById('leaderboardList').addEventListener('click', e => {
    const btn = e.target.closest('.compare-toggle');
    if (btn) { toggleCompare(btn.dataset.key); return; }
    const row = e.target.closest('.leaderboard-row');
    if (row && row.dataset.key) toggleHighlight(row.dataset.key);
  });
  document.getElementById('leaderboardList').addEventListener('keydown', e => {
    if (e.target.closest('.compare-toggle')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      const row = e.target.closest('.leaderboard-row');
      if (row && row.dataset.key) { e.preventDefault(); toggleHighlight(row.dataset.key); }
    }
  });

  // Compare tray, empty state, and compare-table column removal
  document.getElementById('compareTrayChips').addEventListener('click', e => {
    const btn = e.target.closest('.compare-chip-remove');
    if (btn) toggleCompare(btn.dataset.key);
  });
  document.getElementById('compareTableWrap').addEventListener('click', e => {
    const btn = e.target.closest('.compare-col-remove');
    if (btn) toggleCompare(btn.dataset.key);
  });
  document.getElementById('compareTrayGo').addEventListener('click', () => switchTab('compare'));
  document.getElementById('compareTrayClear').addEventListener('click', clearCompare);
  document.getElementById('compareEmptyBrowse').addEventListener('click', () => switchTab('table'));
}

// ===== TAB SWITCHING =====
function switchTab(tabName) {
  const btns = document.querySelectorAll(`.tab-btn[data-tab="${tabName}"]`);
  const section = document.getElementById('tab-' + tabName);
  if (!btns.length || !section) return;

  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.removeAttribute('aria-current');
  });
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btns.forEach(b => {
    b.classList.add('active');
    b.setAttribute('aria-current', 'page');
  });
  section.classList.add('active');

  // On phones the bottom nav can be tapped from anywhere in a long tab, so
  // reset scroll to the top of the newly shown tab. Desktop scroll is untouched.
  if (window.matchMedia('(max-width: 640px)').matches) {
    window.scrollTo(0, 0);
  }

  if (tabName === 'charts') {
    setTimeout(() => {
      if (scatterChart) scatterChart.resize();
      if (barChart) barChart.resize();
      if (radarChart) radarChart.resize();
    }, 50);
  }
  if (tabName === 'compare') {
    setTimeout(() => {
      if (compareRadarChart) compareRadarChart.resize();
    }, 50);
  }
}

// ===== THEME MANAGEMENT =====
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  let defaultTheme = 'dark';
  if (savedTheme) {
    defaultTheme = savedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    defaultTheme = 'light';
  }

  setTheme(defaultTheme, false);

  document.getElementById('themeToggle').addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme, true);
  });
}

function setTheme(theme, save = true) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  if (save) {
    localStorage.setItem('theme', theme);
  }
  updateChartColors(theme);
}

function updateChartColors(theme) {
  const isLight = theme === 'light';
  const gridColor = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.06)';
  const textColor = isLight ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)';
  const tickColor = isLight ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)';
  const paretoColor = isLight ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.4)';

  if (scatterChart && scatterChart.data.datasets[1]) {
    scatterChart.data.datasets[1].borderColor = paretoColor;
  }

  const tooltipStyle = isLight ? {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(15, 23, 42, 0.12)',
    borderWidth: 1,
    titleColor: '#0f172a',
    bodyColor: 'rgba(15, 23, 42, 0.8)',
    titleFont: { family: 'JetBrains Mono', weight: '600' },
    bodyFont: { family: 'JetBrains Mono' },
    padding: 12,
  } : {
    backgroundColor: 'rgba(15, 15, 26, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    titleColor: '#fff',
    bodyColor: 'rgba(255, 255, 255, 0.8)',
    titleFont: { family: 'JetBrains Mono', weight: '600' },
    bodyFont: { family: 'JetBrains Mono' },
    padding: 12,
  };

  [scatterChart, barChart, radarChart, compareRadarChart].forEach(chart => {
    if (!chart) return;

    if (chart === radarChart || chart === compareRadarChart) {
      const rScale = chart.options.scales.r;
      if (rScale) {
        if (rScale.angleLines) rScale.angleLines.color = gridColor;
        if (rScale.grid) rScale.grid.color = gridColor;
        if (rScale.pointLabels) rScale.pointLabels.color = textColor;
        if (rScale.ticks) rScale.ticks.color = tickColor;
      }
      if (chart.options.plugins && chart.options.plugins.legend) {
        chart.options.plugins.legend.labels.color = textColor;
      }
      // Update average dataset colors
      const avgDataset = chart === radarChart ? chart.data.datasets[0] : null;
      if (avgDataset) {
        if (isLight) {
          avgDataset.backgroundColor = 'rgba(79, 70, 229, 0.08)';
          avgDataset.borderColor = 'rgba(79, 70, 229, 0.4)';
        } else {
          avgDataset.backgroundColor = 'rgba(129, 140, 248, 0.1)';
          avgDataset.borderColor = 'rgba(129, 140, 248, 0.4)';
        }
      }
    } else {
      if (chart.options.scales.x) {
        if (chart.options.scales.x.grid) chart.options.scales.x.grid.color = gridColor;
        if (chart.options.scales.x.ticks) chart.options.scales.x.ticks.color = tickColor;
        if (chart.options.scales.x.title) chart.options.scales.x.title.color = textColor;
      }

      if (chart.options.scales.y) {
        if (chart.options.scales.y.grid) chart.options.scales.y.grid.color = gridColor;
        if (chart.options.scales.y.ticks) chart.options.scales.y.ticks.color = tickColor;
        if (chart.options.scales.y.title) chart.options.scales.y.title.color = textColor;
      }
    }

    if (chart.options.plugins && chart.options.plugins.tooltip) {
      Object.assign(chart.options.plugins.tooltip, tooltipStyle);
    }

    chart.update('none');
  });
}

// ===== COUNTER ANIMATION =====
// Per-element rAF handle map; cancel any in-progress loop before starting a new one.
const _animHandles = new WeakMap();

function animateValue(element, start, end, duration = 400, isPrice = false) {
  if (isNaN(start)) start = 0;
  if (isNaN(end)) end = 0;

  // Cancel any in-progress animation on this element
  const existing = _animHandles.get(element);
  if (existing != null) cancelAnimationFrame(existing);

  const format = v => isPrice ? '$' + v.toFixed(2) : v.toFixed(1);

  // Instant set for same value or when user prefers reduced motion
  if (start === end || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.textContent = format(end);
    _animHandles.delete(element);
    return;
  }

  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = progress * (2 - progress); // ease-out quad
    element.textContent = format(start + (end - start) * ease);

    if (progress < 1) {
      _animHandles.set(element, requestAnimationFrame(update));
    } else {
      element.textContent = format(end);
      _animHandles.delete(element);
    }
  }

  _animHandles.set(element, requestAnimationFrame(update));
}

// ===== DUAL SLIDER OVERLAP FIX =====
function initRangeSliderZIndexFix() {
  const dualSliderContainer = document.querySelector('.dual-slider');
  const priceMinInput = document.getElementById('priceMin');
  const priceMaxInput = document.getElementById('priceMax');

  function handleDualSliderPointer(e) {
    const rect = dualSliderContainer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clickPercent = (clientX - rect.left) / rect.width;

    const sliderMax = parseFloat(priceMaxInput.max) || 12;
    const clickValue = clickPercent * sliderMax;

    const distMin = Math.abs(clickValue - state.priceMin);
    const distMax = Math.abs(clickValue - state.priceMax);

    if (distMin === distMax) {
      if (clickValue < state.priceMin) {
        priceMinInput.style.zIndex = '10';
        priceMaxInput.style.zIndex = '9';
      } else {
        priceMinInput.style.zIndex = '9';
        priceMaxInput.style.zIndex = '10';
      }
    } else if (distMin < distMax) {
      priceMinInput.style.zIndex = '10';
      priceMaxInput.style.zIndex = '9';
    } else {
      priceMinInput.style.zIndex = '9';
      priceMaxInput.style.zIndex = '10';
    }
  }

  dualSliderContainer.addEventListener('mousedown', handleDualSliderPointer);
  dualSliderContainer.addEventListener('touchstart', handleDualSliderPointer, { passive: true });
}

// ===== HIGHLIGHTING MANAGEMENT =====
function toggleHighlight(modelName) {
  state.highlightedModel = state.highlightedModel === modelName ? null : modelName;
  updateHighlights();
}

function updateHighlights() {
  const modelName = state.highlightedModel;

  document.querySelectorAll('#tableBody tr').forEach(tr => {
    if (tr.dataset.key) {
      tr.classList.toggle('highlighted', tr.dataset.key === modelName);
    }
  });

  document.querySelectorAll('.leaderboard-row').forEach(row => {
    if (row.dataset.key) {
      row.classList.toggle('highlighted', row.dataset.key === modelName);
    }
  });

  const allModels = computeAllMetrics(RAW_DATA, state.p);
  const filtered = getFilteredModels(allModels);
  updateScatterChart(filtered);
  updateBarChart(filtered);
  updateRadarChart(filtered);
}

// ===== SKELETON REMOVAL =====
function removeSkeletons() {
  document.querySelectorAll('.skeleton-element').forEach(el => {
    el.classList.remove('skeleton-element', 'pulse');
  });
}

// ===== CHATBOT CONTROLLER =====
const CHAT_STATE = {
  isOpen: false,
  apiKey: localStorage.getItem('openrouter_api_key') || '',
  selectedModel: localStorage.getItem('openrouter_chat_model') || 'deepseek/deepseek-v4-pro',
  reasoningEffort: localStorage.getItem('openrouter_reasoning_effort') || 'high',
  messages: [],
  abortController: null
};

// Abort any in-flight request. Without this, clearing or closing mid-stream lets the
// loop keep pushing onto a history the user just reset, producing an unsendable
// tool/assistant sequence on the next turn.
function abortChatRequest() {
  if (CHAT_STATE.abortController) {
    CHAT_STATE.abortController.abort();
    CHAT_STATE.abortController = null;
  }
}

function initChatResizer() {
  const drawer = document.getElementById('chatDrawer');
  const resizerT = document.getElementById('chatResizerT');
  const resizerL = document.getElementById('chatResizerL');
  const resizerTL = document.getElementById('chatResizerTL');

  if (!drawer || !resizerT || !resizerL || !resizerTL) return;

  // Restore saved dimensions
  const savedWidth = localStorage.getItem('chat_drawer_width');
  const savedHeight = localStorage.getItem('chat_drawer_height');
  const maxWidth = window.innerWidth * 0.95;
  const maxHeight = window.innerHeight * 0.85;

  if (savedWidth && window.innerWidth > 480) {
    const clampedWidth = Math.min(parseInt(savedWidth, 10), maxWidth);
    drawer.style.width = clampedWidth + 'px';
  }
  if (savedHeight && window.innerWidth > 480) {
    const clampedHeight = Math.min(parseInt(savedHeight, 10), maxHeight);
    drawer.style.height = clampedHeight + 'px';
  }

  function setupResizer(resizer, type) {
    resizer.addEventListener('mousedown', onMouseDown);
    resizer.addEventListener('touchstart', onTouchStart, { passive: false });

    function onMouseDown(e) {
      e.preventDefault();
      startResize(e.clientX, e.clientY);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    function onTouchStart(e) {
      if (e.touches.length > 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      startResize(touch.clientX, touch.clientY);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    }

    let startX, startY, startWidth, startHeight;

    function startResize(clientX, clientY) {
      if (window.innerWidth <= 480) return;

      startX = clientX;
      startY = clientY;
      const rect = drawer.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;

      drawer.classList.add('resizing');
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';

      if (type === 't') document.body.style.cursor = 'ns-resize';
      else if (type === 'l') document.body.style.cursor = 'ew-resize';
      else if (type === 'tl') document.body.style.cursor = 'nwse-resize';
    }

    function moveResize(clientX, clientY) {
      const dx = clientX - startX;
      const dy = clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (type === 't' || type === 'tl') {
        newHeight = startHeight - dy;
      }
      if (type === 'l' || type === 'tl') {
        newWidth = startWidth - dx;
      }

      // Clamp dimensions
      const minWidth = 360;
      const minHeight = 400;
      const maxWidth = window.innerWidth * 0.95;
      const maxHeight = window.innerHeight * 0.85;

      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

      drawer.style.width = newWidth + 'px';
      drawer.style.height = newHeight + 'px';
    }

    function onMouseMove(e) {
      moveResize(e.clientX, e.clientY);
    }

    function onTouchMove(e) {
      if (e.touches.length > 0) {
        moveResize(e.touches[0].clientX, e.touches[0].clientY);
      }
    }

    function stopResize() {
      drawer.classList.remove('resizing');
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.cursor = '';

      const rect = drawer.getBoundingClientRect();
      localStorage.setItem('chat_drawer_width', Math.round(rect.width));
      localStorage.setItem('chat_drawer_height', Math.round(rect.height));
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      stopResize();
    }

    function onTouchEnd() {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      stopResize();
    }
  }

  setupResizer(resizerT, 't');
  setupResizer(resizerL, 'l');
  setupResizer(resizerTL, 'tl');
}

function setChatDrawerOpen(drawer, isOpen) {
  drawer.classList.toggle('hide', !isOpen);
  drawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  drawer.inert = !isOpen;

  if (!isOpen && drawer.contains(document.activeElement)) {
    document.getElementById('chatFab')?.focus();
  }
}

// Point a select at a saved preference, falling back to its default when that option is
// no longer offered. Without this, a dropped option leaves the dropdown showing one thing
// while requests keep sending the stale saved value.
function restoreSelectValue(select, saved, storageKey) {
  const offered = Array.from(select.options).map(o => o.value);
  let value = saved;
  if (!offered.includes(value)) {
    value = select.querySelector('option[selected]')?.value || offered[0];
    localStorage.setItem(storageKey, value);
  }
  select.value = value;
  return value;
}

function initChatbot() {
  const fab = document.getElementById('chatFab');
  const drawer = document.getElementById('chatDrawer');
  const clearBtn = document.getElementById('chatClearBtn');
  const closeBtn = document.getElementById('chatCloseBtn');
  const settingsBtn = document.getElementById('chatSettingsBtn');
  const apiKeyView = document.getElementById('chatApiKeyView');
  const apiKeyInput = document.getElementById('chatApiKeyInput');
  const saveKeyBtn = document.getElementById('saveApiKeyBtn');
  const clearKeyBtn = document.getElementById('clearApiKeyBtn');
  const modelSelect = document.getElementById('chatModelSelect');
  const reasoningSelect = document.getElementById('chatReasoningSelect');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');

  if (!fab || !drawer) return;

  // Initialize custom resizer handles
  initChatResizer();
  setChatDrawerOpen(drawer, CHAT_STATE.isOpen);

  // Load state
  if (CHAT_STATE.apiKey) {
    apiKeyInput.value = CHAT_STATE.apiKey;
    clearKeyBtn.classList.remove('hide');
  } else {
    apiKeyView.classList.remove('hide');
  }

  if (modelSelect) {
    CHAT_STATE.selectedModel = restoreSelectValue(modelSelect, CHAT_STATE.selectedModel, 'openrouter_chat_model');
  }
  if (reasoningSelect) {
    CHAT_STATE.reasoningEffort = restoreSelectValue(reasoningSelect, CHAT_STATE.reasoningEffort, 'openrouter_reasoning_effort');
  }

  // Listeners
  fab.addEventListener('click', () => {
    CHAT_STATE.isOpen = !CHAT_STATE.isOpen;
    setChatDrawerOpen(drawer, CHAT_STATE.isOpen);
    if (CHAT_STATE.isOpen) {
      if (!CHAT_STATE.apiKey) {
        apiKeyInput.focus();
      } else {
        chatInput.focus();
      }
      scrollToBottom();
      // Remove badge animation once chat is opened
      document.querySelector('.chat-fab-badge')?.classList.remove('pulse-badge');
    }
  });

  closeBtn.addEventListener('click', () => {
    CHAT_STATE.isOpen = false;
    abortChatRequest();
    setChatDrawerOpen(drawer, false);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      abortChatRequest();
      setChatLoading(false);
      CHAT_STATE.messages = [];
      const logs = document.getElementById('chatLogs');
      if (logs) {
        logs.innerHTML = `
          <div class="chat-message assistant">
            <div class="chat-sender-label">Assistant</div>
            <div class="message-bubble">
              Hello! I am your AI Assistant. Ask me anything about the model scores, value calculations, or current filter rankings!
            </div>
          </div>
        `;
      }
    });
  }

  settingsBtn.addEventListener('click', () => {
    apiKeyView.classList.toggle('hide');
  });

  saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      CHAT_STATE.apiKey = key;
      localStorage.setItem('openrouter_api_key', key);
      apiKeyView.classList.add('hide');
      clearKeyBtn.classList.remove('hide');
      addSystemMessage('API key saved successfully.');
    } else {
      alert('Please enter a valid OpenRouter API key.');
    }
  });

  clearKeyBtn.addEventListener('click', () => {
    CHAT_STATE.apiKey = '';
    localStorage.removeItem('openrouter_api_key');
    apiKeyInput.value = '';
    clearKeyBtn.classList.add('hide');
    apiKeyView.classList.remove('hide');
    addSystemMessage('API key cleared.');
  });

  if (modelSelect) {
    modelSelect.addEventListener('change', (e) => {
      CHAT_STATE.selectedModel = e.target.value;
      localStorage.setItem('openrouter_chat_model', e.target.value);
    });
  }

  if (reasoningSelect) {
    reasoningSelect.addEventListener('change', (e) => {
      CHAT_STATE.reasoningEffort = e.target.value;
      localStorage.setItem('openrouter_reasoning_effort', e.target.value);
    });
  }

  chatInput.addEventListener('input', () => {
    // Auto-grow textarea height
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(80, chatInput.scrollHeight) + 'px';
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  });

  sendBtn.addEventListener('click', () => {
    if (CHAT_STATE.abortController) {
      abortChatRequest();
    } else {
      handleChatSubmit();
    }
  });
}

function scrollToBottom() {
  const logs = document.getElementById('chatLogs');
  if (logs) {
    logs.scrollTop = logs.scrollHeight;
  }
}

function addSystemMessage(text) {
  const logs = document.getElementById('chatLogs');
  if (!logs) return;
  const div = document.createElement('div');
  div.className = 'chat-message system';
  div.innerHTML = `<div class="message-bubble">${escapeHtml(text)}</div>`;
  logs.appendChild(div);
  scrollToBottom();
}

function handleChatSubmit() {
  const chatInput = document.getElementById('chatInput');
  if (!chatInput) return;
  const text = chatInput.value.trim();
  if (!text) return;
  if (CHAT_STATE.abortController) return; // a turn is already in flight

  if (!CHAT_STATE.apiKey) {
    const keyView = document.getElementById('chatApiKeyView');
    if (keyView) keyView.classList.remove('hide');
    const keyInput = document.getElementById('chatApiKeyInput');
    if (keyInput) keyInput.focus();
    return;
  }

  // Clear input
  chatInput.value = '';
  chatInput.style.height = 'auto';

  // Append user message
  appendMessage('user', text);

  // Disable inputs during streaming
  setChatLoading(true);

  // Send request
  streamResponse(text).catch(err => {
    if (err && err.name === 'AbortError') return; // user cancelled; not an error
    console.error(err);
    appendMessage('system', `Error: ${err.message || 'Failed to stream response.'}`);
    setChatLoading(false);
  });
}

function appendMessage(role, text) {
  const logs = document.getElementById('chatLogs');
  if (!logs) return;
  const div = document.createElement('div');
  div.className = `chat-message ${role}`;
  
  if (role === 'system') {
    div.innerHTML = `<div class="message-bubble">${escapeHtml(text)}</div>`;
  } else {
    const senderName = role === 'user' ? 'You' : 'Assistant';
    div.innerHTML = `
      <div class="chat-sender-label">${senderName}</div>
      <div class="message-bubble">${parseMarkdown(text)}</div>
    `;
  }
  
  logs.appendChild(div);
  scrollToBottom();
  
  // Save to message history
  if (role !== 'system') {
    CHAT_STATE.messages.push({ role, content: text });
  }
}

function setChatLoading(isLoading) {
  const sendBtn = document.getElementById('chatSendBtn');
  const chatInput = document.getElementById('chatInput');
  const statusIndicator = document.querySelector('.chat-status-indicator');

  // The send button stays enabled while streaming — it becomes the stop button.
  if (sendBtn) {
    sendBtn.disabled = false;
    sendBtn.classList.toggle('streaming', isLoading);
    sendBtn.setAttribute('aria-label', isLoading ? 'Stop generating' : 'Send message');
    sendBtn.title = isLoading ? 'Stop generating' : '';
  }
  if (chatInput) chatInput.disabled = isLoading;
  if (statusIndicator) {
    statusIndicator.classList.toggle('loading', isLoading);
  }
}

// ===== CHAT TOOL HELPERS =====
// Hard cap on rows any single tool result may carry, so a broad query can't flood
// the model's context with the whole dataset.
const TOOL_MAX_ROWS = 25;

const TOOL_SORT_KEYS = ['value', 'performance', 'blended', 'inputPrice', 'outputPrice', 'cachePrice',
  'livebench', 'aaScore', 'model', 'provider'];

function toolOk(payload) {
  return JSON.stringify({ ok: true, ...payload });
}

function toolError(message, extra) {
  return JSON.stringify({ ok: false, error: message, ...(extra || {}) });
}

// Every tool works off the same two projections: the full dataset at the user's current
// cost sensitivity, and that dataset narrowed by their on-screen filters.
function getToolModelSets() {
  const all = computeAllMetrics(RAW_DATA, state.p);
  return { all, filtered: getFilteredModels(all) };
}

function compareByKey(a, b, key, asc) {
  const va = a[key] ?? -Infinity; // null cachePrice sorts last
  const vb = b[key] ?? -Infinity;
  let result = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
  if (!asc) result = -result;
  // Tie-break on name so results are stable regardless of data.json ordering.
  return result !== 0 ? result : a.model.localeCompare(b.model);
}

// Project a model for a tool result. Numbers are rounded to the precision the table
// renders at; `open` is included because it drives a dashboard filter.
function serializeModel(m, detail) {
  const base = {
    model: m.model,
    provider: m.provider,
    open: m.open === true,
    blendedCost: round2(m.blended),
    performance: round1(m.performance),
    value: round1(m.value),
  };
  if (detail !== 'full') return base;
  return {
    ...base,
    inputPrice: round2(m.inputPrice),
    outputPrice: round2(m.outputPrice),
    cachePrice: m.cachePrice == null ? null : round2(m.cachePrice),
    livebench: round2(m.livebench),
    aaScore: m.aaScore,
  };
}

// Resolve a free-text model name against the dataset in tiers: exact, then prefix, then
// substring, then all-tokens-present. Only the best non-empty tier is kept, so a precise
// query ("GPT-5.4") wins outright even though looser names also match. Reports ambiguity
// rather than guessing — silently picking one of five "Opus" models yields confidently
// wrong numbers.
function resolveModelQuery(query, allModels) {
  const q = String(query == null ? '' : query).toLowerCase().trim();
  if (!q) return { status: 'not_found', match: null, candidates: [], matchQuality: null };

  const tokens = q.split(/\s+/).filter(Boolean);
  const tiers = [[], [], [], []];

  allModels.forEach(m => {
    const name = m.model.toLowerCase();
    const full = (m.provider + ' ' + m.model).toLowerCase();
    if (name === q || full === q) tiers[0].push(m);
    else if (name.startsWith(q) || full.startsWith(q)) tiers[1].push(m);
    else if (name.includes(q) || full.includes(q)) tiers[2].push(m);
    else if (tokens.every(t => full.includes(t))) tiers[3].push(m);
  });

  const qualities = ['exact', 'prefix', 'substring', 'tokens'];
  for (let i = 0; i < tiers.length; i++) {
    const hits = tiers[i];
    if (hits.length === 0) continue;
    hits.sort((a, b) => (b.performance - a.performance) || a.model.localeCompare(b.model));
    return {
      status: hits.length === 1 ? 'found' : 'ambiguous',
      match: hits.length === 1 ? hits[0] : null,
      candidates: hits,
      matchQuality: qualities[i],
    };
  }

  return { status: 'not_found', match: null, candidates: [], matchQuality: null };
}

// Snapshot of everything the user currently has on screen. Shared by the read tool and
// returned by the write tool, so the assistant always sees the post-change state.
function buildDashboardContext() {
  const { all, filtered } = getToolModelSets();
  const stats = getSummaryStats(filtered);
  const priceMaxEl = document.getElementById('priceMax');
  const sliderMax = priceMaxEl ? parseFloat(priceMaxEl.max) : state.priceMax;
  const active = Array.from(state.activeProviders);

  const context = {
    dataAsOf: DATA_LAST_UPDATED,
    totalModels: all.length,
    totalProviders: ALL_PROVIDERS.length,
    matchedModels: filtered.length,
    filtersActive: countActiveFilters() > 0,
    settings: {
      costSensitivityP: state.p,
      searchQuery: state.search,
      priceMin: round2(state.priceMin),
      priceMax: round2(state.priceMax),
      priceSliderMax: round2(sliderMax),
      minPerformance: state.perfThreshold,
      weightsFilter: state.sourceFilter,
      activeProviders: active,
      inactiveProviders: ALL_PROVIDERS.filter(p => !state.activeProviders.has(p)),
      tableSort: { column: state.sortColumn, direction: state.sortDirection },
    },
    summaryCards: stats ? {
      bestValue: serializeModel(stats.bestValue),
      bestPerformance: serializeModel(stats.bestPerf),
      cheapest: serializeModel(stats.cheapest),
      mostExpensive: serializeModel(stats.expensive),
    } : null,
    compareSelection: state.compareSet.slice(),
  };

  if (!stats) {
    context.note = 'No models pass the current filters; the dashboard is showing its empty state.';
  }
  return context;
}

// ===== CHAT TOOL SCHEMAS =====
// Built per turn rather than declared as a constant: the provider enum is derived from
// ALL_PROVIDERS, which is empty at parse time and only populated once data is applied.
function buildChatTools() {
  const providerEnum = ALL_PROVIDERS.slice();
  return [
    {
      type: 'function',
      function: {
        name: 'query_models',
        description: 'Search, filter, sort and rank models from the dashboard\'s dataset. This is the main data tool — use it for rankings, leaderboards, "top N", "cheapest", "best value", "which open models…", or any question about a set of models rather than one named model. Read-only: it never changes what the user sees. Set scope="dashboard" (the default) to answer about what is currently on the user\'s screen, or scope="dataset" to search every model regardless of their filters. Returns rounded metrics plus a record of exactly which filters were applied.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            scope: {
              type: 'string',
              enum: ['dashboard', 'dataset'],
              default: 'dashboard',
              description: '"dashboard" = only models passing the user\'s current on-screen filters (providers, price range, min performance, open/closed, search box). "dataset" = every model, ignoring their filters. Use "dataset" when the user asks about models in general, or when a "dashboard" query returns nothing.'
            },
            sort_by: {
              type: 'string',
              enum: TOOL_SORT_KEYS,
              default: 'performance',
              description: 'Metric to sort by. "value" = value score (performance per cost at the user\'s current P). "blended" = blended cost per million tokens. Default "performance".'
            },
            order: {
              type: 'string',
              enum: ['desc', 'asc'],
              default: 'desc',
              description: 'Sort direction. Default "desc" (highest first). Use "asc" with sort_by="blended" for cheapest-first.'
            },
            providers: {
              type: 'array',
              items: { type: 'string', enum: providerEnum },
              description: 'Only include models from these providers. Omit for all providers.'
            },
            weights: {
              type: 'string',
              enum: ['any', 'open', 'closed'],
              default: 'any',
              description: 'Filter by weight availability: "open" = open-weights models only, "closed" = proprietary only, "any" = both.'
            },
            max_blended_cost: {
              type: 'number',
              minimum: 0,
              description: 'Only include models whose blended cost per million tokens is at most this (USD).'
            },
            min_blended_cost: {
              type: 'number',
              minimum: 0,
              description: 'Only include models whose blended cost per million tokens is at least this (USD).'
            },
            min_performance: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Only include models with a normalized performance score at least this high (0-100).'
            },
            name_contains: {
              type: 'string',
              description: 'Free-text substring matched case-insensitively against both model name and provider name. Use for broad filters like "all Gemini models". To look up one specific model, use get_model_details instead.'
            },
            pareto_only: {
              type: 'boolean',
              default: false,
              description: 'When true, return only the cost/performance Pareto frontier of the result set — the models not beaten on both price and performance by another model. This is the frontier line drawn on the dashboard scatter chart. Use for "which models are actually worth considering".'
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: TOOL_MAX_ROWS,
              default: 10,
              description: 'Maximum number of models to return. Default 10, hard maximum ' + TOOL_MAX_ROWS + '.'
            }
          }
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_model_details',
        description: 'Look up full details for one or more specific models by name: input price, output price, blended cost, LiveBench score, AA score, normalized performance, value score, and whether the weights are open. Matching is exact-first, then prefix, then substring, across both model and provider names. If a name is ambiguous (e.g. "Opus" or "Claude") this tool does not guess — it returns the candidates so you can ask the user or re-query with a precise name. Read-only, and it ignores the user\'s dashboard filters, so it can find models currently filtered out of their view.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            model_names: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              maxItems: 8,
              description: 'One to eight model names, e.g. ["Claude Opus 5"] or ["DeepSeek V4 Pro", "GLM 5.2"]. Use the fullest name you have.'
            }
          },
          required: ['model_names']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_dashboard_context',
        description: 'Read the user\'s current dashboard state: every active filter (cost-sensitivity P, search box, price range, minimum performance, open/closed weights filter, selected providers, table sort), how many models pass those filters out of the full dataset, and the four highlight cards shown on screen (best value, best performance, cheapest, most expensive). Call this before answering anything about "my dashboard", "my current view", or "what am I looking at", and whenever you need to explain why a model is missing from a result.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {}
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'compare_models',
        description: 'Put 2 to 4 named models side by side in the dashboard\'s Compare tab and switch the user\'s view to it. This CHANGES what the user sees, so only call it when the user actually asks to compare specific models — for read-only lookups use get_model_details. Uses the same name matching as get_model_details and refuses rather than guesses on an ambiguous name. Returns full metrics for the models it selected, plus any names it could not resolve.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            model_names: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
              maxItems: COMPARE_MAX,
              description: 'The 2-4 models to compare, e.g. ["Claude Opus 5", "GPT-5.6 Sol"]. The Compare view holds at most ' + COMPARE_MAX + '.'
            }
          },
          required: ['model_names']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'apply_dashboard_filters',
        description: 'Change the user\'s dashboard filters for them — providers, price range, minimum performance, open/closed weights, search box, or cost-sensitivity P. This CHANGES what the user sees on screen, so only call it when the user asks to filter, narrow, widen, or reset their view ("show me only open models under $1", "reset the filters"). Do not call it just to answer a question — use query_models with scope="dataset" for that. Only the fields you provide are changed; everything else is left alone. Returns the resulting filter state and how many models now match.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: {
            reset: {
              type: 'boolean',
              description: 'When true, restore every filter to its default (all providers, full price range, no performance floor, weights=any, empty search, P=0.07) before applying any other field in this call.'
            },
            providers: {
              type: 'array',
              items: { type: 'string', enum: providerEnum },
              description: 'Replace the selected providers with exactly these. Must not be empty — at least one provider has to stay selected or the dashboard shows nothing.'
            },
            weights: {
              type: 'string',
              enum: ['any', 'open', 'closed'],
              description: 'Set the Open/Closed segmented control.'
            },
            price_min: {
              type: 'number',
              minimum: 0,
              description: 'Lower bound of the blended-cost range slider, USD per million tokens.'
            },
            price_max: {
              type: 'number',
              minimum: 0,
              description: 'Upper bound of the blended-cost range slider, USD per million tokens. Clamped to the slider maximum.'
            },
            min_performance: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Minimum performance slider (0-100).'
            },
            search: {
              type: 'string',
              description: 'Text for the dashboard search box; matches model or provider name. Pass an empty string to clear it.'
            },
            cost_sensitivity: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Cost Sensitivity P (0-1). Higher makes cheap models score better on Value. Changing this changes every value score, so tell the user.'
            }
          }
        }
      }
    }
  ];
}

// ===== CHAT TOOL EXECUTORS =====
// Match provider names case-insensitively against the dataset so the model doesn't have
// to reproduce exact casing.
function normalizeProviderNames(names) {
  const resolved = [];
  const unknown = [];
  names.forEach(name => {
    const needle = String(name).toLowerCase().trim();
    const hit = ALL_PROVIDERS.find(p => p.toLowerCase() === needle);
    if (hit) {
      if (!resolved.includes(hit)) resolved.push(hit);
    } else {
      unknown.push(name);
    }
  });
  return { resolved, unknown };
}

function executeQueryModels(args) {
  const { all, filtered } = getToolModelSets();
  const scope = args.scope === 'dataset' ? 'dataset' : 'dashboard';
  let rows = scope === 'dataset' ? all : filtered;
  const applied = {};

  if (Array.isArray(args.providers) && args.providers.length > 0) {
    const { resolved, unknown } = normalizeProviderNames(args.providers);
    if (resolved.length === 0) {
      return toolError('None of those providers exist in the dataset.', { knownProviders: ALL_PROVIDERS });
    }
    rows = rows.filter(m => resolved.includes(m.provider));
    applied.providers = resolved;
    if (unknown.length > 0) applied.unknownProviders = unknown;
  }

  if (args.weights === 'open' || args.weights === 'closed') {
    const wantOpen = args.weights === 'open';
    rows = rows.filter(m => (m.open === true) === wantOpen);
    applied.weights = args.weights;
  }

  if (typeof args.max_blended_cost === 'number') {
    rows = rows.filter(m => m.blended <= args.max_blended_cost);
    applied.maxBlendedCost = args.max_blended_cost;
  }
  if (typeof args.min_blended_cost === 'number') {
    rows = rows.filter(m => m.blended >= args.min_blended_cost);
    applied.minBlendedCost = args.min_blended_cost;
  }
  if (typeof args.min_performance === 'number') {
    rows = rows.filter(m => m.performance >= args.min_performance);
    applied.minPerformance = args.min_performance;
  }

  if (typeof args.name_contains === 'string' && args.name_contains.trim() !== '') {
    const needle = args.name_contains.toLowerCase().trim();
    rows = rows.filter(m => m.model.toLowerCase().includes(needle) ||
      m.provider.toLowerCase().includes(needle));
    applied.nameContains = args.name_contains.trim();
  }

  if (args.pareto_only === true) {
    rows = getParetoFrontier(rows);
    applied.paretoOnly = true;
  }

  const sortBy = TOOL_SORT_KEYS.includes(args.sort_by) ? args.sort_by : 'performance';
  const asc = args.order === 'asc';
  const sorted = [...rows].sort((a, b) => compareByKey(a, b, sortBy, asc));

  const limit = clampInt(args.limit, 1, TOOL_MAX_ROWS, 10);
  const page = sorted.slice(0, limit);

  const payload = {
    scope,
    sortedBy: sortBy,
    order: asc ? 'asc' : 'desc',
    filtersApplied: applied,
    dashboardFiltersActive: scope === 'dashboard' && countActiveFilters() > 0,
    matched: sorted.length,
    returned: page.length,
    totalInDataset: all.length,
    truncated: sorted.length > page.length,
    models: page.map(m => serializeModel(m)),
  };

  if (sorted.length === 0 && scope === 'dashboard') {
    payload.hint = 'Nothing matched. The user\'s dashboard filters are active — call get_dashboard_context to see why, or retry with scope="dataset" to search all ' + all.length + ' models.';
  }

  return toolOk(payload);
}

function executeGetModelDetails(args) {
  // Tolerate a singular model_name, which models sometimes emit out of habit.
  const names = Array.isArray(args.model_names)
    ? args.model_names
    : (args.model_name ? [args.model_name] : []);

  if (names.length === 0) {
    return toolError('Provide at least one name in model_names.');
  }

  const { all } = getToolModelSets();
  const results = names.slice(0, 8).map(name => {
    const res = resolveModelQuery(name, all);
    if (res.status === 'found') {
      return { query: name, status: 'found', model: serializeModel(res.match, 'full') };
    }
    if (res.status === 'ambiguous') {
      return {
        query: name,
        status: 'ambiguous',
        matchQuality: res.matchQuality,
        candidates: res.candidates.slice(0, 10).map(m => serializeModel(m)),
        note: res.candidates.length + ' models match. Ask the user which one, or answer for all of them and say so.',
      };
    }
    return { query: name, status: 'not_found' };
  });

  return toolOk({ results });
}

function executeGetDashboardContext() {
  return toolOk(buildDashboardContext());
}

function executeCompareModels(args) {
  if (!Array.isArray(args.model_names) || args.model_names.length === 0) {
    return toolError('Missing model_names parameter.');
  }

  const { all } = getToolModelSets();
  const matched = [];
  const results = [];

  args.model_names.forEach(name => {
    const res = resolveModelQuery(name, all);
    if (res.status === 'found') {
      if (!matched.some(m => modelKey(m) === modelKey(res.match))) matched.push(res.match);
      results.push({ query: name, status: 'found', model: res.match.model });
    } else if (res.status === 'ambiguous') {
      results.push({
        query: name,
        status: 'ambiguous',
        candidates: res.candidates.slice(0, 10).map(m => m.model),
      });
    } else {
      results.push({ query: name, status: 'not_found' });
    }
  });

  // Refuse rather than half-apply: a one-model compare view is not what was asked for.
  if (matched.length < 2) {
    return toolError('Need at least 2 unambiguous models to compare. The dashboard was not changed.', { results });
  }

  const selected = matched.slice(0, COMPARE_MAX);
  const droppedForLimit = matched.slice(COMPARE_MAX).map(m => m.model);

  state.compareSet = selected.map(m => modelKey(m));
  updateCompareUI();
  syncCompareHash();
  switchTab('compare');

  return toolOk({
    viewChanged: true,
    note: 'The Compare tab is now open with these models selected.',
    compared: selected.map(m => serializeModel(m, 'full')),
    droppedForLimit,
    results,
  });
}

function executeApplyDashboardFilters(args) {
  const patch = {};

  if (args.reset === true) patch.reset = true;

  if (Array.isArray(args.providers)) {
    if (args.providers.length === 0) {
      return toolError('Refusing to deselect every provider — the dashboard would show nothing.');
    }
    const { resolved, unknown } = normalizeProviderNames(args.providers);
    if (resolved.length === 0) {
      return toolError('None of those providers exist in the dataset.', { knownProviders: ALL_PROVIDERS });
    }
    patch.providers = resolved;
    if (unknown.length > 0) patch.unknownProviders = unknown;
  }

  if (args.weights === 'any' || args.weights === 'open' || args.weights === 'closed') {
    patch.sourceFilter = args.weights === 'any' ? 'all' : args.weights;
  }
  if (typeof args.price_min === 'number') patch.priceMin = args.price_min;
  if (typeof args.price_max === 'number') patch.priceMax = args.price_max;
  if (typeof args.min_performance === 'number') patch.perfThreshold = args.min_performance;
  if (typeof args.search === 'string') patch.search = args.search;
  if (typeof args.cost_sensitivity === 'number') patch.p = args.cost_sensitivity;

  const keys = Object.keys(patch).filter(k => k !== 'unknownProviders');
  if (keys.length === 0) {
    return toolError('No recognised filter fields were provided, so nothing was changed.');
  }

  setDashboardFilters(patch);

  const payload = buildDashboardContext();
  payload.viewChanged = true;
  payload.changed = keys;
  if (patch.unknownProviders) payload.unknownProviders = patch.unknownProviders;
  payload.note = 'The user\'s dashboard filters were updated. Tell them what changed.';
  return toolOk(payload);
}

const TOOL_HANDLERS = {
  query_models: executeQueryModels,
  get_model_details: executeGetModelDetails,
  get_dashboard_context: executeGetDashboardContext,
  compare_models: executeCompareModels,
  apply_dashboard_filters: executeApplyDashboardFilters,
};

async function executeTool(name, argsString) {
  let args = {};
  if (argsString) {
    try {
      args = JSON.parse(argsString);
    } catch (e) {
      console.error('[Chatbot Tool] Bad arguments JSON for', name, argsString, e);
      return toolError('Could not parse the tool arguments as JSON. Retry with valid JSON.',
        { rawArguments: String(argsString).slice(0, 200) });
    }
  }
  if (!args || typeof args !== 'object' || Array.isArray(args)) args = {};

  console.info(`[Chatbot Tool] Invoking "${name}" with args:`, args);

  const handler = TOOL_HANDLERS[name];
  if (!handler) {
    return toolError(`Tool "${name}" is not implemented.`, { availableTools: Object.keys(TOOL_HANDLERS) });
  }

  // A throwing handler must become a tool result, not an unhandled rejection: bailing out
  // of the loop would leave an assistant tool_calls message with no matching tool reply,
  // which every later request would then be rejected for.
  try {
    return handler(args);
  } catch (err) {
    console.error(`[Chatbot Tool] "${name}" threw:`, err);
    return toolError(`The "${name}" tool failed: ${err.message || 'unknown error'}`);
  }
}

// ===== CHAT PIPELINE =====
// Deliberately does not enumerate tool names — the tool descriptions carry that, and
// duplicating them here just guarantees the two drift apart. Tone matters as much as
// rules here: the assistant is meant to be an approachable guide to the data, not an
// analyst reciting figures.
function buildSystemPrompt() {
  return `You are the built-in assistant for an LLM comparison dashboard. Your job is to make the data easy to understand: help people figure out which models are good, what they cost, and what fits their needs — in plain, friendly language.

THE DATA
The dashboard tracks ${RAW_DATA.length} models from ${ALL_PROVIDERS.length} providers (updated ${DATA_LAST_UPDATED}): prices, two benchmark scores, and whether a model's weights are open. It doesn't track anything else — context length, speed, release dates — so if asked about those, say the dashboard doesn't cover them rather than answering from memory.

Get numbers from your tools rather than memory, since the data and the user's filters can change between turns. The user's filters hide models from their screen but not from your tools — when a model seems to be missing, that's usually why.

HOW TO ANSWER
- Answer the actual question first, conversationally. Use a number or two to back up your point, not as the point — you're a guide, not a spreadsheet. One clear recommendation beats an exhaustive rundown.
- Prefer plain words to jargon: "blended cost" is roughly what a model costs to use, "performance" is how well it scores on benchmarks, "value" is bang for buck (the P slider sets how much price matters to it). Only explain the formulas if someone asks. (For reference: blended cost weights input price heavily over output price; performance blends the two benchmarks, each scaled so the best model in the dataset sets the bar and weighted so neither benchmark dominates; value = performance / cost^P.)
- Near-identical scores are a tie. Don't crown a winner over a decimal point — point to what genuinely separates the models, like price or open weights.
- If a name could mean several models (like "Opus"), just ask which one they meant.

ACTIONS
Two of your tools change the user's screen: one opens the Compare tab, one edits their filters. Use them only when the user asks for that, and mention what you changed. If a tool errors or finds nothing, say so plainly and suggest what to try next — never invent an answer to fill the gap.`;
}

async function streamResponse(userPrompt) {
  const logs = document.getElementById('chatLogs');
  if (!logs) return;

  let currentMessageDiv = null;
  let currentBubbleDiv = null;
  let currentThinkingDetails = null;
  let currentThinkingContentDiv = null;
  let partialContent = '';

  // Loop-invariant: build once per turn, not once per tool round.
  const systemPrompt = buildSystemPrompt();
  const chatTools = buildChatTools();

  const controller = new AbortController();
  CHAT_STATE.abortController = controller;

  try {
  // Runs until the model answers instead of requesting more tools — there is no round
  // cap. The escape hatch is the clear-chat or close button; both abort the request.
  while (true) {
    const messagesToSend = [
      { role: 'system', content: systemPrompt },
      ...CHAT_STATE.messages
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHAT_STATE.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/isr431/model-analysis',
        'X-Title': 'LLM Model Analysis Dashboard'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: CHAT_STATE.selectedModel,
        messages: messagesToSend,
        stream: true,
        tools: chatTools,
        max_tokens: 4096,
        reasoning: { effort: CHAT_STATE.reasoningEffort }
      })
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg = errorJson.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    let reasoningText = '';
    let contentText = '';
    let buffer = '';
    let toolCalls = [];
    // Reset per round: only the current round's text is unsaved, since a round that
    // ends in tool calls stores its text on the assistant message below.
    partialContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep last partial line

      for (const line of lines) {
        const cleaned = line.trim();
        if (!cleaned) continue;
        if (cleaned.startsWith('data: ')) {
          const dataStr = cleaned.slice(6);
          if (dataStr === '[DONE]') continue;
          
          try {
            const data = JSON.parse(dataStr);
            const delta = data.choices?.[0]?.delta;
            if (delta) {
              const reasoningChunk = delta.reasoning || delta.reasoning_content || '';
              const contentChunk = delta.content || '';
              const toolCallsDelta = delta.tool_calls;

              if (reasoningChunk) {
                if (!currentMessageDiv) {
                  createAssistantMessageNodes();
                }
                if (currentThinkingDetails.classList.contains('hide')) {
                  currentThinkingDetails.classList.remove('hide');
                }
                reasoningText += reasoningChunk;
                currentThinkingContentDiv.textContent = reasoningText;
                scrollToBottom();
              }

              if (contentChunk) {
                if (!currentMessageDiv) {
                  createAssistantMessageNodes();
                }
                if (currentThinkingDetails.open && reasoningText.length > 0) {
                  currentThinkingDetails.open = false;
                }
                contentText += contentChunk;
                partialContent = contentText;
                currentBubbleDiv.innerHTML = parseMarkdown(contentText);
                scrollToBottom();
              }

              if (toolCallsDelta) {
                toolCallsDelta.forEach(tc => {
                  const idx = tc.index;
                  if (!toolCalls[idx]) {
                    toolCalls[idx] = {
                      id: tc.id || '',
                      name: tc.function?.name || '',
                      arguments: tc.function?.arguments || ''
                    };
                  } else {
                    if (tc.id) toolCalls[idx].id = tc.id;
                    if (tc.function?.name) toolCalls[idx].name = tc.function.name;
                    if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments;
                  }
                });
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    if (buffer) {
      const cleaned = buffer.trim();
      if (cleaned.startsWith('data: ')) {
        const dataStr = cleaned.slice(6);
        if (dataStr !== '[DONE]') {
          try {
            const data = JSON.parse(dataStr);
            const delta = data.choices?.[0]?.delta;
            if (delta) {
              const contentChunk = delta.content || '';
              if (contentChunk) {
                if (!currentMessageDiv) createAssistantMessageNodes();
                contentText += contentChunk;
                partialContent = contentText;
                currentBubbleDiv.innerHTML = parseMarkdown(contentText);
                scrollToBottom();
              }
            }
          } catch (e) {}
        }
      }
    }

    function createAssistantMessageNodes() {
      currentMessageDiv = document.createElement('div');
      currentMessageDiv.className = 'chat-message assistant';

      // Prepend label
      const labelDiv = document.createElement('div');
      labelDiv.className = 'chat-sender-label';
      labelDiv.textContent = 'Assistant';
      currentMessageDiv.appendChild(labelDiv);

      currentThinkingDetails = document.createElement('details');
      currentThinkingDetails.className = 'thinking-block hide';
      currentThinkingDetails.open = true;
      currentThinkingDetails.innerHTML = `
        <summary class="thinking-title">Thinking Process</summary>
        <div class="thinking-content"></div>
      `;

      currentBubbleDiv = document.createElement('div');
      currentBubbleDiv.className = 'message-bubble';

      currentMessageDiv.appendChild(currentThinkingDetails);
      currentMessageDiv.appendChild(currentBubbleDiv);
      logs.appendChild(currentMessageDiv);
      currentThinkingContentDiv = currentThinkingDetails.querySelector('.thinking-content');
    }

    if (currentThinkingDetails && reasoningText.trim().length === 0) {
      currentThinkingDetails.remove();
    }

    const activeToolCalls = toolCalls.filter(Boolean);

    if (activeToolCalls.length > 0) {
      activeToolCalls.forEach(tc => {
        addToolStatusMessage(`Running tool: ${tc.name}...`);
      });

      CHAT_STATE.messages.push({
        role: 'assistant',
        content: contentText || null,
        tool_calls: activeToolCalls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: tc.arguments
          }
        }))
      });

      for (const tc of activeToolCalls) {
        const result = await executeTool(tc.name, tc.arguments);
        CHAT_STATE.messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          name: tc.name,
          content: result
        });
      }

      currentMessageDiv = null;
      currentBubbleDiv = null;
      currentThinkingDetails = null;
      currentThinkingContentDiv = null;
    } else {
      if (contentText.trim().length === 0 && reasoningText.trim().length === 0) {
        if (!currentMessageDiv) createAssistantMessageNodes();
        currentBubbleDiv.textContent = 'No response generated.';
      } else if (contentText.trim().length > 0) {
        CHAT_STATE.messages.push({ role: 'assistant', content: contentText });
      }
      break;
    }
  }
  } catch (err) {
    // A stopped reply is already rendered on screen, so keep it in history too —
    // otherwise the model has no record of what the user can plainly see it said.
    if (err && err.name === 'AbortError' && partialContent.trim().length > 0) {
      CHAT_STATE.messages.push({ role: 'assistant', content: partialContent });
    }
    throw err;
  } finally {
    if (CHAT_STATE.abortController === controller) CHAT_STATE.abortController = null;
    setChatLoading(false);
  }
}

function addToolStatusMessage(text) {
  const logs = document.getElementById('chatLogs');
  if (!logs) return;
  const div = document.createElement('div');
  div.className = 'chat-message tool-status';
  div.innerHTML = `<div class="message-bubble">⚙️ ${escapeHtml(text)}</div>`;
  logs.appendChild(div);
  scrollToBottom();
}

// Helper to escape HTML characters
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Simple markdown parsing helper
function parseMarkdown(markdown) {
  let normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let html = escapeHtml(normalized);

  // 1. Block Preservation: Extract code blocks
  const codeBlocks = [];
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const placeholder = `%%CODEBLOCK_${codeBlocks.length}%%`;
    let cleanCode = code.replace(/^\n/, '');
    
    // Detect and strip language identifier (e.g. ```javascript\n)
    const firstLineEnd = cleanCode.indexOf('\n');
    let lang = '';
    if (firstLineEnd !== -1) {
      const firstLine = cleanCode.substring(0, firstLineEnd).trim();
      if (/^[a-zA-Z0-9_-]+$/.test(firstLine)) {
        lang = firstLine;
        cleanCode = cleanCode.substring(firstLineEnd + 1);
      }
    } else {
      const trimmed = cleanCode.trim();
      if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        lang = trimmed;
        cleanCode = '';
      }
    }
    
    const classAttr = lang ? ` class="language-${lang}"` : '';
    codeBlocks.push(`<pre><code${classAttr}>${cleanCode}</code></pre>`);
    return `\n${placeholder}\n`;
  });

  // 2. Block Preservation: Extract inline code blocks
  const inlineCodes = [];
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const placeholder = `%%INLINECODE_${inlineCodes.length}%%`;
    inlineCodes.push(`<code>${code}</code>`);
    return placeholder;
  });

  // 3. Link Parsing & Security Check
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    const cleanUrl = url.trim();
    if (cleanUrl.toLowerCase().startsWith('javascript:')) {
      return text;
    }
    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });

  // 4. Tables Parsing
  const linesForTable = html.split('\n');
  let inTable = false;
  let tableRows = [];
  let parsedLines = [];

  for (let i = 0; i < linesForTable.length; i++) {
    const line = linesForTable[i].trim();
    const isRow = line.startsWith('|') && line.endsWith('|');
    
    if (isRow) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
    } else {
      if (inTable) {
        parsedLines.push(renderMarkdownTable(tableRows));
        inTable = false;
      }
      parsedLines.push(linesForTable[i]);
    }
  }
  if (inTable) {
    parsedLines.push(renderMarkdownTable(tableRows));
  }
  html = parsedLines.join('\n');

  // 5. Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 6. Horizontal Rules
  html = html.replace(/^\s*---+\s*$/gim, '<hr>');

  // 7. Bold & Italic text
  html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([\s\S]*?)\*/g, '<em>$1</em>');
  html = html.replace(/_([\s\S]*?)_/g, '<em>$1</em>');

  // 8. Lists (ordered & unordered)
  const lines = html.split('\n');
  let inListType = null; // 'ul', 'ol', or null
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const isOrdered = /^\d+\./.test(listMatch[2]);
      const currentType = isOrdered ? 'ol' : 'ul';
      
      if (inListType && inListType !== currentType) {
        result.push(`</${inListType}>`);
        inListType = null;
      }
      
      if (!inListType) {
        result.push(`<${currentType}>`);
        inListType = currentType;
      }
      result.push(`<li>${listMatch[3]}</li>`);
    } else if (line.trim() === '' && inListType) {
      // Lookahead: check if the next non-empty line continues list of same type
      let nextListItemType = null;
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        if (nextLine !== '') {
          const nextMatch = lines[j].match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
          if (nextMatch) {
            const nextIsOrdered = /^\d+\./.test(nextMatch[2]);
            nextListItemType = nextIsOrdered ? 'ol' : 'ul';
          }
          break;
        }
      }
      
      if (nextListItemType === inListType) {
        continue; // Keep list open and discard formatting whitespace
      } else {
        result.push(`</${inListType}>`);
        inListType = null;
        result.push(line);
      }
    } else {
      if (inListType) {
        result.push(`</${inListType}>`);
        inListType = null;
      }
      result.push(line);
    }
  }
  if (inListType) {
    result.push(`</${inListType}>`);
  }
  html = result.join('\n');

  // 9. Wrap Paragraphs
  const paragraphs = html.split(/\n{2,}/);
  let finalHtml = paragraphs.map(p => {
    const trimmed = p.trim();
    if (trimmed.startsWith('<pre>') || trimmed.startsWith('<ul>') || trimmed.startsWith('<ol>') || trimmed.startsWith('<li>') || trimmed.startsWith('<table>') || trimmed.startsWith('<h1') || trimmed.startsWith('<h2') || trimmed.startsWith('<h3') || trimmed.startsWith('<hr>') || trimmed.startsWith('%%CODEBLOCK_')) {
      return trimmed;
    }
    if (trimmed === '') {
      return '';
    }
    return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
  }).filter(Boolean).join('');

  // 10. Restore Preserved Blocks
  codeBlocks.forEach((block, idx) => {
    finalHtml = finalHtml.replace(`%%CODEBLOCK_${idx}%%`, block);
  });
  inlineCodes.forEach((code, idx) => {
    finalHtml = finalHtml.replace(`%%INLINECODE_${idx}%%`, code);
  });

  return finalHtml;
}

function renderMarkdownTable(rows) {
  if (rows.length < 2) {
    return rows.join('\n');
  }

  const headers = rows[0]
    .split('|')
    .slice(1, -1)
    .map(cell => cell.trim());

  const isDivider = /^[\s|:-]+$/.test(rows[1]);
  if (!isDivider) {
    return rows.join('\n');
  }

  let tableHtml = '<table><thead><tr>';
  headers.forEach(h => {
    tableHtml += `<th>${h}</th>`;
  });
  tableHtml += '</tr></thead><tbody>';

  for (let r = 2; r < rows.length; r++) {
    const cells = rows[r]
      .split('|')
      .slice(1, -1)
      .map(cell => cell.trim());

    tableHtml += '<tr>';
    for (let c = 0; c < headers.length; c++) {
      const val = cells[c] !== undefined ? cells[c] : '';
      tableHtml += `<td>${val}</td>`;
    }
    tableHtml += '</tr>';
  }
  tableHtml += '</tbody></table>';
  return tableHtml;
}

// ===== INIT =====
async function init() {
  // Setup theme before charts so first paint uses correct colors
  initTheme();

  // Apply fallback data and render immediately (instant render — no delay)
  applyData(FALLBACK_DATA);
  state.activeProviders = new Set(ALL_PROVIDERS);

  initCharts();
  // Apply theme colors to charts now that they exist — initTheme() ran
  // before initCharts(), so its updateChartColors() call was a no-op.
  const activeTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  updateChartColors(activeTheme);
  initProviderPills();
  initEventListeners();
  initFilterPanel();
  initFormulaModal();
  initRangeSliderZIndexFix();
  updateSliderBounds();
  updatePriceRangeSliderHighlight();
  initChatbot();
  initTableScrollHints();

  // Re-render when crossing the phone breakpoint (e.g. rotation) so bar-chart
  // labels and table scroll hints re-derive for the new width.
  window.matchMedia('(max-width: 640px)').addEventListener('change', () => updateAll());

  // First paint with fallback data; remove skeleton state
  updateAll();
  removeSkeletons();

  // Restore a shared comparison from the URL; unknown keys are kept until
  // the background fetch resolves, then pruned by revalidateCompareSet()
  restoreCompareFromHash();
  window.addEventListener('hashchange', () => {
    restoreCompareFromHash();
    revalidateCompareSet();
  });

  // Fetch fresh data in the background — swap and refresh only if different
  loadData().then(data => {
    const sameModels = JSON.stringify(data.models) === JSON.stringify(FALLBACK_DATA.models);
    const sameProviders = JSON.stringify(data.providers) === JSON.stringify(FALLBACK_DATA.providers);
    const sameLastUpdated = data.lastUpdated === FALLBACK_DATA.lastUpdated;

    if (!sameModels || !sameProviders || !sameLastUpdated) {
      const oldProvidersSet = new Set(ALL_PROVIDERS);
      applyData(data);
      reinitProviderPills(oldProvidersSet);
      updateSliderBounds();
      updatePriceRangeSliderHighlight();
      updateAll();
      console.info('[LLM Analysis] Data refreshed from data.json.');
    } else {
      console.info('[LLM Analysis] data.json matches fallback — no update needed.');
    }
    revalidateCompareSet();
  });
}

document.addEventListener('DOMContentLoaded', init);
