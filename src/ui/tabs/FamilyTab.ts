// ============================================================================
// MODÜLER SEKME BİLEŞENİ: FamilyTab.ts
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

export class FamilyTab {
  public static render(ui: any, container: HTMLElement): void {
    const st: GameState = ui.engine.state;
    const inf = st.finance.inflationIndex;
    const monthlyRent = Math.round(st.family.houseRentBase * inf);
    const monthlyMembers = st.family.members.reduce((s, m) => s + Math.round(m.monthlyExpense * inf), 0);

    container.innerHTML = `
      <div class="panel-scroll">
        <div class="section-title">
          <div>
            <h2>🏠 Aile Hayatı, Ev Ekonomisi & Gelecek Kuşak</h2>
            <p style="font-size:0.84rem;color:var(--text-secondary);font-weight:600;">
              Dükkan ile ev arasındaki zaman dengesini koruyun. Yıllar geçtikçe büyüyen çocuklarınız dükkanda çalışabilir ve işi devralabilir!
            </p>
          </div>
          <span class="badge badge-info">Usta Yaşı: ${st.player.age} • Yıl ${st.time.year}</span>
        </div>

        <div class="dashboard-2col">
          <div class="game-card">
            <div class="card-title">⚖️ Dükkan vs Aile Zaman Dengesi (%${st.player.familyTimeRatio} Aile)</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);">
              Aileye daha çok vakit ayırmak evdeki mutluluğu ve sabah enerjinizi artırır.
            </div>
            <input type="range" id="rng-family-time" min="10" max="80" step="5" value="${st.player.familyTimeRatio}" style="width:100%;" />
            <div style="display:flex;justify-content:space-between;font-size:0.76rem;color:var(--text-muted);">
              <span>🏪 Gece Gündüz Dükkanda (%${100 - st.player.familyTimeRatio})</span>
              <span>🏠 Aileye Ayrılan Vakit (%${st.player.familyTimeRatio})</span>
            </div>
          </div>

          <div class="game-card">
            <div class="card-title">🏠 Aylık Aile & Ev Giderleri Dağılımı</div>
            ${ChartRenderer.renderSegmentedBar([
              { label: 'Ev Kirası & Faturalar', subLabel: `${monthlyRent.toLocaleString('tr-TR')} ₺`, value: monthlyRent, color: '#f5c76b' },
              { label: 'Okul, Mutfak & Sağlık', subLabel: `${monthlyMembers.toLocaleString('tr-TR')} ₺`, value: Math.max(1000, monthlyMembers), color: '#38d39f' }
            ])}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
              <span style="font-size:0.8rem;color:var(--accent-secondary);font-weight:800;">
                Günlük Kasadan Düşen Ev Payı: ${Math.round((monthlyRent + monthlyMembers) / 30).toLocaleString('tr-TR')} ₺/gün
              </span>
              <button class="btn btn-primary btn-sm" id="btn-family-dinner">
                🎡 Aileyi Geziye Götür (${Math.round(2200 * inf).toLocaleString('tr-TR')} ₺)
              </button>
            </div>
          </div>
        </div>

        <div class="section-title"><span>❤️ Evdeki Aile Bireyleri (${st.family.members.length})</span></div>
        ${
          st.family.members.length === 0
            ? `<div class="game-card">Şu an bekarsınız ve yalnız yaşıyorsunuz. Tüm enerjinizi döner imparatorluğunu kurmaya harcayabilirsiniz!</div>`
            : `<div class="card-grid">
                ${st.family.members
                  .map((m) => {
                    const canWork = (m.relation === 'Çocuk' && m.age >= 16) || m.relation === 'Eş';
                    const canSucceed = m.relation === 'Çocuk' && m.age >= 18;
                    return `
                    <div class="game-card">
                      <div class="card-head">
                        <div>
                          <div class="card-title">${m.name} (${m.relation} • ${m.age} Yaş)</div>
                          <div class="card-subtitle">${m.statusText}</div>
                        </div>
                        ${m.worksInShop ? `<span class="badge badge-success">🏪 Dükkanda Çalışıyor</span>` : ''}
                      </div>

                      <div style="font-size:0.78rem;">Mutluluk: <strong>%${m.happiness}</strong></div>
                      <div class="progress-bar"><div class="progress-fill ${m.happiness >= 65 ? 'good' : 'warn'}" style="width:${m.happiness}%"></div></div>

                      <div style="font-size:0.78rem;">Sağlık: <strong>%${m.health}</strong></div>
                      <div class="progress-bar"><div class="progress-fill info" style="width:${m.health}%"></div></div>

                      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                        <button class="btn btn-sm" data-fam-gift="${m.id}">🎁 Hediye/Harçlık (${Math.round(900 * inf)} ₺)</button>
                        <button class="btn btn-sm" data-fam-doc="${m.id}">🩺 Doktor Kontrolü (${Math.round(1200 * inf)} ₺)</button>
                        ${
                          canWork && !m.worksInShop
                            ? `<button class="btn btn-primary btn-sm" data-fam-work="${m.id}">👨‍🍳 Dükkanda Yardıma Başlat</button>`
                            : ''
                        }
                        ${
                          canSucceed && st.player.successorId !== m.id
                            ? `<button class="btn btn-success btn-sm" data-fam-succeed="${m.id}">👑 Ustabaşılığı Devret!</button>`
                            : ''
                        }
                      </div>
                    </div>
                  `;
                  })
                  .join('')}
              </div>`
        }
      </div>
    `;

    container.querySelector('#rng-family-time')?.addEventListener('change', (e) => {
      st.player.familyTimeRatio = Number((e.target as HTMLInputElement).value);
      bus.emit('state:updated', st);
    });

    container.querySelector('#btn-family-dinner')?.addEventListener('click', () => {
      const cost = Math.round(2200 * inf);
      if (st.finance.cash < cost) {
        ui.showToast('Yetersiz Bakiye', `${cost} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= cost;
      for (const m of st.family.members) {
        m.happiness = Math.min(100, m.happiness + 18);
      }
      st.family.avgHappiness = Math.min(100, st.family.avgHappiness + 18);
      ui.showToast('Harika Bir Aile Akşamı ❤️', 'Ailenizle çok güzel vakit geçirdiniz, herkesin yüzü gülüyor!', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelectorAll('[data-fam-gift]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).getAttribute('data-fam-gift');
        const m = st.family.members.find((x) => x.id === id);
        const cost = Math.round(900 * inf);
        if (!m || st.finance.cash < cost) return;
        st.finance.cash -= cost;
        m.happiness = Math.min(100, m.happiness + 15);
        ui.showToast('Harçlık & Hediye Verildi 🎁', `${m.name} çok sevindi!`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-fam-doc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).getAttribute('data-fam-doc');
        const m = st.family.members.find((x) => x.id === id);
        const cost = Math.round(1200 * inf);
        if (!m || st.finance.cash < cost) return;
        st.finance.cash -= cost;
        m.health = Math.min(100, m.health + 22);
        ui.showToast('Sağlık Kontrolü Yapıldı 🩺', `${m.name} sağlığına kavuştu.`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-fam-work]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).getAttribute('data-fam-work');
        const m = st.family.members.find((x) => x.id === id);
        if (!m || m.worksInShop) return;
        m.worksInShop = true;
        m.statusText = 'Dükkanda babasına/annesine omuz veriyor!';
        st.staff.push({
          id: 'fam_staff_' + m.id,
          name: m.name,
          role: m.relation === 'Eş' ? 'kasiyer' : 'usta',
          skill: 72,
          morale: 95,
          baseSalary: 0,
          experienceDays: 1,
          isFamily: true
        });
        ui.engine.recalculateShopStats();
        ui.engine.checkAchievements();
        ui.showToast('Aile Dükkanı! 👨‍👦', `${m.name} artık dükkanda maaşsız aile üyesi olarak çalışıyor!`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-fam-succeed]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).getAttribute('data-fam-succeed');
        const m = st.family.members.find((x) => x.id === id);
        if (!m) return;
        st.player.successorId = m.id;
        st.player.name = `${m.name} Usta (2. Kuşak)`;
        st.player.age = m.age;
        st.storyLog.push({
          day: st.time.day,
          title: `Nesiller Arası Devir: ${m.name} Usta Önlüğü Devraldı!`,
          text: `Yılların emeği boşa gitmedi; döner bıçağı artık ikinci kuşağın elinde!`
        });
        ui.engine.checkAchievements();
        ui.showToast('2. Kuşak Ustabaşı! 👑', `${m.name} dükkanın yönetimini devraldı!`, 'success');
        bus.emit('state:updated', st);
      });
    });
  }
}
