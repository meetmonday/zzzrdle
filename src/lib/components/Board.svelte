<script>
  import { game } from '../game/index.svelte.js'
  import GuessRow from './GuessRow.svelte'

  let step = $derived(game.mode === 'time' ? 200 : 300)
</script>

<section class="board" id="board" aria-label="Guesses">
  {#if game.target}
    {#each game.guesses as guess (guess.id)}
      <GuessRow
        {guess}
        target={game.target}
        animate={game.animateLast && guess.id === game.lastGuessId}
        {step}
      />
    {/each}
  {/if}
</section>
