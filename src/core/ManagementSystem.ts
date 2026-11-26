// ============================================================================
// KADEMELİ YÖNETİM, DELEGASYON, MÜDÜR, POLİTİKA, MERKEZ DEPO VE KAMPANYA MOTORU
// (ManagementSystem.ts)
// 1-2 Şube: Usta Dönemi | 3-5 Şube: Müdür Dönemi | 6+ Şube: Holding Dönemi
// ============================================================================

import type {
  GameState,
  BranchState,
  ManagerState,
  PolicyConfig,
  PendingDecision,
  ManagementTier,
  PricePolicyMode,
  HygieneStandardMode,
  SupplierTierMode
} from '../types/index.ts';
import {
  MANAGEMENT_CONFIG,
  MANAGER_CANDIDATE_TEMPLATES,
  BRAND_CAMPAIGNS,
  LOCAL_RIVAL_CHAINS
} from '../data/management.ts';
import { TURKEY_PROVINCES } from '../data/turkey_map.ts';
import { RECIPES } from '../data/recipes.ts';
import { INGREDIENTS } from '../data/ingredients.ts';
import { NEIGHBORHOOD_TYPES } from '../data/scenarios.ts';
import { ReputationSystem } from './ReputationSystem.ts';
import { bus } from './EventBus.ts';

export interface BranchAlertItem {
  branchId: string;
  branchName: string;
  severity: 'danger' | 'warning';
  reason: string;
}

export class ManagementSystem {
  /**
   * 1.1: Şube sayısına göre yönetim kademesini günceller ve kademe atlandığında bildirim verir.
   */
  public static checkAndAdvanceManagementTier(state: GameState): ManagementTier {
    const cm = state.chainManagement;
    const count = state.branches.length;
    let newTier: ManagementTier = 'usta';

    if (count >= MANAGEMENT_CONFIG.tierThresholds.holdingMinBranches) {
      newTier = 'holding';
    } else if (count >= MANAGEMENT_CONFIG.tierThresholds.mudurMinBranches) {
      newTier = 'mudur';
    }

    cm.tier = newTier;
    const order: Record<ManagementTier, number> = { usta: 1, mudur: 2, holding: 3 };
    if (order[newTier] > order[cm.highestTierNotified || 'usta']) {
      cm.highestTierNotified = newTier;
      const tierLabel =
        newTier === 'holding'
          ? '🏛️ HOLDİNG DÖNEMİ (6+ Şube • Bölge Müdürleri & Merkez Depo Yetkisi)'
          : '👔 MÜDÜR DÖNEMİ (3-5 Şube • Şube Müdürleri & Otomasyon Politikaları)';
      state.storyLog.push({
        day: state.time.day,
        title: `🎉 Yönetim Kademesi Atlandı: ${tierLabel}`,
        text: `Zinciriniz büyüdü! Artık "🏢 Genel Merkez" sekmesinden şube/bölge müdürleri atayabilir ve otomatik yönetim politikaları belirleyebilirsiniz.`
      });
      bus.emit('toast:show', {
        title: `🏢 Yeni Yönetim Kademesi: ${newTier === 'holding' ? 'Holding Dönemi' : 'Müdür Dönemi'}!`,
        text: `${tierLabel} aktif oldu! Genel Merkez panelinden müdür atayıp politikaları devreye alın.`,
        type: 'success'
      });
    }

    return newTier;
  }

  /**
   * 1.3: Şube için geçerli olan birleşik politikayı döndürür:
   * Zincir Genel Politikası -> Bölge Politikası -> Şube Özel Politikası
   */
  public static getEffectivePolicy(state: GameState, branch: BranchState): PolicyConfig {
    const cm = state.chainManagement;
    const base = cm.chainPolicy;
    const prov = TURKEY_PROVINCES.find((p) => p.id === branch.provinceId);
    const regionName = branch.regionName || prov?.region || 'Marmara';
    const regOverride = cm.regionPolicies[regionName] || {};
    const brOverride = cm.branchPolicies[branch.id] || {};

    return {
      pricePolicy: brOverride.pricePolicy || regOverride.pricePolicy || base.pricePolicy,
      autoOrderThreshold: brOverride.autoOrderThreshold ?? regOverride.autoOrderThreshold ?? base.autoOrderThreshold,
      supplierTier: brOverride.supplierTier || regOverride.supplierTier || base.supplierTier,
      stockBudgetCeilingBase:
        brOverride.stockBudgetCeilingBase ?? regOverride.stockBudgetCeilingBase ?? base.stockBudgetCeilingBase,
      hygieneStandard: brOverride.hygieneStandard || regOverride.hygieneStandard || base.hygieneStandard,
      targetHeadcount: brOverride.targetHeadcount ?? regOverride.targetHeadcount ?? base.targetHeadcount,
      raiseRatePct: brOverride.raiseRatePct ?? regOverride.raiseRatePct ?? base.raiseRatePct,
      spendingLimitBase: brOverride.spendingLimitBase ?? regOverride.spendingLimitBase ?? base.spendingLimitBase
    };
  }

  /**
   * 1.2: Aday havuzundan yeni yönetici (Şube Müdürü veya Bölge Müdürü) işe alır.
   */
  public static hireManagerFromPool(state: GameState, candidateId: string): { ok: boolean; msg: string } {
    const cm = state.chainManagement;
    const idx = cm.candidatePool.findIndex((c) => c.id === candidateId);
    if (idx === -1) return { ok: false, msg: 'Aday bulunamadı.' };

    const candidate = cm.candidatePool[idx];
    const inf = state.finance.inflationIndex;
    const fee = Math.round(MANAGEMENT_CONFIG.managerHiringFeeBase * inf);

    if (state.finance.cash < fee) {
      return { ok: false, msg: `İşe alım ve sözleşme bedeli için ${fee.toLocaleString('tr-TR')} ₺ nakit gerekiyor.` };
    }

    state.finance.cash -= fee;
    state.finance.todayStats.operatingCost += fee;

    const hired: ManagerState = {
      ...candidate,
      id: `mgr_${Date.now()}_${Math.floor(Math.random() * 999)}`,
      status: 'atanmamis',
      embezzledTotal: 0
    };

    cm.managers.push(hired);
    cm.candidatePool.splice(idx, 1);

    // Havuza yeni bir aday ekle
    this.replenishCandidatePool(state);

    bus.emit('toast:show', {
      title: `👔 Yönetici İşe Alındı: ${hired.name}`,
      text: `${hired.title} kadroya katıldı. Genel Merkez sekmesinden bir şubeye veya bölgeye atayabilirsiniz.`,
      type: 'success'
    });
    bus.emit('state:updated', state);
    return { ok: true, msg: `${hired.name} işe alındı.` };
  }

  /**
   * 1.2: Aileden yetişkin (18+) bir çocuğu yüksek sadakat ve dürüstlükle Şube Müdürü olarak kadroya katar.
   */
  public static appointFamilyChildAsManager(state: GameState, familyMemberId: string): { ok: boolean; msg: string } {
    const member = state.family.members.find((m) => m.id === familyMemberId);
    if (!member) return { ok: false, msg: 'Aile üyesi bulunamadı.' };
    if (member.age < 18) return { ok: false, msg: `${member.name} henüz 18 yaşına gelmedi (${member.age} yaşında).` };

    const cm = state.chainManagement;
    if (cm.managers.some((m) => m.familyMemberId === member.id)) {
      return { ok: false, msg: `${member.name} zaten yönetici kadrosunda yer alıyor.` };
    }

    const familyMgr: ManagerState = {
      id: `mgr_fam_${member.id}`,
      name: `${member.name} (${member.relation})`,
      title: 'Aile Veliahtı & Şube Müdürü',
      level: 'sube',
      skill: 74,
      honesty: 98,
      loyalty: 99,
      experience: 10,
      baseMonthlySalary: Math.round(MANAGEMENT_CONFIG.branchManagerBaseSalary * 0.75),
      status: 'atanmamis',
      isFamily: true,
      familyMemberId: member.id,
      embezzledTotal: 0
    };

    member.worksInShop = true;
    member.roleInShop = 'Şube Müdürü';
    member.statusText = 'Zincir yönetiminde Şube Müdürü olarak görev yapıyor';
    cm.managers.push(familyMgr);

    bus.emit('toast:show', {
      title: `👨‍👩‍👧‍👦 Aileden Yönetici Atandı: ${member.name}`,
      text: `${member.name} (%98 Dürüstlük, %99 Sadakat) yönetici kadrosuna katıldı!`,
      type: 'success'
    });
    bus.emit('state:updated', state);
    return { ok: true, msg: `${member.name} yönetici kadrosuna katıldı.` };
  }

  public static replenishCandidatePool(state: GameState): void {
    const cm = state.chainManagement;
    if (cm.candidatePool.length >= 6) return;
    const tpl = MANAGER_CANDIDATE_TEMPLATES[Math.floor(Math.random() * MANAGER_CANDIDATE_TEMPLATES.length)];
    const variance = () => Math.floor(Math.random() * 9) - 4;
    cm.candidatePool.push({
      id: `cand_${Date.now()}_${Math.floor(Math.random() * 999)}`,
      name: tpl.name,
      title: tpl.title,
      level: Math.random() < 0.25 ? 'bolge' : 'sube',
      skill: Math.max(50, Math.min(96, tpl.skill + variance())),
      honesty: Math.max(40, Math.min(98, tpl.honesty + variance())),
      loyalty: Math.max(45, Math.min(98, tpl.loyalty + variance())),
      experience: Math.floor(Math.random() * 14) + 2,
      baseMonthlySalary: Math.round(MANAGEMENT_CONFIG.branchManagerBaseSalary * tpl.salaryMultiplier),
      status: 'atanmamis'
    });
  }

  /**
   * 1.2: Yöneticiyi belirli bir şubeye ('sube') veya coğrafi bölgeye ('bolge') atar.
   */
  public static assignManager(state: GameState, managerId: string, targetId: string): { ok: boolean; msg: string } {
    const cm = state.chainManagement;
    const mgr = cm.managers.find((m) => m.id === managerId);
    if (!mgr) return { ok: false, msg: 'Yönetici bulunamadı.' };

    // Önceki atamasını temizle
    if (mgr.assignedId) {
      const oldBranch = state.branches.find((b) => b.id === mgr.assignedId);
      if (oldBranch && oldBranch.managerId === mgr.id) {
        oldBranch.managerId = undefined;
      }
    }

    if (!targetId || targetId === 'none') {
      mgr.assignedId = undefined;
      mgr.status = 'atanmamis';
      bus.emit('state:updated', state);
      return { ok: true, msg: `${mgr.name} merkeze çekildi.` };
    }

    if (mgr.level === 'sube') {
      const branch = state.branches.find((b) => b.id === targetId);
      if (!branch) return { ok: false, msg: 'Şube bulunamadı.' };
      if (branch.isFranchise) return { ok: false, msg: 'Franchise bayilerine kendi müdürünüzü atayamazsınız.' };

      // O şubede başka müdür varsa boşa çıkar
      for (const other of cm.managers) {
        if (other.id !== mgr.id && other.level === 'sube' && other.assignedId === branch.id) {
          other.assignedId = undefined;
          other.status = 'atanmamis';
        }
      }

      mgr.assignedId = branch.id;
      mgr.status = 'aktif';
      branch.managerId = mgr.id;
      bus.emit('toast:show', {
        title: `🏪 Şube Müdürü Atandı`,
        text: `${mgr.name} -> ${branch.districtName} şubesinin yönetimini devraldı.`,
        type: 'info'
      });
    } else {
      // Bölge müdürü ataması
      for (const other of cm.managers) {
        if (other.id !== mgr.id && other.level === 'bolge' && other.assignedId === targetId) {
          other.assignedId = undefined;
          other.status = 'atanmamis';
        }
      }
      mgr.assignedId = targetId;
      mgr.status = 'aktif';
      bus.emit('toast:show', {
        title: `🗺️ Bölge Müdürü Atandı`,
        text: `${mgr.name} -> ${targetId} Bölgesi operasyonlarının başına geçti.`,
        type: 'info'
      });
    }

    bus.emit('state:updated', state);
    return { ok: true, msg: 'Atama tamamlandı.' };
  }

  /**
   * 1.2: Yöneticiyi eğitir (yetenek ve sadakat artar).
   */
  public static trainManager(state: GameState, managerId: string): { ok: boolean; msg: string } {
    const mgr = state.chainManagement.managers.find((m) => m.id === managerId);
    if (!mgr) return { ok: false, msg: 'Yönetici bulunamadı.' };

    const cost = Math.round(MANAGEMENT_CONFIG.managerTrainingCostBase * state.finance.inflationIndex);
    if (state.finance.cash < cost) {
      return { ok: false, msg: `Yönetici eğitimi için ${cost.toLocaleString('tr-TR')} ₺ gerekiyor.` };
    }

    state.finance.cash -= cost;
    state.finance.todayStats.operatingCost += cost;
    mgr.skill = Math.min(99, mgr.skill + MANAGEMENT_CONFIG.managerTrainingSkillGain);
    mgr.loyalty = Math.min(99, mgr.loyalty + 6);
    mgr.experience += 3;

    bus.emit('toast:show', {
      title: `🎓 Yönetici Eğitimi Tamamlandı`,
      text: `${mgr.name} yeteneği ${mgr.skill} puana, sadakati %${mgr.loyalty} seviyesine yükseldi.`,
      type: 'success'
    });
    bus.emit('state:updated', state);
    return { ok: true, msg: 'Eğitim tamamlandı.' };
  }

  /**
   * 1.2: Başarılı Şube Müdürünü Bölge Müdürlüğüne terfi ettirir.
   */
  public static promoteManagerToRegional(state: GameState, managerId: string): { ok: boolean; msg: string } {
    const mgr = state.chainManagement.managers.find((m) => m.id === managerId);
    if (!mgr) return { ok: false, msg: 'Yönetici bulunamadı.' };
    if (mgr.level === 'bolge') return { ok: false, msg: 'Bu yönetici zaten Bölge Müdürü seviyesinde.' };

    if (
      mgr.skill < MANAGEMENT_CONFIG.managerPromotionMinSkill ||
      mgr.experience < MANAGEMENT_CONFIG.managerPromotionMinExp
    ) {
      return {
        ok: false,
        msg: `Terfi için en az ${MANAGEMENT_CONFIG.managerPromotionMinSkill} Yetenek ve ${MANAGEMENT_CONFIG.managerPromotionMinExp} Gün deneyim gerekir (Şu an: Yetenek ${mgr.skill}, Deneyim ${mgr.experience}).`
      };
    }

    if (mgr.assignedId) {
      const oldBranch = state.branches.find((b) => b.id === mgr.assignedId);
      if (oldBranch) oldBranch.managerId = undefined;
    }

    mgr.level = 'bolge';
    mgr.title = 'Terfi Eden Bölge Operasyon Müdürü';
    mgr.assignedId = undefined;
    mgr.status = 'atanmamis';
    mgr.baseMonthlySalary = Math.max(
      MANAGEMENT_CONFIG.regionalManagerBaseSalary,
      Math.round(mgr.baseMonthlySalary * 1.35)
    );
    mgr.loyalty = Math.min(100, mgr.loyalty + 12);

    bus.emit('toast:show', {
      title: `🏅 Bölge Müdürlüğüne Terfi: ${mgr.name}!`,
      text: `${mgr.name} artık bir coğrafi bölgedeki tüm şubeleri koordine edebilir.`,
      type: 'success'
    });
    bus.emit('state:updated', state);
    return { ok: true, msg: `${mgr.name} Bölge Müdürlüğüne terfi etti!` };
  }

  /**
   * 1.2: Yöneticiyi tazminatını ödeyerek işten çıkarır.
   */
  public static fireManager(state: GameState, managerId: string): { ok: boolean; msg: string } {
    const cm = state.chainManagement;
    const idx = cm.managers.findIndex((m) => m.id === managerId);
    if (idx === -1) return { ok: false, msg: 'Yönetici bulunamadı.' };
    const mgr = cm.managers[idx];

    const severance = Math.round(
      mgr.baseMonthlySalary * MANAGEMENT_CONFIG.managerSeveranceMonths * state.finance.inflationIndex
    );
    state.finance.cash -= severance;
    state.finance.todayStats.operatingCost += severance;

    if (mgr.assignedId) {
      const br = state.branches.find((b) => b.id === mgr.assignedId);
      if (br) br.managerId = undefined;
    }

    if (mgr.isFamily && mgr.familyMemberId) {
      const fm = state.family.members.find((f) => f.id === mgr.familyMemberId);
      if (fm) {
        fm.worksInShop = false;
        fm.roleInShop = undefined;
        fm.happiness = Math.max(20, fm.happiness - 18);
      }
    }

    cm.managers.splice(idx, 1);
    bus.emit('toast:show', {
      title: `Yönetici Görevden Alındı: ${mgr.name}`,
      text: `Kıdem tazminatı olarak ${severance.toLocaleString('tr-TR')} ₺ ödendi.`,
      type: 'warning'
    });
    bus.emit('state:updated', state);
    return { ok: true, msg: 'Yönetici işten çıkarıldı.' };
  }

  /**
   * 1.2: Şube veya bölge müdürünü teftiş eder (zimmet varsa yakalar ve paranın %75'ini kurtarır).
   */
  public static auditManagerOrBranch(state: GameState, branchId: string): { ok: boolean; msg: string } {
    const branch = state.branches.find((b) => b.id === branchId);
    if (!branch) return { ok: false, msg: 'Şube bulunamadı.' };
    const inf = state.finance.inflationIndex;

    if (branch.isFranchise) {
      // Faz 5: Bayi denetimi
      const cost = Math.round(MANAGEMENT_CONFIG.franchiseAuditCostBase * inf);
      if (state.finance.cash < cost) return { ok: false, msg: 'Denetim için yeterli nakit yok.' };
      state.finance.cash -= cost;
      state.finance.todayStats.operatingCost += cost;

      branch.hygiene = Math.min(96, branch.hygiene + 12);
      branch.neighborhoodReputation = Math.min(98, branch.neighborhoodReputation + 3);
      branch.franchiseViolations = 0;
      ReputationSystem.syncReputations(state);
      bus.emit('toast:show', {
        title: `🔍 Bayi Denetimi Tamamlandı (${branch.districtName})`,
        text: `Hijyen standartları %${Math.round(branch.hygiene)} seviyesine çekildi ve kalite eksikleri giderildi.`,
        type: 'success'
      });
      bus.emit('state:updated', state);
      return { ok: true, msg: 'Bayi denetlendi.' };
    }

    const cost = Math.round(MANAGEMENT_CONFIG.auditCostBase * inf);
    if (state.finance.cash < cost) {
      return { ok: false, msg: `Teftiş için ${cost.toLocaleString('tr-TR')} ₺ nakit gerekiyor.` };
    }
    state.finance.cash -= cost;
    state.finance.todayStats.operatingCost += cost;

    const mgr = state.chainManagement.managers.find(
      (m) => m.id === branch.managerId || (m.level === 'sube' && m.assignedId === branch.id)
    );

    if (mgr && (mgr.embezzledTotal || 0) > 0) {
      const recovered = Math.round((mgr.embezzledTotal || 0) * 0.8);
      state.finance.cash += recovered;
      mgr.embezzledTotal = 0;
      mgr.honesty = Math.min(95, mgr.honesty + 15);
      bus.emit('toast:show', {
        title: `🚨 Zimmet Yakalandı: ${mgr.name}!`,
        text: `Müfettişler kasa açığını tespit etti! +${recovered.toLocaleString('tr-TR')} ₺ tahsil edildi.`,
        type: 'danger'
      });
    } else {
      branch.hygiene = Math.min(96, branch.hygiene + 8);
      bus.emit('toast:show', {
        title: `✅ Teftiş Temiz Çıktı: ${branch.districtName}`,
        text: `Hesaplar kuruşu kuruşuna tam. Denetim disiplini şube hijyenini +8 artırdı.`,
        type: 'success'
      });
    }

    bus.emit('state:updated', state);
    return { ok: true, msg: 'Teftiş tamamlandı.' };
  }

  /**
   * Faz 5: İhlal yapan bayiyi resmen uyarır.
   */
  public static warnFranchiseBranch(state: GameState, branchId: string): { ok: boolean; msg: string } {
    const branch = state.branches.find((b) => b.id === branchId && b.isFranchise);
    if (!branch) return { ok: false, msg: 'Bayi bulunamadı.' };

    branch.hygiene = Math.min(92, branch.hygiene + 9);
    branch.franchiseViolations = Math.max(0, (branch.franchiseViolations || 0) - 1);
    bus.emit('toast:show', {
      title: `⚠️ Bayiye Resmi İhtar Çekildi (${branch.districtName})`,
      text: `Bayi mutfak temizliğini düzeltti (Hijyen: %${Math.round(branch.hygiene)}).`,
      type: 'warning'
    });
    bus.emit('state:updated', state);
    return { ok: true, msg: 'Bayi uyarıldı.' };
  }

  /**
   * 1.4: Karar Bekleyenler Kutusundaki bir talebi Onaylar veya Reddeder.
   */
  public static resolvePendingDecision(state: GameState, decisionId: string, approve: boolean): { ok: boolean; msg: string } {
    const cm = state.chainManagement;
    const idx = cm.pendingDecisions.findIndex((d) => d.id === decisionId);
    if (idx === -1) return { ok: false, msg: 'Karar kaydı bulunamadı.' };

    const dec = cm.pendingDecisions[idx];
    const branch = dec.branchId ? state.branches.find((b) => b.id === dec.branchId) : undefined;
    const mgr = dec.managerId ? cm.managers.find((m) => m.id === dec.managerId) : undefined;

    if (approve) {
      if (dec.cost > 0 && state.finance.cash < dec.cost) {
        return { ok: false, msg: `Onaylamak için ${dec.cost.toLocaleString('tr-TR')} ₺ nakit gerekiyor.` };
      }
      if (dec.cost > 0) {
        state.finance.cash -= dec.cost;
        state.finance.todayStats.operatingCost += dec.cost;
      }

      if (dec.category === 'maas_zammi' && mgr) {
        mgr.baseMonthlySalary = Math.round(mgr.baseMonthlySalary * 1.15);
        mgr.loyalty = Math.min(100, mgr.loyalty + 20);
      } else if (dec.category === 'butce' && branch) {
        branch.hygiene = Math.min(98, branch.hygiene + 14);
        branch.neighborhoodReputation = Math.min(100, branch.neighborhoodReputation + 4);
      } else if (dec.category === 'kira_yenileme' && branch) {
        branch.neighborhoodReputation = Math.min(100, branch.neighborhoodReputation + 3);
      } else if (dec.category === 'personel' && branch) {
        branch.staffCount = Math.min(6, branch.staffCount + 1);
      } else if (dec.category === 'bayi_ihlal' && branch) {
        branch.hygiene = Math.min(95, branch.hygiene + 16);
        branch.franchiseViolations = 0;
      } else if (dec.category === 'kriz') {
        state.reputation.countryReputation = Math.min(100, state.reputation.countryReputation + 2);
      }
    } else {
      // Reddedildiğinde
      if (dec.category === 'maas_zammi' && mgr) {
        mgr.loyalty = Math.max(15, mgr.loyalty - 16);
      } else if (dec.category === 'butce' && branch) {
        branch.hygiene = Math.max(35, branch.hygiene - 6);
      } else if (dec.category === 'bayi_ihlal' && branch) {
        branch.neighborhoodReputation = Math.max(20, branch.neighborhoodReputation - 5);
      }
    }

    cm.pendingDecisions.splice(idx, 1);
    ReputationSystem.syncReputations(state);
    bus.emit('state:updated', state);
    return {
      ok: true,
      msg: approve ? `Onaylandı: ${dec.title}` : `Reddedildi: ${dec.title}`
    };
  }

  /**
   * 1.4: Karar Bekleyenler kutusundaki tüm kararları tek tıkla toplu onaylar veya reddeder.
   */
  public static resolveAllPendingDecisions(state: GameState, approve: boolean): void {
    const ids = state.chainManagement.pendingDecisions.map((d) => d.id);
    for (const id of ids) {
      this.resolvePendingDecision(state, id, approve);
    }
    bus.emit('toast:show', {
      title: approve ? '✅ Tüm Talepler Onaylandı' : '❌ Tüm Talepler Reddedildi',
      text: `${ids.length} adet bekleyen yönetim kararı işlendi.`,
      type: approve ? 'success' : 'warning'
    });
  }

  /**
   * 1.4: Toplu İşlem — Tüm şubelerin menü fiyatlarını seçilen politikaya göre senkronize eder.
   */
  public static applyBulkPriceSync(state: GameState, mode: PricePolicyMode): void {
    const inf = state.finance.inflationIndex;
    state.chainManagement.chainPolicy.pricePolicy = mode;

    const applyToMenu = (menu: any, hoodType: string) => {
      const hood = NEIGHBORHOOD_TYPES.find((n) => n.id === hoodType) || NEIGHBORHOOD_TYPES[0];
      const hoodMult =
        mode === 'mahalle_dinamik'
          ? hood.id === 'turistik_merkez'
            ? 1.15
            : hood.id === 'universite_mahallesi'
              ? 0.92
              : 1.02
          : mode === 'enflasyon_takip'
            ? 1.0
            : 0.94;

      for (const rec of RECIPES) {
        if (menu[rec.id]) {
          menu[rec.id].price = Math.max(25, Math.round(rec.baseSuggestedPrice * inf * hoodMult));
        }
      }
    };

    applyToMenu(state.menu, state.player.neighborhoodType);
    for (const b of state.branches) {
      if (b.snapshot?.menu) {
        applyToMenu(b.snapshot.menu, b.neighborhoodType);
      }
    }

    bus.emit('toast:show', {
      title: `🏷️ Tüm Zincir Fiyatları Senkronize Edildi`,
      text: `Fiyat politikası "${mode.toUpperCase()}" olarak tüm şubelere uygulandı.`,
      type: 'success'
    });
    bus.emit('state:updated', state);
  }

  /**
   * Faz 3: Merkez Depo & Soğuk Zincir Üssü kurar veya 2. seviyeye yükseltir.
   */
  public static buildOrUpgradeCentralWarehouse(state: GameState, provinceId?: string): { ok: boolean; msg: string } {
    const wh = state.chainManagement.warehouse;
    const inf = state.finance.inflationIndex;

    if (!wh.built) {
      const cost = Math.round(MANAGEMENT_CONFIG.warehouseInvestmentCostBase * inf);
      if (state.finance.cash < cost) {
        return { ok: false, msg: `Merkez Depo yatırımı için ${cost.toLocaleString('tr-TR')} ₺ nakit gerekiyor.` };
      }
      state.finance.cash -= cost;
      state.finance.todayStats.operatingCost += cost;

      wh.built = true;
      wh.level = 1;
      wh.provinceId = provinceId || state.branches[0]?.provinceId || 'istanbul';
      wh.bulkDiscountPct = MANAGEMENT_CONFIG.warehouseBulkDiscountPctLevel1;
      wh.coldChainReductionPct = MANAGEMENT_CONFIG.warehouseColdChainReductionPct;

      state.storyLog.push({
        day: state.time.day,
        title: `🏭 Merkez Depo & Soğuk Zincir Üssü Kuruldu!`,
        text: `Tüm şubelerde hammadde alım maliyeti %${Math.round(wh.bulkDiscountPct * 100)}, uzak şehir soğuk zincir nakliyesi %${Math.round(wh.coldChainReductionPct * 100)} düştü!`
      });
      bus.emit('toast:show', {
        title: `🏭 Merkez Depo Hizmete Girdi!`,
        text: `Toplu alım indirimi (%${Math.round(wh.bulkDiscountPct * 100)}) ve soğuk zincir lojistik tasarrufu aktif!`,
        type: 'success'
      });
      bus.emit('state:updated', state);
      return { ok: true, msg: 'Merkez Depo kuruldu!' };
    }

    if (wh.level >= 2) {
      return { ok: false, msg: 'Merkez Depo zaten maksimum (Seviye 2 - Ulusal Entegre Tesis) kapasitede.' };
    }

    const upCost = Math.round(MANAGEMENT_CONFIG.warehouseUpgradeCostBase * inf);
    if (state.finance.cash < upCost) {
      return { ok: false, msg: `Seviye 2 Entegre Tesis yükseltmesi için ${upCost.toLocaleString('tr-TR')} ₺ gerekiyor.` };
    }

    state.finance.cash -= upCost;
    state.finance.todayStats.operatingCost += upCost;
    wh.level = 2;
    wh.bulkDiscountPct = MANAGEMENT_CONFIG.warehouseBulkDiscountPctLevel2;
    wh.coldChainReductionPct = 0.65;

    bus.emit('toast:show', {
      title: `🏭 Seviye 2 Ulusal Et & Lojistik Üssü!`,
      text: `Toplu hammadde indirimi %${Math.round(wh.bulkDiscountPct * 100)} seviyesine yükseldi!`,
      type: 'success'
    });
    bus.emit('state:updated', state);
    return { ok: true, msg: 'Merkez Depo Seviye 2 oldu!' };
  }

  /**
   * Faz 6: Marka Pazarlama Kampanyası başlatır (Mahalle / Şehir / Ülke).
   */
  public static startBrandCampaign(state: GameState, campaignId: string): { ok: boolean; msg: string } {
    const def = BRAND_CAMPAIGNS.find((c) => c.id === campaignId);
    if (!def) return { ok: false, msg: 'Kampanya bulunamadı.' };

    const inf = state.finance.inflationIndex;
    const cost = Math.round(def.baseCost * inf);
    if (state.finance.cash < cost) {
      return { ok: false, msg: `Kampanya bütçesi için ${cost.toLocaleString('tr-TR')} ₺ gerekiyor.` };
    }

    state.finance.cash -= cost;
    state.finance.todayStats.operatingCost += cost;

    const activeBranch = state.branches.find((b) => b.id === state.activeBranchId) || state.branches[0];
    const targetId =
      def.scope === 'mahalle'
        ? activeBranch.id
        : def.scope === 'sehir'
          ? activeBranch.provinceId
          : 'turkiye';

    // İtibar artışı ve sosyal medya viral şansı
    const isViral = Math.random() < def.viralChance;
    const finalBoost = isViral ? Math.round(def.repBoost * 1.65) : Math.round(def.repBoost);

    if (def.scope === 'mahalle') {
      state.shop.reputation = Math.min(100, state.shop.reputation + finalBoost);
      activeBranch.neighborhoodReputation = Math.min(100, activeBranch.neighborhoodReputation + finalBoost);
    } else if (def.scope === 'sehir') {
      const pId = activeBranch.provinceId;
      state.reputation.cityReputations[pId] = Math.min(100, (state.reputation.cityReputations[pId] || 55) + finalBoost);
      for (const b of state.branches) {
        if (b.provinceId === pId) {
          b.neighborhoodReputation = Math.min(100, b.neighborhoodReputation + Math.round(finalBoost * 0.7));
        }
      }
    } else {
      state.reputation.countryReputation = Math.min(100, state.reputation.countryReputation + finalBoost);
      for (const b of state.branches) {
        b.neighborhoodReputation = Math.min(100, b.neighborhoodReputation + Math.round(finalBoost * 0.6));
      }
    }

    state.chainManagement.activeCampaigns.push({
      campaignId: def.id,
      name: isViral ? `🔥 VİRAL: ${def.name}` : def.name,
      scope: def.scope,
      targetId,
      daysRemaining: def.durationDays,
      demandBonusPct: isViral ? def.demandBonusPct * 1.4 : def.demandBonusPct
    });

    ReputationSystem.syncReputations(state);
    bus.emit('toast:show', {
      title: isViral ? `🔥 Kampanya Sosyal Medyada VİRAL Oldu!` : `📣 Kampanya Başladı: ${def.name}`,
      text: `+${finalBoost} İtibar kazanıldı ve ${def.durationDays} gün boyunca müşteri talebi +%${Math.round(def.demandBonusPct * 100)} arttı!`,
      type: 'success'
    });
    bus.emit('state:updated', state);
    return { ok: true, msg: 'Kampanya başlatıldı!' };
  }

  /**
   * 1.4: Sadece sorunlu/kritik şubeleri filtreleyen Alarm Listesini üretir.
   */
  public static getTroubledBranchAlerts(state: GameState): BranchAlertItem[] {
    const alerts: BranchAlertItem[] = [];
    const cm = state.chainManagement;

    for (const b of state.branches) {
      if (b.hygiene < 55) {
        alerts.push({
          branchId: b.id,
          branchName: b.name,
          severity: b.hygiene < 40 ? 'danger' : 'warning',
          reason: `Hijyen kritik seviyede (%${Math.round(b.hygiene)}). Skandal riski yüksek!`
        });
      }
      if (b.todayNetProfit < -500) {
        alerts.push({
          branchId: b.id,
          branchName: b.name,
          severity: 'danger',
          reason: `Bugün ${Math.round(b.todayNetProfit).toLocaleString('tr-TR')} ₺ zarar ediyor.`
        });
      }
      if (b.stockHealthPct < 45) {
        alerts.push({
          branchId: b.id,
          branchName: b.name,
          severity: 'warning',
          reason: `Stok seviyesi düşük (%${b.stockHealthPct}).`
        });
      }
      if (!b.isHeadquarters && !b.isFranchise && !b.managerId && state.branches.length >= 3) {
        alerts.push({
          branchId: b.id,
          branchName: b.name,
          severity: 'warning',
          reason: `Şube Müdürü atanmamış! Verim -%16 düşüyor ve hijyen hızlı eriyor.`
        });
      }
      if (b.isFranchise && (b.franchiseViolations || 0) > 0) {
        alerts.push({
          branchId: b.id,
          branchName: b.name,
          severity: 'danger',
          reason: `Bayi kalite standartlarını ${b.franchiseViolations} kez ihlal etti! Denetleyin veya uyarın.`
        });
      }
    }

    for (const m of cm.managers) {
      if (m.loyalty < MANAGEMENT_CONFIG.resignationLoyaltyThreshold) {
        alerts.push({
          branchId: m.assignedId || 'branch_hq',
          branchName: m.name,
          severity: 'warning',
          reason: `Yönetici sadakati düşük (%${m.loyalty}). İstifa veya rakibe transfer riski var!`
        });
      }
    }

    return alerts;
  }

  /**
   * Gün sonunda müdürlerin otomatik stok/fiyat/hijyen işlemlerini yürütür,
   * yetki limitini aşan talepleri `Karar Bekleyenler` kutusuna düşürür ve Yönetim Raporunu yazar.
   */
  public static runDailyManagementCycle(state: GameState): void {
    this.checkAndAdvanceManagementTier(state);
    const cm = state.chainManagement;
    const inf = state.finance.inflationIndex;

    // 1. Aktif kampanya ve tedarik krizi gün sayaçlarını azalt
    cm.activeCampaigns = cm.activeCampaigns
      .map((c) => ({ ...c, daysRemaining: c.daysRemaining - 1 }))
      .filter((c) => c.daysRemaining > 0);

    if (cm.warehouse.supplyCrisisDaysLeft > 0) {
      cm.warehouse.supplyCrisisDaysLeft -= 1;
    }
    if (cm.rivalPriceWarDaysLeft > 0) {
      cm.rivalPriceWarDaysLeft -= 1;
    }

    // 2. Zincir fiyat politikası 'enflasyon_takip' veya 'mahalle_dinamik' ise fiyatları güncel tut
    if (cm.chainPolicy.pricePolicy !== 'sabit' && state.branches.length >= 2) {
      this.applyBulkPriceSync(state, cm.chainPolicy.pricePolicy);
    }

    // 3. Müdürlerin deneyim, sadakat, zimmet ve otomatik şube bakımı
    for (const mgr of cm.managers) {
      if (!mgr.assignedId) continue;
      mgr.experience += 1;

      // Düşük dürüstlüklü müdür gizlice zimmetine para geçirebilir (teftişle yakalanır)
      if (!mgr.isFamily && mgr.honesty < MANAGEMENT_CONFIG.embezzlementHonestyThreshold) {
        if (Math.random() < 0.25) {
          const stolen = Math.round(550 * inf);
          state.finance.cash -= stolen;
          mgr.embezzledTotal = (mgr.embezzledTotal || 0) + stolen;
        }
      }

      // Sadakat kontrolü: çok düşükse zam talebi oluşturur
      if (
        mgr.loyalty < MANAGEMENT_CONFIG.resignationLoyaltyThreshold &&
        !cm.pendingDecisions.some((d) => d.managerId === mgr.id && d.category === 'maas_zammi')
      ) {
        const raiseCost = Math.round(mgr.baseMonthlySalary * 0.15 * inf);
        cm.pendingDecisions.push({
          id: `dec_raise_${mgr.id}_${state.time.day}`,
          dayCreated: state.time.day,
          managerId: mgr.id,
          branchId: mgr.level === 'sube' ? mgr.assignedId : undefined,
          category: 'maas_zammi',
          title: `👔 Yönetici Zam Talebi: ${mgr.name}`,
          description: `${mgr.name} (Yetenek: ${mgr.skill}, Sadakat: %${mgr.loyalty}) rakip bir zincirden teklif aldığını belirterek %15 maaş artışı talep ediyor.`,
          cost: raiseCost,
          approveEffectSummary: `Sadakat +20 artar, maaş +${raiseCost.toLocaleString('tr-TR')} ₺ güncellenir.`,
          rejectEffectSummary: `Sadakat -16 düşer, istifa riski doğar.`
        });
      }
    }

    // 4. Şubelerin politikaya göre otomatik stok, hijyen ve karar kutusu üretimi
    for (const b of state.branches) {
      if (b.isFranchise) {
        // Faz 5: Bayilerde zaman zaman kalite/hijyen gevşemesi yaşanabilir
        if (Math.random() < 0.18) {
          b.hygiene = Math.max(42, b.hygiene - 12);
          if (b.hygiene < 65) {
            b.franchiseViolations = (b.franchiseViolations || 0) + 1;
            if (!cm.pendingDecisions.some((d) => d.branchId === b.id && d.category === 'bayi_ihlal')) {
              const auditCost = Math.round(MANAGEMENT_CONFIG.franchiseAuditCostBase * inf);
              cm.pendingDecisions.push({
                id: `dec_fran_${b.id}_${state.time.day}`,
                dayCreated: state.time.day,
                branchId: b.id,
                category: 'bayi_ihlal',
                title: `◆ Bayi Kalite İhlali: ${b.districtName}`,
                description: `${b.name} şubesinde ucuz yağ kullanımı ve hijyen düşüşü (%${Math.round(b.hygiene)}) tespit edildi.`,
                cost: auditCost,
                approveEffectSummary: `Müfettiş gönderilir (${auditCost.toLocaleString('tr-TR')} ₺), hijyen +16 düzelir.`,
                rejectEffectSummary: `Müdahale edilmez, mahalle itibarı -5 düşer.`
              });
            }
          }
        }
        continue;
      }

      const policy = this.getEffectivePolicy(state, b);
      const mgr = cm.managers.find((m) => m.id === b.managerId || (m.level === 'sube' && m.assignedId === b.id));

      // Otomatik stok yenileme
      if (b.stockHealthPct < policy.autoOrderThreshold || mgr) {
        const restockCost = Math.round(620 * inf * (1 - (cm.warehouse.built ? cm.warehouse.bulkDiscountPct : 0)));
        const limit = Math.round(policy.spendingLimitBase * inf);
        if (restockCost <= limit && state.finance.cash >= restockCost) {
          state.finance.cash -= restockCost;
          state.finance.todayStats.ingredientCost += restockCost;
          b.stockHealthPct = 94;
          if (b.id === state.activeBranchId) {
            for (const ing of INGREDIENTS) {
              if (state.inventory[ing.id]) {
                state.inventory[ing.id].amount = Math.max(state.inventory[ing.id].amount, ing.startingStock);
                state.inventory[ing.id].supplierTier = policy.supplierTier;
              }
            }
          }
        }
      }

      // Hijyen standardı otomatik bakımı
      const targetHyg = MANAGEMENT_CONFIG.hygienePolicyTargetFloor[policy.hygieneStandard];
      if (mgr && b.hygiene < targetHyg) {
        const hygCost = Math.round(MANAGEMENT_CONFIG.hygienePolicyDailyCostBase[policy.hygieneStandard] * inf);
        state.finance.cash -= hygCost;
        state.finance.todayStats.operatingCost += hygCost;
        b.hygiene = Math.min(98, Math.max(b.hygiene, targetHyg));
      }

      // Müdürün yetki limitini aşan harcama talebi (Karar Bekleyenler kutusuna düşer)
      if (mgr && cm.pendingDecisions.length < 6 && Math.random() < 0.22) {
        const eqCost = Math.round((policy.spendingLimitBase * 1.45) * inf);
        cm.pendingDecisions.push({
          id: `dec_eq_${b.id}_${state.time.day}`,
          dayCreated: state.time.day,
          branchId: b.id,
          managerId: mgr.id,
          category: 'butce',
          title: `🔧 Ekipman & Havalandırma Yenileme (${b.districtName})`,
          description: `${mgr.name}, harcama yetki limitini (${Math.round(policy.spendingLimitBase * inf).toLocaleString('tr-TR')} ₺) aşan davlumbaz ve tezgah bakımı için onay istiyor.`,
          cost: eqCost,
          approveEffectSummary: `${b.districtName} hijyen +14, mahalle itibarı +4 artar.`,
          rejectEffectSummary: `Bakım ertelenir, hijyen -6 düşer.`
        });
      }
    }

    // 5. Faz 3 & Faz 4: Rastgele Tedarik Krizi veya Rakip Fiyat Savaşı tetiklemesi (büyük zincirlerde)
    if (state.branches.length >= 3 && Math.random() < 0.16 && cm.warehouse.supplyCrisisDaysLeft === 0) {
      cm.warehouse.supplyCrisisDaysLeft = 2;
      cm.warehouse.supplyCrisisTitle = 'Kırmızı Et & Soğuk Zincir Nakliye Gecikmesi (+%14 Maliyet)';
      if (cm.warehouse.built) {
        // Merkez depo krizi yarı yarıya amorti eder
        cm.warehouse.supplyCrisisDaysLeft = 1;
        cm.warehouse.supplyCrisisTitle = 'Tedarik Gecikmesi (Merkez Depo Stoklarıyla Korumalı)';
      }
    }

    if (state.branches.length >= 2 && Math.random() < 0.18 && cm.rivalPriceWarDaysLeft === 0) {
      const rival = LOCAL_RIVAL_CHAINS[Math.floor(Math.random() * LOCAL_RIVAL_CHAINS.length)];
      cm.rivalPriceWarDaysLeft = 3;
      bus.emit('toast:show', {
        title: `⚔️ Rakip Hamlesi: ${rival.name}!`,
        text: `${rival.homeRegion} bölgesinde agresif fiyat indirimi başlattı. Genel Merkez sekmesinden karşı stratejinizi seçin!`,
        type: 'warning'
      });
    }

    // 6. Günlük Birleşik Yönetim Raporu kaydı
    const alerts = this.getTroubledBranchAlerts(state);
    const totalProfit = state.branches.reduce((s, b) => s + b.todayNetProfit, 0);
    const managedCount = state.branches.filter((b) => Boolean(b.managerId)).length;
    const franchiseCount = state.branches.filter((b) => Boolean(b.isFranchise)).length;

    cm.executiveReports.unshift({
      day: state.time.day,
      summaryText: `Gün ${state.time.day}: ${state.branches.length} lokasyonda (${managedCount} müdürlü, ${franchiseCount} bayi) toplam ${Math.round(totalProfit).toLocaleString('tr-TR')} ₺ net zincir kârı elde edildi. ${alerts.length} alarm mevcut.`,
      totalBranches: state.branches.length,
      totalFranchises: franchiseCount,
      managedBranches: managedCount,
      totalNetProfit: Math.round(totalProfit),
      alertsCount: alerts.length
    });
    if (cm.executiveReports.length > 14) {
      cm.executiveReports.length = 14;
    }
  }
}
