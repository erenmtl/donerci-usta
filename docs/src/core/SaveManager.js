// ============================================================================
// KAYIT SİSTEMİ VE VERSİYON MİGRASYONU (SaveManager.ts)
// Eski kayıtlar yüklendiğinde eksik alanları varsayılanlarla doldurur.
// ============================================================================

import { MANAGEMENT_CONFIG, MANAGER_CANDIDATE_TEMPLATES } from '../data/management.js';
import { TURKEY_PROVINCES } from '../data/turkey_map.js';
import { BranchSystem } from './BranchSystem.js';
import { ReputationSystem } from './ReputationSystem.js';

const SAVE_PREFIX = 'donerci_usta_save_';
const AUTOSAVE_KEY = 'donerci_usta_autosave';


export class SaveManager {
  static createDefaultCandidatePool() {
    return MANAGER_CANDIDATE_TEMPLATES.map((tpl, idx) => ({
      id: `cand_init_${idx}`,
      name: tpl.name,
      title: tpl.title,
      level: idx === 5 ? 'bolge' : 'sube',
      skill: tpl.skill,
      honesty: tpl.honesty,
      loyalty: tpl.loyalty,
      experience: idx * 3 + 2,
      baseMonthlySalary: Math.round(
        (idx === 5 ? MANAGEMENT_CONFIG.regionalManagerBaseSalary : MANAGEMENT_CONFIG.branchManagerBaseSalary) *
          tpl.salaryMultiplier
      ),
      status: 'atanmamis'
    }));
  }

  static createDefaultChainManagement(hqProvinceId = 'istanbul') {
    return {
      tier: 'usta',
      highestTierNotified: 'usta',
      managers: [],
      candidatePool: this.createDefaultCandidatePool(),
      chainPolicy: {
        pricePolicy: 'enflasyon_takip',
        autoOrderThreshold: 45,
        supplierTier: 'standart',
        stockBudgetCeilingBase: 14000,
        hygieneStandard: 'normal',
        targetHeadcount: 2,
        raiseRatePct: 10,
        spendingLimitBase: MANAGEMENT_CONFIG.defaultSpendingLimitBase
      },
      regionPolicies: {},
      branchPolicies: {},
      pendingDecisions: [],
      warehouse: {
        built: false,
        level: 0,
        provinceId: hqProvinceId,
        bulkDiscountPct: 0,
        coldChainReductionPct: 0,
        supplyCrisisDaysLeft: 0
      },
      activeCampaigns: [],
      executiveReports: [],
      rivalPriceWarDaysLeft: 0,
      rivalCounterStance: 'kalite'
    };
  }

  /**
   * Faz 0.4: Kayıt Migrasyonu.
   * Eski bir kayıt yüklendiğinde eksik kalan tüm alanları (branches, quests, reputation, mapView, chainManagement)
   * güvenli varsayılanlarla doldurur.
   */
  static migrateState(rawState) {
    if (!rawState || typeof rawState !== 'object') return null;
    const state = rawState;

    state.saveVersion = MANAGEMENT_CONFIG.saveVersion;

    const provId = BranchSystem.cityToProvinceId(state.player?.city || 'İstanbul');

    if (!state.branches || !Array.isArray(state.branches) || state.branches.length === 0) {
      const hq = BranchSystem.createHeadquartersBranch(state);
      state.branches = [hq];
      state.activeBranchId = hq.id;
    } else {
      // Şubelerdeki eksik bölge/franchise alanlarını tamamla
      for (const b of state.branches) {
        if (!b.regionName) {
          const p = TURKEY_PROVINCES.find((pr) => pr.id === b.provinceId);
          b.regionName = p?.region || 'Marmara';
        }
        if (b.isFranchise === undefined) b.isFranchise = false;
      }
      if (!state.activeBranchId || !state.branches.some((b) => b.id === state.activeBranchId)) {
        state.activeBranchId = state.branches[0].id;
      }
    }

    if (!state.reputation) {
      const baseRep = Math.round(state.shop?.reputation || 64);
      state.reputation = {
        neighborhoodReputation: baseRep,
        cityReputations: { [provId]: baseRep, istanbul: 60, ankara: 50, izmir: 50, bursa: 50 },
        countryReputation: Math.max(40, Math.round(baseRep * 0.85))
      };
    } else if (!state.reputation.cityReputations) {
      state.reputation.cityReputations = { [provId]: Math.round(state.shop?.reputation || 64) };
    }

    if (!state.quests) {
      state.quests = {
        completedQuestIds: [],
        currentTier: 1,
        maxAllowedBranches: Math.max(1, state.branches.length),
        lifetimeCustomersServed: state.finance?.todayStats?.customersServed || 25
      };
    }

    if (!state.mapView) {
      const hq = state.branches[0];
      state.mapView = {
        level: 'city',
        selectedProvinceId: hq.provinceId,
        selectedDistrictId: hq.districtId,
        heatmapMode: 'standard'
      };
    } else if (!state.mapView.heatmapMode) {
      state.mapView.heatmapMode = 'standard';
    }

    if (!state.chainManagement) {
      state.chainManagement = this.createDefaultChainManagement(provId);
    } else {
      const def = this.createDefaultChainManagement(provId);
      if (!state.chainManagement.managers) state.chainManagement.managers = [];
      if (!state.chainManagement.candidatePool || state.chainManagement.candidatePool.length === 0) {
        state.chainManagement.candidatePool = def.candidatePool;
      }
      if (!state.chainManagement.chainPolicy) state.chainManagement.chainPolicy = def.chainPolicy;
      if (!state.chainManagement.regionPolicies) state.chainManagement.regionPolicies = {};
      if (!state.chainManagement.branchPolicies) state.chainManagement.branchPolicies = {};
      if (!state.chainManagement.pendingDecisions) state.chainManagement.pendingDecisions = [];
      if (!state.chainManagement.warehouse) state.chainManagement.warehouse = def.warehouse;
      if (!state.chainManagement.activeCampaigns) state.chainManagement.activeCampaigns = [];
      if (!state.chainManagement.executiveReports) state.chainManagement.executiveReports = [];
      if (!state.chainManagement.rivalCounterStance) state.chainManagement.rivalCounterStance = 'kalite';
      if (state.chainManagement.rivalPriceWarDaysLeft === undefined) state.chainManagement.rivalPriceWarDaysLeft = 0;
    }

    // Yönetim kademesini şube sayısına göre senkronla
    const count = state.branches.length;
    if (count >= MANAGEMENT_CONFIG.tierThresholds.holdingMinBranches) {
      state.chainManagement.tier = 'holding';
    } else if (count >= MANAGEMENT_CONFIG.tierThresholds.mudurMinBranches) {
      state.chainManagement.tier = 'mudur';
    } else {
      state.chainManagement.tier = 'usta';
    }

    ReputationSystem.syncReputations(state);
    return state;
  }

  static saveAuto(state) {
    try {
      state.saveVersion = MANAGEMENT_CONFIG.saveVersion;
      const payload = {
        savedAt: new Date().toLocaleString('tr-TR'),
        state
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('Otomatik kayıt başarısız:', err);
    }
  }

  static loadAuto() {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return this.migrateState(parsed.state);
    } catch {
      return null;
    }
  }

  static saveSlot(slotId, state) {
    try {
      state.saveVersion = MANAGEMENT_CONFIG.saveVersion;
      const payload = {
        savedAt: new Date().toLocaleString('tr-TR'),
        state
      };
      localStorage.setItem(SAVE_PREFIX + slotId, JSON.stringify(payload));
      this.saveAuto(state);
      return true;
    } catch (err) {
      console.error('Slot kaydı başarısız:', err);
      return false;
    }
  }

  static loadSlot(slotId) {
    try {
      const raw = localStorage.getItem(SAVE_PREFIX + slotId);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return this.migrateState(parsed.state);
    } catch {
      return null;
    }
  }

  static deleteSlot(slotId) {
    localStorage.removeItem(SAVE_PREFIX + slotId);
  }

  static clearAll() {
    localStorage.removeItem(AUTOSAVE_KEY);
    ['slot1', 'slot2', 'slot3'].forEach((s) => localStorage.removeItem(SAVE_PREFIX + s));
  }

  static getSlotsMeta() {
    const slots = [
      { id: 'slot1', label: 'Kayıt Slotu 1' },
      { id: 'slot2', label: 'Kayıt Slotu 2' },
      { id: 'slot3', label: 'Kayıt Slotu 3' }
    ];

    return slots.map((s) => {
      try {
        const raw = localStorage.getItem(SAVE_PREFIX + s.id);
        if (!raw) {
          return { slotId: s.id, label: s.label, exists: false };
        }
        const parsed = JSON.parse(raw);
        const st = parsed.state;
        return {
          slotId: s.id,
          label: s.label,
          exists: true,
          savedAt: parsed.savedAt,
          shopName: st.shop?.name || 'Dönerci',
          playerName: st.player?.name || 'Usta',
          day: st.time?.day || 1,
          year: st.time?.year || 1,
          cash: st.finance?.cash || 0
        };
      } catch {
        return { slotId: s.id, label: s.label, exists: false };
      }
    });
  }
}
