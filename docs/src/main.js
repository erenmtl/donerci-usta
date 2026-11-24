// ============================================================================
// DÖNERCİ USTA - UYGULAMA GİRİŞ NOKTASI (main.ts)
// ============================================================================

import { GameEngine } from './core/GameEngine.js';
import { UIManager } from './ui/UIManager.js';

window.addEventListener('DOMContentLoaded', () => {
  const appRoot = document.getElementById('app');
  if (!appRoot) {
    throw new Error('#app kök elementi bulunamadı!');
  }

  const engine = new GameEngine();
  const ui = new UIManager(appRoot, engine);

  // Hata ayıklama ve konsol erişimi için global referans
  (window).__DONERCI_USTA__ = { engine, ui };
});
