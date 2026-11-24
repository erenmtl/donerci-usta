// ============================================================================
// ⚙️ KAYIT SLOTLARI VE AYARLAR SEKMESİ (SettingsTab.ts)
// ============================================================================

import type { GameEngine } from '../../core/GameEngine.ts';
import { SaveManager } from '../../core/SaveManager.ts';
import { SetupModal } from '../SetupModal.ts';

export class SettingsTab {
  public static render(container: HTMLElement, root: HTMLElement, engine: GameEngine, onRefresh: any, onFullReset: any, onToast: any): void {
    const slots = SaveManager.getSlotsMeta();

    container.innerHTML = `
      <div class="panel-scroll">
        <div class="section-title">
          <h2>⚙️ Kayıt Slotları, Tema ve Yeni Oyun</h2>
        </div>

        <div class="card-grid" style="margin-bottom:18px;">
          ${slots
            .map(
              (s) => `
            <div class="game-card">
              <div class="card-head">
                <div class="card-title">💾 ${s.label}</div>
                <span class="badge ${s.exists ? 'badge-success' : 'badge-neutral'}">${s.exists ? 'Dolu' : 'Boş'}</span>
              </div>
              ${
                s.exists
                  ? `<div style="font-size:0.82rem;color:var(--text-secondary);">
                      <strong>${s.shopName}</strong> (${s.playerName})<br/>
                      Yıl ${s.year} • Gün ${s.day} • Kasa: ${Math.round(s.cash || 0).toLocaleString('tr-TR')} ₺<br/>
                      <span style="font-size:0.74rem;color:var(--text-muted);">Kayıt: ${s.savedAt}</span>
                    </div>`
                  : `<div style="font-size:0.82rem;color:var(--text-muted);">Bu slota henüz kayıt yapılmadı.</div>`
              }
              <div style="display:flex;gap:6px;margin-top:auto;">
                <button class="btn btn-primary btn-sm" data-save-slot="${s.slotId}">💾 Kaydet</button>
                <button class="btn btn-sm" data-load-slot="${s.slotId}" ${!s.exists ? 'disabled' : ''}>📂 Yükle</button>
                <button class="btn btn-danger btn-sm" data-del-slot="${s.slotId}" ${!s.exists ? 'disabled' : ''}>🗑️</button>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="game-card">
          <div class="card-title">🔄 Yeni Oyun Başlat</div>
          <div style="font-size:0.84rem;color:var(--text-secondary);">
            Farklı bir şehir (81 İl), aile durumu veya başlangıç senaryosu ile sıfırdan yeni bir döner dükkanı kurmak isterseniz aşağıdaki butonu kullanabilirsiniz.
          </div>
          <div>
            <button class="btn btn-danger" id="btn-new-game-modal">🔥 Yeni Karakter & Dükkan Kurulum Ekranını Aç</button>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-save-slot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slotId = (btn as HTMLElement).getAttribute('data-save-slot');
        if (slotId && SaveManager.saveSlot(slotId, engine.state)) {
          onToast('Oyun Kaydedildi 💾', `${slotId.toUpperCase()} üzerine başarıyla kaydedildi.`, 'success');
          onRefresh();
        }
      });
    });

    container.querySelectorAll('[data-load-slot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slotId = (btn as HTMLElement).getAttribute('data-load-slot');
        if (!slotId) return;
        const loaded = SaveManager.loadSlot(slotId);
        if (loaded) {
          engine.state = loaded;
          engine.recalculateShopStats();
          onToast('Kayıt Yüklendi 📂', `${loaded.shop.name} yüklendi.`, 'info');
          onFullReset();
        }
      });
    });

    container.querySelectorAll('[data-del-slot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slotId = (btn as HTMLElement).getAttribute('data-del-slot');
        if (slotId) {
          SaveManager.deleteSlot(slotId);
          onRefresh();
        }
      });
    });

    container.querySelector('#btn-new-game-modal')?.addEventListener('click', () => {
      engine.setSpeed(0);
      SetupModal.render(root, engine, () => {
        onFullReset();
      });
    });
  }
}
