<script>
  import { game } from '../game/index.svelte.js'

  function close() {
    game.tutorialOpen = false
    if (typeof localStorage !== 'undefined') localStorage.setItem('zzzrdle-tutorial-seen', '1')
  }
</script>

{#if game.tutorialOpen}
  <div id="tutorial-overlay" class="overlay tutorial-overlay is-visible" onclick={(e) => { if (e.target === e.currentTarget) close() }}>
    <div class="modal tutorial" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <button id="tutorial-close" class="modal__close" type="button" aria-label="Close" onclick={close}>×</button>
      <div class="modal__inner">
        <h2 id="tutorial-title" class="modal__title">How to play</h2>
        <p class="modal__result">Guess the ZZZ agent</p>
        <ol class="tutorial__steps">
          <li class="tutorial__step"><span class="tutorial__step-num">1</span><span class="tutorial__step-text">Type a character name and press <strong>Guess</strong></span></li>
          <li class="tutorial__step"><span class="tutorial__step-num">2</span><span class="tutorial__step-text">Each tile shows an attribute — <strong style="color:var(--correct)">green</strong> means it matches the target</span></li>
          <li class="tutorial__step"><span class="tutorial__step-num">3</span><span class="tutorial__step-text"><strong style="color:var(--wrong-text)">Grey</strong> means the attribute doesn't match</span></li>
          <li class="tutorial__step"><span class="tutorial__step-num">4</span><span class="tutorial__step-text">Use the clues to narrow down the correct agent</span></li>
        </ol>
        <div class="tutorial__example" aria-label="Example guess result">
          <div class="tutorial__tile tutorial__tile--correct">Attribute</div>
          <div class="tutorial__tile tutorial__tile--wrong">Specialty</div>
          <div class="tutorial__tile tutorial__tile--wrong">Attack</div>
          <div class="tutorial__tile tutorial__tile--correct">Faction</div>
          <div class="tutorial__tile tutorial__tile--correct">Rarity</div>
        </div>
        <button id="tutorial-start" class="share-btn" type="button" onclick={close}>Got it!</button>
      </div>
    </div>
  </div>
{/if}
