<script>
  import { game } from '../game/index.svelte.js'

  let { onPlay } = $props()
</script>

<section class="menu-screen" aria-label="Main menu">
  <div class="menu-head">
    <div class="menu-logo">
      <img src="logo.svg" alt="" class="menu-logo__icon" width="64" height="69">
      <h1 class="menu-logo__text">rdle</h1>
    </div>
    <p class="menu-tagline">Guess the Zenless Zone Zero agent</p>
  </div>

  <nav class="menu-modes" aria-label="Game modes">
    <button class="mode-card" data-mode="daily" type="button" onclick={() => onPlay('daily')}>
      <span class="mode-card__body">
        <span class="mode-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </span>
        <span class="mode-card__info">
          <span class="mode-card__title">Daily</span>
          <span class="mode-card__desc">One agent per day for everyone</span>
          <span class="mode-card__status" id="menu-status-daily">{game.dailyStatus()}</span>
        </span>
        <svg class="mode-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
      </span>
    </button>

    <button class="mode-card" data-mode="streak" type="button" onclick={() => onPlay('streak')}>
      <span class="mode-card__body">
        <span class="mode-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
        </span>
        <span class="mode-card__info">
          <span class="mode-card__title">Streak</span>
          <span class="mode-card__desc">Chain wins — one loss breaks it</span>
          <span class="mode-card__status" id="menu-status-streak">{game.streakStatus()}</span>
        </span>
        <svg class="mode-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
      </span>
    </button>

    <button class="mode-card" data-mode="practice" type="button" onclick={() => onPlay('practice')}>
      <span class="mode-card__body">
        <span class="mode-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </span>
        <span class="mode-card__info">
          <span class="mode-card__title">Practice</span>
          <span class="mode-card__desc">Unlimited rounds, no pressure</span>
          <span class="mode-card__status" id="menu-status-practice">Ready to play</span>
        </span>
        <svg class="mode-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
      </span>
    </button>

    <button class="mode-card" data-mode="time" type="button" onclick={() => onPlay('time')}>
      <span class="mode-card__body">
        <span class="mode-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </span>
        <span class="mode-card__info">
          <span class="mode-card__title">Time attack</span>
          <span class="mode-card__desc">60 seconds, chase the high score</span>
          <span class="mode-card__status" id="menu-status-time">{game.timeStatus()}</span>
        </span>
        <svg class="mode-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
      </span>
    </button>
  </nav>

  <button id="menu-help-btn" class="menu-help" type="button" onclick={() => { game.tutorialOpen = true }}>How to play</button>

  <div class='menu-legal'>
    This is an unofficial fan-made project. It is not affiliated with, associated with,
    or endorsed by HoYoverse (miHoYo).

    All Zenless Zone Zero names, characters, icons and other game assets are trademarks
    and copyrights of HoYoverse. Game graphics used here remain the property of their
    respective owners and are included for non-commercial, informational purposes as
    fair fan use.
  </div>

  {#if game.meta}
    <p id="menu-roster" class="menu-roster">
      Roster: {game.meta.agents} agents · ZZZ v{game.meta.version}
    </p>
  {/if}
</section>
