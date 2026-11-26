// ============================================================================
// MODÜLER SEKME BİLEŞENİ: StreetTab.ts
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

export class StreetTab {
  public static render(ui: any, container: HTMLElement): void {
    const st: GameState = ui.engine.state;
    const selectedNpc = STREET_NPCS.find((n) => n.id === ui.selectedStreetNpcId) || STREET_NPCS[0];
    const selectedState = st.npcs[selectedNpc.id];
    const dlg = selectedNpc.dialogues[0];
    const shareCost10 = Math.round(selectedNpc.partnerBaseValuation * st.finance.inflationIndex * 0.10);
    const estDailyDiv10 = Math.round(selectedNpc.dailyDividendBase * st.finance.inflationIndex * 0.10);

    const streetColors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4', '#4fd1c5', '#fbd38d'];
    const streetSlices = STREET_NPCS.slice(0, 5).map((npc, i) => ({
      label: npc.shopName,
      subLabel: `İlişki ${st.npcs[npc.id]?.relation || 50}`,
      value: Math.max(10, (st.npcs[npc.id]?.relation || 50) + (st.npcs[npc.id]?.partnerShare || 0) * 2),
      color: streetColors[i % streetColors.length]
    }));

    const activeDealsCount = Object.values(st.npcs).filter((n) => n.hasActiveDeal).length;
    const activePartnersCount = Object.values(st.npcs).filter((n) => n.partnerShare > 0).length;

    container.innerHTML = `
      <div class="panel-scroll">
        <div class="game-card" style="margin-bottom:18px;">
          <div class="card-head">
            <div>
              <span class="card-kicker">MAHALLE ESNAF MECLİSİ • ${STREET_NPCS.length} KOMŞU DÜKKAN</span>
              <div class="card-title">Komşu Esnaflar, Tedarik Anlaşmaları ve Ortaklık Payları</div>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
              <span class="badge badge-success">🤝 Aktif Anlaşma: ${activeDealsCount}</span>
              <span class="badge badge-warning">👑 Ortak Olunan Dükkan: ${activePartnersCount}</span>
            </div>
          </div>

          ${ChartRenderer.renderSegmentedBar(streetSlices)}

          <div class="exec-row-list" style="margin-top:6px;">
            ${STREET_NPCS.map((npc, idx) => {
              const ns = st.npcs[npc.id];
              const col = streetColors[idx % streetColors.length];
              const valuation = Math.round(npc.partnerBaseValuation * st.finance.inflationIndex);
              const myDividend = Math.round(npc.dailyDividendBase * st.finance.inflationIndex * (ns.partnerShare / 100));
              const isSelected = npc.id === selectedNpc.id;

              return `
                <div class="exec-row" style="${isSelected ? 'border-color:var(--accent-secondary);background:var(--bg-row-hover);' : ''}">
                  <div class="exec-row-entity">
                    <span class="exec-accent-bar" style="background:${col};"></span>
                    <div>
                      <div class="exec-entity-title">
                        ${npc.icon} ${npc.name} • ${npc.shopName}
                        ${ns.hasActiveDeal ? `<span class="badge badge-success" style="margin-left:6px;">Anlaşmalı</span>` : ''}
                      </div>
                      <div class="exec-entity-sub">${npc.shopType} • ${npc.dealOffer.title}</div>
                    </div>
                  </div>

                  <div class="exec-big-pct" style="color:${col};" title="Esnaf Dostluk & Güven Oranı">
                    %${ns.relation}
                  </div>

                  <div class="exec-metric-col">
                    <span class="exec-metric-label">DÜKKAN DEĞERİ</span>
                    <span class="exec-metric-val">${valuation.toLocaleString('tr-TR')} ₺</span>
                  </div>

                  <div class="exec-metric-col">
                    <span class="exec-metric-label">ORTAKLIK PAYIN</span>
                    <span class="exec-metric-val" style="color:var(--accent-secondary);">%${ns.partnerShare} Hisse</span>
                  </div>

                  <div class="exec-metric-col">
                    <span class="exec-metric-label">GÜNLÜK KÂR PAYI</span>
                    <span class="exec-metric-val" style="color:var(--emerald);">+${myDividend.toLocaleString('tr-TR')} ₺/gün</span>
                  </div>

                  <div>
                    <div class="exec-dual-bar" title="İlişki: %${ns.relation} / Dükkan Sağlığı: %${ns.shopHealth}">
                      <div style="width:${Math.min(45, ns.partnerShare + 15)}%;background:#f5c76b;"></div>
                      <div style="width:${Math.max(20, ns.relation - 20)}%;background:#38d39f;"></div>
                    </div>
                  </div>

                  <div style="display:flex;gap:6px;">
                    <button class="btn ${isSelected ? 'btn-primary' : ''} btn-sm" data-pick-npc="${npc.id}">
                      💬 Yazılı Görüş
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="dashboard-2col">
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">YAZILI ESNAF GÖRÜŞMESİ & MÜZAKERE</span>
                <div class="card-title">${selectedNpc.icon} ${selectedNpc.name} (${selectedNpc.shopName})</div>
                <div class="card-subtitle">${selectedNpc.backstory}</div>
              </div>
              <span class="badge ${selectedState.relation >= 65 ? 'badge-success' : 'badge-warning'}">
                Dostluk & Güven: %${selectedState.relation}
              </span>
            </div>

            <div style="background:var(--bg-input);border-left:4px solid var(--accent-secondary);padding:13px 15px;border-radius:8px;font-size:0.9rem;line-height:1.5;">
              <div style="font-size:0.72rem;font-weight:900;color:var(--accent-secondary);text-transform:uppercase;margin-bottom:4px;">
                ${selectedNpc.name} Diyor Ki:
              </div>
              "${selectedState.lastDialogueReply || dlg.greeting}"
            </div>

            <div style="display:flex;flex-direction:column;gap:8px;">
              ${dlg.options
                .map(
                  (opt, idx) => `
                <button class="btn" style="justify-content:space-between;text-align:left;padding:10px 14px;border-radius:10px;" data-npc-opt="${idx}">
                  <span>✍️ "${opt.text}"</span>
                  <span class="badge badge-info">+${opt.relationDelta} Güven</span>
                </button>
              `
                )
                .join('')}
            </div>

            <div style="background:var(--bg-row);padding:12px 14px;border-radius:10px;border:1px solid var(--border-color);display:flex;flex-direction:column;gap:8px;margin-top:4px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:800;font-size:0.88rem;">🤝 Özel Ticari Anlaşma: ${selectedNpc.dealOffer.title}</span>
                ${
                  selectedState.hasActiveDeal
                    ? `<span class="badge badge-success">✓ Anlaşma Yürürlükte</span>`
                    : `<span class="badge badge-neutral">Şart: %${selectedNpc.dealOffer.minRelation} Güven</span>`
                }
              </div>
              <div style="font-size:0.8rem;color:var(--text-secondary);">${selectedNpc.dealOffer.description}</div>

              ${
                selectedNpc.canPartner
                  ? `
                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-color);padding-top:8px;margin-top:4px;flex-wrap:wrap;gap:8px;">
                  <div style="font-size:0.8rem;">
                    %10 Ortaklık Bedeli: <strong>${shareCost10.toLocaleString('tr-TR')} ₺</strong> (Günlük Kâr Payı: <strong style="color:var(--emerald);">+${estDailyDiv10.toLocaleString('tr-TR')} ₺</strong>)
                  </div>
                  <button class="btn btn-primary btn-sm" id="btn-buy-npc-share" ${selectedState.partnerShare >= 50 ? 'disabled' : ''}>
                    ${selectedState.partnerShare >= 50 ? 'Maksimum Ortaklık (%50)' : `👑 +%10 Hisse Al (${shareCost10.toLocaleString('tr-TR')} ₺)`}
                  </button>
                </div>
              `
                  : ''
              }
            </div>
          </div>

          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">MAHALLE HALKI & SOKAK GÜNLÜĞÜ</span>
                <div class="card-title">📜 Sokak Sakinleri ve Esnafla Yazılı Diyalog Akışı</div>
                <div class="card-subtitle">Mahalle halkıyla kurduğunuz yazılı etkileşimler itibarınızı ve müşteri sadakatini belirler</div>
              </div>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" id="btn-street-tea">
                ☕ Esnaf Kahvesine & Sokak Halkına Çay İkram Et (${Math.round(350 * st.finance.inflationIndex)} ₺ • +Tüm Esnaf Güven)
              </button>
              <button class="btn btn-sm" id="btn-street-askma">
                🥖 Mahalledeki Öğrencilere Askıda Dürüm Bırak (${Math.round(600 * st.finance.inflationIndex)} ₺ • +5 İtibar)
              </button>
            </div>

            <div data-inner-scroll="street-feed" style="display:flex;flex-direction:column;gap:8px;max-height:330px;overflow-y:auto;padding-right:4px;">
              ${(st.streetFeed || [])
                .map(
                  (item) => `
                <div style="background:var(--bg-row);border:1px solid var(--border-color);border-left:4px solid ${
                  item.tone === 'good' ? 'var(--emerald)' : item.tone === 'warn' ? 'var(--accent-secondary)' : 'var(--sky)'
                };padding:10px 13px;border-radius:8px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-weight:800;font-size:0.86rem;">
                      ${item.speaker} <span style="color:var(--text-muted);font-weight:700;">• ${item.role} (${item.timeLabel})</span>
                    </span>
                    <span class="badge ${item.tone === 'good' ? 'badge-success' : 'badge-info'}">${item.impactLabel}</span>
                  </div>
                  <div style="font-size:0.83rem;color:var(--text-secondary);line-height:1.4;">"${item.text}"</div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-pick-npc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).getAttribute('data-pick-npc');
        if (id) {
          ui.selectedStreetNpcId = id;
          ui.renderActiveTab(true);
        }
      });
    });

    container.querySelectorAll('[data-npc-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number((btn as HTMLElement).getAttribute('data-npc-opt'));
        const opt = dlg.options[idx];
        if (!opt) return;

        if (opt.cashCost) {
          const scaled = Math.round(opt.cashCost * st.finance.inflationIndex);
          if (st.finance.cash < scaled) {
            ui.showToast('Yetersiz Nakit', `${scaled} TL gerekli.`, 'warning');
            return;
          }
          st.finance.cash -= scaled;
        }
        if (opt.energyCost) {
          if (st.player.energy < opt.energyCost) {
            ui.showToast('Yorgunsun Usta!', 'Görüşme için yeterli enerjin kalmadı.', 'warning');
            return;
          }
          st.player.energy -= opt.energyCost;
        }

        selectedState.relation = Math.min(100, selectedState.relation + opt.relationDelta);
        selectedState.lastDialogueReply = opt.reply;

        st.streetFeed.unshift({
          id: 'sf_dlg_' + Date.now(),
          timeLabel: ui.formatClock(st.time.minuteOfDay),
          speaker: selectedNpc.name,
          role: selectedNpc.shopName,
          text: opt.reply,
          impactLabel: `+${opt.relationDelta} Güven`,
          tone: 'good'
        });

        if (opt.specialAction === 'activate_deal' || selectedState.relation >= selectedNpc.dealOffer.minRelation) {
          if (selectedState.relation >= selectedNpc.dealOffer.minRelation && !selectedState.hasActiveDeal) {
            selectedState.hasActiveDeal = true;
            if (selectedNpc.id === 'cayci_riza') st.shop.reputation = Math.min(100, st.shop.reputation + 8);
            ui.showToast('Esnaf Anlaşması İmzalandı! 🤝', `${selectedNpc.name}: ${selectedNpc.dealOffer.title} aktif oldu!`, 'success');
          }
        }

        ui.engine.checkAchievements();
        bus.emit('state:updated', st);
      });
    });

    container.querySelector('#btn-buy-npc-share')?.addEventListener('click', () => {
      if (selectedState.relation < 55) {
        ui.showToast('Güven Yetersiz', `${selectedNpc.name} ile ortak olmak için güven puanı en az %55 olmalı.`, 'warning');
        return;
      }
      if (st.finance.cash < shareCost10) {
        ui.showToast('Yetersiz Sermaye', `${shareCost10.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= shareCost10;
      selectedState.partnerShare = Math.min(50, selectedState.partnerShare + 10);
      selectedState.relation = Math.min(100, selectedState.relation + 8);
      st.streetFeed.unshift({
        id: 'sf_part_' + Date.now(),
        timeLabel: ui.formatClock(st.time.minuteOfDay),
        speaker: selectedNpc.name,
        role: selectedNpc.shopName,
        text: `Hayırlı uğurlu olsun ortağım! ${selectedNpc.shopName} kazancının %${selectedState.partnerShare} payı artık her akşam kasana akacak.`,
        impactLabel: `%${selectedState.partnerShare} Ortaklık`,
        tone: 'good'
      });
      ui.engine.checkAchievements();
      ui.showToast('Hayırlı Ortaklık! 👑', `${selectedNpc.shopName} ortaklık payınız %${selectedState.partnerShare} oldu!`, 'success');
      bus.emit('state:updated', st);
    });

    container.querySelector('#btn-street-tea')?.addEventListener('click', () => {
      const cost = Math.round(350 * st.finance.inflationIndex);
      if (st.finance.cash < cost) {
        ui.showToast('Yetersiz Bakiye', `${cost} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= cost;
      for (const npc of STREET_NPCS) {
        st.npcs[npc.id].relation = Math.min(100, st.npcs[npc.id].relation + 4);
      }
      st.streetFeed.unshift({
        id: 'sf_tea_' + Date.now(),
        timeLabel: ui.formatClock(st.time.minuteOfDay),
        speaker: 'Çaycı Rıza Amca',
        role: 'Çınaraltı Çay Ocağı',
        text: 'Dönerci Ustamızdan bütün sokağa sıcak çay ikramı var! Allah kesene Halil İbrahim bereketi versin komşum.',
        impactLabel: '+4 Tüm Esnaf Güven',
        tone: 'good'
      });
      ui.engine.checkAchievements();
      ui.showToast('Esnafa Çay Dağıtıldı ☕', 'Tüm komşu esnaflarla ilişkiniz +4 güçlendi!', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelector('#btn-street-askma')?.addEventListener('click', () => {
      const cost = Math.round(600 * st.finance.inflationIndex);
      if (st.finance.cash < cost) {
        ui.showToast('Yetersiz Bakiye', `${cost} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= cost;
      st.shop.reputation = Math.min(100, st.shop.reputation + 5);
      st.streetFeed.unshift({
        id: 'sf_ask_' + Date.now(),
        timeLabel: ui.formatClock(st.time.minuteOfDay),
        speaker: 'Mahalle Muhtarı & Öğrenciler',
        role: 'Sokak Halkı',
        text: 'Askıda döner panosunu gören bütün mahalleli duygulandı. Esnaflığın parmakla gösteriliyor!',
        impactLabel: '+5 İtibar',
        tone: 'good'
      });
      ui.showToast('Askıda Dürüm Hayrı 🥖', 'Mahalle halkı gönülden teşekkür etti (+5 İtibar).', 'success');
      bus.emit('state:updated', st);
    });
  }
}
