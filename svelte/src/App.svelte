<script>
  // Migration scaffold. Screen routing will replace the static vanilla DOM.
  let screen = $state('menu')
</script>

<div class="migration-shell">
  <header class="migration-shell__head">
    <h1>ZZZrdle</h1>
    <p>Svelte migration in progress — shell only (no game logic yet).</p>
  </header>
  <main class="migration-shell__body">
    <button type="button" class="mode-card" onclick={() => screen = 'game'}>Open game shell</button>
    <button type="button" class="mode-card" onclick={() => screen = 'menu'}>Back to menu</button>
    <p class="sr-only" aria-live="polite">Current screen: {screen}</p>
  </main>
</div>
