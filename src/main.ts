// ============================================================================
// DÖNERCİ USTA - UYGULAMA GİRİŞ NOKTASI (main.ts)
// ============================================================================

import { GameEngine } from './core/GameEngine.ts';
import { UIManager } from './ui/UIManager.ts';

window.addEventListener('DOMContentLoaded', () => {
  const appRoot = document.getElementById('app');
  if (!appRoot) {
    throw new Error('#app kök elementi bulunamadı!');
  }

  const engine = new GameEngine();
  const ui = new UIManager(appRoot, engine);

  // Hata ayıklama ve konsol erişimi için global referans
  (window as any).__DONERCI_USTA__ = { engine, ui };
});
