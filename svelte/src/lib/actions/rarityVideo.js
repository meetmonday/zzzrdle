// Svelte action: port of the vanilla armRarityVideo logic.
export function rarityVideo(node) {
  const start = node.querySelector('.tile__video--start');
  const loop = node.querySelector('.tile__video--loop');
  if (!start || !loop) return;

  const onEnded = () => {
    start.hidden = true;
    loop.hidden = false;
    loop.currentTime = 0;
    loop.play().catch(() => {});
  };
  const play = () => {
    if (document.hidden) return;
    start.hidden = false;
    start.currentTime = 0;
    start.play().catch(() => {});
  };
  const onLoaded = () => play();

  start.addEventListener('ended', onEnded);
  start.addEventListener('loadedmetadata', onLoaded, { once: true });
  document.addEventListener('visibilitychange', play);

  return {
    destroy() {
      start.removeEventListener('ended', onEnded);
      start.removeEventListener('loadedmetadata', onLoaded);
      document.removeEventListener('visibilitychange', play);
    },
  };
}
