<script>
  import { ATTRIBUTES } from '../game/constants.js'
  import { rarityVideo } from '../actions/rarityVideo.js'

  let { guess, target = null, animate = false, step = 300 } = $props()

  // number of attribute tiles whose result has been revealed
  let revealed = $state(0)

  $effect(() => {
    if (!animate) { revealed = ATTRIBUTES.length; return; }
    revealed = 0
    const timers = ATTRIBUTES.map((_, i) =>
      setTimeout(() => { revealed = i + 1 }, i * step)
    )
    return () => timers.forEach(clearTimeout)
  })

  function isCorrect(key) {
    if (!target) return false
    return guess[key] === target[key]
  }

  function isSpecialRarity(key) {
    return key === 'rarity' && (guess.rarity === 'S' || guess.rarity === 'A')
  }
</script>

<article class="guess-row">
  <div class="tile tile--wide">
    <img class="tile__portrait" src={guess.image} alt={guess.name} loading="lazy" onerror={(e) => { e.currentTarget.style.display = 'none' }} />
    <span class="tile__name">{guess.name}</span>
  </div>

  {#each ATTRIBUTES as attr, i (attr.key)}
    {@const key = attr.key}
    {@const correct = isCorrect(key)}
    {@const special = isSpecialRarity(key)}
    <div
      class="tile {special ? 'tile--rarity' : ''} {revealed > i ? (correct ? 'tile--correct' : 'tile--wrong') : ''} {revealed === i + 1 ? 'tile--animating' : ''}"
      style:opacity={animate && revealed <= i ? 0 : ''}
      use:rarityVideo
      data-correct={correct}
    >
      {#if special}
        <video class="tile__video tile__video--start" src={`demo/unit/Gacha_${guess.rarity}_Start_anim.webm`} muted playsinline preload="auto"></video>
        <video class="tile__video tile__video--loop" src={`demo/unit/Gacha_${guess.rarity}_Loop_anim.webm`} muted loop playsinline preload="auto" hidden></video>
      {:else}
        <img class="tile__icon" src={`static${guess[`${key}Icon`] || ''}`} alt="" loading="lazy" onerror={(e) => { e.currentTarget.style.display = 'none' }} />
        {#if key !== 'rarity'}
          <span class="tile__label">{guess[key]}</span>
        {/if}
      {/if}
    </div>
  {/each}
</article>
