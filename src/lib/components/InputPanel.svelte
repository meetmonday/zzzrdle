<script>
  import { game } from '../game/index.svelte.js'
  import FloatText from './FloatText.svelte'
  import { escapeHtml } from '../utils/escape.js'

  let inputValue = $state('')
  let hiddenTimer = null

  function onInput() {
    game.renderSuggestions(inputValue)
  }

  function submitGuess() {
    if (game.suggestions.length && game.activeSuggestionIndex >= 0) {
      const name = game.suggestions[game.activeSuggestionIndex].name
      game.hideSuggestions()
      game.handleGuess(name)
    } else {
      game.handleGuess(inputValue)
    }
    inputValue = ''
  }

  function onKeydown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (game.suggestions.length === 0) game.renderSuggestions(inputValue)
      else game.setActiveSuggestion(game.activeSuggestionIndex + 1)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (game.suggestions.length === 0) game.renderSuggestions(inputValue)
      else game.setActiveSuggestion(game.activeSuggestionIndex - 1)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (game.suggestions.length && game.activeSuggestionIndex >= 0) {
        inputValue = game.suggestions[game.activeSuggestionIndex].name
        game.hideSuggestions()
        game.handleGuess(inputValue)
        inputValue = ''
      } else {
        game.handleGuess(inputValue)
        inputValue = ''
      }
      return
    }
    if (e.key === 'Escape') game.hideSuggestions()
  }

  function onFocus() {
    if (inputValue.trim()) game.renderSuggestions(inputValue)
  }
  function onBlur() {
    clearTimeout(hiddenTimer)
    hiddenTimer = setTimeout(() => game.hideSuggestions(), 150)
  }

  function onSelectSuggestion(name) {
    inputValue = name
    game.hideSuggestions()
    game.handleGuess(name)
    inputValue = ''
  }

  // keep button disabled in sync
  let btnDisabled = $derived(game.done || game.switchingRound || !inputValue.trim())
</script>

<section class="input-panel" id="input-panel">
  <div class="input-card">
    <div class="input-card__inner">
      <div class="input-card__header">
        <div class="attempts">
          <span id="attempts-count" class="attempts__count">
            {#if game.mode === 'time'}
              {game.state.timeAttack.points}
            {:else}
              {game.guesses.length}/{game.maxAttempts === Infinity ? '∞' : game.maxAttempts}
            {/if}
          </span>
          <span id="attempts-label" class="attempts__label">
            {game.mode === 'time' ? 'pts' : 'attempts'}
          </span>
        </div>
        {#if game.mode === 'streak'}
          <span class="streak-badge">Streak {game.state.streak.current}</span>
        {/if}
        {#if game.mode === 'time'}
          <span class="streak-badge">Best {game.state.timeAttack.best}</span>
        {/if}
        {#if game.mode === 'time' && game.state.timeAttack.combo > 1}
          <span class="combo-badge">×{game.state.timeAttack.combo} COMBO</span>
        {/if}
      </div>

      <div class="guess-field">
        <input
          id="guess-input"
          class="guess-field__input"
          type="text"
          bind:value={inputValue}
          oninput={onInput}
          onkeydown={onKeydown}
          onfocus={onFocus}
          onblur={onBlur}
          placeholder="Type a character name..."
          autocomplete="off"
          aria-label="Character name"
          disabled={game.done || game.switchingRound}
        />
        <button
          id="guess-btn"
          class="guess-field__btn"
          type="button"
          onclick={submitGuess}
          disabled={btnDisabled}
        >Guess</button>

        {#if game.suggestions.length}
          <div id="suggestions" class="suggestions">
            {#each game.suggestions as s, i (s.id)}
              <div
                class="suggestion-item {i === game.activeSuggestionIndex ? 'is-active' : ''}"
                onmousedown={(e) => { e.preventDefault(); onSelectSuggestion(s.name) }}
                role="option"
                tabindex={-1}
                aria-selected={i === game.activeSuggestionIndex}
              >
                <img class="suggestion-item__img" src={s.image} alt="" loading="lazy" onerror={(e) => { e.currentTarget.style.display = 'none' }} />
                <span class="suggestion-item__name">{s.name}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <p id="message" class="message {game.message.type ? 'message--' + game.message.type : ''}" aria-live="polite">
        {game.message.text}
      </p>
    </div>
  </div>
  <FloatText />
</section>
