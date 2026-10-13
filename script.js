(() => {
  const ASSET = 'assets';
  const YEARS = Array.from({ length: 22 }, (_, i) => 2000 + i);
  const csvPaths = {
    city: `${ASSET}/data/guwahati_water_area.csv`,
    buffer: `${ASSET}/data/guwahati_water_area_with_10km_buffer.csv`,
    seasonal: `${ASSET}/data/guwahati_seasonal_water_areas_2000_2021.csv`
  };

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (!lines.length) return [];
    const parseLine = (line) => {
      const cells = [];
      let current = '';
      let quoted = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (quoted && line[i + 1] === '"') { current += '"'; i++; }
          else quoted = !quoted;
        } else if (ch === ',' && !quoted) {
          cells.push(current); current = '';
        } else current += ch;
      }
      cells.push(current);
      return cells;
    };
    const headers = parseLine(lines[0]).map(h => h.trim());
    return lines.slice(1).filter(line => line.trim()).map(line => {
      const cells = parseLine(line);
      const item = {};
      headers.forEach((header, index) => item[header] = (cells[index] ?? '').trim());
      return item;
    });
  }

  async function loadCSV(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
    return parseCSV(await response.text());
  }

  const fmt = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : '—';
  };
  const fmtYear = (value) => String(value ?? '—');

  // Mobile navigation
  const menuToggle = document.getElementById('menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      menuToggle.textContent = open ? '×' : '☰';
    });
    mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰';
    }));
  }

  let cityRows = [];
  let bufferRows = [];
  let currentScope = 'buffer';
  let annualIndex = 0;
  let annualPaused = false;
  let annualTimer = null;

  const annualElements = {
    title: document.getElementById('area-scope-title'),
    year: document.getElementById('area-year'),
    count: document.getElementById('area-year-count'),
    progress: document.getElementById('area-progress-bar'),
    nonwater: document.getElementById('nonwater-value'),
    seasonal: document.getElementById('seasonal-value'),
    permanent: document.getElementById('permanent-value'),
    source: document.getElementById('area-source-name'),
    csv: document.getElementById('area-csv-link'),
    pause: document.getElementById('area-pause'),
    next: document.getElementById('area-next'),
    table: document.querySelector('#annual-table tbody')
  };

  function renderAnnualYear() {
    const rows = currentScope === 'city' ? cityRows : bufferRows;
    if (!rows.length) return;
    const row = rows[Math.min(annualIndex, rows.length - 1)];
    const year = Number(row.Year);
    annualElements.title.textContent = currentScope === 'city' ? 'Inside Guwahati municipal boundary' : 'Guwahati + 10 km surrounding extent';
    annualElements.year.textContent = fmtYear(year);
    annualElements.count.textContent = `${String(annualIndex + 1).padStart(2, '0')} / ${rows.length}`;
    annualElements.progress.style.width = `${((annualIndex + 1) / rows.length) * 100}%`;
    annualElements.nonwater.textContent = fmt(row['Non-water (km²)']);
    annualElements.seasonal.textContent = fmt(row['Seasonal water (km²)']);
    annualElements.permanent.textContent = fmt(row['Permanent water (km²)']);
    annualElements.source.textContent = currentScope === 'city' ? 'Source file: guwahati_water_area.csv' : 'Source file: guwahati_water_area_with_10km_buffer.csv';
    annualElements.csv.href = csvPaths[currentScope];
    document.querySelectorAll('[data-scope]').forEach(btn => {
      const active = btn.dataset.scope === currentScope;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function renderAnnualTable() {
    const rows = currentScope === 'city' ? cityRows : bufferRows;
    if (!annualElements.table) return;
    annualElements.table.innerHTML = rows.map(row => `<tr><td>${row.Year}</td><td>${fmt(row['Non-water (km²)'])}</td><td>${fmt(row['Seasonal water (km²)'])}</td><td>${fmt(row['Permanent water (km²)'])}</td></tr>`).join('');
  }

  function advanceAnnual() {
    if (!annualPaused) {
      const rows = currentScope === 'city' ? cityRows : bufferRows;
      if (rows.length) annualIndex = (annualIndex + 1) % rows.length;
      renderAnnualYear();
    }
  }

  function startAnnualTimer() {
    if (annualTimer) clearInterval(annualTimer);
    annualTimer = setInterval(advanceAnnual, 2000);
  }

  document.querySelectorAll('[data-scope]').forEach(btn => btn.addEventListener('click', () => {
    currentScope = btn.dataset.scope;
    annualIndex = 0;
    renderAnnualYear();
    renderAnnualTable();
  }));
  annualElements.pause?.addEventListener('click', () => {
    annualPaused = !annualPaused;
    annualElements.pause.textContent = annualPaused ? '▶' : 'Ⅱ';
    annualElements.pause.setAttribute('aria-pressed', String(annualPaused));
    annualElements.pause.setAttribute('aria-label', annualPaused ? 'Resume yearly area viewer' : 'Pause yearly area viewer');
  });
  annualElements.next?.addEventListener('click', () => {
    const rows = currentScope === 'city' ? cityRows : bufferRows;
    annualIndex = rows.length ? (annualIndex + 1) % rows.length : 0;
    renderAnnualYear();
  });

  // Seasonal map and seasonal area ticker
  const seasonConfigs = {
    Summer: { gif: `${ASSET}/images/guwahati_summer_water_2000_2021.gif`, label: 'Summer water classification', months: 'Mar–May' },
    Monsoon: { gif: `${ASSET}/images/guwahati_monsoon_water_2000_2021.gif`, label: 'Monsoon water classification', months: 'Jun–Sep' },
    Winter: { gif: `${ASSET}/images/guwahati_winter_water_2000_2021.gif`, label: 'Winter water classification', months: 'Dec–Feb' }
  };
  let seasonalRows = [];
  let currentSeason = 'Summer';
  let seasonalIndex = 0;
  let seasonalPaused = false;
  let seasonalTimer = null;

  const seasonEls = {
    gif: document.getElementById('season-gif'),
    title: document.getElementById('season-map-title'),
    tag: document.getElementById('season-tag'),
    download: document.getElementById('season-gif-download'),
    year: document.getElementById('season-year'),
    count: document.getElementById('season-year-count'),
    noWater: document.getElementById('season-no-water'),
    seasonal: document.getElementById('season-seasonal-water'),
    allWater: document.getElementById('season-all-water'),
    progress: document.getElementById('season-progress-bar'),
    next: document.getElementById('season-next'),
    table: document.querySelector('#seasonal-table tbody')
  };

  function rowsForSeason() {
    return seasonalRows.filter(row => row.Season === currentSeason).sort((a,b) => Number(a.Year) - Number(b.Year));
  }

  function renderSeasonStats() {
    const rows = rowsForSeason();
    if (!rows.length) return;
    const row = rows[Math.min(seasonalIndex, rows.length - 1)];
    seasonEls.year.textContent = row.Year;
    seasonEls.count.textContent = `${String(seasonalIndex + 1).padStart(2, '0')} / ${rows.length}`;
    seasonEls.noWater.innerHTML = `${fmt(row['No water (km²)'])} <small>km²</small>`;
    seasonEls.seasonal.innerHTML = `${fmt(row['Seasonal water (km²)'])} <small>km²</small>`;
    seasonEls.allWater.innerHTML = `${fmt(row['Water in all valid seasonal observations (km²)'])} <small>km²</small>`;
    seasonEls.progress.style.width = `${((seasonalIndex + 1) / rows.length) * 100}%`;
  }

  function setSeason(season) {
    if (!seasonConfigs[season]) return;
    currentSeason = season;
    seasonalIndex = 0;
    const conf = seasonConfigs[season];
    seasonEls.gif.src = conf.gif;
    seasonEls.gif.alt = `${season} seasonal water-class animation for Guwahati, 2000–2021`;
    seasonEls.title.textContent = conf.label;
    seasonEls.tag.textContent = season.toUpperCase();
    seasonEls.download.href = conf.gif;
    document.querySelectorAll('[data-season]').forEach(btn => {
      const active = btn.dataset.season === season;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    renderSeasonStats();
  }

  function advanceSeason() {
    if (!seasonalPaused) {
      const rows = rowsForSeason();
      if (rows.length) seasonalIndex = (seasonalIndex + 1) % rows.length;
      renderSeasonStats();
    }
  }
  function startSeasonalTimer() {
    if (seasonalTimer) clearInterval(seasonalTimer);
    seasonalTimer = setInterval(advanceSeason, 2000);
  }
  document.querySelectorAll('[data-season]').forEach(btn => btn.addEventListener('click', () => setSeason(btn.dataset.season)));
  seasonEls.next?.addEventListener('click', () => {
    const rows = rowsForSeason();
    seasonalIndex = rows.length ? (seasonalIndex + 1) % rows.length : 0;
    renderSeasonStats();
  });

  Promise.all([
    loadCSV(csvPaths.city),
    loadCSV(csvPaths.buffer),
    loadCSV(csvPaths.seasonal)
  ]).then(([city, buffer, seasonal]) => {
    cityRows = city.sort((a,b) => Number(a.Year) - Number(b.Year));
    bufferRows = buffer.sort((a,b) => Number(a.Year) - Number(b.Year));
    seasonalRows = seasonal.sort((a,b) => Number(a.Year) - Number(b.Year));
    renderAnnualYear();
    renderAnnualTable();
    setSeason('Summer');
    if (seasonEls.table) {
      seasonEls.table.innerHTML = seasonalRows.map(row => `<tr><td>${row.Year}</td><td>${row.Season}</td><td>${fmt(row['No water (km²)'])}</td><td>${fmt(row['Seasonal water (km²)'])}</td><td>${fmt(row['Water in all valid seasonal observations (km²)'])}</td></tr>`).join('');
    }
    startAnnualTimer();
    startSeasonalTimer();
  }).catch(err => {
    console.error(err);
    const areaTitle = document.getElementById('area-scope-title');
    if (areaTitle) areaTitle.textContent = 'Could not load the CSV data — check that the site is opened through GitHub Pages or a local web server.';
    const seasonIntro = document.querySelector('.season-stat-intro');
    if (seasonIntro) seasonIntro.textContent = 'Seasonal CSV could not be loaded. Check the assets/data paths.';
  });
})();
