<script>
  import { game } from '../game/index.svelte.js'
  import { DAILY_ATTEMPTS, TIME_RANKS } from '../game/constants.js'

  let won = $derived(game.done ? game.won : false)

  function close() { game.resultModalOpen = false }

  function practiceAction() {
    game.resultModalOpen = false
    if (game.mode === 'daily') {
      game.setMode('practice')
    } else if (game.mode === 'streak') {
      game.startStreakGame()
    } else if (game.mode === 'time') {
      game.startAttackGame()
    } else {
      game.startPracticeGame()
    }
  }

  let rank = $derived(
    game.mode === 'time'
      ? TIME_RANKS.find((r) => game.state.timeAttack.points >= r.min)
      : null
  )
</script>

{#if game.resultModalOpen && game.target}
  <div id="overlay" class="overlay is-visible" onclick={(e) => { if (e.target === e.currentTarget) close() }} role="dialog" aria-modal="true">
    <div class="modal">
      <button id="modal-close" class="modal__close" type="button" aria-label="Close" onclick={close}>×</button>
      <div class="modal__inner">
        <h2 id="modal-title" class="modal__title">
          {#if game.mode === 'time'}
            Time's up!
          {:else if won}
            Agent found!
          {:else}
            Agent escaped...
          {/if}
        </h2>

        <p id="modal-result" class="modal__result">
          {#if game.mode === 'time'}
            {game.state.timeAttack.points} pts · {game.state.timeAttack.solved} {game.state.timeAttack.solved === 1 ? 'agent' : 'agents'} solved
          {:else if won}
            {#if game.mode === 'daily'}
              Solved in {game.guesses.length}/{DAILY_ATTEMPTS}
            {:else if game.mode === 'streak'}
              Solved in {game.guesses.length}/{DAILY_ATTEMPTS} · Streak: {game.state.streak.current}
            {:else}
              Solved in {game.guesses.length} attempts
            {/if}
          {:else}
            {#if game.mode === 'daily'}
              Out of attempts ({DAILY_ATTEMPTS}/{DAILY_ATTEMPTS})
            {:else if game.mode === 'streak'}
              Streak lost! Best: {game.state.streak.max}
            {:else}
              Better luck next time
            {/if}
          {/if}
        </p>

        {#if game.mode === 'time' && rank}
          <div id="modal-rank" class="modal-rank">
            <span id="rank-letter" class="rank-badge {rank.cls}">{rank.rank}</span>
            <span id="rank-label" class="rank-label">{rank.label}</span>
          </div>
        {/if}

        <div id="modal-target" class="target-card">
          <img class="target-card__image" src={game.target.image} alt={game.target.name} onerror={(e) => { e.currentTarget.style.display = 'none' }} />
          <div class="target-card__info">
            <span class="target-card__name">{game.target.name}</span>
            <span class="target-card__meta">{game.target.faction} · {game.target.attribute} · {game.target.specialty}</span>
          </div>
        </div>

        <p class="modal__stats-heading">
          {game.mode === 'time' ? "This run" : "Your stats"}
        </p>

        {#if game.mode !== 'time'}
          <div class="stats" id="stats">
            <div class="stat"><span class="stat__value" id="stat-played">{game.state.stats.played}</span><span class="stat__label">Played</span></div>
            <div class="stat"><span class="stat__value" id="stat-won">{game.state.stats.won}</span><span class="stat__label">Won</span></div>
            <div class="stat"><span class="stat__value" id="stat-streak">{game.state.stats.streak}</span><span class="stat__label">Streak</span></div>
            <div class="stat"><span class="stat__value" id="stat-max">{game.state.stats.maxStreak}</span><span class="stat__label">Max streak</span></div>
          </div>
        {:else}
          <div class="stats" id="time-stats">
            <div class="stat"><span class="stat__value" id="stat-score">{game.state.timeAttack.solved}</span><span class="stat__label">Score</span></div>
            <div class="stat"><span class="stat__value" id="stat-best">{game.state.timeAttack.best}</span><span class="stat__label">Best</span></div>
          </div>
        {/if}

        <button id="share-btn" class="share-btn" type="button" onclick={() => { /* share stub */ }}>Share result</button>
        <button id="practice-btn" class="share-btn share-btn--secondary" type="button" onclick={practiceAction}>
          {game.mode === 'daily' ? (won ? 'Play practice' : 'Try practice') : 'New game'}
        </button>
        <p id="share-status" class="share-status" aria-live="polite"></p>
      </div>
    </div>
  </div>
{/if}
