// ============================================================================
// MODÜLER SEKME BİLEŞENİ: InventoryTab.ts
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

export class InventoryTab {
  public static render(ui: any, container: HTMLElement): void {
    const st: GameState = ui.engine.state;

    const catTotals = {
      et: 0,
      unlu: 0,
      sebze_sos: 0,
      icecek_tatli: 0
    };
    for (const ing of INGREDIENTS) {
      catTotals[ing.category] += Math.round(st.inventory[ing.id]?.amount || 0);
    }

    container.innerHTML = `
      <div class="panel-scroll">
        <div class="section-title">
          <div>
            <h2>📦 Depo Stokları, Otomatik Tedarik & Raf Ömrü (SKT)</h2>
            <p style="font-size:0.84rem;color:var(--text-secondary);font-weight:600;">
              Toptan paketler 100–150 porsiyonluktur ve uzun süre dayanır. Otomatik Toptancı Siparişi açıkken azalan stoklarınız kesintisiz tamamlanır.
            </p>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <label class="badge badge-success" style="padding:8px 14px;cursor:pointer;font-size:0.82rem;">
              <input type="checkbox" id="chk-auto-order-ing" ${st.shop.autoOrderIngredients ? 'checked' : ''} />
              🔄 Otomatik Toptancı Siparişi (Stok 20 Altına Düşünce Tamamla)
            </label>
            <button class="btn btn-primary" id="btn-restock-all-low">
              🚚 Eksik Tüm Malzemeleri Toptan Doldur
            </button>
          </div>
        </div>

        <div class="game-card" style="margin-bottom:18px;">
          <div class="card-head">
            <div>
              <span class="card-kicker">DEPO ENVANTER DAĞILIMI</span>
              <div class="card-title">📊 Kategori Bazlı Mevcut Stok Hacmi</div>
            </div>
          </div>
          ${ChartRenderer.renderSegmentedBar([
            { label: 'Et & Tavuk Grubu', subLabel: `${catTotals.et} porsiyon`, value: Math.max(1, catTotals.et), color: '#f68773' },
            { label: 'Lavaş & Tombik Ekmek', subLabel: `${catTotals.unlu} adet`, value: Math.max(1, catTotals.unlu), color: '#f5c76b' },
            { label: 'Sebze, Patates & Özel Sos', subLabel: `${catTotals.sebze_sos} porsiyon`, value: Math.max(1, catTotals.sebze_sos), color: '#38d39f' },
            { label: 'Ayran, İçecek & Tatlı', subLabel: `${catTotals.icecek_tatli} adet`, value: Math.max(1, catTotals.icecek_tatli), color: '#63b3ed' }
          ])}
        </div>

        <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr));">
          ${INGREDIENTS.map((ing) => {
            const stock = st.inventory[ing.id];
            const fillPct = Math.min(100, Math.round((stock.amount / (ing.packSize * 2)) * 100));
            const barClass = stock.amount < 30 ? 'bad' : stock.amount < 80 ? 'warn' : 'good';

            return `
              <div class="game-card">
                <div class="card-head">
                  <div>
                    <div class="card-title">${ing.icon} ${ing.name}</div>
                    <div class="card-subtitle">Toptan Paket: ${ing.packSize} ${ing.unit} • Raf Ömrü: ${ing.shelfLifeDays} gün</div>
                  </div>
                  <span class="badge ${stock.amount < 30 ? 'badge-danger' : 'badge-success'}">
                    ${Math.round(stock.amount)} ${ing.unit}
                  </span>
                </div>

                <div class="progress-bar">
                  <div class="progress-fill ${barClass}" style="width:${fillPct}%"></div>
                </div>

                <div style="display:flex;justify-content:space-between;font-size:0.78rem;">
                  <span>🕒 Kalan Tazelik (SKT): <strong>${stock.freshnessDays} Gün</strong></span>
                  <span>Tedarikçi: <strong>${SUPPLIER_TIERS[stock.supplierTier].name.split(' ')[0]}</strong></span>
                </div>

                <div style="display:flex;flex-direction:column;gap:6px;margin-top:4px;">
                  ${(['ucuz', 'standart', 'kaliteli'] as const)
                    .map((tierKey) => {
                      const tDef = SUPPLIER_TIERS[tierKey];
                      const uCost = ui.engine.getIngredientUnitCost(ing.id, tierKey);
                      const packCost = Math.round(uCost * ing.packSize);
                      return `
                        <button class="btn btn-sm ${tierKey === 'standart' ? 'btn-primary' : ''}" style="justify-content:space-between;" data-order-ing="${ing.id}:${tierKey}">
                          <span>+${ing.packSize} ${ing.unit} (${tDef.name.split(' ')[0]})</span>
                          <strong>${packCost.toLocaleString('tr-TR')} ₺</strong>
                        </button>
                      `;
                    })
                    .join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.querySelector('#chk-auto-order-ing')?.addEventListener('change', (e) => {
      st.shop.autoOrderIngredients = (e.target as HTMLInputElement).checked;
      SaveManager.saveAuto(st);
      ui.showToast(
        'Otomatik Tedarik',
        st.shop.autoOrderIngredients ? 'Otomatik toptancı siparişi aktif edildi.' : 'Otomatik sipariş kapatıldı.',
        'info'
      );
    });

    container.querySelectorAll('[data-order-ing]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = (btn as HTMLElement).getAttribute('data-order-ing') || '';
        const [ingId, tier] = raw.split(':') as [string, 'ucuz' | 'standart' | 'kaliteli'];
        const res = ui.engine.orderIngredientPack(ingId, tier);
        ui.showToast(res.ok ? 'Tedarik Siparişi Geldi' : 'Sipariş Hatası', res.msg, res.ok ? 'success' : 'warning');
      });
    });

    container.querySelector('#btn-restock-all-low')?.addEventListener('click', () => {
      let ordered = 0;
      for (const ing of INGREDIENTS) {
        if (st.inventory[ing.id].amount < ing.packSize * 1.2) {
          const res = ui.engine.orderIngredientPack(ing.id, 'standart');
          if (res.ok) ordered++;
        }
      }
      ui.showToast(
        ordered > 0 ? 'Toplu Tedarik Tamamlandı 🚚' : 'Depo Zaten Dolu',
        ordered > 0 ? `${ordered} kalem malzeme depoya eklendi.` : 'Tüm stoklarınız zaten yüksek seviyede.',
        ordered > 0 ? 'success' : 'info'
      );
    });
  }
}
