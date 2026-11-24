// ============================================================================
// 📈 DEFTER, ZİNCİR ANALİZ GRAFİKLERİ, YORUMLAR VE BAŞARIMLAR SEKMESİ (LedgerTab.ts)
// ============================================================================

import { ChartRenderer } from '../../render/ChartRenderer.js';
import { ACHIEVEMENTS } from '../../data/achievements.js';

export class LedgerTab {
  static render(container, engine) {
    const st = engine.state;
    const totalIngCost = st.finance.ledgerHistory.reduce((s, d) => s + d.ingredientCost, 0);
    const totalOpCost = st.finance.ledgerHistory.reduce((s, d) => s + d.operatingCost, 0);
    const totalFamCost = st.finance.ledgerHistory.reduce((s, d) => s + d.familyCost, 0);

    container.innerHTML = `
      <div class="panel-scroll">
        <div class="section-title">
          <h2>📈 Esnaf Muhasebe Defteri, Çoklu Analiz Grafikleri & Müşteri Yorumları</h2>
        </div>

        <div class="game-card" style="margin-bottom:18px;">
          <div class="card-head">
            <div>
              <span class="card-kicker">MALİYET YAPISI ANALİZİ</span>
              <div class="card-title">📊 Toplam Gider Kalemleri Dağılımı (Malzeme vs İşletme vs Aile)</div>
            </div>
          </div>
          ${ChartRenderer.renderSegmentedBar([
            { label: 'Et, Lavaş & Malzeme Tedariki', subLabel: `${totalIngCost.toLocaleString('tr-TR')} ₺`, value: Math.max(1, totalIngCost), color: '#f68773' },
            { label: 'Dükkan Kira, Maaş & Bakım', subLabel: `${totalOpCost.toLocaleString('tr-TR')} ₺`, value: Math.max(1, totalOpCost), color: '#f5c76b' },
            { label: 'Aile & Ev Geçim Masrafları', subLabel: `${totalFamCost.toLocaleString('tr-TR')} ₺`, value: Math.max(1, totalFamCost), color: '#63b3ed' }
          ])}
        </div>

        <div class="game-card" style="margin-bottom:18px;">
          <div class="card-head">
            <div>
              <span class="card-kicker">ZİNCİR & ŞUBE PERFORMANS ANALİZİ (FAZ 2)</span>
              <div class="card-title">🏪 Şube ve Bayilerin Günlük Ciro / Gider / Net Kâr Karşılaştırması</div>
            </div>
          </div>
          ${ChartRenderer.renderBranchComparisonChart(st.branches)}
        </div>

        <div class="dashboard-2col">
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">GELİR & GİDER EĞRİSİ</span>
                <div class="card-title">📈 Günlük Ciro, Gider ve Net Kâr Çizgi Grafiği</div>
              </div>
            </div>
            ${ChartRenderer.renderProfitLineChart(st.finance.ledgerHistory)}
          </div>

          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">MAKRO EKONOMİ & TRAFİK</span>
                <div class="card-title">📊 Müşteri Sayısı Sütunları & Enflasyon Endeksi Trendi</div>
              </div>
            </div>
            ${ChartRenderer.renderInflationTrendChart(st.finance.ledgerHistory)}
          </div>
        </div>

        <div class="dashboard-2col">
          <div class="game-card">
            <div class="card-title">💬 "MahalleYorum & DönerSepeti" Müşteri Yorumları</div>
            <div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;" data-inner-scroll="ledger-reviews">
              ${st.reviews
                .map(
                  (r) => `
                <div style="padding:10px 12px;background:var(--bg-row);border:1px solid var(--border-color);border-radius:8px;font-size:0.82rem;">
                  <div style="display:flex;justify-content:space-between;font-weight:800;margin-bottom:3px;">
                    <span>@${r.author} (${r.customerType.toUpperCase()}) • Gün ${r.day}</span>
                    <span style="color:#f5c76b;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <div style="color:var(--text-secondary);">"${r.comment}"</div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="game-card">
            <div class="card-title">🏆 Esnaf Başarımları & Rozetler (${st.unlockedAchievements.length}/${ACHIEVEMENTS.length})</div>
            <div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;" data-inner-scroll="ledger-achievements">
              ${ACHIEVEMENTS.map((ach) => {
                const unlocked = st.unlockedAchievements.includes(ach.id);
                return `
                  <div style="padding:10px 12px;background:var(--bg-row);border:1px solid var(--border-color);border-radius:8px;display:flex;justify-content:space-between;align-items:center;opacity:${unlocked ? '1' : '0.55'};">
                    <div>
                      <div style="font-weight:800;font-size:0.86rem;">${ach.icon} ${ach.title}</div>
                      <div style="font-size:0.76rem;color:var(--text-secondary);">${ach.description}</div>
                    </div>
                    <span class="badge ${unlocked ? 'badge-success' : 'badge-neutral'}">
                      ${unlocked ? '✓ Kazanıldı' : `+${ach.rewardCash} ₺`}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="game-card">
          <div class="card-title">📜 Nesiller Boyu Dükkan & Aile Hikayesi (Hayat Özeti)</div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${st.storyLog
              .slice()
              .reverse()
              .map(
                (log) => `
              <div style="padding:9px 12px;background:var(--bg-row);border-left:3px solid var(--accent-secondary);border-radius:6px;font-size:0.83rem;">
                <strong>[Gün ${log.day}] ${log.title}:</strong> ${log.text}
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }
}
