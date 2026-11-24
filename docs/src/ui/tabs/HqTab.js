// ============================================================================
// 🏢 GENEL MERKEZ SEKMESİ (HqTab.ts)
// İstisna Odaklı Yönetim Paneli: Karar Bekleyenler, Alarm Listesi, Müdürler,
// Politika & Otomasyon, Merkez Depo, Marka Kampanyaları ve Sıralanabilir Şube Tablosu
// ============================================================================


import { ManagementSystem } from '../../core/ManagementSystem.js';
import { BranchSystem } from '../../core/BranchSystem.js';
import {
  MANAGEMENT_CONFIG,
  BRAND_CAMPAIGNS,
  LOCAL_RIVAL_CHAINS,
  REGIONAL_CULTURE_MODIFIERS
} from '../../data/management.js';
import { TURKEY_PROVINCES } from '../../data/turkey_map.js';

export class HqTab {
  static branchSortKey: 'profit' | 'revenue' | 'customers' | 'rep' | 'hygiene' = 'profit';
  static branchSortAsc = false;

  static render(container, engine, onSwitchTab) {
    const st = engine.state;
    const cm = st.chainManagement;
    const inf = st.finance.inflationIndex;
    ManagementSystem.checkAndAdvanceManagementTier(st);

    const alerts = ManagementSystem.getTroubledBranchAlerts(st);
    const pending = cm.pendingDecisions || [];
    const totalChainProfit = st.branches.reduce((s, b) => s + b.todayNetProfit, 0);
    const totalChainRev = st.branches.reduce((s, b) => s + b.todayRevenue, 0);
    const managedCount = st.branches.filter((b) => Boolean(b.managerId)).length;
    const franchiseCount = st.branches.filter((b) => Boolean(b.isFranchise)).length;
    const companyBranches = st.branches.filter((b) => !b.isFranchise);

    const tierBadge =
      cm.tier === 'holding'
        ? `<span class="badge badge-warning">🏛️ 3. Kademe: HOLDİNG DÖNEMİ (6+ Şube • Bölge Müdürleri & Merkez Depo)</span>`
        : cm.tier === 'mudur'
          ? `<span class="badge badge-info">👔 2. Kademe: MÜDÜR DÖNEMİ (3-5 Şube • Şube Müdürleri & Otomasyon)</span>`
          : `<span class="badge badge-neutral">👨‍🍳 1. Kademe: USTA DÖNEMİ (1-2 Şube • Doğrudan İşletme)</span>`;

    const regions = [
      'Marmara',
      'Ege',
      'İç Anadolu',
      'Akdeniz',
      'Karadeniz',
      'Doğu Anadolu',
      'Güneydoğu Anadolu'
    ];

    // Sıralanabilir şube karşılaştırma listesi (Faz 2)
    const sortedBranches = [...st.branches].sort((a, b) => {
      let va = a.todayNetProfit;
      let vb = b.todayNetProfit;
      if (this.branchSortKey === 'revenue') {
        va = a.todayRevenue;
        vb = b.todayRevenue;
      } else if (this.branchSortKey === 'customers') {
        va = a.todayCustomers;
        vb = b.todayCustomers;
      } else if (this.branchSortKey === 'rep') {
        va = a.neighborhoodReputation;
        vb = b.neighborhoodReputation;
      } else if (this.branchSortKey === 'hygiene') {
        va = a.hygiene;
        vb = b.hygiene;
      }
      return this.branchSortAsc ? va - vb : vb - va;
    });

    // 18+ aile çocukları (Yönetici yapılabilir)
    const eligibleChildren = st.family.members.filter(
      (f) => f.age >= 18 && !cm.managers.some((m) => m.familyMemberId === f.id)
    );

    const wh = cm.warehouse;
    const whCost = Math.round(
      (wh.built ? MANAGEMENT_CONFIG.warehouseUpgradeCostBase : MANAGEMENT_CONFIG.warehouseInvestmentCostBase) * inf
    );

    container.innerHTML = `
      <div class="panel-scroll">
        <!-- ÜST HOLDİNG ÖZET BARI -->
        <div class="section-header" style="flex-wrap:wrap;gap:10px;">
          <div>
            <h2 class="section-title">🏢 Genel Merkez, Delegasyon & Zincir Komuta Paneli</h2>
            <p class="section-subtitle">
              Şube sayısı arttıkça mikro yönetimden makro yönetime geçin: Müdür atayın, politika koyun ve yalnızca istisnaları onaylayın.
            </p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            ${tierBadge}
            <span class="badge badge-success">Net Zincir Kârı: ${Math.round(totalChainProfit).toLocaleString('tr-TR')} ₺/gün</span>
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-box">
            <span class="kpi-label">TOPLAM LOKASYON</span>
            <span class="kpi-value" style="color:var(--sky);">${st.branches.length} (${companyBranches.length} Öz Şube • ${franchiseCount} Bayi)</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">DELEGASYON & MÜDÜR</span>
            <span class="kpi-value" style="color:var(--accent-secondary);">${managedCount}/${companyBranches.length} Şube Müdürlü (${cm.managers.length} Yönetici)</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">KARAR BEKLEYEN / ALARM</span>
            <span class="kpi-value" style="color:${pending.length + alerts.length > 0 ? 'var(--warning)' : 'var(--success)'};">
              ${pending.length} Karar • ${alerts.length} Alarm
            </span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">MERKEZ DEPO & LOJİSTİK</span>
            <span class="kpi-value" style="color:${wh.built ? 'var(--success)' : 'var(--text-secondary)'};">
              ${wh.built ? `Seviye ${wh.level} (-%${Math.round(wh.bulkDiscountPct * 100)} Alım)` : 'Kurulmadı'}
            </span>
          </div>
        </div>

        <!-- 1.4: KARAR BEKLEYENLER KUTUSU VE ALARM LİSTESİ -->
        <div class="dashboard-2col">
          <!-- SOL: KARAR BEKLEYENLER KUTUSU -->
          <div class="game-card" style="border-color:rgba(245,199,107,0.45);">
            <div class="card-head">
              <span class="card-title">📥 Karar Bekleyenler Kutusu (${pending.length})</span>
              ${
                pending.length > 0
                  ? `
                <div style="display:flex;gap:6px;">
                  <button class="btn btn-success btn-sm" id="btn-hq-approve-all">✅ Tümünü Onayla</button>
                  <button class="btn btn-danger btn-sm" id="btn-hq-reject-all">❌ Tümünü Reddet</button>
                </div>
              `
                  : `<span class="badge badge-success">Bekleyen Talep Yok</span>`
              }
            </div>
            <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:8px;">
              Müdürlerin harcama yetki limitini (${Math.round(cm.chainPolicy.spendingLimitBase * inf).toLocaleString('tr-TR')} ₺) aşan talepleri, maaş zamları ve bayi kalite ihlalleri buraya düşer.
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;" data-inner-scroll="hq-pending">
              ${
                pending.length === 0
                  ? `<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:0.84rem;">Şu an onayınızı bekleyen bir yönetici veya şube talebi bulunmuyor. Müdürleriniz yetki limiti dahilindeki günlük işleri otomatik yürütüyor.</div>`
                  : pending
                      .map(
                        (d) => `
                  <div style="padding:10px;border-radius:10px;background:var(--bg-elevated);border:1px solid var(--border-color);display:flex;flex-direction:column;gap:6px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <strong style="color:var(--accent-secondary);font-size:0.86rem;">${d.title}</strong>
                      <span class="badge badge-warning">${d.cost > 0 ? `${d.cost.toLocaleString('tr-TR')} ₺` : 'Bedelsiz'}</span>
                    </div>
                    <div style="font-size:0.78rem;color:var(--text-primary);">${d.description}</div>
                    <div style="font-size:0.73rem;color:var(--text-secondary);">
                      <span style="color:var(--success);">Onay: ${d.approveEffectSummary}</span> •
                      <span style="color:var(--danger);">Red: ${d.rejectEffectSummary}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                      <button class="btn btn-success btn-sm" data-decision-approve="${d.id}">✅ Onayla</button>
                      <button class="btn btn-outline btn-sm" data-decision-reject="${d.id}">❌ Reddet</button>
                    </div>
                  </div>
                `
                      )
                      .join('')
              }
            </div>
          </div>

          <!-- SAĞ: ALARM LİSTESİ VE BİRLEŞİK YÖNETİM RAPORU -->
          <div class="game-card">
            <div class="card-head">
              <span class="card-title">🚨 Sorunlu Şube Alarm Listesi (${alerts.length})</span>
              <span class="badge ${alerts.length > 0 ? 'badge-danger' : 'badge-success'}">${alerts.length > 0 ? 'Müdahale Gerekli' : 'Tüm Şubeler Stabil'}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;max-height:165px;overflow-y:auto;" data-inner-scroll="hq-alerts">
              ${
                alerts.length === 0
                  ? `<div style="padding:12px;text-align:center;color:var(--success);font-size:0.82rem;">✨ Tüm şube ve bayilerde hijyen, stok ve kârlılık hedeflenen aralıkta!</div>`
                  : alerts
                      .map(
                        (a) => `
                  <div style="padding:8px 10px;border-radius:8px;background:rgba(240,93,94,0.08);border-left:3px solid ${a.severity === 'danger' ? 'var(--danger)' : 'var(--warning)'};display:flex;justify-content:space-between;align-items:center;gap:8px;">
                    <div>
                      <div style="font-weight:800;font-size:0.8rem;">${a.branchName}</div>
                      <div style="font-size:0.75rem;color:var(--text-secondary);">${a.reason}</div>
                    </div>
                    <button class="btn btn-outline btn-sm" data-hq-audit="${a.branchId}">🔍 Teftiş / Müdahale</button>
                  </div>
                `
                      )
                      .join('')
              }
            </div>

            <div style="border-top:1px solid var(--border-color);padding-top:8px;margin-top:6px;">
              <div style="font-size:0.78rem;font-weight:800;color:var(--accent-secondary);margin-bottom:4px;">📋 Günlük Birleşik Yönetim Raporu</div>
              <div style="display:flex;flex-direction:column;gap:4px;max-height:95px;overflow-y:auto;font-size:0.75rem;color:var(--text-secondary);">
                ${
                  cm.executiveReports.length === 0
                    ? `<div>Gün sonu kapanışında müdürleriniz tek bir birleşik özet rapor sunar.</div>`
                    : cm.executiveReports.slice(0, 4).map((r) => `<div>• ${r.summaryText}</div>`).join('')
                }
              </div>
            </div>
          </div>
        </div>

        <!-- 1.3: POLİTİKA VE OTOMASYON PANELİ + TOPLU İŞLEMLER -->
        <div class="game-card">
          <div class="card-head">
            <span class="card-title">⚙️ Zincir Otomasyon Politikaları & Toplu İşlemler</span>
            <span class="badge badge-info">Genel -> Bölge -> Şube Hiyerarşisi</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;">
            <div class="form-group">
              <label class="form-label">Fiyat Politikası (Tüm Şubeler)</label>
              <select id="hq-policy-price" class="form-select">
                <option value="sabit" ${cm.chainPolicy.pricePolicy === 'sabit' ? 'selected' : ''}>Sabit Fiyat (Sürüm Odaklı)</option>
                <option value="enflasyon_takip" ${cm.chainPolicy.pricePolicy === 'enflasyon_takip' ? 'selected' : ''}>Enflasyona Göre Otomatik Güncelle</option>
                <option value="mahalle_dinamik" ${cm.chainPolicy.pricePolicy === 'mahalle_dinamik' ? 'selected' : ''}>Mahalle Alım Gücüne Göre Dinamik (%8 Marj)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Hijyen Standardı</label>
              <select id="hq-policy-hygiene" class="form-select">
                <option value="dusuk" ${cm.chainPolicy.hygieneStandard === 'dusuk' ? 'selected' : ''}>Düşük (Ucuz Bakım • Skandal Riski)</option>
                <option value="normal" ${cm.chainPolicy.hygieneStandard === 'normal' ? 'selected' : ''}>Normal (%80+ Hedef • Dengeli)</option>
                <option value="yuksek" ${cm.chainPolicy.hygieneStandard === 'yuksek' ? 'selected' : ''}>Yüksek (%93+ Beyaz Önlük • Sıfır Risk)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Otomatik Tedarik Kalitesi</label>
              <select id="hq-policy-supplier" class="form-select">
                <option value="ucuz" ${cm.chainPolicy.supplierTier === 'ucuz' ? 'selected' : ''}>Ekonomik Hal (Düşük Maliyet)</option>
                <option value="standart" ${cm.chainPolicy.supplierTier === 'standart' ? 'selected' : ''}>Standart Esnaf Tedariki</option>
                <option value="kaliteli" ${cm.chainPolicy.supplierTier === 'kaliteli' ? 'selected' : ''}>1. Sınıf Seçme Çiftlik (+İtibar)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Müdür Onaysız Harcama Limiti (Baz ₺)</label>
              <select id="hq-policy-limit" class="form-select">
                <option value="4000" ${cm.chainPolicy.spendingLimitBase === 4000 ? 'selected' : ''}>Sıkı Denetim (${Math.round(4000 * inf).toLocaleString('tr-TR')} ₺)</option>
                <option value="8000" ${cm.chainPolicy.spendingLimitBase === 8000 ? 'selected' : ''}>Dengeli Yetki (${Math.round(8000 * inf).toLocaleString('tr-TR')} ₺)</option>
                <option value="18000" ${cm.chainPolicy.spendingLimitBase === 18000 ? 'selected' : ''}>Geniş Otonomi (${Math.round(18000 * inf).toLocaleString('tr-TR')} ₺)</option>
              </select>
            </div>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
            <button class="btn btn-primary btn-sm" id="btn-hq-save-policy">💾 Politikayı Kaydet & Tüm Zincire Uygula</button>
            <button class="btn btn-outline btn-sm" id="btn-hq-sync-prices">🏷️ Tüm Şube Fiyatlarını Şimdi Senkronla</button>
          </div>
        </div>

        <!-- 1.2: YÖNETİCİ (ŞUBE MÜDÜRÜ & BÖLGE MÜDÜRÜ) KADROSU VE ADAY HAVUZU -->
        <div class="dashboard-2col">
          <!-- MEVCUT YÖNETİCİLERİMİZ -->
          <div class="game-card">
            <div class="card-head">
              <span class="card-title">👔 Yönetici Kadrosu (${cm.managers.length})</span>
              <span class="badge badge-info">Şube Müdürü -> Bölge Müdürü Terfi</span>
            </div>
            ${
              eligibleChildren.length > 0
                ? `
              <div style="padding:8px 10px;border-radius:8px;background:var(--accent-soft);border:1px solid var(--accent-primary);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
                <span style="font-size:0.78rem;font-weight:700;">👨‍👩‍👧‍👦 Yetişkin çocuğunuz yüksek sadakatle Şube Müdürü olabilir:</span>
                <div style="display:flex;gap:6px;">
                  ${eligibleChildren
                    .map(
                      (ch) =>
                        `<button class="btn btn-primary btn-sm" data-appoint-family="${ch.id}">👑 ${ch.name} (${ch.age}) Müdür Yap</button>`
                    )
                    .join('')}
                </div>
              </div>
            `
                : ''
            }
            <div style="display:flex;flex-direction:column;gap:8px;max-height:330px;overflow-y:auto;" data-inner-scroll="hq-managers">
              ${
                cm.managers.length === 0
                  ? `<div style="padding:14px;text-align:center;color:var(--text-muted);font-size:0.83rem;">Henüz işe alınmış bir Şube veya Bölge Müdürünüz yok. Sağdaki aday havuzundan yönetici işe alarak şubelerinizi otopilota geçirin ve holding genel giderinde %42 organizasyon indirimi kazanın!</div>`
                  : cm.managers
                      .map((m) => {
                        const salaryNow = Math.round(m.baseMonthlySalary * inf);
                        const canPromote =
                          m.level === 'sube' &&
                          m.skill >= MANAGEMENT_CONFIG.managerPromotionMinSkill &&
                          m.experience >= MANAGEMENT_CONFIG.managerPromotionMinExp;

                        return `
                        <div style="padding:10px;border-radius:10px;background:var(--bg-elevated);border:1px solid var(--border-color);display:flex;flex-direction:column;gap:6px;">
                          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
                            <div>
                              <strong style="font-size:0.88rem;color:var(--accent-secondary);">${m.name}</strong>
                              <span class="badge ${m.level === 'bolge' ? 'badge-warning' : 'badge-info'}" style="margin-left:6px;">
                                ${m.level === 'bolge' ? '🗺️ Bölge Müdürü' : '🏪 Şube Müdürü'}
                              </span>
                              ${m.isFamily ? `<span class="badge badge-success">Aileden</span>` : ''}
                            </div>
                            <span style="font-size:0.78rem;font-weight:800;">Maaş: ${salaryNow.toLocaleString('tr-TR')} ₺/ay</span>
                          </div>
                          <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:0.76rem;color:var(--text-secondary);">
                            <span>⭐ Yetenek: <strong>${m.skill}</strong></span>
                            <span>⚖️ Dürüstlük: <strong style="color:${m.honesty < 55 ? 'var(--danger)' : 'var(--success)'};">%${m.honesty}</strong></span>
                            <span>❤️ Sadakat: <strong style="color:${m.loyalty < 45 ? 'var(--warning)' : 'var(--success)'};">%${m.loyalty}</strong></span>
                            <span>📅 Deneyim: <strong>${m.experience} gün</strong></span>
                          </div>
                          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                            <select class="form-select" data-mgr-assign="${m.id}" style="flex:1;min-width:170px;padding:4px 8px;font-size:0.78rem;">
                              <option value="none">-- Atanmamış (Merkezde Bekliyor) --</option>
                              ${
                                m.level === 'sube'
                                  ? companyBranches
                                      .map(
                                        (b) =>
                                          `<option value="${b.id}" ${m.assignedId === b.id ? 'selected' : ''}>🏪 ${b.provinceName} - ${b.districtName}</option>`
                                      )
                                      .join('')
                                  : regions
                                      .map(
                                        (reg) =>
                                          `<option value="${reg}" ${m.assignedId === reg ? 'selected' : ''}>🗺️ ${reg} Bölgesi</option>`
                                      )
                                      .join('')
                              }
                            </select>
                            <button class="btn btn-outline btn-sm" data-mgr-train="${m.id}" title="Yetenek +8, Sadakat +6">🎓 Eğit (${Math.round(MANAGEMENT_CONFIG.managerTrainingCostBase * inf).toLocaleString('tr-TR')} ₺)</button>
                            ${
                              m.level === 'sube'
                                ? `<button class="btn btn-primary btn-sm" data-mgr-promote="${m.id}" ${canPromote ? '' : 'disabled'} title="Yetenek ${MANAGEMENT_CONFIG.managerPromotionMinSkill}+ ve Deneyim ${MANAGEMENT_CONFIG.managerPromotionMinExp}+ gün gerekir">🏅 Bölge Müdürü Yap</button>`
                                : ''
                            }
                            <button class="btn btn-danger btn-sm" data-mgr-fire="${m.id}">Kov</button>
                          </div>
                        </div>
                      `;
                      })
                      .join('')
              }
            </div>
          </div>

          <!-- ADAY HAVUZU -->
          <div class="game-card">
            <div class="card-head">
              <span class="card-title">📋 Yönetici Aday Havuzu</span>
              <span class="badge badge-neutral">İşe Alım Bedeli: ${Math.round(MANAGEMENT_CONFIG.managerHiringFeeBase * inf).toLocaleString('tr-TR')} ₺</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;max-height:330px;overflow-y:auto;" data-inner-scroll="hq-candidates">
              ${cm.candidatePool
                .map((c) => {
                  const sal = Math.round(c.baseMonthlySalary * inf);
                  return `
                  <div style="padding:10px;border-radius:10px;background:var(--bg-elevated);border:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                    <div>
                      <div>
                        <strong style="font-size:0.86rem;">${c.name}</strong>
                        <span class="badge ${c.level === 'bolge' ? 'badge-warning' : 'badge-info'}" style="margin-left:4px;">
                          ${c.level === 'bolge' ? 'Bölge Müdürü Adayı' : 'Şube Müdürü Adayı'}
                        </span>
                      </div>
                      <div style="font-size:0.74rem;color:var(--text-secondary);">${c.title} • Maaş: ${sal.toLocaleString('tr-TR')} ₺/ay</div>
                      <div style="font-size:0.74rem;color:var(--text-secondary);margin-top:2px;">
                        Yetenek: <strong>${c.skill}</strong> • Dürüstlük: <strong>%${c.honesty}</strong> • Sadakat: <strong>%${c.loyalty}</strong>
                      </div>
                    </div>
                    <button class="btn btn-success btn-sm" data-mgr-hire="${c.id}">👔 İşe Al</button>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>
        </div>

        <!-- FAZ 3: MERKEZ DEPO & SOĞUK ZİNCİR + FAZ 6: MARKA KAMPANYALARI & REKABET -->
        <div class="dashboard-2col">
          <!-- MERKEZ DEPO & TEDARİK ZİNCİRİ -->
          <div class="game-card">
            <div class="card-head">
              <span class="card-title">🏭 Merkez Depo & Soğuk Zincir Üssü (Faz 3)</span>
              <span class="badge ${wh.built ? 'badge-success' : 'badge-warning'}">${wh.built ? `Seviye ${wh.level} Aktif` : 'Yatırım Bekliyor'}</span>
            </div>
            <div style="font-size:0.8rem;color:var(--text-secondary);">
              Merkez Depo ve Et İşleme Üssü kurulduğunda tüm şubelerinizin hammadde maliyeti toplu alımla <strong>%16 - %26</strong> ucuzlar ve uzak illerdeki soğuk zincir lojistik gideri <strong>%45 - %65</strong> düşer.
            </div>
            ${
              wh.supplyCrisisDaysLeft > 0
                ? `<div class="badge badge-danger" style="padding:8px;margin-top:6px;">⚠️ Aktif Tedarik Krizi: ${wh.supplyCrisisTitle} (${wh.supplyCrisisDaysLeft} gün kaldı)</div>`
                : ''
            }
            <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div style="font-size:0.78rem;">
                Günlük Bakım: <strong>${Math.round(MANAGEMENT_CONFIG.warehouseDailyMaintenanceBase * Math.max(1, wh.level) * inf).toLocaleString('tr-TR')} ₺/gün</strong>
              </div>
              ${
                wh.level < 2
                  ? `<button class="btn btn-primary btn-sm" id="btn-hq-warehouse">
                      🏭 ${wh.built ? 'Seviye 2 Ulusal Entegre Üsse Yükselt' : 'Merkez Depo & Soğuk Zincir Kur'} (${whCost.toLocaleString('tr-TR')} ₺)
                    </button>`
                  : `<span class="badge badge-success">✓ Maksimum Kapasite (Seviye 2 Ulusal Üs)</span>`
              }
            </div>
          </div>

          <!-- MARKA PAZARLAMA KAMPANYALARI & RAKİP STRATEJİSİ -->
          <div class="game-card">
            <div class="card-head">
              <span class="card-title">📣 Marka Kampanyaları & Rakip Savaşı (Faz 4 & 6)</span>
              ${
                cm.rivalPriceWarDaysLeft > 0
                  ? `<span class="badge badge-danger">⚔️ Fiyat Savaşı (${cm.rivalPriceWarDaysLeft}g)</span>`
                  : `<span class="badge badge-info">${cm.activeCampaigns.length} Aktif Kampanya</span>`
              }
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${BRAND_CAMPAIGNS.map((camp) => {
                const cCost = Math.round(camp.baseCost * inf);
                return `
                  <div style="padding:7px 10px;border-radius:8px;background:var(--bg-elevated);border:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                    <div>
                      <div style="font-weight:800;font-size:0.8rem;">${camp.name} <span class="badge badge-info">${camp.scope.toUpperCase()}</span></div>
                      <div style="font-size:0.73rem;color:var(--text-secondary);">+${camp.repBoost} İtibar • +%${Math.round(camp.demandBonusPct * 100)} Müşteri (${camp.durationDays} Gün • %${Math.round(camp.viralChance * 100)} Viral Şansı)</div>
                    </div>
                    <button class="btn btn-primary btn-sm" data-start-campaign="${camp.id}">Başlat (${cCost.toLocaleString('tr-TR')} ₺)</button>
                  </div>
                `;
              }).join('')}
            </div>
            <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;font-size:0.76rem;">
              <span>⚔️ Rakip Zincirlere Karşı Duruş:</span>
              <select id="hq-rival-stance" class="form-select" style="width:auto;padding:4px 8px;font-size:0.76rem;">
                <option value="kalite" ${cm.rivalCounterStance === 'kalite' ? 'selected' : ''}>Kaliteyi Koru (İtibar Odaklı)</option>
                <option value="fiyat_kir" ${cm.rivalCounterStance === 'fiyat_kir' ? 'selected' : ''}>Fiyat Kırarak Karşılık Ver (Müşteri Kaybını Önler)</option>
                <option value="kampanya" ${cm.rivalCounterStance === 'kampanya' ? 'selected' : ''}>Agresif Promosyon & İkram</option>
              </select>
            </div>
          </div>
        </div>

        <!-- FAZ 2 & FAZ 5: TÜM ŞUBE VE BAYİLERİN SIRALANABİLİR KARŞILAŞTIRMA TABLOSU -->
        <div class="game-card">
          <div class="card-head" style="flex-wrap:wrap;gap:8px;">
            <span class="card-title">📊 Tüm Şube & Bayi Karşılaştırma Tablosu (Sıralamak İçin Başlığa Tıklayın)</span>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm" data-hq-sort="profit">Kâr/Zarar ${this.branchSortKey === 'profit' ? (this.branchSortAsc ? '↑' : '↓') : ''}</button>
              <button class="btn btn-outline btn-sm" data-hq-sort="revenue">Ciro ${this.branchSortKey === 'revenue' ? (this.branchSortAsc ? '↑' : '↓') : ''}</button>
              <button class="btn btn-outline btn-sm" data-hq-sort="customers">Müşteri ${this.branchSortKey === 'customers' ? (this.branchSortAsc ? '↑' : '↓') : ''}</button>
              <button class="btn btn-outline btn-sm" data-hq-sort="rep">İtibar ${this.branchSortKey === 'rep' ? (this.branchSortAsc ? '↑' : '↓') : ''}</button>
              <button class="btn btn-outline btn-sm" data-hq-sort="hygiene">Hijyen ${this.branchSortKey === 'hygiene' ? (this.branchSortAsc ? '↑' : '↓') : ''}</button>
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.79rem;">
              <thead>
                <tr style="border-bottom:1px solid var(--border-color);color:var(--text-secondary);text-align:left;">
                  <th style="padding:8px;">Şube / Bayi</th>
                  <th style="padding:8px;">Tür & Bölge</th>
                  <th style="padding:8px;">Atanan Müdür</th>
                  <th style="padding:8px;">Müşteri</th>
                  <th style="padding:8px;">Günlük Ciro</th>
                  <th style="padding:8px;">Giderler</th>
                  <th style="padding:8px;">Net Kâr</th>
                  <th style="padding:8px;">İtibar / Hijyen</th>
                  <th style="padding:8px;">İşlem</th>
                </tr>
              </thead>
              <tbody>
                ${sortedBranches
                  .map((b) => {
                    const mgr = cm.managers.find((m) => m.id === b.managerId || (m.level === 'sube' && m.assignedId === b.id));
                    const exp = b.todayIngredientCost + b.todayRentAndTax + b.todayLogisticsCost + b.todayStaffCost;
                    return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                      <td style="padding:8px;font-weight:800;">
                        ${b.isFranchise ? '◆' : '★'} ${b.provinceName} - ${b.districtName}
                        ${b.id === st.activeBranchId ? `<span class="badge badge-success">Aktif</span>` : ''}
                      </td>
                      <td style="padding:8px;">
                        <span class="badge ${b.isFranchise ? 'badge-warning' : 'badge-info'}">${b.isFranchise ? `Bayi (%${b.franchiseRoyaltyPct || 10} Pay)` : b.isHeadquarters ? 'Merkez Şube' : 'Öz Şube'}</span>
                        <span style="font-size:0.72rem;color:var(--text-secondary);margin-left:4px;">${b.regionName || 'Marmara'}</span>
                      </td>
                      <td style="padding:8px;">
                        ${
                          b.isFranchise
                            ? `<span style="color:var(--text-muted);">Bayi İşletmecisi</span>`
                            : mgr
                              ? `<span style="color:var(--accent-secondary);font-weight:700;">👔 ${mgr.name} (${mgr.skill})</span>`
                              : `<span style="color:var(--warning);">Atanmadı</span>`
                        }
                      </td>
                      <td style="padding:8px;">${b.todayCustomers}</td>
                      <td style="padding:8px;">${Math.round(b.todayRevenue).toLocaleString('tr-TR')} ₺</td>
                      <td style="padding:8px;color:var(--danger);">${b.isFranchise ? '0 ₺ (Bayi Öder)' : `-${Math.round(exp).toLocaleString('tr-TR')} ₺`}</td>
                      <td style="padding:8px;font-weight:800;color:${b.todayNetProfit >= 0 ? 'var(--success)' : 'var(--danger)'};">
                        ${b.todayNetProfit >= 0 ? '+' : ''}${Math.round(b.todayNetProfit).toLocaleString('tr-TR')} ₺
                      </td>
                      <td style="padding:8px;">${b.neighborhoodReputation}★ • %${Math.round(b.hygiene)}🧼</td>
                      <td style="padding:8px;display:flex;gap:4px;flex-wrap:wrap;">
                        ${
                          b.isFranchise
                            ? `
                              <button class="btn btn-outline btn-sm" data-hq-audit="${b.id}">Denetle</button>
                              <button class="btn btn-outline btn-sm" data-hq-warn-fran="${b.id}">Uyar</button>
                              <button class="btn btn-danger btn-sm" data-hq-close-branch="${b.id}">Feshet</button>
                            `
                            : `
                              ${b.id !== st.activeBranchId ? `<button class="btn btn-primary btn-sm" data-hq-switch-branch="${b.id}">Yönet</button>` : ''}
                              <button class="btn btn-outline btn-sm" data-hq-audit="${b.id}">Teftiş</button>
                              ${!b.isHeadquarters ? `<button class="btn btn-danger btn-sm" data-hq-close-branch="${b.id}">Kapat</button>` : ''}
                            `
                        }
                      </td>
                    </tr>
                  `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container, engine, onSwitchTab);
  }

  static bindEvents(container, engine, onSwitchTab) {
    const st = engine.state;

    // Karar kutusu tekil onay/red
    container.querySelectorAll('[data-decision-approve]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-decision-approve') || '';
        ManagementSystem.resolvePendingDecision(st, id, true);
      });
    });
    container.querySelectorAll('[data-decision-reject]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-decision-reject') || '';
        ManagementSystem.resolvePendingDecision(st, id, false);
      });
    });

    // Toplu onay/red
    container.querySelector('#btn-hq-approve-all')?.addEventListener('click', () => {
      ManagementSystem.resolveAllPendingDecisions(st, true);
    });
    container.querySelector('#btn-hq-reject-all')?.addEventListener('click', () => {
      ManagementSystem.resolveAllPendingDecisions(st, false);
    });

    // Politika kaydetme
    container.querySelector('#btn-hq-save-policy')?.addEventListener('click', () => {
      const pricePol = (container.querySelector('#hq-policy-price'))?.value;
      const hygPol = (container.querySelector('#hq-policy-hygiene'))?.value;
      const supPol = (container.querySelector('#hq-policy-supplier'))?.value;
      const limitVal = Number((container.querySelector('#hq-policy-limit'))?.value) || 8000;

      st.chainManagement.chainPolicy.pricePolicy = pricePol || 'enflasyon_takip';
      st.chainManagement.chainPolicy.hygieneStandard = hygPol || 'normal';
      st.chainManagement.chainPolicy.supplierTier = supPol || 'standart';
      st.chainManagement.chainPolicy.spendingLimitBase = limitVal;

      ManagementSystem.applyBulkPriceSync(st, st.chainManagement.chainPolicy.pricePolicy);
    });

    container.querySelector('#btn-hq-sync-prices')?.addEventListener('click', () => {
      const pricePol = (container.querySelector('#hq-policy-price'))?.value;
      ManagementSystem.applyBulkPriceSync(st, pricePol || st.chainManagement.chainPolicy.pricePolicy);
    });

    // Yönetici işe alma, atama, eğitim, terfi, kovma
    container.querySelectorAll('[data-mgr-hire]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-mgr-hire') || '';
        ManagementSystem.hireManagerFromPool(st, id);
      });
    });

    container.querySelectorAll('[data-appoint-family]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-appoint-family') || '';
        ManagementSystem.appointFamilyChildAsManager(st, id);
      });
    });

    container.querySelectorAll('[data-mgr-assign]').forEach((sel) => {
      sel.addEventListener('change', () => {
        const mgrId = (sel).getAttribute('data-mgr-assign') || '';
        const targetId = (sel).value;
        ManagementSystem.assignManager(st, mgrId, targetId);
      });
    });

    container.querySelectorAll('[data-mgr-train]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-mgr-train') || '';
        ManagementSystem.trainManager(st, id);
      });
    });

    container.querySelectorAll('[data-mgr-promote]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-mgr-promote') || '';
        ManagementSystem.promoteManagerToRegional(st, id);
      });
    });

    container.querySelectorAll('[data-mgr-fire]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-mgr-fire') || '';
        ManagementSystem.fireManager(st, id);
      });
    });

    // Merkez depo kur/yükselt
    container.querySelector('#btn-hq-warehouse')?.addEventListener('click', () => {
      ManagementSystem.buildOrUpgradeCentralWarehouse(st);
    });

    // Marka kampanyası başlat
    container.querySelectorAll('[data-start-campaign]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-start-campaign') || '';
        ManagementSystem.startBrandCampaign(st, id);
      });
    });

    // Rakip karşı duruş
    const rivalSel = container.querySelector('#hq-rival-stance');
    rivalSel?.addEventListener('change', () => {
      st.chainManagement.rivalCounterStance = (rivalSel.value || 'kalite');
    });

    // Şube tablo sıralama
    container.querySelectorAll('[data-hq-sort]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = (btn).getAttribute('data-hq-sort');
        if (this.branchSortKey === key) {
          this.branchSortAsc = !this.branchSortAsc;
        } else {
          this.branchSortKey = key;
          this.branchSortAsc = false;
        }
        this.render(container, engine, onSwitchTab);
      });
    });

    // Teftiş / Denetim / Bayi uyarı / Şube geçiş / Kapatma
    container.querySelectorAll('[data-hq-audit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-hq-audit') || '';
        ManagementSystem.auditManagerOrBranch(st, id);
      });
    });

    container.querySelectorAll('[data-hq-warn-fran]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-hq-warn-fran') || '';
        ManagementSystem.warnFranchiseBranch(st, id);
      });
    });

    container.querySelectorAll('[data-hq-switch-branch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-hq-switch-branch') || '';
        if (BranchSystem.switchActiveBranch(st, id)) {
          onSwitchTab('dukkan');
        }
      });
    });

    container.querySelectorAll('[data-hq-close-branch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-hq-close-branch') || '';
        BranchSystem.closeOrSellBranch(st, id);
      });
    });
  }
}
