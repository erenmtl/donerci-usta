// ============================================================================
// MODÜLER SEKME BİLEŞENİ: ShopTab.ts
// ============================================================================

import { bus } from '../../core/EventBus.js';
import { SaveManager } from '../../core/SaveManager.js';
import { ChartRenderer } from '../../render/ChartRenderer.js';
import { FURNITURE_CATALOG, WALL_STYLES, FLOOR_STYLES, SHOP_UPGRADES } from '../../data/furniture.js';
import { INGREDIENTS, SUPPLIER_TIERS } from '../../data/ingredients.js';
import { RECIPES } from '../../data/recipes.js';
import { STREET_NPCS } from '../../data/npcs.js';
import { ACHIEVEMENTS, INVESTMENT_CATALOG, LOAN_PACKAGES } from '../../data/achievements.js';
import { SPECIAL_CALENDAR_DAYS } from '../../data/events.js';
import { NEIGHBORHOOD_TYPES } from '../../data/scenarios.js';
import { TURKEY_PROVINCES, getDistrictsForProvince } from '../../data/turkey_map.js';
import { ReputationSystem } from '../../core/ReputationSystem.js';
import { QuestSystem } from '../../core/QuestSystem.js';
import { BranchSystem } from '../../core/BranchSystem.js';
import { ManagementSystem } from '../../core/ManagementSystem.js';
import { MapRenderer } from '../../render/MapRenderer.js';

export class ShopTab {
  static render(ui, container) {
    const st = ui.engine.state;
    const specialDay = SPECIAL_CALENDAR_DAYS[st.time.day % 30 || 30];
    const ct = st.finance.todayStats.byCustomerType || { ogrenci: 8, isci: 5, aile: 4, turist: 2, esnaf: 4 };
    const menuFit = ui.engine.getNeighborhoodMenuFitScore();
    const trafficPct = Math.round((st.shop.trafficMultiplier || 1.0) * 100);

    const topRecipes = RECIPES.filter((r) => st.menu[r.id]?.active)
      .slice(0, 5)
      .map((r, idx) => {
        const colors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4'];
        const ms = st.menu[r.id];
        return {
          label: r.name,
          subLabel: `${ms.soldTotal} adet`,
          value: Math.max(1, ms.soldTotal * ms.price),
          color: colors[idx % colors.length]
        };
      });

    container.innerHTML = `
      <div class="panel-scroll">
        <!-- ÜST PİLL ALT SEKMELER VE HIZLI AKSİYONLAR (Manuel Olay Butonu Kaldırıldı, Olaylar Organik Gelişir) -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
          <div class="sub-tabs" style="margin-bottom:0;">
            <button class="sub-tab-btn ${ui.shopSubTab === 'operasyon' ? 'active' : ''}" data-shop-sub="operasyon">📊 Canlı Operasyon & Grafikler</button>
            <button class="sub-tab-btn ${ui.shopSubTab === 'dekorasyon' ? 'active' : ''}" data-shop-sub="dekorasyon">🪑 Salon Ekipmanları (${st.shop.placedItems.length})</button>
            <button class="sub-tab-btn ${ui.shopSubTab === 'genisletme' ? 'active' : ''}" data-shop-sub="genisletme">🏗️ Salon Büyütme & Mimari</button>
          </div>

          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span class="badge ${trafficPct >= 100 ? 'badge-success' : 'badge-warning'}" title="Gün içi rastgele gelişen olaylar ve hijyen müşteri akışını etkiler">
              🚶 Sokak Akışı: ${st.shop.trafficReason || `Normal (%${trafficPct})`}
            </span>
            <span class="badge ${menuFit >= 75 ? 'badge-success' : 'badge-info'}">
              🎯 Sosyal Çevre Menü Uyumu: %${menuFit}
            </span>
            ${
              specialDay
                ? `<span class="badge badge-warning">🎉 ${specialDay.name}</span>`
                : ''
            }
            <button class="btn btn-primary btn-sm" id="btn-restock-doner">🔥 Şişe Taze Döner Tak</button>
            <button class="btn btn-sm" id="btn-clean-shop">🧼 Salon Temizliği (+22 Hijyen)</button>
            <button class="btn btn-danger btn-sm" id="btn-finish-day-early">🌙 Günü Kapat (Z Raporu)</button>
          </div>
        </div>

        <!-- ÜST KPI KARTLARI -->
        <div class="kpi-strip">
          <div class="kpi-box">
            <span class="kpi-label">BUGÜNKÜ CANLI CİRO</span>
            <span class="kpi-value" style="color:var(--emerald);" id="live-today-rev">${Math.round(st.finance.todayStats.revenue).toLocaleString('tr-TR')} ₺</span>
            <span class="kpi-sub">+${st.finance.todayStats.tipsEarned} ₺ Bahşiş • ${st.finance.todayStats.onlineOrdersServed} Online Paket</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">BRÜT SATIŞ KÂRI</span>
            <span class="kpi-value" style="color:var(--accent-secondary);" id="live-today-profit">${Math.round(st.finance.todayStats.revenue - st.finance.todayStats.ingredientCost).toLocaleString('tr-TR')} ₺</span>
            <span class="kpi-sub">Malzeme Gideri: ${Math.round(st.finance.todayStats.ingredientCost).toLocaleString('tr-TR')} ₺</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">MÜŞTERİ TRAFİĞİ</span>
            <span class="kpi-value" id="live-today-cust">${st.finance.todayStats.customersServed} Servis (${st.finance.todayStats.customersLost} Kaçan)</span>
            <span class="kpi-sub">Kapasite: ${st.shop.seatingCapacity} Koltuk • Yoğunluk Çarpanı: %${trafficPct}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">OCAKTAKİ DÖNER ŞİŞİ</span>
            <span class="kpi-value" style="color:var(--sky);" id="live-doner-kg">${st.shop.donerRollKg.toFixed(1)} / ${st.shop.donerMaxKg} kg</span>
            <span class="kpi-sub">
              <label style="cursor:pointer;display:inline-flex;align-items:center;gap:5px;">
                <input type="checkbox" id="chk-auto-doner" ${st.shop.autoRestockDoner ? 'checked' : ''} /> Otomatik Şiş Tak
              </label>
            </span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">SALON DEKOR & HİJYEN</span>
            <span class="kpi-value">${st.shop.decorScore} Dekor • %${Math.round(st.shop.hygiene)} Hijyen</span>
            <span class="kpi-sub">${st.shop.hygiene < 70 ? '⚠️ Hijyen Düşük! Denetim/Şikayet Riski' : '✓ Hijyen Güvenli Seviyede'}</span>
          </div>
        </div>

        ${
          ui.shopSubTab === 'operasyon'
            ? `
          <div class="dashboard-2col">
            <div class="game-card">
              <div class="card-head">
                <div>
                  <span class="card-kicker">CANLI MÜŞTERİ DAĞILIMI</span>
                  <div class="card-title">Müşteri Profili & Segment Payları</div>
                </div>
                <span class="badge badge-info">Toplam Kapasite: ${st.shop.seatingCapacity} Kişi</span>
              </div>
              ${ChartRenderer.renderSegmentedBar([
                { label: 'Öğrenci', value: ct.ogrenci || 8, color: '#f5c76b' },
                { label: 'Sanayi / İşçi', value: ct.isci || 6, color: '#38d39f' },
                { label: 'Aile', value: ct.aile || 5, color: '#63b3ed' },
                { label: 'Komşu Esnaf', value: ct.esnaf || 4, color: '#b794f4' },
                { label: 'Turist', value: ct.turist || 2, color: '#f68773' }
              ])}
            </div>

            <div class="game-card">
              <div class="card-head">
                <div>
                  <span class="card-kicker">AKTİF MENÜ CİRO PAYLARI</span>
                  <div class="card-title">En Çok Kazandıran Döner & Menü Ürünleri</div>
                </div>
                <span class="badge badge-warning">Enflasyon x${st.finance.inflationIndex.toFixed(2)}</span>
              </div>
              ${ChartRenderer.renderSegmentedBar(topRecipes)}
            </div>
          </div>

          <div class="dashboard-2col">
            <div class="game-card">
              <div class="card-head">
                <div>
                  <span class="card-kicker">GÜN İÇİ CANLI TELEMETRİ</span>
                  <div class="card-title">📈 Saatlik Kümülatif Ciro & Maliyet Akış Grafiği</div>
                </div>
                <span class="badge badge-success">Canlı Güncellenir</span>
              </div>
              <div id="live-intraday-chart-box">
                ${ChartRenderer.renderIntradayAreaChart(st.finance.hourlyStats)}
              </div>
            </div>

            <div class="game-card">
              <div class="card-head">
                <div>
                  <span class="card-kicker">FİNANSAL PERFORMANS TRENDİ</span>
                  <div class="card-title">📊 Günlük Ciro, Toplam Gider ve Net Kâr Grafiği</div>
                </div>
                <span class="badge badge-neutral">Son ${st.finance.ledgerHistory.length} Gün</span>
              </div>
              ${ChartRenderer.renderProfitLineChart(st.finance.ledgerHistory)}
            </div>
          </div>

          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">AKTİF SALON DONANIMI • ${st.shop.placedItems.length} BİRİM</span>
                <div class="card-title">Kurulu Ocaklar, Tezgahlar ve Oturma Grupları</div>
              </div>
              <button class="btn btn-primary btn-sm" data-goto-shop-sub="dekorasyon">➕ Yeni Ekipman Ekle</button>
            </div>

            <div class="exec-row-list">
              ${st.shop.placedItems
                .map((placed, idx) => {
                  const def = FURNITURE_CATALOG.find((f) => f.id === placed.itemId);
                  if (!def) return '';
                  const accentColors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4'];
                  const col = accentColors[idx % accentColors.length];
                  const valNow = Math.round(def.basePrice * st.finance.inflationIndex);
                  const upkeepNow = Math.round(def.dailyUpkeep * st.finance.inflationIndex);
                  const mainEffect = def.effects.seating
                    ? `+${def.effects.seating} Koltuk`
                    : def.effects.donerMaxKgBonus
                    ? `+${def.effects.donerMaxKgBonus}kg Ocak`
                    : def.effects.speedBonus
                    ? `+%${def.effects.speedBonus} Hız`
                    : `+${def.effects.decorBonus || 5} Dekor`;

                  return `
                    <div class="exec-row">
                      <div class="exec-row-entity">
                        <span class="exec-accent-bar" style="background:${col};"></span>
                        <div>
                          <div class="exec-entity-title">${def.icon} ${def.name}</div>
                          <div class="exec-entity-sub">${def.description}</div>
                        </div>
                      </div>
                      <div class="exec-big-pct" style="color:${col};">${mainEffect}</div>
                      <div class="exec-metric-col">
                        <span class="exec-metric-label">DEĞER</span>
                        <span class="exec-metric-val">${valNow.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div class="exec-metric-col">
                        <span class="exec-metric-label">GÜNLÜK BAKIM</span>
                        <span class="exec-metric-val" style="color:var(--accent-secondary);">${upkeepNow} ₺</span>
                      </div>
                      <div class="exec-metric-col">
                        <span class="exec-metric-label">DEKOR KATKISI</span>
                        <span class="exec-metric-val" style="color:var(--emerald);">+${def.effects.decorBonus || 0} Puan</span>
                      </div>
                      <div>
                        <div class="exec-dual-bar">
                          <div style="width:22%;background:#f5c76b;"></div>
                          <div style="width:78%;background:#38d39f;"></div>
                        </div>
                      </div>
                      <button class="btn btn-sm" data-sell-item="${placed.instanceId}" title="İkinci El Sat (%50 İade)">Sat</button>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          ui.shopSubTab === 'dekorasyon'
            ? `
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">DONANIM & DEKORASYON MAĞAZASI</span>
                <div class="card-title">Dükkan Kapasitesini, Hızını ve Müşteri Çekimini Artıran Ekipmanlar</div>
              </div>
              <span class="badge badge-info">Kurulu Ekipman: ${st.shop.placedItems.length} Adet</span>
            </div>

            <div class="exec-row-list">
              ${FURNITURE_CATALOG.map((item, idx) => {
                const price = Math.round(item.basePrice * st.finance.inflationIndex);
                const upkeep = Math.round(item.dailyUpkeep * st.finance.inflationIndex);
                const installedCount = st.shop.placedItems.filter((p) => p.itemId === item.id).length;
                const accentColors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4'];
                const col = accentColors[idx % accentColors.length];

                return `
                  <div class="exec-row">
                    <div class="exec-row-entity">
                      <span class="exec-accent-bar" style="background:${col};"></span>
                      <div>
                        <div class="exec-entity-title">${item.icon} ${item.name} ${installedCount > 0 ? `<span class="badge badge-success">${installedCount} Kurulu</span>` : ''}</div>
                        <div class="exec-entity-sub">${item.description}</div>
                      </div>
                    </div>
                    <div class="exec-big-pct" style="color:${col};">
                      ${item.effects.seating ? `+${item.effects.seating} Koltuk` : item.effects.speedBonus ? `+%${item.effects.speedBonus} Hız` : `+${item.effects.decorBonus || 5} Dekor`}
                    </div>
                    <div class="exec-metric-col">
                      <span class="exec-metric-label">KURULUM FİYATI</span>
                      <span class="exec-metric-val">${price.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    <div class="exec-metric-col">
                      <span class="exec-metric-label">GÜNLÜK BAKIM</span>
                      <span class="exec-metric-val" style="color:var(--accent-secondary);">${upkeep} ₺/gün</span>
                    </div>
                    <div class="exec-metric-col">
                      <span class="exec-metric-label">EK BONUS</span>
                      <span class="exec-metric-val" style="color:var(--emerald);">+${item.effects.decorBonus || 0} Dekor / +${item.effects.hygieneBonus || 0} Hijyen</span>
                    </div>
                    <div>
                      <div class="exec-dual-bar">
                        <div style="width:35%;background:${col};"></div>
                        <div style="width:65%;background:#38d39f;"></div>
                      </div>
                    </div>
                    <button class="btn btn-primary btn-sm" data-buy-furniture="${item.id}">
                      ➕ Satın Al & Kur
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          ui.shopSubTab === 'genisletme'
            ? `
          <div class="game-card" style="margin-bottom:16px;">
            <div class="card-head">
              <div>
                <span class="card-kicker">MİMARİ BÜYÜME & RUHSATLAR</span>
                <div class="card-title">Küçük Salondan Mega İki Katlı Döner Restoranına Geçiş</div>
              </div>
            </div>
            <div class="exec-row-list">
              <div class="exec-row">
                <div class="exec-row-entity">
                  <span class="exec-accent-bar" style="background:#f5c76b;"></span>
                  <div>
                    <div class="exec-entity-title">🏪 ${SHOP_UPGRADES.expandLevel2.name}</div>
                    <div class="exec-entity-sub">${SHOP_UPGRADES.expandLevel2.description}</div>
                  </div>
                </div>
                <div class="exec-big-pct" style="color:#f5c76b;">Seviye 2</div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">MALİYET</span>
                  <span class="exec-metric-val">${Math.round(SHOP_UPGRADES.expandLevel2.basePrice * st.finance.inflationIndex).toLocaleString('tr-TR')} ₺</span>
                </div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">KAPASİTE</span>
                  <span class="exec-metric-val" style="color:var(--emerald);">Orta Salon</span>
                </div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">DURUM</span>
                  <span class="exec-metric-val">${st.shop.level >= 2 ? 'Aktif' : 'Kilitli'}</span>
                </div>
                <div><div class="exec-dual-bar"><div style="width:${st.shop.level >= 2 ? 100 : 30}%;background:#38d39f;"></div></div></div>
                ${
                  st.shop.level >= 2
                    ? `<span class="badge badge-success">✓ Tamamlandı</span>`
                    : `<button class="btn btn-primary btn-sm" id="btn-upg-level2">Genişlet</button>`
                }
              </div>

              <div class="exec-row">
                <div class="exec-row-entity">
                  <span class="exec-accent-bar" style="background:#38d39f;"></span>
                  <div>
                    <div class="exec-entity-title">⛱️ ${SHOP_UPGRADES.sidewalkPermit.name}</div>
                    <div class="exec-entity-sub">${SHOP_UPGRADES.sidewalkPermit.description}</div>
                  </div>
                </div>
                <div class="exec-big-pct" style="color:#38d39f;">+6 Koltuk</div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">RUHSAT BEDELİ</span>
                  <span class="exec-metric-val">${Math.round(SHOP_UPGRADES.sidewalkPermit.basePrice * st.finance.inflationIndex).toLocaleString('tr-TR')} ₺</span>
                </div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">DEKOR KATKISI</span>
                  <span class="exec-metric-val" style="color:var(--emerald);">+8 Puan</span>
                </div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">DURUM</span>
                  <span class="exec-metric-val">${st.shop.hasSidewalkPermit ? 'İzinli' : 'Yok'}</span>
                </div>
                <div><div class="exec-dual-bar"><div style="width:${st.shop.hasSidewalkPermit ? 100 : 25}%;background:#38d39f;"></div></div></div>
                ${
                  st.shop.hasSidewalkPermit
                    ? `<span class="badge badge-success">✓ İzin Alındı</span>`
                    : `<button class="btn btn-primary btn-sm" id="btn-upg-sidewalk">Ruhsat Al</button>`
                }
              </div>

              <div class="exec-row">
                <div class="exec-row-entity">
                  <span class="exec-accent-bar" style="background:#63b3ed;"></span>
                  <div>
                    <div class="exec-entity-title">👑 ${SHOP_UPGRADES.secondFloor.name}</div>
                    <div class="exec-entity-sub">${SHOP_UPGRADES.secondFloor.description}</div>
                  </div>
                </div>
                <div class="exec-big-pct" style="color:#63b3ed;">+8 Koltuk</div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">YATIRIM BEDELİ</span>
                  <span class="exec-metric-val">${Math.round(SHOP_UPGRADES.secondFloor.basePrice * st.finance.inflationIndex).toLocaleString('tr-TR')} ₺</span>
                </div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">PRESTİJ</span>
                  <span class="exec-metric-val" style="color:var(--emerald);">+16 Dekor</span>
                </div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">DURUM</span>
                  <span class="exec-metric-val">${st.shop.hasSecondFloor ? '2. Kat Açık' : 'Kapalı'}</span>
                </div>
                <div><div class="exec-dual-bar"><div style="width:${st.shop.hasSecondFloor ? 100 : 20}%;background:#63b3ed;"></div></div></div>
                ${
                  st.shop.hasSecondFloor
                    ? `<span class="badge badge-success">✓ 2. Kat Açık</span>`
                    : `<button class="btn btn-primary btn-sm" id="btn-upg-floor2">2. Katı Aç</button>`
                }
              </div>
            </div>
          </div>

          <div class="game-card">
            <div class="card-title">🎨 İç Mimari Duvar & Zemin Konsepti</div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              ${WALL_STYLES.map(
                (w) => `
                <button class="btn btn-sm ${st.shop.wallColor === w.id ? 'btn-primary' : ''}" data-wall-style="${w.id}">
                  Duvar: ${w.name} (+${w.decorBonus} Dekor • ${Math.round(w.price * st.finance.inflationIndex).toLocaleString('tr-TR')} ₺)
                </button>
              `
              ).join('')}
              ${FLOOR_STYLES.map(
                (f) => `
                <button class="btn btn-sm ${st.shop.floorStyle === f.id ? 'btn-primary' : ''}" data-floor-style="${f.id}">
                  Zemin: ${f.name} (+${f.decorBonus} Dekor • ${Math.round(f.price * st.finance.inflationIndex).toLocaleString('tr-TR')} ₺)
                </button>
              `
              ).join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;

    container.querySelectorAll('[data-shop-sub]').forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.shopSubTab = (btn).getAttribute('data-shop-sub');
        ui.renderActiveTab(true);
      });
    });

    container.querySelector('[data-goto-shop-sub]')?.addEventListener('click', () => {
      ui.shopSubTab = 'dekorasyon';
      ui.renderActiveTab(true);
    });

    container.querySelector('#btn-restock-doner')?.addEventListener('click', () => ui.engine.restockDonerSkewer(false));
    container.querySelector('#btn-clean-shop')?.addEventListener('click', () => ui.engine.cleanShopAction());
    container.querySelector('#chk-auto-doner')?.addEventListener('change', (e) => {
      st.shop.autoRestockDoner = (e.target).checked;
      SaveManager.saveAuto(st);
    });
    container.querySelector('#btn-finish-day-early')?.addEventListener('click', () => ui.engine.finishDay());

    container.querySelectorAll('[data-buy-furniture]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const itemId = (btn).getAttribute('data-buy-furniture');
        if (!itemId) return;
        const res = ui.engine.buyAndPlaceFurniture(itemId, 0, 0);
        ui.showToast(res.ok ? 'Ekipman Kuruldu' : 'İşlem Başarısız', res.msg, res.ok ? 'success' : 'warning');
      });
    });

    container.querySelectorAll('[data-sell-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const instId = (btn).getAttribute('data-sell-item');
        if (instId) ui.engine.sellPlacedFurniture(instId);
      });
    });

    const realEstateMult = st.npcs['emlakci_murat']?.hasActiveDeal ? 0.85 : 1.0;

    container.querySelector('#btn-upg-level2')?.addEventListener('click', () => {
      const cost = Math.round(SHOP_UPGRADES.expandLevel2.basePrice * st.finance.inflationIndex * realEstateMult);
      if (st.finance.cash < cost) {
        ui.showToast('Yetersiz Bakiye', `${cost.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= cost;
      st.shop.level = 2;
      ui.engine.recalculateShopStats();
      ui.showToast('Orta Salon Açıldı! 🎉', 'Dükkanınız Seviye 2 geniş salona büyüdü.', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelector('#btn-upg-sidewalk')?.addEventListener('click', () => {
      const cost = Math.round(SHOP_UPGRADES.sidewalkPermit.basePrice * st.finance.inflationIndex);
      if (st.finance.cash < cost) {
        ui.showToast('Yetersiz Bakiye', `${cost.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= cost;
      st.shop.hasSidewalkPermit = true;
      ui.engine.recalculateShopStats();
      ui.showToast('Kaldırım Masa İzni Alındı! ⛱️', '+6 Açık hava koltuk kapasitesi eklendi.', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelector('#btn-upg-floor2')?.addEventListener('click', () => {
      const cost = Math.round(SHOP_UPGRADES.secondFloor.basePrice * st.finance.inflationIndex * realEstateMult);
      if (st.finance.cash < cost) {
        ui.showToast('Yetersiz Bakiye', `${cost.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= cost;
      st.shop.level = 3;
      st.shop.hasSecondFloor = true;
      ui.engine.recalculateShopStats();
      ui.engine.checkAchievements();
      ui.showToast('2. Kat Mega Aile Salonu Açıldı! 👑', 'Dükkanınız iki katlı meşhur bir restorana dönüştü!', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelectorAll('[data-wall-style]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-wall-style');
        const ws = WALL_STYLES.find((w) => w.id === id);
        if (!ws) return;
        const cost = Math.round(ws.price * st.finance.inflationIndex);
        if (st.shop.wallColor !== ws.id && st.finance.cash < cost) {
          ui.showToast('Yetersiz Bakiye', `${cost.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
          return;
        }
        if (st.shop.wallColor !== ws.id) st.finance.cash -= cost;
        st.shop.wallColor = ws.id;
        ui.engine.recalculateShopStats();
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-floor-style]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-floor-style');
        const fs = FLOOR_STYLES.find((f) => f.id === id);
        if (!fs) return;
        const cost = Math.round(fs.price * st.finance.inflationIndex);
        if (st.shop.floorStyle !== fs.id && st.finance.cash < cost) {
          ui.showToast('Yetersiz Bakiye', `${cost.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
          return;
        }
        if (st.shop.floorStyle !== fs.id) st.finance.cash -= cost;
        st.shop.floorStyle = fs.id;
        ui.engine.recalculateShopStats();
        bus.emit('state:updated', st);
      });
    });
  }
}
