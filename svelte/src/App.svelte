<script>
  import { onMount } from 'svelte'
  import { game } from './lib/game/index.svelte.js'

  let screen = $state('menu')

  onMount(() => {
    void game.boot()
  })
</script>

<!-- Migration scaffold: menu markup placeholder -->
<div class="migration-shell">
  <header class="migration-shell__head">
    <h1>ZZZrdle</h1>
    <p>Migration shell. Loaded: {game.loaded ? 'yes' : 'no'}</p>
    <p class="sr-only" aria-live="polite">Screen: {screen}</p>
  </header>
  <main class="migration-shell__body">
    <button type="button" class="mode-card" onclick={() => (screen = 'game')}>Open game shell</button>
    <button type="button" class="mode-card" onclick={() => (screen = 'menu')}>Back to menu</button>
    {#if game.loadError}
      <p role="alert">{game.loadError}</p>
    {/if}
  </main>
</div>
