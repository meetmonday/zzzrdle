<script>
  import { game } from '../game/index.svelte.js'

  $effect(() => {
    const ft = game.floatText
    if (!ft) return
    const timer = setTimeout(() => {
      if (game.floatText?.id === ft.id) game.floatText = null
    }, 1500)
    return () => clearTimeout(timer)
  })
</script>

{#if game.floatText}
  <div class="float-text float-text--{game.floatText.cls || ''}" aria-hidden="true">
    {game.floatText.text}
  </div>
{/if}
