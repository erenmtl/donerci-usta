// ============================================================================
// 3 KATMANLI İTİBAR SİSTEMİ (ReputationSystem.ts)
// 1. Mahalle İtibarı -> 2. Şehir İtibarı -> 3. Ülke (Türkiye Marka) İtibarı
// ============================================================================

import type { GameState } from '../types/index.ts';
import { TURKEY_PROVINCES } from '../data/turkey_map.ts';
import { EXPANSION_CONFIG } from '../data/quests.ts';
import { bus } from './EventBus.ts';

export class ReputationSystem {
  /**
   * Aktif şubenin mahalle itibarını tüm şube/şehir/ülke katmanlarına ağırlıklı olarak yansıtır.
   */
  public static syncReputations(state: GameState): void {
    if (!state.reputation) {
      state.reputation = {
        neighborhoodReputation: Math.round(state.shop.reputation || 64),
        cityReputations: { istanbul: 60, ankara: 50, izmir: 50, bursa: 50 },
        countryReputation: 54
      };
    }

    // 1. Aktif şubenin mahalle itibarını güncelle
    const activeBranch = state.branches?.find((b) => b.id === state.activeBranchId);
    if (activeBranch) {
      activeBranch.neighborhoodReputation = Math.round(state.shop.reputation);
      activeBranch.hygiene = Math.round(state.shop.hygiene);
      activeBranch.decorScore = state.shop.decorScore;
      activeBranch.seatingCapacity = state.shop.seatingCapacity;
      activeBranch.staffCount = state.staff.length;
    }
    state.reputation.neighborhoodReputation = Math.round(state.shop.reputation);

    // 2. Şehir İtibarları: O şehirdeki tüm şubelerin ağırlıklı ortalaması
    const branchesByProvince: Record<string, number[]> = {};
    for (const b of state.branches || []) {
      if (!branchesByProvince[b.provinceId]) {
        branchesByProvince[b.provinceId] = [];
      }
      branchesByProvince[b.provinceId].push(b.neighborhoodReputation);
    }

    for (const provId of Object.keys(branchesByProvince)) {
      const list = branchesByProvince[provId];
      const avg = list.reduce((s, v) => s + v, 0) / list.length;
      // Aynı şehirde birden fazla başarılı şube olması şehir itibarını ekstra güçlendirir
      const multiBranchBonus = Math.min(10, (list.length - 1) * 3);
      state.reputation.cityReputations[provId] = Math.max(
        10,
        Math.min(100, Math.round(avg * 0.92 + multiBranchBonus))
      );
    }

    // Şube olmayan illerin baz şehir itibarı ülke marka itibarının %85'i kadardır
    for (const prov of TURKEY_PROVINCES) {
      if (!branchesByProvince[prov.id] && state.reputation.cityReputations[prov.id] === undefined) {
        state.reputation.cityReputations[prov.id] = Math.round((state.reputation.countryReputation || 52) * 0.85);
      }
    }

    // 3. Ülke (Marka) İtibarı: Şube açılan tüm şehirlerin ortalaması + ulusal yayılım bonusu
    const activeProvinces = Object.keys(branchesByProvince);
    if (activeProvinces.length > 0) {
      const cityAvg =
        activeProvinces.reduce((s, pId) => s + (state.reputation.cityReputations[pId] || 55), 0) /
        activeProvinces.length;
      const nationalSpreadBonus = Math.min(18, (activeProvinces.length - 1) * 3.5 + ((state.branches?.length || 1) - 1) * 1.5);
      state.reputation.countryReputation = Math.max(
        15,
        Math.min(100, Math.round(cityAvg * 0.86 + nationalSpreadBonus))
      );
    }
  }

  /**
   * Bir şubede hijyen kritik seviyenin (%35) altına düşerse skandal patlak verir ve tüm marka etkilenir.
   */
  public static checkBranchScandal(state: GameState, branchName: string, provinceId: string, hygiene: number): void {
    if (hygiene >= 35) return;
    if (Math.random() > 0.25) return; // Gün içinde belirli olasılıkla patlak verir

    state.shop.reputation = Math.max(10, state.shop.reputation - 10);
    const currentCityRep = state.reputation.cityReputations[provinceId] || 55;
    state.reputation.cityReputations[provinceId] = Math.max(
      10,
      currentCityRep + EXPANSION_CONFIG.scandalCityRepPenalty
    );
    state.reputation.countryReputation = Math.max(
      10,
      state.reputation.countryReputation + EXPANSION_CONFIG.scandalBrandRepPenalty
    );
    state.reputation.lastScandalNote = `${branchName} şubesinde hijyen skandalı yaşandı! (Ülke İtibarı ${EXPANSION_CONFIG.scandalBrandRepPenalty})`;

    bus.emit('toast:show', {
      title: `🚨 Şube Hijyen Skandalı: ${branchName}!`,
      text: `Düşük hijyen sosyal medyaya düştü! Şehir İtibarı ${EXPANSION_CONFIG.scandalCityRepPenalty}, Türkiye Marka İtibarı ${EXPANSION_CONFIG.scandalBrandRepPenalty} puan düştü!`,
      type: 'danger'
    });
  }

  /**
   * Bulunulan ekrana göre (Mahalle/Şube, Şehir Haritası, Türkiye Haritası) HUD'da gösterilecek ana itibar metnini üretir.
   */
  public static getHudReputationInfo(state: GameState, activeTab: string) {
    this.syncReputations(state);
    const activeBranch = state.branches?.find((b) => b.id === state.activeBranchId);
    const currentProvId =
      activeTab === 'harita'
        ? state.mapView?.selectedProvinceId || activeBranch?.provinceId || 'istanbul'
        : activeBranch?.provinceId || 'istanbul';

    const provDef = TURKEY_PROVINCES.find((p) => p.id === currentProvId);
    const provName = provDef?.name || 'İstanbul';
    const distName = activeBranch?.districtName || 'Merkez';

    const localRep = Math.round(state.reputation.neighborhoodReputation);
    const cityRep = Math.round(state.reputation.cityReputations[currentProvId] || localRep);
    const countryRep = Math.round(state.reputation.countryReputation);

    if (activeTab === 'harita') {
      if (state.mapView?.level === 'turkey') {
        return {
          contextLabel: '🇹🇷 ÜLKE MARKA İTİBARI',
          primaryValue: `${countryRep}/100`,
          secondarySummary: `Şehir (${provName}): ${cityRep} • Mahalle: ${localRep}`
        };
      }
      if (state.mapView?.level === 'city') {
        return {
          contextLabel: `🏙️ ${provName.toUpperCase()} ŞEHİR İTİBARI`,
          primaryValue: `${cityRep}/100`,
          secondarySummary: `Ülke Marka: ${countryRep} • Mahalle (${distName}): ${localRep}`
        };
      }
    }

    return {
      contextLabel: `🏘️ MAHALLE İTİBARI (${distName.toUpperCase()})`,
      primaryValue: `${localRep}/100`,
      secondarySummary: `Şehir (${provName}): ${cityRep} • Ülke: ${countryRep}`
    };
  }
}
