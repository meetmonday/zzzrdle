<script>
  import { game } from '../game/index.svelte.js'

  let container
  const COLORS = ['#d9fa00', '#a8c200', '#ffb500', '#ea00ff', '#00a8ff', '#f04444']

  $effect(() => {
    const tick = game.confettiTick
    if (!tick || !container) return
    const pieces = []
    for (let i = 0; i < 50; i++) {
      const piece = document.createElement('div')
      piece.className = 'confetti-piece'
      piece.style.left = Math.random() * 100 + 'vw'
      piece.style.background = COLORS[Math.floor(Math.random() * COLORS.length)]
      piece.style.animationDuration = (1.5 + Math.random() * 2) + 's'
      piece.style.animationDelay = Math.random() * 0.5 + 's'
      piece.style.width = (6 + Math.random() * 8) + 'px'
      piece.style.height = (6 + Math.random() * 8) + 'px'
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
      container.appendChild(piece)
      const t = setTimeout(() => piece.remove(), 4000)
      pieces.push(t)
    }
    return () => pieces.forEach(clearTimeout)
  })
</script>

<div bind:this={container} class="confetti-layer" aria-hidden="true"></div>
