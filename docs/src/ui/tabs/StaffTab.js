// ============================================================================
// MODÜLER SEKME BİLEŞENİ: StaffTab.ts
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

export class StaffTab {
  static render(ui, container) {
    const st = ui.engine.state;
    const candidates = [
      { name: 'Mahmut Usta', role: 'usta', skill: 74, morale: 85, baseSalary: 28000, desc: 'Yaprak döner kesiminde hızlıdır, servis kapasitesini artırır.' },
      { name: 'Seda Kasiyer', role: 'kasiyer', skill: 70, morale: 88, baseSalary: 19500, desc: 'Kasada güler yüzlüdür, kuyruk bekleme süresini azaltır.' },
      { name: 'Çırak Baran', role: 'komi', skill: 62, morale: 90, baseSalary: 16000, desc: 'Masaları anında siler, gün içi hijyen düşüşünü %75 engeller.' },
      { name: 'Motorcu Kaan', role: 'kurye', skill: 78, morale: 84, baseSalary: 22500, desc: 'Sıcak paket servis taşır, online sipariş platformu için şarttır.' }
    ];

    container.innerHTML = `
      <div class="panel-scroll">
        <div class="section-title">
          <div>
            <h2>👨‍🍳 Personel Yönetimi & Online Paket Servis</h2>
            <p style="font-size:0.84rem;color:var(--text-secondary);font-weight:600;">
              Usta, kasiyer, komi ve kurye işe alarak dükkanı büyütün. Maaşlar enflasyon endeksine göre her akşam günlük olarak ödenir.
            </p>
          </div>
        </div>

        <div class="game-card" style="margin-bottom:18px;border-color:var(--accent-primary);">
          <div class="card-head">
            <div>
              <span class="card-kicker">DİJİTAL SİPARİŞ AĞI</span>
              <div class="card-title">📱 "DönerSepeti & MahalleYemek" Online Sipariş Ortaklığı</div>
              <div class="card-subtitle">
                Aktif edildiğinde kuryeniz veya kurye motorunuz varsa her gün %25 ekstra online paket sipariş gelir (%18 platform komisyonu kesilir).
              </div>
            </div>
            <button class="btn ${st.shop.onlineDeliveryEnabled ? 'btn-success' : 'btn-primary'}" id="btn-toggle-online">
              ${st.shop.onlineDeliveryEnabled ? '✓ Online Sipariş AÇIK' : 'Online Siparişi Aktif Et'}
            </button>
          </div>
        </div>

        <div class="dashboard-2col">
          <div>
            <div class="section-title"><span>📋 Dükkanda Çalışan Ekip (${st.staff.length})</span></div>
            ${
              st.staff.length === 0
                ? `<div class="game-card" style="color:var(--text-muted);text-align:center;padding:24px;">Henüz personel almadınız. Sağdaki adaylardan işe alım yapabilirsiniz.</div>`
                : `<div style="display:flex;flex-direction:column;gap:10px;">
                  ${st.staff
                    .map((m) => {
                      const monthlySal = m.isFamily ? 0 : Math.round(m.baseSalary * st.finance.inflationIndex);
                      return `
                      <div class="game-card">
                        <div class="card-head">
                          <div>
                            <div class="card-title">${m.name} (${m.role.toUpperCase()})</div>
                            <div class="card-subtitle">Deneyim: ${m.experienceDays} Gün • ${m.isFamily ? 'Aile Üyesi (Maaşsız)' : `Maaş: ${monthlySal.toLocaleString('tr-TR')} ₺/ay`}</div>
                          </div>
                          <span class="badge badge-info">Ustalık: %${m.skill}</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill good" style="width:${m.skill}%"></div></div>
                        <div style="display:flex;gap:8px;">
                          <button class="btn btn-primary btn-sm" data-train-staff="${m.id}">
                            🎓 Eğitime Gönder (${Math.round(2500 * st.finance.inflationIndex).toLocaleString('tr-TR')} ₺)
                          </button>
                          <button class="btn btn-danger btn-sm" data-fire-staff="${m.id}">İşten Çıkar</button>
                        </div>
                      </div>
                    `;
                    })
                    .join('')}
                </div>`
            }
          </div>

          <div>
            <div class="section-title"><span>🤝 İş Başvurusu Yapan Adaylar</span></div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${candidates
                .map((c, idx) => {
                  const monthly = Math.round(c.baseSalary * st.finance.inflationIndex);
                  const fee = Math.round(monthly * 0.25);
                  return `
                  <div class="game-card">
                    <div class="card-head">
                      <div>
                        <div class="card-title">${c.name} — ${c.role.toUpperCase()}</div>
                        <div class="card-subtitle">${c.desc}</div>
                      </div>
                      <span class="badge badge-warning">${monthly.toLocaleString('tr-TR')} ₺/ay</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <span class="badge badge-info">Başlangıç Yetenek: %${c.skill}</span>
                      <button class="btn btn-primary btn-sm" data-hire-idx="${idx}">
                        ➕ İşe Al (Peşinat: ${fee.toLocaleString('tr-TR')} ₺)
                      </button>
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btn-toggle-online')?.addEventListener('click', () => {
      st.shop.onlineDeliveryEnabled = !st.shop.onlineDeliveryEnabled;
      ui.showToast(
        'Online Paket Servis',
        st.shop.onlineDeliveryEnabled
          ? 'DönerSepeti entegrasyonu açıldı! Kuryeniz varsa paket siparişler akacak.'
          : 'Online sipariş kapatıldı.',
        'info'
      );
      bus.emit('state:updated', st);
    });

    container.querySelectorAll('[data-hire-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number((btn).getAttribute('data-hire-idx'));
        const cand = candidates[idx];
        if (!cand) return;
        const res = ui.engine.hireStaff({
          name: cand.name,
          role: cand.role,
          skill: cand.skill,
          morale: cand.morale,
          baseSalary: cand.baseSalary
        });
        ui.showToast(res.ok ? 'Yeni Personel' : 'İşe Alım Hatası', res.msg, res.ok ? 'success' : 'warning');
      });
    });

    container.querySelectorAll('[data-train-staff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-train-staff');
        if (id) ui.engine.trainStaff(id);
      });
    });

    container.querySelectorAll('[data-fire-staff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-fire-staff');
        if (id) ui.engine.fireStaff(id);
      });
    });
  }
}
