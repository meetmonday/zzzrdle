<script>
  import { onMount } from 'svelte'
  import { game } from './lib/game/index.svelte.js'

  import MenuScreen from './lib/components/MenuScreen.svelte'
  import GameScreen from './lib/components/GameScreen.svelte'
  import ResultModal from './lib/components/ResultModal.svelte'
  import TutorialModal from './lib/components/TutorialModal.svelte'
  import Toast from './lib/components/Toast.svelte'
  import CountdownOverlay from './lib/components/CountdownOverlay.svelte'
  import Confetti from './lib/components/Confetti.svelte'

  let screen = $state('menu')

  function playMode(mode) {
    game.launchMode(mode)
    screen = 'game'
  }
  function backToMenu() {
    game.openMenu()
    screen = 'menu'
  }

  // keyboard shortcuts (Shift+Enter etc.)
  function onKeydown(e) {
    if (e.key !== 'Enter' || !e.shiftKey) return
    if (screen !== 'game') return
    if (game.mode === 'time' && game.isTimeActive()) {
      e.preventDefault()
      game.requestRestart()
      return
    }
    if (game.done) {
      e.preventDefault()
      if (game.mode === 'streak') game.startStreakGame()
      else if (game.mode === 'practice') game.startPracticeGame()
      else if (game.mode === 'time' && !game.countdownActive) game.startAttackGame()
    }
  }

  onMount(() => {
    void (async () => {
      await game.boot()
      if (!localStorage.getItem('zzzrdle-tutorial-seen')) {
        game.tutorialOpen = true
      }
    })()
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  })

  // Escape handling for overlays
  function onDocumentKeydown(e) {
    if (e.key !== 'Escape') return
    if (game.tutorialOpen) { game.tutorialOpen = false; return }
    if (game.resultModalOpen) { game.resultModalOpen = false; return }
    if (game.suggestions.length) { game.hideSuggestions(); return }
  }
  onMount(() => {
    window.addEventListener('keydown', onDocumentKeydown)
    return () => window.removeEventListener('keydown', onDocumentKeydown)
  })
</script>

<div class="bg-grid" aria-hidden="true"></div>

{#if screen === 'menu'}
  <MenuScreen onPlay={playMode} />
{:else}
  <GameScreen onMenu={backToMenu} />
{/if}

<ResultModal />
<TutorialModal />
<Toast />
<CountdownOverlay />
<Confetti />
