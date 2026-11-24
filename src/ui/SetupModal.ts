// ============================================================================
// OYUN BAŞI KARAKTER, AİLE VE SENARYO KURULUM EKRANI (SetupModal)
// ============================================================================

import type { GameEngine } from '../core/GameEngine.ts';
import type { Gender, FamilyStatus, DifficultyLevel } from '../types/index.ts';
import { NEIGHBORHOOD_TYPES, STARTING_SCENARIOS, FAMILY_TEMPLATES } from '../data/scenarios.ts';
import { TURKEY_PROVINCES } from '../data/turkey_map.ts';
import { SaveManager } from '../core/SaveManager.ts';

export class SetupModal {
  public static render(container: HTMLElement, engine: GameEngine, onComplete: () => void): void {
    const slots = SaveManager.getSlotsMeta().filter((s) => s.exists);

    container.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-box" style="max-width:820px;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--border-color);padding-bottom:12px;">
            <div>
              <h1 style="font-size:1.55rem;font-weight:900;color:var(--accent-secondary);">🌯 DÖNERCİ USTA</h1>
              <p style="font-size:0.86rem;color:var(--text-secondary);font-weight:700;">
                Mahalle Esnafı, Aile ve Döner İmparatorluğu Simülasyonu
              </p>
            </div>
            <span class="badge badge-warning">Yeni Oyun Kurulumu</span>
          </div>

          ${
            slots.length > 0
              ? `
            <div class="game-card" style="background:var(--accent-soft);border-color:var(--accent-primary);">
              <div class="card-title">💾 Kayıtlı Oyununuz Bulundu</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                ${slots
                  .map(
                    (s) => `
                  <button class="btn btn-primary btn-sm" data-load-slot="${s.slotId}">
                    📂 ${s.label}: ${s.shopName} (Gün ${s.day} - ${Math.round(s.cash || 0).toLocaleString('tr-TR')} ₺)
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
              : ''
          }

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;">
            <div class="form-group">
              <label class="form-label">Ustanın Adı Soyadı</label>
              <input id="setup-name" class="form-input" type="text" value="Ahmet Usta" maxlength="28" />
            </div>
            <div class="form-group">
              <label class="form-label">Döner Dükkanının Tabelası</label>
              <input id="setup-shop" class="form-input" type="text" value="Meşhur Bereket Döner" maxlength="32" />
            </div>
            <div class="form-group">
              <label class="form-label">Başlangıç Yaşı (18 - 55)</label>
              <input id="setup-age" class="form-input" type="number" min="18" max="55" value="32" />
            </div>
            <div class="form-group">
              <label class="form-label">Cinsiyet</label>
              <select id="setup-gender" class="form-select">
                <option value="erkek">Erkek Usta</option>
                <option value="kadin">Kadın Usta</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Başlangıç Şehri (81 İl)</label>
              <select id="setup-city" class="form-select">
                ${TURKEY_PROVINCES.map(
                  (p) =>
                    `<option value="${p.name}" ${p.id === 'istanbul' ? 'selected' : ''}>${p.plate} - ${p.name} (${p.region})</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Zorluk & Enflasyon Seviyesi</label>
              <select id="setup-diff" class="form-select">
                <option value="kolay">Kolay (Düşük Enflasyon, Bol Sermaye)</option>
                <option value="normal" selected>Normal (Gerçekçi Türkiye Ekonomisi)</option>
                <option value="zor">Zor (Yüksek Enflasyon & Sert Rekabet)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Mahalle Tipi (Müşteri Profilini ve Kirayı Belirler)</label>
            <select id="setup-hood" class="form-select">
              ${NEIGHBORHOOD_TYPES.map(
                (n) => `<option value="${n.id}">${n.name} (Kira Çarpanı: x${n.rentMultiplier})</option>`
              ).join('')}
            </select>
            <div id="hood-desc" style="font-size:0.8rem;color:var(--text-secondary);margin-top:3px;">
              ${NEIGHBORHOOD_TYPES[0].description}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Aile Durumu (Ev Giderlerini, Hikayeyi ve Gelecekte İşi Devralacak Çocukları Etkiler)</label>
            <select id="setup-family" class="form-select">
              ${Object.entries(FAMILY_TEMPLATES)
                .map(
                  ([k, v]) =>
                    `<option value="${k}" ${k === 'evli_cocuklu' ? 'selected' : ''}>${v.label} (Baz Ev Kirası: ${v.houseRentBase.toLocaleString('tr-TR')} ₺/ay)</option>`
                )
                .join('')}
            </select>
            <div id="family-desc" style="font-size:0.8rem;color:var(--text-secondary);margin-top:3px;">
              ${FAMILY_TEMPLATES.evli_cocuklu.description}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Başlangıç Hikayesi & Sermaye Senaryosu</label>
            <div class="card-grid" id="scenario-cards" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">
              ${STARTING_SCENARIOS.map(
                (sc, idx) => `
                <div class="game-card scenario-choice ${idx === 0 ? 'selected' : ''}" data-scenario="${sc.id}" style="cursor:pointer;border-width:2px;${idx === 0 ? 'border-color:var(--accent-secondary);background:var(--accent-soft);' : ''}">
                  <div class="card-head">
                    <span class="card-title">${sc.title}</span>
                  </div>
                  <div style="font-size:0.78rem;color:var(--text-secondary);">${sc.story}</div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:auto;">
                    <span class="badge badge-success">💵 ${sc.startingCash.toLocaleString('tr-TR')} ₺</span>
                    ${
                      sc.startingDebt > 0
                        ? `<span class="badge badge-danger">🏦 Borç: ${sc.startingDebt.toLocaleString('tr-TR')} ₺</span>`
                        : `<span class="badge badge-info">Borçsuz</span>`
                    }
                    <span class="badge badge-warning">⭐ İtibar: ${sc.startingReputation}</span>
                  </div>
                </div>
              `
              ).join('')}
            </div>
          </div>

          <button id="btn-start-game" class="btn btn-primary btn-block" style="padding:13px;font-size:1.05rem;">
            🔥 Ocağın Ateşini Yak ve Dükkanı Aç!
          </button>
        </div>
      </div>
    `;

    let chosenScenarioId = STARTING_SCENARIOS[0].id;

    // Mahalle açıklaması güncelleme
    const hoodSelect = container.querySelector('#setup-hood') as HTMLSelectElement;
    const hoodDesc = container.querySelector('#hood-desc') as HTMLElement;
    hoodSelect?.addEventListener('change', () => {
      const found = NEIGHBORHOOD_TYPES.find((n) => n.id === hoodSelect.value);
      if (found && hoodDesc) hoodDesc.textContent = found.description;
    });

    // Aile açıklaması güncelleme
    const famSelect = container.querySelector('#setup-family') as HTMLSelectElement;
    const famDesc = container.querySelector('#family-desc') as HTMLElement;
    famSelect?.addEventListener('change', () => {
      const found = FAMILY_TEMPLATES[famSelect.value as FamilyStatus];
      if (found && famDesc) famDesc.textContent = found.description;
    });

    // Senaryo kartı seçimi
    container.querySelectorAll('.scenario-choice').forEach((card) => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.scenario-choice').forEach((c) => {
          (c as HTMLElement).style.borderColor = 'var(--border-color)';
          (c as HTMLElement).style.background = 'var(--bg-card)';
        });
        const el = card as HTMLElement;
        el.style.borderColor = 'var(--accent-secondary)';
        el.style.background = 'var(--accent-soft)';
        chosenScenarioId = el.getAttribute('data-scenario') || STARTING_SCENARIOS[0].id;
      });
    });

    // Kayıtlı slot yükleme
    container.querySelectorAll('[data-load-slot]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slotId = (btn as HTMLElement).getAttribute('data-load-slot');
        if (!slotId) return;
        const loaded = SaveManager.loadSlot(slotId);
        if (loaded) {
          engine.state = loaded;
          engine.recalculateShopStats();
          engine.startLoop();
          onComplete();
        }
      });
    });

    // Oyunu Başlat
    const startBtn = container.querySelector('#btn-start-game');
    startBtn?.addEventListener('click', () => {
      const playerName = (container.querySelector('#setup-name') as HTMLInputElement)?.value || 'Ahmet Usta';
      const shopName = (container.querySelector('#setup-shop') as HTMLInputElement)?.value || 'Meşhur Dönerci';
      const age = Math.max(18, Math.min(55, Number((container.querySelector('#setup-age') as HTMLInputElement)?.value) || 32));
      const gender = ((container.querySelector('#setup-gender') as HTMLSelectElement)?.value || 'erkek') as Gender;
      const city = (container.querySelector('#setup-city') as HTMLSelectElement)?.value || 'İstanbul';
      const difficulty = ((container.querySelector('#setup-diff') as HTMLSelectElement)?.value || 'normal') as DifficultyLevel;
      const neighborhoodType = hoodSelect?.value || NEIGHBORHOOD_TYPES[0].id;
      const familyStatus = (famSelect?.value || 'evli_cocuklu') as FamilyStatus;

      engine.startNewGame({
        playerName,
        shopName,
        age,
        gender,
        city,
        neighborhoodType,
        familyStatus,
        scenarioId: chosenScenarioId,
        difficulty
      });
      onComplete();
    });
  }
}
