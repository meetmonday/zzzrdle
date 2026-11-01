import { todayString, yesterdayString } from '../utils/dates.js';
import { hashString, seededIndex } from '../utils/hash.js';
import { normalizeName, expandCharacter, loadCharacters as loadData, findCharacter } from '../data/characters.js';
import { filterCharacters } from './suggestions.js';
import {
  DAILY_ATTEMPTS, STORAGE_KEY, TIME_START, TIME_BONUS, TIME_DANGER,
  TIME_POINTS_BASE, TIME_POINTS_EFF, TIME_POINTS_EFF_STEP,
  TIME_POINTS_SPEED, TIME_POINTS_SPEED_STEP, TIME_COMBO_MAX,
  TIME_RANKS, ATTRIBUTES,
} from './constants.js';

function randomTarget(characters) {
  return characters[Math.floor(Math.random() * characters.length)];
}

function getDailyTarget(characters) {
  const today = todayString();
  const idx = seededIndex(today, characters.length);
  return characters[idx];
}

function defaultState() {
  return {
    stats: { played: 0, won: 0, streak: 0, maxStreak: 0, lastPlayedDate: null },
    daily: { date: todayString(), guesses: [], targetId: null, solved: false, lost: false },
    streak: { current: 0, max: 0, guesses: [], targetId: null, solved: false, lost: false },
    timeAttack: { guesses: [], targetId: null, points: 0, solved: 0, best: 0, combo: 0, solvedIds: [], endsAt: null, roundStartedAt: null },
    practiceTarget: null,
    practiceGuesses: [],
  };
}

function loadState() {
  try {
    if (typeof localStorage === 'undefined') return defaultState();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return defaultState();
    if (!saved.streak) saved.streak = defaultState().streak;
    if (!saved.timeAttack) {
      saved.timeAttack = defaultState().timeAttack;
    } else {
      const proto = defaultState().timeAttack;
      for (const key of Object.keys(proto)) {
        if (!(key in saved.timeAttack)) saved.timeAttack[key] = proto[key];
      }
    }
    if (!saved.stats) saved.stats = defaultState().stats;
    if (!('practiceTarget' in saved)) saved.practiceTarget = null;
    if (!('practiceGuesses' in saved)) saved.practiceGuesses = [];
    return saved;
  } catch {
    return defaultState();
  }
}

function saveStateInstance(s) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export class GameState {
  constructor() {
    this.state = loadState();
    this.mode = 'daily';

    this.characters = [];
    this.meta = null;
    this.loaded = false;
    this.loadError = '';

    this.suggestions = [];
    this.activeSuggestionIndex = -1;

    this.switchingRound = false;
    this.countdownActive = false;
    this.countdownToken = 0;
    this.countdownText = '';
    this.restartArmed = false;

    this.message = { text: '', type: '' };

    // transient ui requests (components react)
    this.toast = null;
    this.confettiTick = 0;
    this.resultModalOpen = false;
    this.tutorialOpen = false;

    this.newBestCelebrated = false;
    this.lastGuessId = null;
    this.animateLast = false;

    this._dailyTimerHandle = null;
    this._timeTickerHandle = null;

    this._toastSeed = 0;
    this.timeRemaining = 0;
    this.dailyTimerText = '--:--:--';
    this.shakeTick = 0;
  }

  // ---------- data ----------
  async boot() {
    try {
      const { characters, meta } = await loadData();
      this.characters = characters;
      this.meta = meta;
      this.loaded = true;
    } catch (err) {
      this.loadError = String(err?.message || err);
      this.message = { text: 'Failed to load character data.', type: 'error' };
      return;
    }
    this.resetDailyIfNeeded();
    this.ensureTargets();
    this.message = { text: '', type: '' };
  }

  // ---------- derived getters ----------
  get attrs() { return ATTRIBUTES; }

  get guesses() {
    const s = this.state;
    if (this.mode === 'daily') return s.daily.guesses;
    if (this.mode === 'streak') return s.streak.guesses;
    if (this.mode === 'time') return s.timeAttack.guesses;
    return (s.practiceGuesses ||= []);
  }

  get targetId() {
    const s = this.state;
    if (this.mode === 'daily') return s.daily.targetId;
    if (this.mode === 'streak') return s.streak.targetId;
    if (this.mode === 'time') return s.timeAttack.targetId;
    return s.practiceTarget;
  }

  get target() {
    if (!this.characters.length) return null;
    if (this.targetId) {
      const found = this.characters.find((c) => c.id === this.targetId);
      if (found) return found;
    }
    return null;
  }

  get maxAttempts() {
    if (this.mode === 'practice' || this.mode === 'time') return Infinity;
    return DAILY_ATTEMPTS;
  }

  get done() {
    const s = this.state;
    if (this.mode === 'daily') return s.daily.solved || s.daily.lost || s.daily.guesses.length >= DAILY_ATTEMPTS;
    if (this.mode === 'streak') return s.streak.solved || s.streak.lost || s.streak.guesses.length >= DAILY_ATTEMPTS;
    if (this.mode === 'time') return !this.isTimeActive();
    return this.isPracticeSolved();
  }

  get won() {
    const g = this.guesses;
    const t = this.target;
    return g.length > 0 && t && g[g.length - 1].id === t.id;
  }

  isPracticeSolved() {
    if (this.mode !== 'practice') return false;
    const guesses = this.state.practiceGuesses || [];
    const target = this.target;
    return guesses.length > 0 && target && guesses[guesses.length - 1].id === target.id;
  }

  isTimeActive() {
    return !!this.state.timeAttack.endsAt && Date.now() < this.state.timeAttack.endsAt;
  }

  // ---------- persistence ----------
  save() { saveStateInstance(this.state); }

  resetDailyIfNeeded() {
    const today = todayString();
    if (this.state.daily.date !== today) {
      this.state.daily = { date: today, guesses: [], targetId: null, solved: false, lost: false };
      this.save();
    }
  }

  ensureTargets() {
    const s = this.state;
    if (!this.characters.length) return;
    if (this.mode === 'daily') {
      this.resetDailyIfNeeded();
      if (!s.daily.targetId) {
        s.daily.targetId = getDailyTarget(this.characters).id;
        this.save();
      }
    } else if (this.mode === 'streak') {
      if (!s.streak.targetId) {
        s.streak.targetId = randomTarget(this.characters).id;
        this.save();
      }
    } else if (this.mode === 'time') {
      if (!s.timeAttack.targetId) {
        s.timeAttack.targetId = randomTarget(this.characters).id;
        this.save();
      }
    } else {
      if (!s.practiceTarget) {
        s.practiceTarget = randomTarget(this.characters).id;
        this.save();
      }
    }
    // fallback if target id missing
    if (!this.target && this.characters.length) {
      if (this.mode === 'daily') s.daily.targetId = getDailyTarget(this.characters).id;
      else if (this.mode === 'streak') s.streak.targetId = randomTarget(this.characters).id;
      else if (this.mode === 'time') s.timeAttack.targetId = randomTarget(this.characters).id;
      else s.practiceTarget = randomTarget(this.characters).id;
      this.save();
    }
  }

  setMode(newMode) {
    if (newMode === this.mode) { this.ensureTargets(); return; }
    this.cancelCountdown();
    this.mode = newMode;
    this.ensureTargets();
    // init game equivalence
    if (this.mode === 'time' && this.state.timeAttack.endsAt) {
      if (this.isTimeActive()) {
        this.startTimeTicker();
      } else {
        this.finishTimeRun();
      }
    } else if (this.mode !== 'time') {
      this.stopTimeTicker();
    }
    if (!this.done) {
      // focus handled by component
    }
    this.message = { text: '', type: '' };
    this.save();
  }

  // ---------- suggestions ----------
  renderSuggestions(query) {
    const q = query ?? '';
    this.suggestions = filterCharacters(this.characters, q);
    if (this.suggestions.length) this.activeSuggestionIndex = 0;
    else { this.suggestions = []; this.activeSuggestionIndex = -1; }
  }
  hideSuggestions() {
    this.suggestions = [];
    this.activeSuggestionIndex = -1;
  }
  setActiveSuggestion(index) {
    if (!this.suggestions.length) return;
    this.activeSuggestionIndex = Math.max(0, Math.min(index, this.suggestions.length - 1));
  }

  shake() { /* component handles via toast? expose tick */ this.shakeTick = (this.shakeTick || 0) + 1; }

  // ---------- guess handling ----------
  handleGuess(rawQuery) {
    if (this.switchingRound) return;

    const char = findCharacter(this.characters, rawQuery);
    if (!char) {
      this.message = { text: 'Unknown character. Pick a name from the list.', type: 'error' };
      this.shake();
      return;
    }
    const guesses = this.guesses;
    if (guesses.some((g) => g.id === char.id)) {
      this.message = { text: 'You already guessed that character.', type: 'error' };
      this.shake();
      return;
    }

    const target = this.target;
    guesses.push(char);
    this.lastGuessId = char.id;
    this.animateLast = true;
    this.save();

    const isWin = target && char.id === target.id;
    const maxAttempts = this.maxAttempts;
    const isLoss = maxAttempts !== Infinity && guesses.length >= maxAttempts;
    const remaining = maxAttempts === Infinity ? '∞' : maxAttempts - guesses.length;

    const step = this.mode === 'time' ? 200 : 300;

    if (isWin) {
      const s = this.state;
      if (this.mode === 'daily' && !s.daily.solved) {
        s.daily.solved = true;
        this.updateStats(true, guesses.length);
      }
      if (this.mode === 'streak' && !s.streak.solved) {
        s.streak.solved = true;
        s.streak.current += 1;
        s.streak.max = Math.max(s.streak.max, s.streak.current);
      }
      if (this.mode === 'time') {
        this.advanceTimeRound(target);
      }
      this.save();
      // confetti on daily
      if (this.mode === 'daily') {
        setTimeout(() => { this.confettiTick++; this.resultModalOpen = true; }, step * ATTRIBUTES.length + 300);
      } else if (this.mode !== 'time') {
        setTimeout(() => {
          this.confettiTick++;
          this.toast = { id: ++this._toastSeed, type: 'win', html: this.toastWin(char, guesses.length, this.mode), duration: 3000 };
        }, step * ATTRIBUTES.length + 300);
      }
      this.message = { text: '', type: '' };
    } else if (isLoss) {
      const s = this.state;
      if (this.mode === 'daily' && !s.daily.lost) {
        s.daily.lost = true;
        this.updateStats(false, guesses.length);
      }
      if (this.mode === 'streak' && !s.streak.lost) {
        s.streak.lost = true;
        s.streak.current = 0;
      }
      this.save();
      const revealDelay = step * ATTRIBUTES.length + 300;
      if (this.mode === 'daily') {
        setTimeout(() => { this.resultModalOpen = true; }, revealDelay);
      } else {
        setTimeout(() => {
          this.toast = { id: ++this._toastSeed, type: 'loss', html: this.toastLoss(target, this.mode), duration: 3000 };
        }, revealDelay);
      }
      this.message = { text: '', type: '' };
    } else {
      // non-win
      if (this.mode === 'time' && this.state.timeAttack.combo > 0) {
        this.state.timeAttack.combo = 0;
        this.save();
      }
      const allMatchExceptFaction = ATTRIBUTES.filter((a) => a.key !== 'faction')
        .every(({ key }) => char[key] === target[key]);
      if (allMatchExceptFaction) {
        const collisionCandidates = this.characters.filter((c) =>
          c.id !== target.id &&
          ATTRIBUTES.filter((a) => a.key !== 'faction')
            .every(({ key }) => c[key] === target[key])
        ).length + 1;
        if (collisionCandidates > (maxAttempts === Infinity ? Infinity : remaining)) {
          this.message = { text: `All attributes match except faction — it is: ${target.faction}`, type: 'hint' };
        } else {
          this.message = { text: 'All attributes match except faction — try a different one!', type: 'hint' };
        }
        this.shake();
      } else {
        this.message = { text: '', type: '' };
      }
    }

    // after any guess, reset input state derived by component via done
    this.updateInputState();
  }

  toastWin(char, count, mode) {
    const streakText = mode === 'streak' ? ` · Streak: ${this.state.streak.current}` : '';
    return `
      <img class="toast__icon" src="${char.image}" alt="">
      <div class="toast__text">
        <span class="toast__title">Agent found!</span>
        <span class="toast__subtitle">Solved in ${count}${streakText}</span>
      </div>
    `;
  }
  toastLoss(target, mode) {
    const subtitle = mode === 'streak' ? 'Streak lost!' : 'Better luck next time';
    return `
      <img class="toast__icon" src="${target.image}" alt="">
      <div class="toast__text">
        <span class="toast__title">${target.name}</span>
        <span class="toast__subtitle">${subtitle}</span>
      </div>
    `;
  }

  updateInputState() {
    // components derive disabled from done/switchingRound; nothing to do
  }

  updateStats(won, guessesCount) {
    const s = this.state;
    s.stats.played += 1;
    if (won) {
      s.stats.won += 1;
      if (s.stats.lastPlayedDate === yesterdayString()) {
        s.stats.streak += 1;
      } else {
        s.stats.streak = 1;
      }
    } else {
      s.stats.streak = 0;
    }
    s.stats.maxStreak = Math.max(s.stats.maxStreak, s.stats.streak);
    s.stats.lastPlayedDate = todayString();
    this.save();
  }

  // ---------- menu status helpers ----------
  dailyStatus() {
    const d = this.state.daily;
    if (d.solved) return `Solved · ${d.guesses.length}/${DAILY_ATTEMPTS}`;
    if (d.lost || d.guesses.length >= DAILY_ATTEMPTS) return 'Come back tomorrow';
    if (d.guesses.length > 0) {
      const left = DAILY_ATTEMPTS - d.guesses.length;
      return `${left} ${left === 1 ? 'try' : 'tries'} left`;
    }
    return 'Ready to play';
  }
  streakStatus() {
    const s = this.state.streak;
    return s.current > 0 ? `Current streak · ${s.current}` : (s.lost ? 'Streak broken — start again' : 'Build your win streak');
  }
  timeStatus() {
    return this.state.timeAttack.best > 0 ? `Best · ${this.state.timeAttack.best} pts` : 'No record yet';
  }

  // ---------- screens ----------
  showScreen() { /* component-level */ }

  launchMode(newMode) {
    if (newMode !== 'time') { /* pending result handled component */ }
    this.setMode(newMode);
    if (newMode === 'time') {
      if (this.state.timeAttack.solved > 0 && !this.isTimeActive() && !this.countdownActive) {
        // pending result? keep simple
      }
      if (!this.isTimeActive() && !this.countdownActive) {
        this.startAttackGame();
        return;
      }
    }
  }

  openMenu() {
    this.cancelCountdown();
    // focus not here
  }

  // ---------- game starters ----------
  startPracticeGame() {
    this.state.practiceTarget = randomTarget(this.characters).id;
    this.state.practiceGuesses = [];
    this.lastGuessId = null;
    this.animateLast = false;
    this.mode = 'practice';
    this.ensureTargets();
    this.message = { text: '', type: '' };
    this.save();
  }
  startStreakGame() {
    this.state.streak.targetId = randomTarget(this.characters).id;
    this.state.streak.guesses = [];
    this.lastGuessId = null;
    this.animateLast = false;
    this.state.streak.solved = false;
    this.state.streak.lost = false;
    this.mode = 'streak';
    this.ensureTargets();
    this.message = { text: '', type: '' };
    this.save();
  }

  // ---------- time attack ----------
  pickTimeTarget() {
    const solved = this.state.timeAttack.solvedIds || [];
    const pool = this.characters.filter((c) => !solved.includes(c.id));
    if (!pool.length) {
      this.state.timeAttack.solvedIds = [];
      return randomTarget(this.characters);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  startAttackGame() {
    this.cancelCountdown();
    this.stopTimeTicker();
    this.hideSuggestions();
    this.switchingRound = false;
    this.newBestCelebrated = false;
    this.lastGuessId = null;
    this.animateLast = false;
    const ta = this.state.timeAttack;
    ta.guesses = [];
    ta.solvedIds = [];
    this.lastGuessId = null;
    this.animateLast = false;
    ta.points = 0;
    ta.solved = 0;
    ta.combo = 0;
    ta.roundStartedAt = null;
    ta.endsAt = null;
    ta.targetId = this.pickTimeTarget().id;
    this.mode = 'time';
    this.ensureTargets();
    this.save();
    this.beginCountdown();
  }

  beginCountdown() {
    this.cancelCountdown();
    this.countdownToken += 1;
    const token = this.countdownToken;
    this.countdownActive = true;
    // steps
    const steps = ['3', '2', '1'];
    steps.forEach((n, i) => {
      setTimeout(() => {
        if (token !== this.countdownToken) return;
        this.countdownText = n;
      }, i * 650);
    });
    setTimeout(() => {
      if (token !== this.countdownToken) return;
      this.countdownActive = false;
      this.countdownText = '';
      this.state.timeAttack.endsAt = Date.now() + TIME_START * 1000;
      this.state.timeAttack.roundStartedAt = Date.now();
      this.save();
      this.startTimeTicker();
    }, steps.length * 650);
  }
  cancelCountdown() {
    this.countdownToken += 1;
    this.countdownActive = false;
    this.countdownText = '';
  }

  startTimeTicker() {
    this.stopTimeTicker();
    this._timeTickerHandle = setInterval(() => this.updateTimeTimer(), 250);
    this.updateTimeTimer();
  }
  stopTimeTicker() {
    if (this._timeTickerHandle) { clearInterval(this._timeTickerHandle); this._timeTickerHandle = null; }
  }
  updateTimeTimer() {
    const ta = this.state.timeAttack;
    if (!ta.endsAt) { this.stopTimeTicker(); return; }
    const remaining = (ta.endsAt - Date.now()) / 1000;
    // expose remaining for components via fields
    this.timeRemaining = remaining;
    if (remaining <= 0) this.finishTimeRun();
  }

  advanceTimeRound(target) {
    const ta = this.state.timeAttack;
    const guessesUsed = ta.guesses.length;
    const elapsed = Math.max(0, (Date.now() - ta.roundStartedAt) / 1000);
    const effBonus = Math.max(0, TIME_POINTS_EFF - (guessesUsed - 1) * TIME_POINTS_EFF_STEP);
    const speedBonus = Math.max(0, TIME_POINTS_SPEED - Math.floor(elapsed * TIME_POINTS_SPEED_STEP));
    ta.combo = Math.min(ta.combo + 1, TIME_COMBO_MAX);
    const gained = (TIME_POINTS_BASE + effBonus + speedBonus) * ta.combo;
    const prevBest = ta.best;
    ta.points += gained;
    ta.solved += 1;
    ta.best = Math.max(prevBest, ta.points);
    ta.solvedIds.push(target.id);
    ta.endsAt += TIME_BONUS * 1000;
    this.save();

    this.switchingRound = true;
    const comboText = ta.combo > 1 ? ` · COMBO ×${ta.combo}` : '';
    const bestText = prevBest > 0 && ta.points > prevBest && !this.newBestCelebrated ? ' · NEW BEST!' : '';
    if (bestText) { this.newBestCelebrated = true; this.confettiTick++; }
    this.toast = { id: ++this._toastSeed, type: 'win', html: `
      <img class="toast__icon" src="${target.image}" alt="">
      <div class="toast__text">
        <span class="toast__title">Agent found!</span>
        <span class="toast__subtitle">+${gained} pts${comboText}</span>
      </div>
    `, duration: 1600 };
    // float text handling omitted (component can derive?)

    setTimeout(() => {
      this.switchingRound = false;
      if (!this.isTimeActive()) return;
      ta.guesses = [];
      ta.targetId = this.pickTimeTarget().id;
      ta.roundStartedAt = Date.now();
      this.lastGuessId = null;
      this.animateLast = false;
      this.save();
      this.ensureTargets();
      this.message = { text: '', type: '' };
    }, 200 * ATTRIBUTES.length + 300);
  }

  finishTimeRun() {
    this.stopTimeTicker();
    const ta = this.state.timeAttack;
    ta.endsAt = null;
    this.save();
    if (this.mode !== 'time') return;
    this.switchingRound = false;
    if (ta.solved > 0) this.confettiTick++;
    this.resultModalOpen = true;
  }

  requestRestart() {
    if (this.mode !== 'time' || !this.isTimeActive()) return;
    if (!this.restartArmed) {
      this.restartArmed = true;
      setTimeout(() => { this.restartArmed = false; }, 2500);
      return;
    }
    this.restartArmed = false;
    this.startAttackGame();
  }

  // ---------- daily timer ----------
  startDailyTimer() {
    const update = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = next - now;
      const hh = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mm = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const ss = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      this.dailyTimerText = `${hh}:${mm}:${ss}`;
      if (this.state.daily.date !== todayString()) {
        this.resetDailyIfNeeded();
        if (this.mode === 'daily') {
          // init game: re-render happens automatically
        }
      }
    };
    update();
    if (this._dailyTimerHandle) clearInterval(this._dailyTimerHandle);
    this._dailyTimerHandle = setInterval(update, 1000);
  }

  // ---------- helpers for components ----------
  setModalOpen(v) { this.resultModalOpen = !!v; }
}
