// ============================================================================
// MODÜLER SEKME BİLEŞENİ: MenuTab.ts
// ============================================================================

import type { GameState } from '../../types/index.ts';
import { bus } from '../../core/EventBus.ts';
import { SaveManager } from '../../core/SaveManager.ts';
import { ChartRenderer } from '../../render/ChartRenderer.ts';
import { FURNITURE_CATALOG, WALL_STYLES, FLOOR_STYLES, SHOP_UPGRADES } from '../../data/furniture.ts';
import { INGREDIENTS, SUPPLIER_TIERS } from '../../data/ingredients.ts';
import { RECIPES } from '../../data/recipes.ts';
import { STREET_NPCS } from '../../data/npcs.ts';
import { ACHIEVEMENTS, INVESTMENT_CATALOG, LOAN_PACKAGES } from '../../data/achievements.ts';
import { SPECIAL_CALENDAR_DAYS } from '../../data/events.ts';
import { NEIGHBORHOOD_TYPES } from '../../data/scenarios.ts';
import { TURKEY_PROVINCES, getDistrictsForProvince } from '../../data/turkey_map.ts';
import { ReputationSystem } from '../../core/ReputationSystem.ts';
import { QuestSystem } from '../../core/QuestSystem.ts';
import { BranchSystem } from '../../core/BranchSystem.ts';
import { ManagementSystem } from '../../core/ManagementSystem.ts';
import { MapRenderer } from '../../render/MapRenderer.ts';

export class MenuTab {
  public static render(ui: any, container: HTMLElement): void {
    const st: GameState = ui.engine.state;
    const hood = NEIGHBORHOOD_TYPES.find((n) => n.id === st.player.neighborhoodType) || NEIGHBORHOOD_TYPES[0];
    const menuFit = ui.engine.getNeighborhoodMenuFitScore();

    const filteredRecipes = RECIPES.filter((r) => {
      if (ui.menuCategoryFilter === 'tumu') return true;
      return r.socialTag === ui.menuCategoryFilter || r.socialTag === 'genel';
    });

    const chartRows = filteredRecipes.map((rec) => ({
      name: rec.name,
      icon: rec.icon,
      price: st.menu[rec.id].price,
      cost: ui.engine.getRecipeUnitCost(rec.id),
      suggested: ui.engine.getSuggestedPrice(rec.id),
      sold: st.menu[rec.id].soldTotal
    }));

    container.innerHTML = `
      <div class="panel-scroll">
        <!-- SOKAĞIN SOSYAL ÇEVRESİ & HAZIR MENÜ STRATEJİLERİ KARTI -->
        <div class="game-card" style="margin-bottom:18px;border-color:var(--accent-primary);">
          <div class="card-head">
            <div>
              <span class="card-kicker">SOKAĞIN SOSYAL ÇEVRESİ & ALIM GÜCÜ ANALİZİ</span>
              <div class="card-title">🏘️ ${hood.name}</div>
              <div class="card-subtitle">${hood.description}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span class="badge ${menuFit >= 75 ? 'badge-success' : 'badge-warning'}" style="font-size:0.86rem;padding:6px 12px;">
                🎯 Sosyal Çevre Menü & Fiyat Uyumu: %${menuFit}
              </span>
            </div>
          </div>

          <!-- Sokağın Demografik Ağırlık Çubuğu -->
          ${ChartRenderer.renderSegmentedBar([
            { label: 'Öğrenci Nüfusu', value: hood.customerWeights.ogrenci, color: '#f5c76b' },
            { label: 'Sanayi / İşçi', value: hood.customerWeights.isci, color: '#38d39f' },
            { label: 'Aile Sakinleri', value: hood.customerWeights.aile, color: '#63b3ed' },
            { label: 'Çarşı Esnafı', value: hood.customerWeights.esnaf, color: '#b794f4' },
            { label: 'Turist / Misafir', value: hood.customerWeights.turist, color: '#f68773' }
          ])}

          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;border-top:1px solid var(--border-color);padding-top:10px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:0.8rem;font-weight:800;color:var(--text-secondary);">Hazır Menü & Fiyat Şablonları:</span>
              <button class="btn btn-primary btn-sm" data-menu-preset="social_optimal">
                🎯 Bu Sokağın Sosyal Çevresine Göre Optimize Et
              </button>
              <button class="btn btn-sm" data-menu-preset="ekonomik_surum">
                🎓 Öğrenci & Ekonomik Sürüm Menüsü
              </button>
              <button class="btn btn-sm" data-menu-preset="orta_dengeli">
                🛠️ Sanayi & Esnaf Doyurucu Menü
              </button>
              <button class="btn btn-sm" data-menu-preset="prestij_gurme">
                👑 Aile & Turistik Gurme Restoran Menüsü
              </button>
            </div>

            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:0.78rem;color:var(--text-muted);font-weight:700;">Şube / Mahalle Çevresi:</span>
              <select id="sel-change-hood" class="form-select" style="padding:5px 10px;font-size:0.8rem;">
                ${NEIGHBORHOOD_TYPES.map(
                  (n) => `<option value="${n.id}" ${n.id === st.player.neighborhoodType ? 'selected' : ''}>${n.name.split('(')[0].trim()}</option>`
                ).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- FİLTRE SEKMELERİ VE TÜMÜNÜ GÜNCELLE BUTONU -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
          <div class="sub-tabs" style="margin-bottom:0;">
            <button class="sub-tab-btn ${ui.menuCategoryFilter === 'tumu' ? 'active' : ''}" data-menu-cat="tumu">Tüm Menü (${RECIPES.length})</button>
            <button class="sub-tab-btn ${ui.menuCategoryFilter === 'ogrenci_favorisi' ? 'active' : ''}" data-menu-cat="ogrenci_favorisi">🎓 Öğrenci & Genç</button>
            <button class="sub-tab-btn ${ui.menuCategoryFilter === 'sanayi_esnaf' ? 'active' : ''}" data-menu-cat="sanayi_esnaf">🛠️ Sanayi & Esnaf</button>
            <button class="sub-tab-btn ${ui.menuCategoryFilter === 'aile_klasik' ? 'active' : ''}" data-menu-cat="aile_klasik">👨‍👩‍👧 Aile Semti</button>
            <button class="sub-tab-btn ${ui.menuCategoryFilter === 'turist_gurme' ? 'active' : ''}" data-menu-cat="turist_gurme">📸 Turistik & Gurme</button>
          </div>

          <button class="btn btn-primary btn-sm" id="btn-sync-all-prices">
            📈 Tüm Fiyatları Güncel Enflasyon Önerisine Eşitle (x${st.finance.inflationIndex.toFixed(2)})
          </button>
        </div>

        <!-- MENÜ MALİYET vs KÂR MARJI GRAFİĞİ -->
        <div class="game-card" style="margin-bottom:18px;">
          <div class="card-head">
            <div>
              <span class="card-kicker">ÜRÜN KARLILIK ANALİZİ</span>
              <div class="card-title">📊 Menü Ürünleri Birim Maliyet ve Net Kâr Marjı Grafiği</div>
            </div>
          </div>
          ${ChartRenderer.renderMenuMarginChart(chartRows)}
        </div>

        <!-- ÜRÜN KARTLARI -->
        <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr));">
          ${filteredRecipes.map((rec) => {
            const ms = st.menu[rec.id];
            const cost = ui.engine.getRecipeUnitCost(rec.id);
            const suggested = ui.engine.getSuggestedPrice(rec.id);
            const demand = ui.engine.getNeighborhoodRecipeDemand(rec.id);
            const profit = ms.price - cost;
            const marginPct = ms.price > 0 ? Math.round((profit / ms.price) * 100) : 0;
            const hasStock = ui.engine.hasIngredientsForRecipe(rec.id);
            const overBudget = ms.price > demand.maxBudgetPrice;

            return `
              <div class="game-card" style="${!ms.active ? 'opacity:0.6;' : ''}">
                <div class="card-head">
                  <div>
                    <span class="card-kicker">${rec.socialTagLabel}</span>
                    <div class="card-title">${rec.icon} ${rec.name}</div>
                    <div class="card-subtitle">${rec.description}</div>
                  </div>
                  <label style="display:flex;align-items:center;gap:5px;font-size:0.78rem;font-weight:800;cursor:pointer;">
                    <input type="checkbox" data-toggle-recipe="${rec.id}" ${ms.active ? 'checked' : ''} />
                    Menüde
                  </label>
                </div>

                <!-- Sosyal Çevre Talep Gücü & Bütçe Tavanı -->
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <span class="badge ${demand.badgeClass}">${demand.label} (%${demand.score})</span>
                  <span class="badge ${overBudget ? 'badge-danger' : 'badge-neutral'}">
                    ${overBudget ? `⚠️ Tavanı Aşıyor (Max ${demand.maxBudgetPrice} ₺)` : `Mahalle Tavanı: ${demand.maxBudgetPrice} ₺`}
                  </span>
                </div>

                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <span class="badge ${hasStock ? 'badge-success' : 'badge-danger'}">
                    ${hasStock ? '✓ Stok Hazır' : '⚠️ Malzeme Eksik'}
                  </span>
                  <span class="badge badge-neutral">Maliyet: ${cost} ₺</span>
                  <span class="badge badge-info">Önerilen: ${suggested} ₺</span>
                  <span class="badge ${profit > 0 ? 'badge-success' : 'badge-danger'}">
                    Net Kâr: ${profit} ₺ (%${marginPct})
                  </span>
                </div>

                <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.8rem;background:var(--bg-input);padding:6px 10px;border-radius:8px;">
                  <span style="font-weight:700;">Porsiyon Gramajı:</span>
                  <div style="display:flex;gap:4px;">
                    <button class="btn btn-sm ${ms.portionFactor === 0.8 ? 'btn-primary' : ''}" data-portion="${rec.id}:0.8">Az (0.8x)</button>
                    <button class="btn btn-sm ${ms.portionFactor === 1.0 ? 'btn-primary' : ''}" data-portion="${rec.id}:1.0">Tam (1x)</button>
                    <button class="btn btn-sm ${ms.portionFactor === 1.25 ? 'btn-primary' : ''}" data-portion="${rec.id}:1.25">Bol (1.25x)</button>
                  </div>
                </div>

                <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                  <button class="btn btn-sm" data-price-step="${rec.id}:-5">-5 ₺</button>
                  <input type="number" class="form-input" style="width:90px;text-align:center;" data-price-input="${rec.id}" value="${ms.price}" min="5" max="5000" />
                  <button class="btn btn-sm" data-price-step="${rec.id}:5">+5 ₺</button>
                  <button class="btn btn-primary btn-sm" style="flex:1;" data-price-suggest="${rec.id}">
                    Önerilen (${suggested} ₺)
                  </button>
                </div>

                <div style="display:flex;justify-content:space-between;font-size:0.76rem;color:var(--text-muted);border-top:1px solid var(--border-color);padding-top:6px;">
                  <span>Bugün Satılan: <strong>${ms.soldToday} adet</strong></span>
                  <span>Toplam Satış: <strong>${ms.soldTotal} adet</strong></span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('[data-menu-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.menuCategoryFilter = (btn as HTMLElement).getAttribute('data-menu-cat') as any;
        ui.renderActiveTab(true);
      });
    });

    container.querySelectorAll('[data-menu-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = (btn as HTMLElement).getAttribute('data-menu-preset') as any;
        if (preset) {
          ui.engine.applyNeighborhoodMenuPreset(preset, false);
        }
      });
    });

    container.querySelector('#sel-change-hood')?.addEventListener('change', (e) => {
      st.player.neighborhoodType = (e.target as HTMLSelectElement).value;
      const found = NEIGHBORHOOD_TYPES.find((n) => n.id === st.player.neighborhoodType);
      ui.showToast(
        'Sosyal Çevre Güncellendi 🏘️',
        `Hedef mahalle profili "${found?.name.split('(')[0].trim()}" olarak değiştirildi. Menünüzü yeni çevreye göre optimize edebilirsiniz.`,
        'info'
      );
      bus.emit('state:updated', st);
    });

    container.querySelector('#btn-sync-all-prices')?.addEventListener('click', () => {
      for (const rec of RECIPES) {
        st.menu[rec.id].price = ui.engine.getSuggestedPrice(rec.id);
      }
      ui.showToast('Fiyatlar Güncellendi 📈', 'Tüm menü fiyatları güncel enflasyon önerisine eşitlendi.', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelectorAll('[data-toggle-recipe]').forEach((chk) => {
      chk.addEventListener('change', (e) => {
        const id = (chk as HTMLElement).getAttribute('data-toggle-recipe');
        if (id) {
          st.menu[id].active = (e.target as HTMLInputElement).checked;
          bus.emit('state:updated', st);
        }
      });
    });

    container.querySelectorAll('[data-portion]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = (btn as HTMLElement).getAttribute('data-portion') || '';
        const [id, factor] = raw.split(':');
        if (id && st.menu[id]) {
          st.menu[id].portionFactor = Number(factor);
          bus.emit('state:updated', st);
        }
      });
    });

    container.querySelectorAll('[data-price-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = (btn as HTMLElement).getAttribute('data-price-step') || '';
        const [id, step] = raw.split(':');
        if (id && st.menu[id]) {
          st.menu[id].price = Math.max(5, st.menu[id].price + Number(step));
          bus.emit('state:updated', st);
        }
      });
    });

    container.querySelectorAll('[data-price-input]').forEach((inp) => {
      inp.addEventListener('change', (e) => {
        const id = (inp as HTMLElement).getAttribute('data-price-input');
        const val = Math.max(5, Math.round(Number((e.target as HTMLInputElement).value) || 50));
        if (id && st.menu[id]) {
          st.menu[id].price = val;
          bus.emit('state:updated', st);
        }
      });
    });

    container.querySelectorAll('[data-price-suggest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).getAttribute('data-price-suggest');
        if (id && st.menu[id]) {
          st.menu[id].price = ui.engine.getSuggestedPrice(id);
          bus.emit('state:updated', st);
        }
      });
    });
  }
}
