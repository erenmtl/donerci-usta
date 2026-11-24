// ============================================================================
// KADEMELİ GÖREV SİSTEMİ (QuestSystem.ts)
// Görevlerin ilerlemesini hesaplar, ödülleri dağıtır ve şube açma kademelerini açar.
// ============================================================================

import type { GameState } from '../types/index.ts';
import { QUEST_CATALOG, type QuestDef } from '../data/quests.ts';
import { bus } from './EventBus.ts';

export interface QuestStatusView {
  def: QuestDef;
  currentValue: number;
  targetValue: number;
  progressPct: number;
  completed: boolean;
  locked: boolean;
}

export class QuestSystem {
  public static getMetricValue(state: GameState, metric: string, netWorth: number): number {
    const activeBranch = state.branches?.find((b) => b.id === state.activeBranchId);
    const provId = activeBranch?.provinceId || 'istanbul';
    const cityRep = state.reputation?.cityReputations?.[provId] || state.shop.reputation;

    switch (metric) {
      case 'total_customers':
        return state.quests?.lifetimeCustomersServed || 0;
      case 'daily_revenue': {
        const totalTodayRev = (state.branches || []).reduce((s, b) => s + (b.todayRevenue || 0), 0);
        return Math.max(state.finance.todayStats.revenue, totalTodayRev);
      }
      case 'neighborhood_rep':
        return Math.round(state.shop.reputation);
      case 'city_rep':
        return Math.round(cityRep);
      case 'country_rep':
        return Math.round(state.reputation?.countryReputation || 54);
      case 'hygiene':
        return Math.round(state.shop.hygiene);
      case 'days_survived':
        return state.time.day;
      case 'active_branches':
        return state.branches?.length || 1;
      case 'active_cities': {
        const uniqueCities = new Set((state.branches || []).map((b) => b.provinceId));
        return uniqueCities.size;
      }
      case 'staff_count': {
        const totalStaff = (state.branches || []).reduce((s, b) => s + (b.staffCount || 0), 0);
        return Math.max(state.staff.length, totalStaff);
      }
      case 'net_worth':
        return Math.round(netWorth);
      default:
        return 0;
    }
  }

  public static evaluateQuests(state: GameState, netWorth: number): void {
    if (!state.quests) {
      state.quests = {
        completedQuestIds: [],
        currentTier: 1,
        maxAllowedBranches: 1,
        lifetimeCustomersServed: 35
      };
    }

    let newlyCompleted = false;

    for (const q of QUEST_CATALOG) {
      // Sadece mevcut kademe veya önceki kademedeki görevler tamamlanabilir
      if (q.tier > state.quests.currentTier) continue;
      if (state.quests.completedQuestIds.includes(q.id)) continue;

      const val = this.getMetricValue(state, q.metric, netWorth);
      if (val >= q.targetValue) {
        state.quests.completedQuestIds.push(q.id);
        const scaledReward = Math.round(q.rewardCash * state.finance.inflationIndex);
        state.finance.cash += scaledReward;
        state.reputation.countryReputation = Math.min(100, state.reputation.countryReputation + q.rewardBrandRep);
        newlyCompleted = true;

        state.storyLog.push({
          day: state.time.day,
          title: `🎯 Görev Tamamlandı: ${q.title}`,
          text: `${q.description} (+${scaledReward.toLocaleString('tr-TR')} ₺ Ödül & +${q.rewardBrandRep} Marka İtibarı)`
        });

        bus.emit('toast:show', {
          title: `🎯 Görev Tamamlandı: ${q.title}!`,
          text: `+${scaledReward.toLocaleString('tr-TR')} ₺ Ödül ve +${q.rewardBrandRep} Türkiye Marka İtibarı kazandınız!`,
          type: 'success'
        });
      }
    }

    // Mevcut kademedeki tüm görevler bittiyse şube açma hakkını yükselt ve sonraki kademeyi aç!
    for (let tier = 1; tier <= 5; tier++) {
      const tierQuests = QUEST_CATALOG.filter((q) => q.tier === tier);
      const allDone = tierQuests.every((q) => state.quests.completedQuestIds.includes(q.id));
      if (allDone) {
        const unlockLimit = tierQuests[0]?.unlocksMaxBranches || 2;
        if (state.quests.maxAllowedBranches < unlockLimit) {
          state.quests.maxAllowedBranches = unlockLimit;
          bus.emit('toast:show', {
            title: `🔓 Kademe ${tier} Tamamlandı: Yeni Şube Yetkisi Açıldı!`,
            text: `Artık Türkiye ve Şehir Haritası üzerinden ${unlockLimit === 99 ? 'Sınırsız' : unlockLimit} şubeye kadar bayileşebilirsiniz!`,
            type: 'info'
          });
        }
        if (state.quests.currentTier === tier && tier < 5) {
          state.quests.currentTier = tier + 1;
        }
      }
    }

    if (newlyCompleted) {
      bus.emit('state:updated', state);
    }
  }

  public static getAllQuestStatuses(state: GameState, netWorth: number) {
    return QUEST_CATALOG.map((def) => {
      const completed = state.quests?.completedQuestIds.includes(def.id) || false;
      const locked = def.tier > (state.quests?.currentTier || 1);
      const currentValue = completed ? def.targetValue : this.getMetricValue(state, def.metric, netWorth);
      const progressPct = completed ? 100 : Math.min(100, Math.round((currentValue / Math.max(1, def.targetValue)) * 100));

      return {
        def,
        currentValue,
        targetValue: def.targetValue,
        progressPct,
        completed,
        locked
      };
    });
  }
}
