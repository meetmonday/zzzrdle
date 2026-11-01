<script>
  import { game } from '../game/index.svelte.js'

  let visible = $state(false)

  $effect(() => {
    const t = game.toast
    if (!t) { visible = false; return }
    visible = true
    const id = t.id
    const dur = t.duration || 3000
    const timer = setTimeout(() => {
      if (game.toast?.id === id) game.toast = null
    }, dur)
    return () => clearTimeout(timer)
  })
</script>

{#if game.toast}
  <div id="toast" class="toast toast--{game.toast.type || ''} {visible ? 'is-visible' : ''}" role="status" aria-live="polite">
    {@html game.toast.html}
  </div>
{/if}
