(function(){
  const vscode = acquireVsCodeApi();
  window.addEventListener('click', (e) => {
    const tile = e.target.closest('[data-tile]');
    if (tile) {
      const payload = JSON.parse(tile.getAttribute('data-tile'));
      vscode.postMessage({ type: 'tileClick', tile: payload });
    }
  });

  window.addEventListener('message', (e) => {
    const msg = e.data;
    if(msg?.type === 'updateTiles') {
      const root = document.getElementById('root');
      root.innerHTML = msg.html;
    }
  });
})();
