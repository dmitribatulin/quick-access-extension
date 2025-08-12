(function(){
  const vscode = acquireVsCodeApi();
  let currentTileIndex = 0;
  let tiles = [];
  let allTiles = [];
  let searchInput = null;
  let isSearchFocused = false;

  function updateTilesList() {
    allTiles = Array.from(document.querySelectorAll('[data-tile]'));
    filterTiles();
    searchInput = document.getElementById('search-input');

    if (searchInput && !isSearchFocused) {
      searchInput.focus();
      isSearchFocused = true;
    }
  }

  function filterTiles() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    tiles = allTiles.filter(tile => {
      if (!searchTerm) return true;

      const tileData = JSON.parse(tile.getAttribute('data-tile'));
      const name = (tileData.name || '').toLowerCase();
      const description = (tileData.description || '').toLowerCase();

      const matches = name.includes(searchTerm) || description.includes(searchTerm);
      tile.style.display = matches ? '' : 'none';
      return matches;
    });

    // Hide empty groups
    const groups = document.querySelectorAll('.tile-group');
    groups.forEach(group => {
      const visibleTiles = group.querySelectorAll('[data-tile]:not([style*="display: none"])');
      group.style.display = visibleTiles.length > 0 ? '' : 'none';
    });

    if (tiles.length > 0 && currentTileIndex >= tiles.length) {
      currentTileIndex = tiles.length - 1;
    }
    if (currentTileIndex < 0) currentTileIndex = 0;

    if (!isSearchFocused) {
      updateFocus();
    }
  }

  function updateFocus() {
    allTiles.forEach((tile, index) => {
      tile.classList.remove('keyboard-focused');
    });

    if (tiles[currentTileIndex] && !isSearchFocused) {
      tiles[currentTileIndex].classList.add('keyboard-focused');
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

    const tilesPerRow = Math.floor(window.innerWidth / 340);

    switch(direction) {
      case 'up':
        if (currentTileIndex >= tilesPerRow) {
          currentTileIndex -= tilesPerRow;
        } else {
          // If on first row, return focus to search
          focusSearch();
          return;
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

  function focusSearch() {
    if (searchInput) {
      searchInput.focus();
      isSearchFocused = true;
      allTiles.forEach(tile => tile.classList.remove('keyboard-focused'));
    }
  }

  function focusTiles() {
    if (searchInput) {
      searchInput.blur();
    }
    isSearchFocused = false;
    if (tiles.length > 0) {
      currentTileIndex = Math.max(0, Math.min(currentTileIndex, tiles.length - 1));
      updateFocus();
    }
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

  // Search input handler
  document.addEventListener('input', (e) => {
    if (e.target.id === 'search-input') {
      filterTiles();
    }
  });

  // Focus handlers
  document.addEventListener('focus', (e) => {
    if (e.target.id === 'search-input') {
      isSearchFocused = true;
      allTiles.forEach(tile => tile.classList.remove('keyboard-focused'));
    }
  }, true);

  document.addEventListener('blur', (e) => {
    if (e.target.id === 'search-input') {
      isSearchFocused = false;
    }
  }, true);

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    // Ctrl+F to focus search
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      focusSearch();
      return;
    }

    if (isSearchFocused) {
      // From search, navigate to tiles with arrow keys (except up)
      switch(e.key) {
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          focusTiles();
          break;
        case 'Escape':
          e.preventDefault();
          focusTiles();
          break;
      }
    } else {
      // Tile navigation
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
