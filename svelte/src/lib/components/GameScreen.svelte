<script>
  import { onMount, onDestroy } from 'svelte'
  import { game } from '../game/index.svelte.js'
  import Board from './Board.svelte'
  import InputPanel from './InputPanel.svelte'

  let { onMenu } = $props()

  onMount(() => {
    if (game.mode === 'daily') game.startDailyTimer()
    // focus input
    setTimeout(() => {
      const el = document.getElementById('guess-input')
      el?.focus()
    }, 0)
  })

  function back() {
    game.openMenu()
    onMenu()
  }

  function newGame() {
    if (game.mode === 'streak') game.startStreakGame()
    else if (game.mode === 'time') game.startAttackGame()
    else game.startPracticeGame()
  }

  function dailyTimerText() {
    return game.dailyTimerText
  }

  function formatTime(total) {
    const s = Math.max(0, Math.ceil(total))
    const mm = Math.floor(s / 60)
    const ss = String(s % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }

  function timeProgress() {
    if (!game.state.timeAttack.endsAt) return 0
    return Math.max(0, Math.min(100, (game.timeRemaining / 60) * 100))
  }
</script>

<main class="game" id="game-screen">
  <header class="game__header">
    <button id="menu-btn" class="menu-btn" type="button" onclick={back}>
      <svg class="menu-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      <span>Back</span>
    </button>
    <div class="new-game-area">
      {#if game.mode === 'daily'}
        <div id="daily-timer" class="timer timer--header">
          <span class="timer__label">Next agent in</span>
          <span id="timer-value" class="timer__value">{dailyTimerText()}</span>
        </div>
      {/if}
      {#if game.mode === 'time' && game.state.timeAttack.endsAt}
        <div id="time-timer" class="timer timer--header">
          <div class="time-bar"><div id="time-bar-fill" class="time-bar__fill" style:width={timeProgress() + '%'}></div></div>
          <span id="time-timer-value" class="timer__value">{formatTime(game.timeRemaining)}</span>
        </div>
      {/if}
      <span id="new-game-hint" class="new-game-hint" hidden={!((game.mode === 'practice' || game.mode === 'streak') && game.done) && !(game.mode === 'time' && !game.state.timeAttack.endsAt && !game.countdownActive)}>Shift + Enter</span>
      {#if game.mode === 'time' && game.state.timeAttack.endsAt}
        <button id="restart-btn" class="new-game-btn new-game-btn--danger" type="button" onclick={() => game.requestRestart()}>
          {game.restartArmed ? 'Sure?' : 'Restart'}
        </button>
      {/if}
      {#if ((game.mode === 'practice' || game.mode === 'streak') && game.done) || (game.mode === 'time' && !game.state.timeAttack.endsAt && !game.countdownActive)}
        <button id="new-practice-btn" class="new-game-btn" type="button" onclick={newGame}>
          {game.mode === 'time' ? 'Start' : 'New game'}
        </button>
      {/if}
    </div>
  </header>

  <Board />

  <InputPanel />
</main>
