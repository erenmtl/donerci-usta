// ============================================================================
// KAYIT SİSTEMİ (localStorage Otomatik Kayıt + Çoklu Kayıt Slotu)
// ============================================================================

import type { GameState } from '../types/index.ts';

const SAVE_PREFIX = 'donerci_usta_save_';
const AUTOSAVE_KEY = 'donerci_usta_autosave';

export interface SaveSlotMeta {
  slotId: string;
  label: string;
  exists: boolean;
  savedAt?: string;
  shopName?: string;
  playerName?: string;
  day?: number;
  year?: number;
  cash?: number;
}

export class SaveManager {
  public static saveAuto(state: GameState): void {
    try {
      const payload = {
        savedAt: new Date().toLocaleString('tr-TR'),
        state
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('Otomatik kayıt başarısız:', err);
    }
  }

  public static loadAuto(): GameState | null {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.state || null;
    } catch {
      return null;
    }
  }

  public static saveSlot(slotId: string, state: GameState): boolean {
    try {
      const payload = {
        savedAt: new Date().toLocaleString('tr-TR'),
        state
      };
      localStorage.setItem(SAVE_PREFIX + slotId, JSON.stringify(payload));
      this.saveAuto(state);
      return true;
    } catch (err) {
      console.error('Slot kaydı başarısız:', err);
      return false;
    }
  }

  public static loadSlot(slotId: string): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_PREFIX + slotId);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed.state || null;
    } catch {
      return null;
    }
  }

  public static deleteSlot(slotId: string): void {
    localStorage.removeItem(SAVE_PREFIX + slotId);
  }

  public static clearAll(): void {
    localStorage.removeItem(AUTOSAVE_KEY);
    ['slot1', 'slot2', 'slot3'].forEach((s) => localStorage.removeItem(SAVE_PREFIX + s));
  }

  public static getSlotsMeta(): SaveSlotMeta[] {
    const slots = [
      { id: 'slot1', label: 'Kayıt Slotu 1' },
      { id: 'slot2', label: 'Kayıt Slotu 2' },
      { id: 'slot3', label: 'Kayıt Slotu 3' }
    ];

    return slots.map((s) => {
      try {
        const raw = localStorage.getItem(SAVE_PREFIX + s.id);
        if (!raw) {
          return { slotId: s.id, label: s.label, exists: false };
        }
        const parsed = JSON.parse(raw);
        const st: GameState = parsed.state;
        return {
          slotId: s.id,
          label: s.label,
          exists: true,
          savedAt: parsed.savedAt,
          shopName: st.shop?.name || 'Dönerci',
          playerName: st.player?.name || 'Usta',
          day: st.time?.day || 1,
          year: st.time?.year || 1,
          cash: st.finance?.cash || 0
        };
      } catch {
        return { slotId: s.id, label: s.label, exists: false };
      }
    });
  }
}
