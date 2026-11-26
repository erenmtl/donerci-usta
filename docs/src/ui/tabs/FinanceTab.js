// ============================================================================
// MODÜLER SEKME BİLEŞENİ: FinanceTab.ts
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

export class FinanceTab {
  static render(ui, container) {
    const st = ui.engine.state;
    const netWorth = ui.engine.getNetWorth();

    const holdingsVal = st.finance.holdings.reduce((s, h) => s + h.units * h.currentUnitValue, 0);
    let partnerVal = 0;
    for (const npc of STREET_NPCS) {
      const ns = st.npcs[npc.id];
      if (ns && ns.partnerShare > 0) {
        partnerVal += Math.round(npc.partnerBaseValuation * st.finance.inflationIndex * (ns.partnerShare / 100));
      }
    }

    container.innerHTML = `
      <div class="panel-scroll">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
          <div class="sub-tabs" style="margin-bottom:0;">
            <button class="sub-tab-btn ${ui.financeSubTab === 'yatirim' ? 'active' : ''}" data-fin-sub="yatirim">🪙 Altın, Döviz, Araç & 2. Şube</button>
            <button class="sub-tab-btn ${ui.financeSubTab === 'ortaklik' ? 'active' : ''}" data-fin-sub="ortaklik">🤝 Komşu Dükkan Ortaklıkları</button>
            <button class="sub-tab-btn ${ui.financeSubTab === 'veresiye' ? 'active' : ''}" data-fin-sub="veresiye">📓 Veresiye Defteri (${st.finance.veresiyeList.length})</button>
            <button class="sub-tab-btn ${ui.financeSubTab === 'banka' ? 'active' : ''}" data-fin-sub="banka">🏦 Banka & Esnaf Kredisi</button>
          </div>
          <div style="display:flex;gap:10px;align-items:center;">
            <span class="badge badge-success" style="font-size:0.86rem;padding:6px 14px;">
              Net Servet: ${netWorth.toLocaleString('tr-TR')} ₺
            </span>
            ${
              st.finance.cash < 0
                ? `<button class="btn btn-danger btn-sm" id="btn-emergency-rescue">🆘 Esnaf Dayanışma Paketi (+25.000 ₺)</button>`
                : ''
            }
          </div>
        </div>

        <div class="dashboard-2col">
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">VARLIK PORTFÖYÜ</span>
                <div class="card-title">📊 Servet ve Yatırım Dağılım Grafiği</div>
              </div>
            </div>
            ${ChartRenderer.renderPortfolioDonut([
              { label: 'Kasadaki Nakit', value: Math.max(0, st.finance.cash), color: '#38d39f' },
              { label: 'Altın, Döviz, Araç & Şube', value: holdingsVal, color: '#f5c76b' },
              { label: 'Komşu Esnaf Ortaklıkları', value: partnerVal, color: '#63b3ed' }
            ])}
          </div>

          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">PORTFÖY AĞIRLIK ÇUBUĞU</span>
                <div class="card-title">📈 Varlık Sınıfları Paylaşımı</div>
              </div>
            </div>
            ${ChartRenderer.renderSegmentedBar([
              { label: 'Nakit', value: Math.max(1, st.finance.cash), color: '#38d39f' },
              { label: 'Yatırım & Şube', value: Math.max(0, holdingsVal), color: '#f5c76b' },
              { label: 'Esnaf Ortaklığı', value: Math.max(0, partnerVal), color: '#63b3ed' }
            ])}
            <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:6px;">
              Gram Altın Kuru: <strong>${st.finance.goldPrice.toLocaleString('tr-TR')} ₺</strong> •
              Dolar Kuru: <strong>${st.finance.usdPrice.toLocaleString('tr-TR')} ₺</strong> •
              Banka Kredi Borcu: <strong style="color:var(--danger-light);">${st.finance.bankDebt.toLocaleString('tr-TR')} ₺</strong>
            </div>
          </div>
        </div>

        ${
          ui.financeSubTab === 'yatirim'
            ? `
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">YATIRIM ARAÇLARI & YENİ ŞUBE</span>
                <div class="card-title">Enflasyona Karşı Koruma ve Pasif Gelir Yatırımları</div>
              </div>
            </div>
            <div class="exec-row-list">
              ${INVESTMENT_CATALOG.map((inv, idx) => {
                const holding = st.finance.holdings.find((h) => h.id === inv.id);
                const currentPrice = holding
                  ? holding.currentUnitValue
                  : Math.round(inv.baseUnitValue * st.finance.inflationIndex);
                const units = holding?.units || 0;
                const colors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4', '#4fd1c5'];
                const col = colors[idx % colors.length];

                return `
                  <div class="exec-row">
                    <div class="exec-row-entity">
                      <span class="exec-accent-bar" style="background:${col};"></span>
                      <div>
                        <div class="exec-entity-title">${inv.icon} ${inv.name}</div>
                        <div class="exec-entity-sub">${inv.description}</div>
                      </div>
                    </div>
                    <div class="exec-big-pct" style="color:${col};">${units} Adet</div>
                    <div class="exec-metric-col">
                      <span class="exec-metric-label">BİRİM FİYAT</span>
                      <span class="exec-metric-val">${currentPrice.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    <div class="exec-metric-col">
                      <span class="exec-metric-label">TOPLAM DEĞER</span>
                      <span class="exec-metric-val" style="color:var(--emerald);">${(units * currentPrice).toLocaleString('tr-TR')} ₺</span>
                    </div>
                    <div class="exec-metric-col">
                      <span class="exec-metric-label">GÜNLÜK GETİRİ</span>
                      <span class="exec-metric-val" style="color:var(--accent-secondary);">+%${(inv.dailyYieldRate * 100).toFixed(2)}</span>
                    </div>
                    <div>
                      <div class="exec-dual-bar">
                        <div style="width:${Math.min(100, units * 20)}%;background:${col};"></div>
                      </div>
                    </div>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-primary btn-sm" data-buy-inv="${inv.id}">➕ Al</button>
                      <button class="btn btn-sm" data-sell-inv="${inv.id}" ${units <= 0 ? 'disabled' : ''}>➖ Sat</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          ui.financeSubTab === 'ortaklik'
            ? `
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">ORTAKLAR • KOMŞU ESNAF HİSSELERİ</span>
                <div class="card-title">Komşu Dükkanlara Ortak Olun, Kazanç Paylara Göre Bölünsün</div>
              </div>
            </div>
            <div class="exec-row-list">
              ${STREET_NPCS.filter((n) => n.canPartner)
                .map((npc, idx) => {
                  const ns = st.npcs[npc.id];
                  const cost10 = Math.round(npc.partnerBaseValuation * st.finance.inflationIndex * 0.10);
                  const dailyDiv = Math.round(npc.dailyDividendBase * st.finance.inflationIndex * (ns.partnerShare / 100));
                  const colors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4', '#4fd1c5'];
                  const col = colors[idx % colors.length];

                  return `
                    <div class="exec-row">
                      <div class="exec-row-entity">
                        <span class="exec-accent-bar" style="background:${col};"></span>
                        <div>
                          <div class="exec-entity-title">${npc.icon} ${npc.shopName} • ${npc.name}</div>
                          <div class="exec-entity-sub">Dostluk: %${ns.relation} • Dükkan Sağlığı: %${ns.shopHealth}</div>
                        </div>
                      </div>
                      <div class="exec-big-pct" style="color:${col};">%${ns.partnerShare}</div>
                      <div class="exec-metric-col">
                        <span class="exec-metric-label">%10 HİSSE BEDELİ</span>
                        <span class="exec-metric-val">${cost10.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div class="exec-metric-col">
                        <span class="exec-metric-label">GÜNLÜK KÂR PAYI</span>
                        <span class="exec-metric-val" style="color:var(--emerald);">+${dailyDiv.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div class="exec-metric-col">
                        <span class="exec-metric-label">MAKSİMUM PAY</span>
                        <span class="exec-metric-val">%50 Ortak</span>
                      </div>
                      <div>
                        <div class="exec-dual-bar">
                          <div style="width:${ns.partnerShare * 2}%;background:${col};"></div>
                        </div>
                      </div>
                      <button class="btn btn-primary btn-sm" data-partner-npc="${npc.id}" ${ns.partnerShare >= 50 ? 'disabled' : ''}>
                        ${ns.partnerShare >= 50 ? 'Tamamlandı' : `+%10 Ortak Ol`}
                      </button>
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
          ui.financeSubTab === 'veresiye'
            ? `
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">MAHALLE ALACAKLARI</span>
                <div class="card-title">📓 Veresiye Defteri</div>
              </div>
            </div>
            ${
              st.finance.veresiyeList.length === 0
                ? `<div style="padding:18px;text-align:center;color:var(--text-muted);">Veresiye defterinde alacak kaydı yok.</div>`
                : `
              <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Borçlu Komşu</th>
                    <th>Not</th>
                    <th>Tutar</th>
                    <th>Güven</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  ${st.finance.veresiyeList
                    .map(
                      (v) => `
                    <tr>
                      <td><strong>${v.debtorName}</strong></td>
                      <td>${v.note}</td>
                      <td style="font-weight:800;color:var(--accent-secondary);">${v.amount.toLocaleString('tr-TR')} ₺</td>
                      <td>%${v.trustScore}</td>
                      <td style="display:flex;gap:6px;">
                        <button class="btn btn-primary btn-sm" data-collect-ver="${v.id}">💵 Tahsil Et</button>
                        <button class="btn btn-sm" data-forgive-ver="${v.id}">❤️ Helal Et (+4 İtibar)</button>
                      </td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
              </div>
            `
            }
          </div>
        `
            : ''
        }

        ${
          ui.financeSubTab === 'banka'
            ? `
          <div class="card-grid">
            ${LOAN_PACKAGES.map((pkg) => {
              const scaledPrincipal = Math.round(pkg.principal * st.finance.inflationIndex);
              const scaledTotal = Math.round(pkg.totalRepayment * st.finance.inflationIndex);
              const dailyInst = Math.round(scaledTotal / pkg.days);
              return `
                <div class="game-card">
                  <div class="card-head">
                    <div class="card-title">🏦 ${pkg.name}</div>
                    <span class="badge badge-success">+${scaledPrincipal.toLocaleString('tr-TR')} ₺ Nakit</span>
                  </div>
                  <div style="font-size:0.8rem;color:var(--text-secondary);">
                    Toplam Geri Ödeme: <strong>${scaledTotal.toLocaleString('tr-TR')} ₺</strong> (${pkg.days} gün boyunca günlük <strong>${dailyInst.toLocaleString('tr-TR')} ₺</strong> taksit)
                  </div>
                  <button class="btn btn-primary btn-sm" data-take-loan="${pkg.id}">Krediyi Kullan</button>
                </div>
              `;
            }).join('')}
          </div>

          <div class="game-card" style="margin-top:16px;">
            <div class="card-title">📋 Aktif Kredi Taksitleriniz (Toplam Borç: ${st.finance.bankDebt.toLocaleString('tr-TR')} ₺)</div>
            ${
              st.finance.loans.length === 0
                ? `<div style="color:var(--text-muted);font-size:0.84rem;">Bankaya hiçbir kredi borcunuz bulunmuyor!</div>`
                : st.finance.loans
                    .map(
                      (l) => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--bg-row);border-radius:8px;">
                    <span><strong>${l.name}</strong> • Kalan: ${l.remainingPrincipal.toLocaleString('tr-TR')} ₺ (${l.remainingDays} gün)</span>
                    <button class="btn btn-success btn-sm" data-payoff-loan="${l.id}">Borcu Erken Kapat</button>
                  </div>
                `
                    )
                    .join('')
            }
          </div>
        `
            : ''
        }
      </div>
    `;

    container.querySelectorAll('[data-fin-sub]').forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.financeSubTab = (btn).getAttribute('data-fin-sub');
        ui.renderActiveTab(true);
      });
    });

    container.querySelector('#btn-emergency-rescue')?.addEventListener('click', () => {
      st.finance.cash += 25000;
      st.shop.reputation = Math.max(20, st.shop.reputation - 5);
      ui.showToast('Esnaf Dayanışması! 🤝', 'Aileniz ve mahalle esnafı aralarında 25.000 TL toplayıp kasanıza destek oldu!', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelectorAll('[data-buy-inv]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-buy-inv');
        const cat = INVESTMENT_CATALOG.find((c) => c.id === id);
        if (!cat) return;
        let holding = st.finance.holdings.find((h) => h.id === id);
        const price = holding ? holding.currentUnitValue : Math.round(cat.baseUnitValue * st.finance.inflationIndex);
        if (st.finance.cash < price) {
          ui.showToast('Yetersiz Bakiye', `${price.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
          return;
        }
        st.finance.cash -= price;
        if (!holding) {
          st.finance.holdings.push({
            id: cat.id,
            type: cat.type,
            name: cat.name,
            units: 1,
            avgCost: price,
            currentUnitValue: price,
            dailyYieldRate: cat.dailyYieldRate
          });
        } else {
          holding.units += 1;
        }
        ui.engine.checkAchievements();
        ui.showToast('Yatırım Yapıldı 💼', `1 adet ${cat.name} portföyünüze eklendi.`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-sell-inv]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-sell-inv');
        const idx = st.finance.holdings.findIndex((h) => h.id === id);
        if (idx === -1) return;
        const holding = st.finance.holdings[idx];
        st.finance.cash += holding.currentUnitValue;
        holding.units -= 1;
        if (holding.units <= 0) st.finance.holdings.splice(idx, 1);
        ui.showToast('Varlık Bozduruldu 💵', `${holding.currentUnitValue.toLocaleString('tr-TR')} TL kasaya eklendi.`, 'info');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-partner-npc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const npcId = (btn).getAttribute('data-partner-npc');
        const npc = STREET_NPCS.find((n) => n.id === npcId);
        if (!npc) return;
        const ns = st.npcs[npc.id];
        const cost10 = Math.round(npc.partnerBaseValuation * st.finance.inflationIndex * 0.10);
        if (st.finance.cash < cost10) {
          ui.showToast('Yetersiz Bakiye', `${cost10.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
          return;
        }
        st.finance.cash -= cost10;
        ns.partnerShare = Math.min(50, ns.partnerShare + 10);
        ui.engine.checkAchievements();
        ui.showToast('Ortaklık Artırıldı 👑', `${npc.shopName} ortaklık payınız %${ns.partnerShare} oldu!`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-collect-ver]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-collect-ver');
        const idx = st.finance.veresiyeList.findIndex((v) => v.id === id);
        if (idx === -1) return;
        const ver = st.finance.veresiyeList[idx];
        st.finance.cash += ver.amount;
        st.finance.veresiyeList.splice(idx, 1);
        ui.showToast('Veresiye Tahsil Edildi 💵', `${ver.debtorName} borcu olan ${ver.amount} TL'yi ödedi.`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-forgive-ver]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-forgive-ver');
        const idx = st.finance.veresiyeList.findIndex((v) => v.id === id);
        if (idx === -1) return;
        const ver = st.finance.veresiyeList[idx];
        st.finance.veresiyeList.splice(idx, 1);
        st.shop.reputation = Math.min(100, st.shop.reputation + 4);
        ui.showToast('Borç Helal Edildi ❤️', `${ver.debtorName} hayır duası etti (+4 İtibar).`, 'info');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-take-loan]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-take-loan');
        const pkg = LOAN_PACKAGES.find((p) => p.id === id);
        if (!pkg) return;
        const scaledPrincipal = Math.round(pkg.principal * st.finance.inflationIndex);
        const scaledTotal = Math.round(pkg.totalRepayment * st.finance.inflationIndex);
        st.finance.cash += scaledPrincipal;
        st.finance.loans.push({
          id: 'loan_' + Date.now(),
          name: pkg.name,
          remainingPrincipal: scaledTotal,
          dailyInstallment: Math.round(scaledTotal / pkg.days),
          remainingDays: pkg.days,
          missedPayments: 0
        });
        st.finance.bankDebt = st.finance.loans.reduce((s, l) => s + l.remainingPrincipal, 0);
        ui.showToast('Kredi Onaylandı 🏦', `${scaledPrincipal.toLocaleString('tr-TR')} TL hesabınıza geçti.`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-payoff-loan]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-payoff-loan');
        const idx = st.finance.loans.findIndex((l) => l.id === id);
        if (idx === -1) return;
        const loan = st.finance.loans[idx];
        if (st.finance.cash < loan.remainingPrincipal) {
          ui.showToast('Yetersiz Bakiye', 'Borcu kapatmak için nakit yetersiz.', 'warning');
          return;
        }
        st.finance.cash -= loan.remainingPrincipal;
        st.finance.loans.splice(idx, 1);
        st.finance.bankDebt = st.finance.loans.reduce((s, l) => s + l.remainingPrincipal, 0);
        ui.showToast('Kredi Borcu Kapatıldı! 🎉', 'Bankaya olan borcunuzu kapattınız.', 'success');
        bus.emit('state:updated', st);
      });
    });
  }
}
