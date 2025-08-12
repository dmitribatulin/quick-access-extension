(function(){
  const vscode = acquireVsCodeApi();
  let currentTileIndex = 0;
  let tiles = [];

  function updateTilesList() {
    tiles = Array.from(document.querySelectorAll('[data-tile]'));
    if (tiles.length > 0 && currentTileIndex >= tiles.length) {
      currentTileIndex = tiles.length - 1;
    }
    updateFocus();
  }

  function updateFocus() {
    tiles.forEach((tile, index) => {
      tile.classList.toggle('keyboard-focused', index === currentTileIndex);
    });
    if (tiles[currentTileIndex]) {
      tiles[currentTileIndex].focus();
    }
  }

  function activateCurrentTile() {
    if (tiles[currentTileIndex]) {
      const payload = JSON.parse(tiles[currentTileIndex].getAttribute('data-tile'));
      vscode.postMessage({ type: 'tileClick', tile: payload });
    }
  }

  function navigateTiles(direction) {
    if (tiles.length === 0) return;
    
    const tilesPerRow = Math.floor(window.innerWidth / 340); // approximate tiles per row
    
    switch(direction) {
      case 'up':
        if (currentTileIndex >= tilesPerRow) {
          currentTileIndex -= tilesPerRow;
        }
        break;
      case 'down':
        if (currentTileIndex + tilesPerRow < tiles.length) {
          currentTileIndex += tilesPerRow;
        }
        break;
      case 'left':
        if (currentTileIndex > 0) {
          currentTileIndex--;
        }
        break;
      case 'right':
        if (currentTileIndex < tiles.length - 1) {
          currentTileIndex++;
        }
        break;
    }
    updateFocus();
  }

  // Click handler
  window.addEventListener('click', (e) => {
    const tile = e.target.closest('[data-tile]');
    if (tile) {
      currentTileIndex = tiles.indexOf(tile);
      const payload = JSON.parse(tile.getAttribute('data-tile'));
      vscode.postMessage({ type: 'tileClick', tile: payload });
    }
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        navigateTiles('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateTiles('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        navigateTiles('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateTiles('right');
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        activateCurrentTile();
        break;
    }
  });

  // Focus management
  window.addEventListener('focus', () => {
    updateTilesList();
  });

  // Message handler for tile updates
  window.addEventListener('message', (e) => {
    const msg = e.data;
    if(msg?.type === 'updateTiles') {
      const root = document.getElementById('root') || document.querySelector('.page-wrapper');
      if (root) {
        root.innerHTML = msg.html;
        setTimeout(() => {
          updateTilesList();
        }, 50);
      }
    }
  });

  // Initialize on load
  window.addEventListener('DOMContentLoaded', () => {
    updateTilesList();
  });

  // Initialize immediately if DOM is already loaded
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', updateTilesList);
  } else {
    updateTilesList();
  }
})();
