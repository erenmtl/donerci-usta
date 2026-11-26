// ============================================================================
// MODÜLER SEKME BİLEŞENİ: MapTab.ts
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

export class MapTab {
  public static render(ui: any, container: HTMLElement): void {
    const st: GameState = ui.engine.state;
    ReputationSystem.syncReputations(st);

    if (!st.mapView) {
      st.mapView = {
        level: 'city',
        selectedProvinceId: st.branches[0]?.provinceId || 'istanbul',
        selectedDistrictId: st.branches[0]?.districtId || 'ist_besiktas'
      };
    }

    const activeBranch = st.branches.find((b) => b.id === st.activeBranchId) || st.branches[0];
    const selectedProv =
      TURKEY_PROVINCES.find((p) => p.id === st.mapView.selectedProvinceId) || TURKEY_PROVINCES[0];
    const districts = getDistrictsForProvince(selectedProv.id);
    const selectedDist =
      districts.find((d) => d.id === st.mapView.selectedDistrictId) || districts[0];
    st.mapView.selectedDistrictId = selectedDist.id;

    const evalInfo = BranchSystem.evaluateDistrictOpening(st, selectedProv.id, selectedDist);
    const existingBranchInDist = st.branches.find((b) => b.districtId === selectedDist.id);

    const localRep = Math.round(activeBranch.neighborhoodReputation);
    const cityRep = Math.round(st.reputation.cityReputations[selectedProv.id] || localRep);
    const countryRep = Math.round(st.reputation.countryReputation);

    const hoodProfile =
      NEIGHBORHOOD_TYPES.find((n) => n.id === selectedDist.neighborhoodType) || NEIGHBORHOOD_TYPES[0];

    // Toplu zincir özeti
    const totalChainRev = st.branches.reduce((s, b) => s + (b.todayRevenue || 0), 0);
    const totalChainIng = st.branches.reduce((s, b) => s + (b.todayIngredientCost || 0), 0);
    const totalChainLog = st.branches.reduce((s, b) => s + (b.todayLogisticsCost || 0), 0);
    const totalChainRent = st.branches.reduce((s, b) => s + (b.todayRentAndTax || 0) + Math.round(b.dailyRentBase * st.finance.inflationIndex), 0);

    container.innerHTML = `
      <div class="panel-scroll">
        ${
          st.finance.cash < 0
            ? `
          <div class="game-card" style="margin-bottom:16px;border-color:var(--danger-light);background:rgba(214,69,69,0.16);">
            <div class="card-head">
              <div>
                <span class="card-kicker" style="color:var(--danger-light);">🚨 İFLAS RİSKİ UYARISI</span>
                <div class="card-title">Kasadaki Nakit Negatife Düştü (${Math.round(st.finance.cash).toLocaleString('tr-TR')} ₺)!</div>
                <div class="card-subtitle">Aşağıdaki şube tablosundan zarardaki şubelerinizi kapatıp demirbaş bedelini (%42) nakde çevirebilir veya Yatırım & Banka sekmesinden kredi/dayanışma paketi kullanabilirsiniz.</div>
              </div>
            </div>
          </div>
        `
            : ''
        }

        <!-- ÜST BREADCRUMB & 3 SEVİYELİ HARİTA GEÇİŞ BARI -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
          <div class="sub-tabs" style="margin-bottom:0;">
            <button class="sub-tab-btn ${st.mapView.level === 'turkey' ? 'active' : ''}" data-map-level="turkey">
              🇹🇷 Türkiye Haritası (81 İl)
            </button>
            <button class="sub-tab-btn ${st.mapView.level === 'city' ? 'active' : ''}" data-map-level="city">
              🏙️ ${selectedProv.name} Şehir Haritası (${districts.length} İlçe)
            </button>
            <button class="sub-tab-btn" id="btn-goto-active-branch-shop">
              🏘️ Aktif Şube Yönetimi: ${activeBranch.districtName}
            </button>
          </div>

          <!-- Breadcrumb Navigasyon -->
          <div style="display:flex;align-items:center;gap:6px;font-size:0.82rem;font-weight:800;background:var(--bg-card);padding:6px 14px;border-radius:999px;border:1px solid var(--border-color);">
            <span style="cursor:pointer;color:var(--accent-secondary);" data-map-level="turkey">🇹🇷 Türkiye</span>
            <span style="color:var(--text-muted);">›</span>
            <span style="cursor:pointer;color:var(--emerald);" data-map-level="city">🏙️ ${selectedProv.name} (${selectedProv.plate})</span>
            <span style="color:var(--text-muted);">›</span>
            <span style="color:var(--text-primary);">📍 ${selectedDist.name}</span>
          </div>
        </div>

        <!-- 3 KATMANLI İTİBAR HİYERARŞİSİ (MAHALLE -> ŞEHİR -> ÜLKE MARKA) -->
        <div class="kpi-strip">
          <div class="kpi-box" style="${st.mapView.level === 'branch' ? 'border-color:var(--accent-secondary);' : ''}">
            <span class="kpi-label">1. KATMAN • MAHALLE İTİBARI (${activeBranch.districtName.toUpperCase()})</span>
            <span class="kpi-value" style="color:var(--emerald);">${localRep} / 100</span>
            <span class="kpi-sub">Hijyen, servis hızı ve fiyat uyumundan doğrudan etkilenir</span>
          </div>
          <div class="kpi-box" style="${st.mapView.level === 'city' ? 'border-color:var(--accent-secondary);' : ''}">
            <span class="kpi-label">2. KATMAN • ${selectedProv.name.toUpperCase()} ŞEHİR İTİBARI</span>
            <span class="kpi-value" style="color:var(--accent-secondary);">${cityRep} / 100</span>
            <span class="kpi-sub">${selectedProv.name} ilindeki tüm şubelerinizin ağırlıklı ortalaması</span>
          </div>
          <div class="kpi-box" style="${st.mapView.level === 'turkey' ? 'border-color:var(--accent-secondary);' : ''}">
            <span class="kpi-label">3. KATMAN • TÜRKİYE (ÜLKE MARKA) İTİBARI</span>
            <span class="kpi-value" style="color:var(--sky);">${countryRep} / 100</span>
            <span class="kpi-sub">Tüm şehirlerin ortalaması + ulusal yayılım (${st.branches.length} Şube)</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">ŞUBE AÇMA YETKİSİ & KONTENJAN</span>
            <span class="kpi-value">${st.branches.length} / ${st.quests.maxAllowedBranches === 99 ? 'Sınırsız' : st.quests.maxAllowedBranches} Şube</span>
            <span class="kpi-sub">Aktif Görev Kademesi: Kademe ${st.quests.currentTier}/5</span>
          </div>
        </div>

        <!-- SOL: İNTERAKTİF HARİTA (TÜRKİYE 81 İL VEYA ŞEHİR İLÇELERİ) | SAĞ: LOKASYON SEÇİM & ŞUBE AÇMA EKRANI -->
        <div class="dashboard-2col">
          <!-- SOL HARİTA KARTI -->
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">
                  ${st.mapView.level === 'turkey' ? '81 İL TÜRKİYE GENİŞLEME HARİTASI' : `${selectedProv.plate} • ${selectedProv.name.toUpperCase()} İLÇE BAZLI ŞEHİR HARİTASI`}
                </span>
                <div class="card-title">
                  ${
                    st.mapView.level === 'turkey'
                      ? '🗺️ Türkiye 81 İl Haritası (İle tıklayarak şehir haritasına veya şube açılışına geçin)'
                      : `🏙️ ${selectedProv.name} İlçeleri (İlçeye tıklayarak maliyetleri görün ve şube açın)`
                  }
                </div>
              </div>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <select id="map-heatmap-mode" class="form-select" style="padding:5px 10px;font-size:0.78rem;">
                  <option value="standard" ${(st.mapView.heatmapMode || 'standard') === 'standard' ? 'selected' : ''}>🗺️ Katman: Standart (★ Şube / ◆ Bayi)</option>
                  <option value="profit" ${st.mapView.heatmapMode === 'profit' ? 'selected' : ''}>💰 Katman: Kâr / Zarar Isı Haritası</option>
                  <option value="reputation" ${st.mapView.heatmapMode === 'reputation' ? 'selected' : ''}>⭐ Katman: İtibar Isı Haritası</option>
                </select>
                <select id="map-province-select" class="form-select" style="padding:5px 10px;font-size:0.78rem;">
                  ${TURKEY_PROVINCES.map(
                    (p) =>
                      `<option value="${p.id}" ${p.id === selectedProv.id ? 'selected' : ''}>${p.plate} - ${p.name} (${st.branches.filter((b) => b.provinceId === p.id).length} Şube)</option>`
                  ).join('')}
                </select>
              </div>
            </div>

            <!-- SVG HARİTA ÇİZİMİ -->
            <div>
              ${
                st.mapView.level === 'turkey'
                  ? MapRenderer.renderTurkeyMapSVG(st)
                  : MapRenderer.renderCityDistrictMapSVG(st, selectedProv.id)
              }
            </div>

            <!-- Harita Renk Skalası Açıklaması -->
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:0.77rem;font-weight:700;color:var(--text-secondary);">
              <div style="display:flex;gap:14px;flex-wrap:wrap;">
                <span><strong style="color:#38d39f;">▉ ★ Yeşil:</strong> Öz Şubemiz Açık</span>
                <span><strong style="color:#f6ad55;">▉ ◆ Turuncu:</strong> Franchise Bayi</span>
                <span><strong style="color:#f5c76b;">▉ Altın Çerçeveli:</strong> Seçili Lokasyon</span>
                <span><strong style="color:#6c869e;">▉ Arduvaz:</strong> Şube Yok</span>
              </div>
              ${
                st.mapView.level === 'turkey'
                  ? `<button class="btn btn-primary btn-sm" id="btn-zoom-into-city">🔍 ${selectedProv.name} İlçe Haritasını Aç</button>`
                  : `<button class="btn btn-sm" data-map-level="turkey">⬅ Türkiye (81 İl) Haritasına Dön</button>`
              }
            </div>
          </div>

          <!-- SAĞ: LOKASYON SEÇİM, MALİYET & ŞUBE AÇMA KARTI -->
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">LOKASYON ANALİZİ & ŞUBE YATIRIM FİZİBİLİTESİ</span>
                <div class="card-title">📍 ${selectedProv.name} › ${selectedDist.name}</div>
                <div class="card-subtitle">${selectedDist.description}</div>
              </div>
              <span class="badge ${existingBranchInDist ? 'badge-success' : evalInfo.canOpen ? 'badge-info' : 'badge-warning'}">
                ${existingBranchInDist ? '🏪 Şubemiz Var' : evalInfo.canOpen ? '✓ Açılışa Uygun' : '🔒 Koşul Eksik'}
              </span>
            </div>

            <!-- İlçe Seçim Hapları -->
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${districts
                .map((d) => {
                  const hasBr = st.branches.some((b) => b.districtId === d.id);
                  return `
                    <button class="btn btn-sm ${d.id === selectedDist.id ? 'btn-primary' : ''}"
                            style="${hasBr && d.id !== selectedDist.id ? 'border-color:#38d39f;color:#38d39f;' : ''}"
                            data-pick-district="${d.id}">
                      ${hasBr ? '★ ' : ''}${d.name.split('/')[0].trim()}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <!-- Maliyet, Kira, Lojistik ve Potansiyel Tablosu -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:var(--bg-input);padding:12px;border-radius:10px;border:1px solid var(--border-color);font-size:0.81rem;">
              <div>
                <div style="color:var(--text-muted);font-size:0.7rem;font-weight:800;">AÇILIŞ & KURULUM MALİYETİ</div>
                <div style="font-weight:900;font-size:0.98rem;color:var(--accent-secondary);">${evalInfo.openingCost.toLocaleString('tr-TR')} ₺</div>
              </div>
              <div>
                <div style="color:var(--text-muted);font-size:0.7rem;font-weight:800;">GÜNLÜK KİRA YÜKÜMLÜLÜĞÜ</div>
                <div style="font-weight:900;font-size:0.98rem;">${evalInfo.dailyRent.toLocaleString('tr-TR')} ₺ / gün</div>
              </div>
              <div>
                <div style="color:var(--text-muted);font-size:0.7rem;font-weight:800;">TEDARİK & UZAK ŞEHİR LOJİSTİĞİ</div>
                <div style="font-weight:800;color:${evalInfo.logisticsMultiplier > 1.15 ? 'var(--danger-light)' : 'var(--emerald)'};">
                  x${evalInfo.logisticsMultiplier.toFixed(2)} (~${evalInfo.estDailyLogistics.toLocaleString('tr-TR')} ₺/gün)
                </div>
              </div>
              <div>
                <div style="color:var(--text-muted);font-size:0.7rem;font-weight:800;">HOLDİNG YÖNETİM & VERGİ YÜKÜ</div>
                <div style="font-weight:800;">+${evalInfo.estHoldingOverhead.toLocaleString('tr-TR')} ₺/gün + %6 Vergi</div>
              </div>
              <div>
                <div style="color:var(--text-muted);font-size:0.7rem;font-weight:800;">MÜŞTERİ POTANSİYELİ</div>
                <div style="font-weight:900;color:var(--emerald);">%${selectedDist.customerPotential} Yoğunluk</div>
              </div>
              <div>
                <div style="color:var(--text-muted);font-size:0.7rem;font-weight:800;">SOSYAL ÇEVRE PROFİLİ</div>
                <div style="font-weight:800;color:var(--sky);">${hoodProfile.name.split('(')[0].trim()}</div>
              </div>
            </div>

            <!-- Şube Açma İki Zorunlu Koşul Kontrol Kutusu -->
            <div style="background:var(--bg-row);padding:11px 13px;border-radius:10px;border:1px solid var(--border-color);font-size:0.79rem;display:flex;flex-direction:column;gap:5px;">
              <div style="font-weight:900;font-size:0.74rem;color:var(--text-muted);text-transform:uppercase;">Şube Açılışı Zorunlu Koşullar Kontrolü:</div>
              <div style="display:flex;justify-content:space-between;">
                <span>1a. Kademe ${selectedDist.requiredQuestTier} Görev Seti & Şube Hakkı:</span>
                <strong style="color:${evalInfo.isQuestTierCompleted && evalInfo.hasBranchSlot ? 'var(--emerald)' : 'var(--danger-light)'};">
                  ${evalInfo.isQuestTierCompleted && evalInfo.hasBranchSlot ? '✓ Tamamlandı' : `🔒 Görevler Sekmesini Tamamlayın`}
                </strong>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span>1b. Minimum Şehir (${selectedDist.minCityRep}) & Ülke (${selectedDist.minCountryRep}) İtibarı:</span>
                <strong style="color:${evalInfo.meetsCityRep && evalInfo.meetsCountryRep ? 'var(--emerald)' : 'var(--danger-light)'};">
                  ${evalInfo.meetsCityRep && evalInfo.meetsCountryRep ? `✓ Uygun (${evalInfo.cityRep}/${evalInfo.countryRep})` : `🔒 Yetersiz (${evalInfo.cityRep}/${evalInfo.countryRep})`}
                </strong>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span>2. Yeterli Nakit Sermaye (${evalInfo.openingCost.toLocaleString('tr-TR')} ₺):</span>
                <strong style="color:${evalInfo.hasEnoughCash ? 'var(--emerald)' : 'var(--danger-light)'};">
                  ${evalInfo.hasEnoughCash ? '✓ Bakiye Yeterli' : '⚠️ Nakit Yetersiz'}
                </strong>
              </div>
            </div>

            ${
              existingBranchInDist
                ? `
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;">
                ${
                  existingBranchInDist.isFranchise
                    ? `<button class="btn btn-outline" style="flex:1;" data-audit-branch="${existingBranchInDist.id}">🔍 Bayiyi Denetle (${existingBranchInDist.districtName})</button>`
                    : `<button class="btn btn-primary" style="flex:1;" data-switch-branch="${existingBranchInDist.id}">🎛️ Bu Şubeyi Yönet (${existingBranchInDist.districtName})</button>`
                }
                ${
                  !existingBranchInDist.isHeadquarters
                    ? `<button class="btn btn-danger btn-sm" data-close-branch="${existingBranchInDist.id}">🛑 ${existingBranchInDist.isFranchise ? 'Sözleşmeyi Feshet' : 'Şubeyi Kapat / Sat'}</button>`
                    : ''
                }
              </div>
            `
                : `
              <div style="display:flex;flex-direction:column;gap:8px;margin-top:auto;">
                <button class="btn btn-primary btn-block" id="btn-open-branch-here" ${!evalInfo.canOpen ? 'disabled' : ''}>
                  ${evalInfo.canOpen ? `★ ${selectedProv.name} / ${selectedDist.name} Öz Şube Aç (-${evalInfo.openingCost.toLocaleString('tr-TR')} ₺ • Başlangıç İtibar: ${evalInfo.estimatedInitialRep}★)` : `🔒 ${evalInfo.reasons[0] || 'Koşullar Eksik'}`}
                </button>
                <button class="btn btn-outline btn-block" id="btn-grant-franchise-here" ${!evalInfo.canGrantFranchise ? 'disabled' : ''} style="border-color:#f6ad55;color:#f6ad55;">
                  ${
                    evalInfo.canGrantFranchise
                      ? `◆ Bayilik (Franchise) Ver (+${evalInfo.franchiseUpfrontFee.toLocaleString('tr-TR')} ₺ Peşin İsim Hakkı + %${evalInfo.franchiseRoyaltyPct} Günlük Ciro Payı • Sıfır Kira/Maaş)`
                      : `🔒 Bayilik Vermek İçin: En Az 3 Şube, Kontenjan ve 58+ Ülke İtibarı Gerekir`
                  }
                </button>
              </div>
            `
            }
          </div>
        </div>

        <!-- TÜM ŞUBELER VE TOPLU ZİNCİR GELİR-GİDER TABLOSU -->
        <div class="game-card">
          <div class="card-head">
            <div>
              <span class="card-kicker">TÜRKİYE ZİNCİR OPERASYONU • ${st.branches.length} AKTİF ŞUBE</span>
              <div class="card-title">🏪 Şubeler Arası Geçiş, Şube Bazlı Gelir-Gider ve Toplu Zincir Özeti</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <span class="badge badge-success">Zincir Günlük Ciro: +${Math.round(totalChainRev).toLocaleString('tr-TR')} ₺</span>
              <span class="badge badge-warning">Kira+Vergi+Lojistik: -${Math.round(totalChainRent + totalChainLog).toLocaleString('tr-TR')} ₺/gün</span>
            </div>
          </div>

          <div class="exec-row-list">
            ${st.branches
              .map((b, idx) => {
                const isActive = b.id === st.activeBranchId;
                const colors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4'];
                const col = colors[idx % colors.length];
                const estDailyFixed = Math.round(b.dailyRentBase * st.finance.inflationIndex * b.logisticsMultiplier);
                const liveNet = b.todayRevenue - b.todayIngredientCost - estDailyFixed;

                return `
                  <div class="exec-row" style="${isActive ? 'border-color:var(--accent-secondary);background:var(--bg-row-hover);' : ''}">
                    <div class="exec-row-entity">
                      <span class="exec-accent-bar" style="background:${col};"></span>
                      <div>
                        <div class="exec-entity-title">
                          🏪 ${b.provinceName} • ${b.districtName}
                          ${b.isHeadquarters ? `<span class="badge badge-info">Merkez</span>` : ''}
                          ${isActive ? `<span class="badge badge-success">Aktif Yönetilen</span>` : ''}
                        </div>
                        <div class="exec-entity-sub">
                          Mahalle İtibarı: ${b.neighborhoodReputation}/100 • Hijyen: %${Math.round(b.hygiene)} • Personel: ${b.staffCount} Kişi • Lojistik: x${b.logisticsMultiplier.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div class="exec-big-pct" style="color:${col};">
                      ${b.todayCustomers} Müşteri
                    </div>

                    <div class="exec-metric-col">
                      <span class="exec-metric-label">BUGÜNKÜ CİRO</span>
                      <span class="exec-metric-val" style="color:var(--emerald);">+${Math.round(b.todayRevenue).toLocaleString('tr-TR')} ₺</span>
                    </div>

                    <div class="exec-metric-col">
                      <span class="exec-metric-label">MALZEME GİDERİ</span>
                      <span class="exec-metric-val" style="color:var(--danger-light);">-${Math.round(b.todayIngredientCost).toLocaleString('tr-TR')} ₺</span>
                    </div>

                    <div class="exec-metric-col">
                      <span class="exec-metric-label">KİRA & LOJİSTİK</span>
                      <span class="exec-metric-val" style="color:var(--accent-secondary);">-${estDailyFixed.toLocaleString('tr-TR')} ₺/gün</span>
                    </div>

                    <div class="exec-metric-col">
                      <span class="exec-metric-label">TAHMİNİ NET</span>
                      <span class="exec-metric-val" style="color:${liveNet >= 0 ? 'var(--emerald)' : 'var(--danger-light)'};">
                        ${liveNet >= 0 ? '+' : ''}${Math.round(liveNet).toLocaleString('tr-TR')} ₺
                      </span>
                    </div>

                    <div style="display:flex;gap:6px;">
                      <button class="btn ${isActive ? 'btn-success' : 'btn-primary'} btn-sm" data-switch-branch="${b.id}">
                        ${isActive ? '✓ Yönetiliyor' : '🎛️ Yönet'}
                      </button>
                      ${
                        !b.isHeadquarters
                          ? `<button class="btn btn-danger btn-sm" data-close-branch="${b.id}" title="Şubeyi Kapat / Devret (%42 İade)">🛑 Kapat</button>`
                          : ''
                      }
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;

    // Harita seviyesi geçişleri (Türkiye <-> Şehir)
    container.querySelectorAll('[data-map-level]').forEach((el) => {
      el.addEventListener('click', () => {
        const lvl = (el as HTMLElement).getAttribute('data-map-level') as any;
        if (lvl) {
          st.mapView.level = lvl;
          ui.updateTopBarLive();
          ui.renderActiveTab(true);
        }
      });
    });

    container.querySelector('#btn-zoom-into-city')?.addEventListener('click', () => {
      st.mapView.level = 'city';
      ui.updateTopBarLive();
      ui.renderActiveTab(true);
    });

    container.querySelector('#btn-ist-zoom-full')?.addEventListener('click', () => {
      MapRenderer.istanbulZoomCenter = false;
      ui.renderActiveTab(true);
    });

    container.querySelector('#btn-ist-zoom-center')?.addEventListener('click', () => {
      MapRenderer.istanbulZoomCenter = true;
      ui.renderActiveTab(true);
    });

    container.querySelector('#btn-goto-active-branch-shop')?.addEventListener('click', () => {
      ui.activeTab = 'dukkan';
      ui.updateNavHighlight();
      ui.renderActiveTab(false);
    });

    // Harita ısı katmanı seçimi
    container.querySelector('#map-heatmap-mode')?.addEventListener('change', (e) => {
      st.mapView.heatmapMode = (e.target as HTMLSelectElement).value as any;
      ui.renderActiveTab(true);
    });

    // İl seçimi (Select kutusu veya Türkiye SVG Haritası üzerindeki 81 il kutuları)
    container.querySelector('#map-province-select')?.addEventListener('change', (e) => {
      const provId = (e.target as HTMLSelectElement).value;
      st.mapView.selectedProvinceId = provId;
      const dists = getDistrictsForProvince(provId);
      st.mapView.selectedDistrictId = dists[0]?.id || '';
      ui.updateTopBarLive();
      ui.renderActiveTab(true);
    });

    container.querySelectorAll('[data-map-province]').forEach((el) => {
      el.addEventListener('click', () => {
        const provId = (el as HTMLElement).getAttribute('data-map-province');
        if (!provId) return;
        // Eğer zaten seçili olan ile tekrar tıklandıysa doğrudan o ilin Şehir/İlçe haritasına gir
        if (st.mapView.selectedProvinceId === provId) {
          st.mapView.level = 'city';
        } else {
          st.mapView.selectedProvinceId = provId;
          const dists = getDistrictsForProvince(provId);
          st.mapView.selectedDistrictId = dists[0]?.id || '';
        }
        ui.updateTopBarLive();
        ui.renderActiveTab(true);
      });
    });

    // İlçe seçimi (Şehir SVG Haritası üzerinden veya sağdaki ilçe butonlarından)
    container.querySelectorAll('[data-map-district], [data-pick-district]').forEach((el) => {
      el.addEventListener('click', () => {
        const distId =
          (el as HTMLElement).getAttribute('data-map-district') ||
          (el as HTMLElement).getAttribute('data-pick-district');
        if (distId) {
          st.mapView.selectedDistrictId = distId;
          ui.renderActiveTab(true);
        }
      });
    });

    // Yeni şube açma butonu
    container.querySelector('#btn-open-branch-here')?.addEventListener('click', () => {
      const res = BranchSystem.openNewBranch(st, selectedProv.id, selectedDist.id);
      if (!res.ok) {
        ui.showToast('Şube Açılamadı', res.msg, 'warning');
      } else {
        ManagementSystem.checkAndAdvanceManagementTier(st);
        QuestSystem.evaluateQuests(st, ui.engine.getNetWorth());
        ui.renderMainShell();
      }
    });

    // Faz 5: Bayilik (Franchise) verme butonu
    container.querySelector('#btn-grant-franchise-here')?.addEventListener('click', () => {
      const res = BranchSystem.grantFranchiseBranch(st, selectedProv.id, selectedDist.id);
      if (!res.ok) {
        ui.showToast('Bayilik Verilemedi', res.msg, 'warning');
      } else {
        ManagementSystem.checkAndAdvanceManagementTier(st);
        QuestSystem.evaluateQuests(st, ui.engine.getNetWorth());
        ui.renderMainShell();
      }
    });

    // Bayi veya şube teftişi
    container.querySelectorAll('[data-audit-branch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bId = (btn as HTMLElement).getAttribute('data-audit-branch');
        if (bId) {
          ManagementSystem.auditManagerOrBranch(st, bId);
          ui.renderActiveTab(true);
        }
      });
    });

    // Şube yönetimine geçiş
    container.querySelectorAll('[data-switch-branch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bId = (btn as HTMLElement).getAttribute('data-switch-branch');
        if (bId) {
          BranchSystem.switchActiveBranch(st, bId);
          ui.activeTab = 'dukkan';
          ui.renderMainShell();
        }
      });
    });

    // Şube kapatma / satma
    container.querySelectorAll('[data-close-branch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bId = (btn as HTMLElement).getAttribute('data-close-branch');
        if (bId) {
          BranchSystem.closeOrSellBranch(st, bId);
          ui.renderMainShell();
        }
      });
    });
  }
}
