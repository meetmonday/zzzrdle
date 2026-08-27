(function () {
  'use strict';

  // Bump the version when data/characters.json changes so returning users get the fresh data.
  const DATA_URL = 'data/characters.json?v=3';
  const STORAGE_KEY = 'zzzrdle-v1';
  const DAILY_ATTEMPTS = 5;
  const TIME_START = 60;
  const TIME_BONUS = 5;
  const TIME_DANGER = 10;
  const TIME_POINTS_BASE = 100;
  const TIME_POINTS_EFF = 60;
  const TIME_POINTS_EFF_STEP = 15;
  const TIME_POINTS_SPEED = 50;
  const TIME_POINTS_SPEED_STEP = 5;
  const TIME_COMBO_MAX = 5;
  const TIME_RANKS = [
    { min: 2500, rank: 'SS', label: 'Legendary', cls: 'rank--ss' },
    { min: 1800, rank: 'S', label: 'Ace', cls: 'rank--s' },
    { min: 1200, rank: 'A', label: 'Elite', cls: 'rank--a' },
    { min: 700, rank: 'B', label: 'Pro', cls: 'rank--b' },
    { min: 300, rank: 'C', label: 'Rookie', cls: 'rank--c' },
    { min: 0, rank: 'D', label: 'Beginner', cls: 'rank--d' },
  ];
  const ATTRIBUTES = [
    { key: 'attribute', label: 'Attribute' },
    { key: 'specialty', label: 'Specialty' },
    { key: 'attackType', label: 'Attack' },
    { key: 'faction', label: 'Faction' },
    { key: 'rarity', label: 'Rarity' },
  ];

  const els = {
    input: document.getElementById('guess-input'),
    guessBtn: document.getElementById('guess-btn'),
    suggestions: document.getElementById('suggestions'),
    board: document.getElementById('board'),
    message: document.getElementById('message'),
    attempts: document.getElementById('attempts-count'),
    menuScreen: document.getElementById('menu-screen'),
    gameScreen: document.getElementById('game-screen'),
    menuBtn: document.getElementById('menu-btn'),
    menuHelpBtn: document.getElementById('menu-help-btn'),
    modeCards: document.querySelectorAll('.mode-card'),
    statusDaily: document.getElementById('menu-status-daily'),
    statusStreak: document.getElementById('menu-status-streak'),
    statusPractice: document.getElementById('menu-status-practice'),
    statusTime: document.getElementById('menu-status-time'),
    overlay: document.getElementById('overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalResult: document.getElementById('modal-result'),
    modalTarget: document.getElementById('modal-target'),
    modalClose: document.getElementById('modal-close'),
    shareBtn: document.getElementById('share-btn'),
    shareStatus: document.getElementById('share-status'),
    practiceBtn: document.getElementById('practice-btn'),
    newPracticeBtn: document.getElementById('new-practice-btn'),
    newGameHint: document.getElementById('new-game-hint'),
    restartBtn: document.getElementById('restart-btn'),
    streakBadge: document.getElementById('streak-badge'),
    timeBadge: document.getElementById('time-badge'),
    comboBadge: document.getElementById('combo-badge'),
    attemptsLabel: document.getElementById('attempts-label'),
    inputPanel: document.getElementById('input-panel'),
    timeTimerWrap: document.getElementById('time-timer'),
    timeTimerValue: document.getElementById('time-timer-value'),
    timeBarFill: document.getElementById('time-bar-fill'),
    timeStats: document.getElementById('time-stats'),
    statScore: document.getElementById('stat-score'),
    statBest: document.getElementById('stat-best'),
    modalRank: document.getElementById('modal-rank'),
    rankLetter: document.getElementById('rank-letter'),
    rankLabel: document.getElementById('rank-label'),
    timerWrap: document.getElementById('daily-timer'),
    timerValue: document.getElementById('timer-value'),
    statPlayed: document.getElementById('stat-played'),
    statWon: document.getElementById('stat-won'),
    statStreak: document.getElementById('stat-streak'),
    statMax: document.getElementById('stat-max'),
    helpBtn: document.getElementById('help-btn'),
    statsHeading: document.querySelector('.modal__stats-heading'),
    statsGrid: document.getElementById('stats'),
    tutorialOverlay: document.getElementById('tutorial-overlay'),
    tutorialClose: document.getElementById('tutorial-close'),
    tutorialStart: document.getElementById('tutorial-start'),
    announcer: document.getElementById('announcer'),
    toast: document.getElementById('toast'),
    countdownOverlay: document.getElementById('countdown-overlay'),
    countdownNumber: document.getElementById('countdown-number'),
  };

  let characters = [];
  let state = loadState();
  let mode = 'daily';
  let suggestionMatches = [];
  let activeSuggestionIndex = -1;
  let pendingTimeResult = false;

  // Keep controls disabled until data is loaded.
  els.input.disabled = true;
  els.guessBtn.disabled = true;

  // --- Utilities -----------------------------------------------------------

  function normalizeName(name) {
    return (name || '').toLowerCase().trim();
  }

  function announce(text) {
    els.announcer.textContent = '';
    requestAnimationFrame(() => {
      els.announcer.textContent = text;
    });
  }

  let toastTimer = null;

  function showToast(html, type = '', duration = 3000) {
    clearTimeout(toastTimer);
    els.toast.innerHTML = html;
    els.toast.className = `toast${type ? ' toast--' + type : ''}`;
    els.toast.hidden = false;
    requestAnimationFrame(() => {
      els.toast.classList.add('is-visible');
    });
    toastTimer = setTimeout(() => {
      els.toast.classList.remove('is-visible');
      setTimeout(() => { els.toast.hidden = true; }, 300);
    }, duration);
  }

  function showFloatText(text, cls = '') {
    const el = document.createElement('div');
    el.className = 'float-text' + (cls ? ' float-text--' + cls : '');
    el.textContent = text;
    els.inputPanel.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  function findCharacter(query) {
    const n = normalizeName(query);
    return characters.find((c) => normalizeName(c.name) === n);
  }

  function todayString() {
    return new Date().toLocaleDateString('en-CA');
  }

  function hashString(str) {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 0x9e3779b9);
      h2 = Math.imul(h2 ^ ch, 0x5f356495);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 0x85ebca6b);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 0xc2b2ae35);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 0x85ebca6b);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 0xc2b2ae35);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)) >>> 0;
  }

  function seededIndex(seed, length) {
    const hash = hashString(seed);
    return Math.floor((hash / 0x100000000) * length);
  }

  function getDailyTarget() {
    const today = todayString();
    const idx = seededIndex(today, characters.length);
    return characters[idx];
  }

  function getRandomTarget() {
    return characters[Math.floor(Math.random() * characters.length)];
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return defaultState();
      // Ensure newer fields exist for returning users.
      if (!saved.streak) saved.streak = defaultState().streak;
      if (!saved.timeAttack) {
        saved.timeAttack = defaultState().timeAttack;
      } else {
        const proto = defaultState().timeAttack;
        for (const key of Object.keys(proto)) {
          if (!(key in saved.timeAttack)) saved.timeAttack[key] = proto[key];
        }
      }
      return saved;
    } catch {
      return defaultState();
    }
  }

  function defaultState() {
    return {
      stats: { played: 0, won: 0, streak: 0, maxStreak: 0 },
      daily: { date: todayString(), guesses: [], targetId: null, solved: false, lost: false },
      streak: { current: 0, max: 0, guesses: [], targetId: null, solved: false, lost: false },
      timeAttack: { guesses: [], targetId: null, points: 0, solved: 0, best: 0, combo: 0, solvedIds: [], endsAt: null, roundStartedAt: null },
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetDailyIfNeeded() {
    const today = todayString();
    if (state.daily.date !== today) {
      state.daily = { date: today, guesses: [], targetId: null, solved: false, lost: false };
      saveState();
    }
  }

  function currentTarget() {
    if (mode === 'daily') {
      resetDailyIfNeeded();
      if (!state.daily.targetId) {
        state.daily.targetId = getDailyTarget().id;
        saveState();
      }
      return characters.find((c) => c.id === state.daily.targetId) || getDailyTarget();
    }
    if (mode === 'streak') {
      if (!state.streak.targetId) {
        state.streak.targetId = getRandomTarget().id;
        saveState();
      }
      return characters.find((c) => c.id === state.streak.targetId) || getRandomTarget();
    }
    if (mode === 'time') {
      if (!state.timeAttack.targetId) {
        state.timeAttack.targetId = getRandomTarget().id;
        saveState();
      }
      return characters.find((c) => c.id === state.timeAttack.targetId) || getRandomTarget();
    }
    if (!state.practiceTarget) {
      state.practiceTarget = getRandomTarget().id;
      saveState();
    }
    return characters.find((c) => c.id === state.practiceTarget) || getRandomTarget();
  }

  function currentGuesses() {
    if (mode === 'daily') return state.daily.guesses;
    if (mode === 'streak') return state.streak.guesses;
    if (mode === 'time') return state.timeAttack.guesses;
    return (state.practiceGuesses ||= []);
  }

  function currentMaxAttempts() {
    if (mode === 'practice' || mode === 'time') return Infinity;
    return DAILY_ATTEMPTS;
  }

  function isTimeActive() {
    return !!state.timeAttack.endsAt && Date.now() < state.timeAttack.endsAt;
  }

  function isGameDone() {
    if (mode === 'daily') {
      return state.daily.solved || state.daily.lost || state.daily.guesses.length >= DAILY_ATTEMPTS;
    }
    if (mode === 'streak') {
      return state.streak.solved || state.streak.lost || state.streak.guesses.length >= DAILY_ATTEMPTS;
    }
    if (mode === 'time') {
      return !isTimeActive();
    }
    return isPracticeSolved();
  }

  function isGameWon() {
    const guesses = currentGuesses();
    const target = currentTarget();
    return guesses.length > 0 && guesses[guesses.length - 1].id === target.id;
  }

  // --- Rendering -----------------------------------------------------------

  // --- Suggestions ---------------------------------------------------------

  function filterCharacters(query) {
    const q = normalizeName(query);
    if (!q) return [];
    return characters
      .filter((c) => normalizeName(c.name).includes(q))
      .slice(0, 8);
  }

  function renderSuggestions() {
    const query = els.input.value;
    suggestionMatches = filterCharacters(query);

    if (suggestionMatches.length === 0) {
      hideSuggestions();
      return;
    }

    activeSuggestionIndex = 0;
    els.suggestions.innerHTML = suggestionMatches
      .map((c, i) => `
        <div class="suggestion-item ${i === 0 ? 'is-active' : ''}" data-name="${escapeAttr(c.name)}" data-index="${i}">
          <img class="suggestion-item__img" src="${escapeAttr(c.image)}" alt="" loading="lazy" onerror="this.style.display='none'">
          <span class="suggestion-item__name">${escapeHtml(c.name)}</span>
        </div>
      `)
      .join('');
    els.suggestions.hidden = false;
  }

  function hideSuggestions() {
    els.suggestions.hidden = true;
    suggestionMatches = [];
    activeSuggestionIndex = -1;
  }

  function setActiveSuggestion(index) {
    if (!suggestionMatches.length) return;
    activeSuggestionIndex = Math.max(0, Math.min(index, suggestionMatches.length - 1));
    const items = els.suggestions.querySelectorAll('.suggestion-item');
    items.forEach((item, i) => item.classList.toggle('is-active', i === activeSuggestionIndex));
    items[activeSuggestionIndex]?.scrollIntoView({ block: 'nearest' });
  }

  function selectActiveSuggestion() {
    if (suggestionMatches.length && activeSuggestionIndex >= 0) {
      const name = suggestionMatches[activeSuggestionIndex].name;
      els.input.value = name;
      hideSuggestions();
      handleGuess();
    } else {
      handleGuess();
    }
  }

  function createTile(content, classes = []) {
    const tile = document.createElement('div');
    tile.className = ['tile', ...classes].join(' ');
    tile.innerHTML = content;
    return tile;
  }

  function renderGuessRow(guess, target, animate = false, step = 300) {
    const row = document.createElement('article');
    row.className = 'guess-row';

    const nameTile = createTile(`
      <img class="tile__portrait" src="${escapeAttr(guess.image)}" alt="${escapeHtml(guess.name)}" loading="lazy" onerror="this.style.display='none'">
      <span class="tile__name">${escapeHtml(guess.name)}</span>
    `, ['tile--wide']);
    row.appendChild(nameTile);

    const attributeTiles = [];
    for (const { key } of ATTRIBUTES) {
      const value = guess[key];
      const correct = target[key] === value;
      const iconKey = `${key}Icon`;
      const icon = guess[iconKey] || '';
      const tile = createTile(`
        <img class="tile__icon" src="static${escapeAttr(icon)}" alt="" loading="lazy" onerror="this.style.display='none'">
        ${key !== 'rarity' ? `<span class="tile__label">${escapeHtml(value)}</span>` : ''}
      `, []);
      tile.dataset.correct = correct;
      row.appendChild(tile);
      attributeTiles.push(tile);
    }

    if (animate) {
      attributeTiles.forEach((tile, i) => {
        tile.style.opacity = '0';
        setTimeout(() => {
          const isCorrect = tile.dataset.correct === 'true';
          tile.classList.add(isCorrect ? 'tile--correct' : 'tile--wrong');
          tile.classList.add('tile--animating');
          tile.style.opacity = '';
          setTimeout(() => {
            tile.classList.remove('tile--animating');
            tile.classList.add('tile--pop');
            setTimeout(() => tile.classList.remove('tile--pop'), 300);
          }, step);
        }, i * step);
      });
    } else {
      attributeTiles.forEach((tile) => {
        const isCorrect = tile.dataset.correct === 'true';
        tile.classList.add(isCorrect ? 'tile--correct' : 'tile--wrong');
      });
    }

    return row;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderBoard() {
    const target = currentTarget();
    const guesses = currentGuesses();

    els.board.innerHTML = '';
    for (const guess of guesses) {
      els.board.appendChild(renderGuessRow(guess, target));
    }
  }

  function renderAttempts() {
    if (mode === 'time') {
      els.attempts.textContent = String(state.timeAttack.points);
      els.attemptsLabel.textContent = 'pts';
      return;
    }
    els.attemptsLabel.textContent = 'attempts';
    const guesses = currentGuesses();
    const max = currentMaxAttempts();
    els.attempts.textContent = `${guesses.length}/${max === Infinity ? '\u221e' : max}`;
  }

  function renderMessage(text, type = '') {
    els.message.textContent = text;
    els.message.className = `message${type ? ' message--' + type : ''}`;
  }

  let switchingRound = false;

  function updateInputState() {
    const done = isGameDone();
    els.input.disabled = done || switchingRound;
    els.guessBtn.disabled = done || switchingRound || !els.input.value.trim();
  }

  function isPracticeSolved() {
    if (mode !== 'practice') return false;
    const guesses = state.practiceGuesses || [];
    const target = currentTarget();
    return guesses.length > 0 && guesses[guesses.length - 1].id === target.id;
  }

  function renderMode() {
    if (restartArmed) disarmRestart();
    els.timerWrap.hidden = mode !== 'daily';
    els.timeTimerWrap.hidden = !(mode === 'time' && isTimeActive());
    els.restartBtn.hidden = !(mode === 'time' && isTimeActive());
    els.practiceBtn.hidden = mode !== 'daily';
    const newGameAvailable = (mode === 'practice' || mode === 'streak') && isGameDone();
    const timeIdle = mode === 'time' && !isTimeActive() && !countdownActive;
    els.newPracticeBtn.hidden = !newGameAvailable && !timeIdle;
    els.newPracticeBtn.textContent = mode === 'time' ? 'Start' : 'New game';
    els.newGameHint.hidden = !newGameAvailable && !timeIdle;
    els.streakBadge.hidden = mode !== 'streak';
    if (mode === 'streak') {
      els.streakBadge.textContent = `Streak ${state.streak.current}`;
    }
    els.timeBadge.hidden = mode !== 'time';
    if (mode === 'time') {
      els.timeBadge.textContent = `Best ${state.timeAttack.best}`;
    }
    const comboShown = mode === 'time' && state.timeAttack.combo > 1;
    els.comboBadge.hidden = !comboShown;
    if (comboShown) {
      els.comboBadge.textContent = `×${state.timeAttack.combo} COMBO`;
    }
    renderMenuStatuses();
  }

  // --- Screens and menu ------------------------------------------------------

  function isGameVisible() {
    return !els.gameScreen.hidden;
  }

  function showScreen(which) {
    const menu = which === 'menu';
    els.menuScreen.hidden = !menu;
    els.gameScreen.hidden = menu;
  }

  function renderMenuStatuses() {
    const d = state.daily;
    let dailyStatus;
    if (d.solved) {
      dailyStatus = `Solved · ${d.guesses.length}/${DAILY_ATTEMPTS}`;
    } else if (d.lost || d.guesses.length >= DAILY_ATTEMPTS) {
      dailyStatus = 'Come back tomorrow';
    } else if (d.guesses.length > 0) {
      const left = DAILY_ATTEMPTS - d.guesses.length;
      dailyStatus = `${left} ${left === 1 ? 'try' : 'tries'} left`;
    } else {
      dailyStatus = 'Ready to play';
    }
    els.statusDaily.textContent = dailyStatus;

    const s = state.streak;
    els.statusStreak.textContent = s.current > 0
      ? `Current streak · ${s.current}`
      : s.lost
        ? 'Streak broken — start again'
        : 'Build your win streak';

    els.statusPractice.textContent = 'Ready to play';

    els.statusTime.textContent = state.timeAttack.best > 0
      ? `Best · ${state.timeAttack.best} pts`
      : 'No record yet';
  }

  function openMenu() {
    if (restartArmed) disarmRestart();
    cancelCountdown();
    renderMenuStatuses();
    showScreen('menu');
  }

  function launchMode(newMode) {
    if (newMode !== 'time') pendingTimeResult = false;
    setMode(newMode);
    showScreen('game');
    if (newMode === 'time') {
      if (pendingTimeResult) {
        pendingTimeResult = false;
        renderMode();
        initGame();
        showGameOver(state.timeAttack.solved > 0);
        return;
      }
      if (!isTimeActive() && !countdownActive) {
        startAttackGame();
        return;
      }
    }
    if (!isGameDone()) els.input.focus();
  }

  // --- Game actions --------------------------------------------------------

  function handleGuess() {
    if (switchingRound) return;

    const query = els.input.value;
    const char = findCharacter(query);

    if (!char) {
      renderMessage('Unknown character. Pick a name from the list.', 'error');
      shakeInput();
      announce('Unknown character');
      return;
    }

    const guesses = currentGuesses();
    if (guesses.some((g) => g.id === char.id)) {
      renderMessage('You already guessed that character.', 'error');
      shakeInput();
      announce('Already guessed');
      return;
    }

    const target = currentTarget();
    guesses.push(char);
    saveState();

    const step = mode === 'time' ? 200 : 300;
    const row = renderGuessRow(char, target, true, step);
    els.board.appendChild(row);

    els.input.value = '';
    renderAttempts();
    renderMessage('');
    requestAnimationFrame(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });

    const isWin = char.id === target.id;
    const maxAttempts = currentMaxAttempts();
    const isLoss = maxAttempts !== Infinity && guesses.length >= maxAttempts;
    const remaining = maxAttempts === Infinity ? '\u221e' : maxAttempts - guesses.length;

    if (isWin) {
      if (mode === 'daily' && !state.daily.solved) {
        state.daily.solved = true;
        updateStats(true, guesses.length);
      }
      if (mode === 'streak' && !state.streak.solved) {
        state.streak.solved = true;
        state.streak.current += 1;
        state.streak.max = Math.max(state.streak.max, state.streak.current);
      }
      if (mode === 'time') {
        advanceTimeRound(target);
      }
      saveState();
      announce(`Agent found in ${guesses.length} ${guesses.length === 1 ? 'try' : 'tries'}!`);
      const revealDelay = step * ATTRIBUTES.length + 300;
      if (mode === 'daily') {
        setTimeout(() => {
          spawnConfetti();
          showGameOver(true);
        }, revealDelay);
      } else if (mode !== 'time') {
        setTimeout(() => {
          spawnConfetti();
          const streakText = mode === 'streak' ? ` · Streak: ${state.streak.current}` : '';
          showToast(`
            <img class="toast__icon" src="${escapeAttr(char.image)}" alt="">
            <div class="toast__text">
              <span class="toast__title">Agent found!</span>
              <span class="toast__subtitle">Solved in ${guesses.length}${streakText}</span>
            </div>
          `, 'win');
        }, revealDelay);
      }
    } else if (isLoss) {
      if (mode === 'daily' && !state.daily.lost) {
        state.daily.lost = true;
        updateStats(false, guesses.length);
      }
      if (mode === 'streak' && !state.streak.lost) {
        state.streak.lost = true;
        state.streak.current = 0;
      }
      saveState();
      announce('Out of attempts. Game over.');
      const revealDelay = step * ATTRIBUTES.length + 300;
      if (mode === 'daily') {
        setTimeout(() => showGameOver(false), revealDelay);
      } else {
        setTimeout(() => {
          showToast(`
            <img class="toast__icon" src="${escapeAttr(target.image)}" alt="">
            <div class="toast__text">
              <span class="toast__title">${escapeHtml(target.name)}</span>
              <span class="toast__subtitle">${mode === 'streak' ? 'Streak lost!' : 'Better luck next time'}</span>
            </div>
          `, 'loss');
        }, revealDelay);
      }
    } else {
      if (mode === 'time' && state.timeAttack.combo > 0) {
        state.timeAttack.combo = 0;
        saveState();
        renderMode();
      }
      const allMatchExceptFaction = ATTRIBUTES.filter(({ key }) => key !== 'faction')
        .every(({ key }) => char[key] === target[key]);
      if (allMatchExceptFaction) {
        const collisionCandidates = characters.filter((c) =>
          c.id !== target.id &&
          ATTRIBUTES.filter(({ key }) => key !== 'faction')
            .every(({ key }) => c[key] === target[key])
        ).length + 1;
        if (collisionCandidates > remaining) {
          renderMessage(`All attributes match except faction — it is: ${target.faction}`, 'hint');
        } else {
          renderMessage('All attributes match except faction — try a different one!', 'hint');
        }
        shakeInput();
      }
      announce(`${char.name}: ${guesses.filter((g, i) => {
        const t = currentTarget();
        return ATTRIBUTES.some(({ key }) => g[key] === t[key]);
      }).length > 0 ? 'some matches' : 'no matches'}. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} left.`);
    }

    updateInputState();
    renderMode();
  }

  function shakeInput() {
    els.input.parentElement.classList.add('shake');
    setTimeout(() => els.input.parentElement.classList.remove('shake'), 400);
  }

  function spawnConfetti() {
    const colors = ['#d9fa00', '#a8c200', '#ffb500', '#ea00ff', '#00a8ff', '#f04444'];
    const container = document.body;
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDuration = (1.5 + Math.random() * 2) + 's';
      piece.style.animationDelay = Math.random() * 0.5 + 's';
      piece.style.width = (6 + Math.random() * 8) + 'px';
      piece.style.height = (6 + Math.random() * 8) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      container.appendChild(piece);
      setTimeout(() => piece.remove(), 4000);
    }
  }

  function trapFocus(overlay, e) {
    const focusable = overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function yesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
  }

  function updateStats(won, guessesCount) {
    state.stats.played += 1;
    if (won) {
      state.stats.won += 1;
      if (state.stats.lastPlayedDate === yesterdayString()) {
        state.stats.streak += 1;
      } else {
        state.stats.streak = 1;
      }
    } else {
      state.stats.streak = 0;
    }
    state.stats.maxStreak = Math.max(state.stats.maxStreak, state.stats.streak);
    state.stats.lastPlayedDate = todayString();
    saveState();
  }

  function showGameOver(won) {
    const target = currentTarget();
    const guesses = currentGuesses();
    const guessCount = guesses.length;

    els.modalRank.hidden = mode !== 'time';
    if (mode === 'time') {
      const { points, solved } = state.timeAttack;
      const rank = TIME_RANKS.find((r) => points >= r.min);
      els.modalTitle.textContent = "Time's up!";
      els.modalResult.textContent = `${points} pts · ${solved} ${solved === 1 ? 'agent' : 'agents'} solved`;
      els.rankLetter.textContent = rank.rank;
      els.rankLetter.className = `rank-badge ${rank.cls}`;
      els.rankLabel.textContent = rank.label;
    } else if (won) {
      els.modalTitle.textContent = 'Agent found!';
      if (mode === 'daily') {
        els.modalResult.textContent = `Solved in ${guessCount}/${DAILY_ATTEMPTS}`;
      } else if (mode === 'streak') {
        els.modalResult.textContent = `Solved in ${guessCount}/${DAILY_ATTEMPTS} · Streak: ${state.streak.current}`;
      } else {
        els.modalResult.textContent = `Solved in ${guessCount} attempts`;
      }
    } else {
      els.modalTitle.textContent = 'Agent escaped...';
      if (mode === 'daily') {
        els.modalResult.textContent = `Out of attempts (${DAILY_ATTEMPTS}/${DAILY_ATTEMPTS})`;
      } else if (mode === 'streak') {
        els.modalResult.textContent = `Streak lost! Best: ${state.streak.max}`;
      } else {
        els.modalResult.textContent = 'Better luck next time';
      }
    }

    els.modalTarget.innerHTML = `
      <img class="target-card__image" src="${escapeAttr(target.image)}" alt="${escapeHtml(target.name)}" onerror="this.style.display='none'">
      <div class="target-card__info">
        <span class="target-card__name">${escapeHtml(target.name)}</span>
        <span class="target-card__meta">${escapeHtml(target.faction)} · ${escapeHtml(target.attribute)} · ${escapeHtml(target.specialty)}</span>
      </div>
    `;

    const isTime = mode === 'time';
    els.statsHeading.textContent = isTime ? 'This run' : 'Your stats';
    els.statsGrid.hidden = isTime;
    els.timeStats.hidden = !isTime;
    if (isTime) {
      els.statScore.textContent = state.timeAttack.solved;
      els.statBest.textContent = state.timeAttack.best;
    }

    els.statPlayed.textContent = state.stats.played;
    els.statWon.textContent = state.stats.won;
    els.statStreak.textContent = state.stats.streak;
    els.statMax.textContent = state.stats.maxStreak;

    els.practiceBtn.hidden = false;
    if (mode === 'daily') {
      els.practiceBtn.textContent = won ? 'Play practice' : 'Try practice';
    } else if (mode === 'streak') {
      els.practiceBtn.textContent = 'New game';
    } else {
      els.practiceBtn.textContent = 'New game';
    }
    els.shareStatus.textContent = '';

    els.overlay.hidden = false;
    els.overlay.classList.add('is-visible');
    requestAnimationFrame(() => {
      els.modalClose.focus();
    });
  }

  function closeOverlay() {
    els.overlay.classList.remove('is-visible');
    setTimeout(() => {
      els.overlay.hidden = true;
      if (isGameVisible()) els.input.focus();
    }, 200);
  }

  function shareResult() {
    const today = todayString();
    const guesses = currentGuesses();
    const target = currentTarget();
    const won = isGameWon();

    let header;
    if (mode === 'daily') {
      header = `ZZZrdle Daily ${today} ${won ? guesses.length + '/' + DAILY_ATTEMPTS : 'X/' + DAILY_ATTEMPTS}`;
    } else if (mode === 'streak') {
      header = `ZZZrdle Streak ${won ? guesses.length + '/' + DAILY_ATTEMPTS : 'X/' + DAILY_ATTEMPTS} · current streak: ${state.streak.current}`;
    } else if (mode === 'time') {
      const { points, solved, best } = state.timeAttack;
      const rank = TIME_RANKS.find((r) => points >= r.min);
      header = `ZZZrdle Time Attack — ${solved} agents · ${points} pts (${rank.rank}) · best: ${best}`;
    } else {
      header = `ZZZrdle Practice ${won ? '— solved in ' + guesses.length : ''}`;
    }

    const grid = mode === 'time'
      ? ''
      : guesses
          .map((g) =>
            ATTRIBUTES
              .map(({ key }) => (g[key] === target[key] ? '🟩' : '⬛'))
              .join('')
          )
          .join('\n');

    const text = `${header}\n${grid ? grid + '\n' : ''}${window.location.href}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        els.shareStatus.textContent = 'Copied to clipboard!';
      }).catch(() => {
        fallbackShare(text);
      });
    } else {
      fallbackShare(text);
    }
  }

  function fallbackShare(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    els.shareStatus.textContent = 'Copied to clipboard!';
  }

  // --- Timer ---------------------------------------------------------------

  function startTimer() {
    const update = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = next - now;
      const hh = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      els.timerValue.textContent = `${hh}:${mm}:${ss}`;

      if (state.daily.date !== todayString()) {
        resetDailyIfNeeded();
        if (mode === 'daily') initGame();
      }
    };
    update();
    setInterval(update, 1000);
  }

  // --- Time attack ----------------------------------------------------------

  let timeTickInterval = null;

  function formatCountdown(totalSeconds) {
    const s = Math.max(0, Math.ceil(totalSeconds));
    const mm = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function startTimeTicker() {
    stopTimeTicker();
    timeTickInterval = setInterval(updateTimeTimer, 250);
    updateTimeTimer();
  }

  function stopTimeTicker() {
    if (timeTickInterval) {
      clearInterval(timeTickInterval);
      timeTickInterval = null;
    }
  }

  function updateTimeTimer() {
    if (!state.timeAttack.endsAt) {
      els.timeTimerWrap.classList.remove('timer--danger');
      stopTimeTicker();
      return;
    }
    const remaining = (state.timeAttack.endsAt - Date.now()) / 1000;
    els.timeTimerValue.textContent = formatCountdown(remaining);
    const pct = Math.max(0, Math.min(100, (remaining / TIME_START) * 100));
    els.timeBarFill.style.width = pct + '%';
    els.timeBarFill.classList.toggle('time-bar__fill--warn', remaining <= TIME_START / 2 && remaining > TIME_DANGER);
    els.timeBarFill.classList.toggle('time-bar__fill--danger', remaining <= TIME_DANGER);
    els.timeTimerWrap.classList.toggle('timer--danger', remaining <= TIME_DANGER);
    if (remaining <= 0) {
      finishTimeRun();
    }
  }

  function pickTimeTarget() {
    const solved = state.timeAttack.solvedIds || [];
    const pool = characters.filter((c) => !solved.includes(c.id));
    if (!pool.length) {
      state.timeAttack.solvedIds = [];
      return getRandomTarget();
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  let newBestCelebrated = false;
  let countdownActive = false;
  let countdownToken = 0;
  let restartArmed = false;
  let restartArmTimer = null;

  function disarmRestart() {
    restartArmed = false;
    clearTimeout(restartArmTimer);
    els.restartBtn.textContent = 'Restart';
    els.restartBtn.classList.remove('is-confirm');
  }

  function requestRestart() {
    if (mode !== 'time' || !isTimeActive()) return;
    if (!restartArmed) {
      restartArmed = true;
      els.restartBtn.textContent = 'Sure?';
      els.restartBtn.classList.add('is-confirm');
      restartArmTimer = setTimeout(disarmRestart, 2500);
      announce('Press restart again to confirm');
      return;
    }
    disarmRestart();
    startAttackGame();
  }

  function showCountdownNumber(text) {
    els.countdownNumber.textContent = text;
    els.countdownNumber.classList.remove('is-tick');
    void els.countdownNumber.offsetWidth;
    els.countdownNumber.classList.add('is-tick');
  }

  function cancelCountdown() {
    countdownToken += 1;
    countdownActive = false;
    els.countdownOverlay.hidden = true;
  }

  function beginCountdown() {
    cancelCountdown();
    const token = countdownToken;
    countdownActive = true;
    renderMode();
    updateInputState();
    els.countdownOverlay.hidden = false;
    const steps = ['3', '2', '1'];
    steps.forEach((n, i) => {
      setTimeout(() => {
        if (token !== countdownToken) return;
        showCountdownNumber(n);
        announce(n);
      }, i * 650);
    });
    setTimeout(() => {
      if (token !== countdownToken) return;
      countdownActive = false;
      els.countdownOverlay.hidden = true;
      state.timeAttack.endsAt = Date.now() + TIME_START * 1000;
      state.timeAttack.roundStartedAt = Date.now();
      saveState();
      startTimeTicker();
      renderMode();
      updateInputState();
      els.input.focus();
    }, steps.length * 650);
  }

  function startAttackGame() {
    cancelCountdown();
    stopTimeTicker();
    hideSuggestions();
    els.input.value = '';
    switchingRound = false;
    newBestCelebrated = false;
    state.timeAttack.guesses = [];
    state.timeAttack.solvedIds = [];
    state.timeAttack.points = 0;
    state.timeAttack.solved = 0;
    state.timeAttack.combo = 0;
    state.timeAttack.roundStartedAt = null;
    state.timeAttack.endsAt = null;
    state.timeAttack.targetId = pickTimeTarget().id;
    saveState();
    mode = 'time';
    renderMode();
    initGame();
    beginCountdown();
  }

  function advanceTimeRound(target) {
    const guessesUsed = state.timeAttack.guesses.length;
    const elapsed = Math.max(0, (Date.now() - state.timeAttack.roundStartedAt) / 1000);
    const effBonus = Math.max(0, TIME_POINTS_EFF - (guessesUsed - 1) * TIME_POINTS_EFF_STEP);
    const speedBonus = Math.max(0, TIME_POINTS_SPEED - Math.floor(elapsed * TIME_POINTS_SPEED_STEP));
    state.timeAttack.combo = Math.min(state.timeAttack.combo + 1, TIME_COMBO_MAX);
    const gained = (TIME_POINTS_BASE + effBonus + speedBonus) * state.timeAttack.combo;
    const prevBest = state.timeAttack.best;
    state.timeAttack.points += gained;
    state.timeAttack.solved += 1;
    state.timeAttack.best = Math.max(prevBest, state.timeAttack.points);
    state.timeAttack.solvedIds.push(target.id);
    state.timeAttack.endsAt += TIME_BONUS * 1000;
    saveState();

    switchingRound = true;
    updateInputState();
    renderAttempts();
    renderMode();

    const comboText = state.timeAttack.combo > 1 ? ` · COMBO ×${state.timeAttack.combo}` : '';
    const bestText = prevBest > 0 && state.timeAttack.points > prevBest && !newBestCelebrated ? ' · NEW BEST!' : '';
    if (bestText) {
      newBestCelebrated = true;
      spawnConfetti();
    }
    showFloatText(`+${gained} · +${TIME_BONUS}s${comboText}${bestText}`);
    showToast(`
      <img class="toast__icon" src="${escapeAttr(target.image)}" alt="">
      <div class="toast__text">
        <span class="toast__title">Agent found!</span>
        <span class="toast__subtitle">+${gained} pts${comboText}</span>
      </div>
    `, 'win', 1600);

    setTimeout(() => {
      switchingRound = false;
      if (!isTimeActive()) return;
      state.timeAttack.guesses = [];
      state.timeAttack.targetId = pickTimeTarget().id;
      state.timeAttack.roundStartedAt = Date.now();
      saveState();
      initGame();
      renderMode();
      els.input.focus();
    }, 200 * ATTRIBUTES.length + 300);
  }

  function finishTimeRun() {
    stopTimeTicker();
    state.timeAttack.endsAt = null;
    saveState();
    els.timeTimerWrap.classList.remove('timer--danger');
    if (mode !== 'time') return;
    if (!isGameVisible()) {
      pendingTimeResult = true;
      return;
    }
    switchingRound = false;
    updateInputState();
    renderMode();
    if (state.timeAttack.solved > 0) spawnConfetti();
    showGameOver(state.timeAttack.solved > 0);
  }

  // --- Mode switching ------------------------------------------------------

  function setMode(newMode) {
    if (newMode === mode) return;
    cancelCountdown();
    mode = newMode;
    renderMode();
    initGame();
    if (mode === 'time' && state.timeAttack.endsAt) {
      if (isTimeActive()) {
        startTimeTicker();
      } else {
        finishTimeRun();
      }
    } else if (mode !== 'time') {
      stopTimeTicker();
    }
    if (!isGameDone()) els.input.focus();
  }

  function startPracticeGame() {
    state.practiceTarget = getRandomTarget().id;
    state.practiceGuesses = [];
    saveState();
    mode = 'practice';
    renderMode();
    initGame();
    els.input.focus();
  }

  function startStreakGame() {
    state.streak.targetId = getRandomTarget().id;
    state.streak.guesses = [];
    state.streak.solved = false;
    state.streak.lost = false;
    saveState();
    mode = 'streak';
    renderMode();
    initGame();
    els.input.focus();
  }

  function initGame() {
    renderBoard();
    renderAttempts();
    updateInputState();
    renderMessage('');

    if (mode === 'daily' && (state.daily.solved || state.daily.lost)) {
      // Keep input disabled and allow reviewing; result can be reopened via share button if we add one.
    }
  }

  // --- Tutorial -------------------------------------------------------------

  const TUTORIAL_KEY = 'zzzrdle-tutorial-seen';

  function shouldShowTutorial() {
    return !localStorage.getItem(TUTORIAL_KEY);
  }

  function showTutorial() {
    els.tutorialOverlay.hidden = false;
    els.tutorialOverlay.classList.add('is-visible');
    requestAnimationFrame(() => {
      els.tutorialClose.focus();
    });
  }

  function closeTutorial() {
    els.tutorialOverlay.classList.remove('is-visible');
    setTimeout(() => {
      els.tutorialOverlay.hidden = true;
      localStorage.setItem(TUTORIAL_KEY, '1');
      if (isGameVisible()) els.input.focus();
    }, 200);
  }

  // --- Event wiring --------------------------------------------------------

  function bindEvents() {
    els.guessBtn.addEventListener('click', selectActiveSuggestion);

    els.input.addEventListener('input', () => {
      els.guessBtn.disabled = !els.input.value.trim();
      renderSuggestions();
    });

    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (els.suggestions.hidden) {
          renderSuggestions();
        } else {
          setActiveSuggestion(activeSuggestionIndex + 1);
        }
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (els.suggestions.hidden) {
          renderSuggestions();
        } else {
          setActiveSuggestion(activeSuggestionIndex - 1);
        }
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectActiveSuggestion();
        return;
      }
      if (e.key === 'Escape') {
        hideSuggestions();
      }
    });

    els.input.addEventListener('focus', () => {
      if (els.input.value.trim()) renderSuggestions();
    });

    els.input.addEventListener('blur', () => {
      setTimeout(hideSuggestions, 150);
    });

    els.suggestions.addEventListener('mousedown', (e) => {
      const item = e.target.closest('.suggestion-item');
      if (!item) return;
      e.preventDefault();
      els.input.value = item.dataset.name;
      hideSuggestions();
      handleGuess();
    });

    document.addEventListener('click', (e) => {
      if (!els.input.contains(e.target) && !els.suggestions.contains(e.target)) {
        hideSuggestions();
      }
    });

    for (const card of els.modeCards) {
      card.addEventListener('click', () => launchMode(card.dataset.mode));
    }

    els.menuBtn.addEventListener('click', openMenu);
    els.menuHelpBtn.addEventListener('click', showTutorial);

    els.modalClose.addEventListener('click', closeOverlay);
    els.overlay.addEventListener('click', (e) => {
      if (e.target === els.overlay) closeOverlay();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (restartArmed) {
          disarmRestart();
        }
        if (!els.tutorialOverlay.hidden) {
          closeTutorial();
        } else if (!els.overlay.hidden) {
          closeOverlay();
        } else if (!els.suggestions.hidden) {
          hideSuggestions();
        }
      }
      if (e.key === 'Enter' && e.shiftKey && els.overlay.hidden && els.tutorialOverlay.hidden) {
        if (mode === 'time' && isTimeActive()) {
          e.preventDefault();
          requestRestart();
          return;
        }
        if (isGameDone()) {
          e.preventDefault();
          if (mode === 'streak') {
            startStreakGame();
          } else if (mode === 'practice') {
            startPracticeGame();
          } else if (mode === 'time') {
            if (!countdownActive) startAttackGame();
          }
        }
      }
    });

    els.overlay.addEventListener('keydown', (e) => trapFocus(els.overlay, e));
    els.tutorialOverlay.addEventListener('keydown', (e) => trapFocus(els.tutorialOverlay, e));

    els.shareBtn.addEventListener('click', shareResult);
    els.newPracticeBtn.addEventListener('click', () => {
      if (mode === 'streak') {
        startStreakGame();
      } else if (mode === 'time') {
        startAttackGame();
      } else {
        startPracticeGame();
      }
    });
    els.restartBtn.addEventListener('click', requestRestart);
    els.practiceBtn.addEventListener('click', () => {
      closeOverlay();
      if (mode === 'daily') {
        setMode('practice');
      } else if (mode === 'streak') {
        startStreakGame();
      } else if (mode === 'time') {
        startAttackGame();
      } else {
        startPracticeGame();
      }
    });

    // els.helpBtn.addEventListener('click', showTutorial);
    els.tutorialClose.addEventListener('click', closeTutorial);
    els.tutorialStart.addEventListener('click', closeTutorial);
    els.tutorialOverlay.addEventListener('click', (e) => {
      if (e.target === els.tutorialOverlay) closeTutorial();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isGameVisible() && !isGameDone()) {
        els.input.focus();
      }
    });

    window.addEventListener('focus', () => {
      if (isGameVisible() && !isGameDone()) {
        els.input.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (isGameVisible() && !isGameDone() && !els.overlay.classList.contains('is-visible') && !els.tutorialOverlay.classList.contains('is-visible')) {
        const ignore = e.target.closest('button, a, .suggestions, .mode-card, .help-btn');
        if (!ignore) {
          els.input.focus();
        }
      }
    });
  }

  // --- Bootstrap -----------------------------------------------------------

  async function boot() {
    bindEvents();
    renderMessage('Loading agents...');

    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(res.statusText);
      characters = await res.json();
    } catch (err) {
      renderMessage('Failed to load character data.', 'error');
      console.error(err);
      return;
    }

    resetDailyIfNeeded();
    showScreen('menu');
    renderMenuStatuses();
    renderMode();
    initGame();
    startTimer();

    if (shouldShowTutorial()) {
      showTutorial();
    }
  }

  boot();
})();
