<script>
  import { game } from '../game/index.svelte.js'
</script>

{#if game.countdownActive}
  <div id="countdown-overlay" class="overlay countdown-overlay" aria-hidden="true">
    <div id="countdown-number" class="countdown-number is-tick">{game.countdownText}</div>
  </div>
{/if}
