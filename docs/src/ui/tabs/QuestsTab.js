// ============================================================================
// 🎯 GÖREVLER VE BAYİLEŞME YETKİ PANELİ SEKMESİ (QuestsTab.ts)
// ============================================================================

import { QuestSystem } from '../../core/QuestSystem.js';

export class QuestsTab {
  static render(container, engine) {
    const st = engine.state;
    const netWorth = engine.getNetWorth();
    QuestSystem.evaluateQuests(st, netWorth);
    const allStatuses = QuestSystem.getAllQuestStatuses(st, netWorth);

    const completedCount = allStatuses.filter((q) => q.completed).length;
    const tiers = [1, 2, 3, 4, 5];

    container.innerHTML = `
      <div class="panel-scroll">
        <div class="section-title">
          <div>
            <h2>🎯 Bayileşme Görevleri & Şube Açma Yetki Kademeleri</h2>
            <p style="font-size:0.84rem;color:var(--text-secondary);font-weight:600;">
              Yeni şube açabilmek için iki koşul birlikte aranır: <strong>(1) İlgili kademedeki görevlerin tamamlanması</strong> ve <strong>(2) Yeterli nakit sermaye</strong>.
            </p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span class="badge badge-info">Tamamlanan Görev: ${completedCount} / ${allStatuses.length}</span>
            <span class="badge badge-success">Açık Şube Yetkisi: Maks. ${st.quests.maxAllowedBranches === 99 ? 'Sınırsız' : st.quests.maxAllowedBranches} Şube</span>
          </div>
        </div>

        ${tiers
          .map((tierNum) => {
            const tierQuests = allStatuses.filter((q) => q.def.tier === tierNum);
            if (tierQuests.length === 0) return '';
            const tierTitle = tierQuests[0].def.tierTitle;
            const doneInTier = tierQuests.filter((q) => q.completed).length;
            const isTierUnlocked = tierNum <= st.quests.currentTier;
            const isTierAllDone = doneInTier === tierQuests.length;

            return `
              <div class="game-card" style="margin-bottom:16px;${isTierAllDone ? 'border-color:var(--emerald);' : isTierUnlocked ? 'border-color:var(--accent-secondary);' : 'opacity:0.68;'}">
                <div class="card-head">
                  <div>
                    <span class="card-kicker">${isTierAllDone ? '✓ KADEME TAMAMLANDI' : isTierUnlocked ? '🔥 AKTİF GÖREV KADEMESİ' : '🔒 KİLİTLİ KADEME'}</span>
                    <div class="card-title">${tierTitle}</div>
                  </div>
                  <span class="badge ${isTierAllDone ? 'badge-success' : isTierUnlocked ? 'badge-warning' : 'badge-neutral'}">
                    ${doneInTier} / ${tierQuests.length} Görev Tamamlandı
                  </span>
                </div>

                <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr));">
                  ${tierQuests
                    .map((qs) => {
                      const scaledReward = Math.round(qs.def.rewardCash * st.finance.inflationIndex);
                      return `
                        <div style="background:var(--bg-row);border:1px solid ${
                          qs.completed ? 'rgba(56,211,159,0.45)' : 'var(--border-color)'
                        };border-radius:10px;padding:13px;display:flex;flex-direction:column;gap:8px;">
                          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                            <div style="font-weight:800;font-size:0.93rem;">${qs.def.icon} ${qs.def.title}</div>
                            <span class="badge ${qs.completed ? 'badge-success' : qs.locked ? 'badge-neutral' : 'badge-info'}">
                              ${qs.completed ? '✓ Tamam' : qs.locked ? '🔒 Kilitli' : `%${qs.progressPct}`}
                            </span>
                          </div>
                          <div style="font-size:0.79rem;color:var(--text-secondary);">${qs.def.description}</div>

                          <div class="progress-bar">
                            <div class="progress-fill ${qs.completed ? 'good' : 'warn'}" style="width:${qs.progressPct}%"></div>
                          </div>

                          <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.76rem;font-family:'JetBrains Mono',monospace;">
                            <span>İlerleme: <strong>${qs.currentValue.toLocaleString('tr-TR')} / ${qs.targetValue.toLocaleString('tr-TR')}</strong></span>
                            <span style="color:var(--emerald);font-weight:800;">+${scaledReward.toLocaleString('tr-TR')} ₺ & +${qs.def.rewardBrandRep}★</span>
                          </div>
                        </div>
                      `;
                    })
                    .join('')}
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }
}
