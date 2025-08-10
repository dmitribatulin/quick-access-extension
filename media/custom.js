console.log('[QuickAccessTiles] custom.js loaded');
// Example: Add a footer note
(function(){
  const root = document.getElementById('root');
  if(!root) return;
  const footer = document.createElement('div');
  footer.style.marginTop = '32px';
  footer.style.opacity = '0.6';
  footer.style.fontSize = '11px';
  footer.textContent = 'Custom JS injected via settings';
  root.appendChild(footer);
})();
