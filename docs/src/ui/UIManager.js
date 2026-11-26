// ============================================================================
// ANA ARAYÜZ YÖNETİCİSİ (UIManager) - Sosyal Çevre Menüsü, Organik Olaylar & Scroll Koruma
// ============================================================================


import { bus } from '../core/EventBus.js';
import { SaveManager } from '../core/SaveManager.js';
import { SetupModal } from './SetupModal.js';
import { ChartRenderer } from '../render/ChartRenderer.js';
import { FURNITURE_CATALOG, WALL_STYLES, FLOOR_STYLES, SHOP_UPGRADES } from '../data/furniture.js';
import { INGREDIENTS, SUPPLIER_TIERS } from '../data/ingredients.js';
import { RECIPES } from '../data/recipes.js';
import { STREET_NPCS } from '../data/npcs.js';
import { ACHIEVEMENTS, INVESTMENT_CATALOG, LOAN_PACKAGES } from '../data/achievements.js';
import { SPECIAL_CALENDAR_DAYS } from '../data/events.js';
import { NEIGHBORHOOD_TYPES } from '../data/scenarios.js';
import { TURKEY_PROVINCES, getDistrictsForProvince } from '../data/turkey_map.js';
import { ReputationSystem } from '../core/ReputationSystem.js';
import { QuestSystem } from '../core/QuestSystem.js';
import { BranchSystem } from '../core/BranchSystem.js';
import { ManagementSystem } from '../core/ManagementSystem.js';
import { MapRenderer } from '../render/MapRenderer.js';
import { HqTab } from './tabs/HqTab.js';
import { QuestsTab } from './tabs/QuestsTab.js';
import { LedgerTab } from './tabs/LedgerTab.js';
import { SettingsTab } from './tabs/SettingsTab.js';
import { MapTab } from './tabs/MapTab.js';
import { ShopTab } from './tabs/ShopTab.js';
import { StreetTab } from './tabs/StreetTab.js';
import { MenuTab } from './tabs/MenuTab.js';
import { InventoryTab } from './tabs/InventoryTab.js';
import { StaffTab } from './tabs/StaffTab.js';
import { FamilyTab } from './tabs/FamilyTab.js';
import { FinanceTab } from './tabs/FinanceTab.js';


export class UIManager {
  root;
  engine;
  activeTab = 'dukkan';
  shopSubTab = 'operasyon';
  financeSubTab = 'yatirim';
  menuCategoryFilter = 'tumu';
  selectedStreetNpcId = STREET_NPCS[0].id;
  tickCounter = 0;

  constructor(root, engine) {
    this.root = root;
    this.engine = engine;

    this.subscribeEvents();
    this.boot();
  }

  subscribeEvents() {
    bus.on('time:tick', () => {
      this.tickCounter += 1;
      this.updateTopBarLive();
      if (this.activeTab === 'dukkan' && this.shopSubTab === 'operasyon' && this.tickCounter % 6 === 0) {
        this.updateLiveDashboardCharts();
      }
    });
    bus.on('state:updated', () => {
      this.updateTopBarLive();
      this.updateNavHighlight();
      this.renderActiveTab(true); // Scroll pozisyonunu koruyarak güncelle!
    });
    bus.on('toast:show', (payload) => this.showToast(payload.title, payload.text, payload.type));
    bus.on('event:triggered', (ev) => this.showRandomEventModal(ev));
    bus.on('day:finished', (entry) => this.showEndOfDayModal(entry));
  }

  boot() {
    document.documentElement.setAttribute('data-theme', this.engine.state.theme || 'dark');

    if (!this.engine.state.initialized) {
      SetupModal.render(this.root, this.engine, () => {
        this.renderMainShell();
      });
    } else {
      this.engine.startLoop();
      this.renderMainShell();
    }
  }

  formatClock(minuteOfDay) {
    const totalMin = Math.floor(minuteOfDay);
    const hh = String(Math.floor(totalMin / 60)).padStart(2, '0');
    const mm = String(totalMin % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  getPhaseLabel(phase) {
    const map = {
      sabah_hazirlik: 'Sabah Hazırlık',
      acilis: 'Açılış Servisi',
      ogle_yogunlugu: 'Öğle Yoğunluğu',
      aksam_servisi: 'Akşam Servisi',
      kapanis: 'Kapanış & Hesap'
    };
    return map[phase] || phase;
  }

  // ==========================================================================
  // ANA İSKELET (ÜST BAR, YATAY PİLL MENÜ, İÇERİK ALANI)
  // ==========================================================================

  renderMainShell() {
    const st = this.engine.state;
    document.documentElement.setAttribute('data-theme', st.theme);
    const repHud = ReputationSystem.getHudReputationInfo(st, this.activeTab);

    this.root.innerHTML = `
      <header class="top-bar">
        <div class="brand-cluster">
          <div>
            <span class="brand-live-tag">CANLI • TÜRKİYE BAYİLEŞME & ESNAF SİMÜLASYONU</span>
            <div class="brand-logo" id="top-shop-title">🌯 ${st.shop.name}</div>
          </div>
          ${
            (st.branches?.length || 1) > 1
              ? `
            <select id="top-branch-switcher" class="form-select" style="padding:4px 10px;font-size:0.78rem;border-radius:999px;background:var(--bg-card);border-color:var(--accent-secondary);">
              ${st.branches
                .map(
                  (b) =>
                    `<option value="${b.id}" ${b.id === st.activeBranchId ? 'selected' : ''}>🏪 ${b.provinceName} • ${b.districtName} (${b.neighborhoodReputation}★)</option>`
                )
                .join('')}
            </select>
          `
              : `<span class="brand-sub" id="top-player-tag">${st.player.name} (${st.player.age}) • ${st.player.city}</span>`
          }
        </div>

        <div class="stats-cluster">
          <div class="stat-pill money" title="Kasadaki Nakit Para">
            <span class="stat-label">KASA</span>
            <span class="stat-val" id="top-cash">${Math.round(st.finance.cash).toLocaleString('tr-TR')} ₺</span>
          </div>
          <div class="stat-pill" style="border-color:rgba(245,199,107,0.4);" title="${repHud.secondarySummary}">
            <span class="stat-label" id="top-rep-label" style="color:var(--accent-secondary);">${repHud.contextLabel}</span>
            <span class="stat-val" id="top-rep">${repHud.primaryValue}</span>
          </div>
          <div class="stat-pill" title="Aktif Şube Sayısı / Görevlerle Açılan Maksimum Şube Hakkı">
            <span class="stat-label">ŞUBE</span>
            <span class="stat-val" id="top-branches" style="color:var(--sky);">${st.branches?.length || 1}/${st.quests?.maxAllowedBranches === 99 ? '∞' : st.quests?.maxAllowedBranches || 1}</span>
          </div>
          <div class="stat-pill inflation" title="Güncel Enflasyon Endeksi">
            <span class="stat-label">ENFLASYON</span>
            <span class="stat-val" id="top-inflation">x${st.finance.inflationIndex.toFixed(2)}</span>
          </div>
          <div class="stat-pill" title="Aktif Şube Hijyen Puanı">
            <span class="stat-label">HİJYEN</span>
            <span class="stat-val" id="top-hyg">%${Math.round(st.shop.hygiene)}</span>
          </div>
          <div class="stat-pill" title="Usta Enerjisi">
            <span class="stat-label">ENERJİ</span>
            <span class="stat-val" id="top-energy">%${Math.round(st.player.energy)}</span>
          </div>
        </div>

        <div class="time-cluster">
          <div class="clock-box">
            <span class="clock-date" id="top-date">📅 Gün ${st.time.day} • ${st.time.season} (Yıl ${st.time.year})</span>
            <span class="clock-time" id="top-clock">${this.formatClock(st.time.minuteOfDay)} • ${this.getPhaseLabel(st.time.phase)}</span>
          </div>
          <div class="speed-controls">
            <button class="speed-btn ${st.time.speed === 0 ? 'active' : ''}" data-speed="0" title="Duraklat">⏸</button>
            <button class="speed-btn ${st.time.speed === 1 ? 'active' : ''}" data-speed="1">1x</button>
            <button class="speed-btn ${st.time.speed === 2 ? 'active' : ''}" data-speed="2">2x</button>
            <button class="speed-btn ${st.time.speed === 4 ? 'active' : ''}" data-speed="4">4x</button>
          </div>
          <button class="speed-btn" id="btn-theme-toggle" title="Tema Değiştir">${st.theme === 'dark' ? '☀️' : '🌙'}</button>
        </div>
      </header>

      <div class="main-workspace">
        <nav class="side-nav" id="side-nav">
          ${this.renderNavButtons()}
        </nav>

        <main class="content-area" id="main-content"></main>
      </div>

      <div class="toast-container" id="toast-container"></div>
      <div id="chart-tooltip" class="chart-floating-tooltip"></div>
      <div id="modal-layer"></div>
    `;

    this.bindShellEvents();
    this.initChartTooltipDelegation();
    this.renderActiveTab(false);
  }

  initChartTooltipDelegation() {
    const tipEl = this.root.querySelector('#chart-tooltip');
    if (!tipEl) return;

    const positionTooltipAtCoords = (clientX, clientY) => {
      const pad = 12;
      const rect = tipEl.getBoundingClientRect();
      let left = clientX + 16;
      let top = clientY - 14;

      if (left + rect.width + pad > window.innerWidth) {
        left = Math.max(pad, clientX - rect.width - 14);
      }
      if (top + rect.height + pad > window.innerHeight) {
        top = Math.max(pad, window.innerHeight - rect.height - pad);
      }
      if (top < pad) top = pad;

      tipEl.style.left = `${left}px`;
      tipEl.style.top = `${top}px`;
    };

    const showTooltipForTarget = (target, clientX, clientY) => {
      const title = target.getAttribute('data-chart-tip-title') || '';
      const linesRaw = target.getAttribute('data-chart-tip-lines') || '';
      const color = target.getAttribute('data-chart-tip-color') || '#f5c76b';
      const lines = linesRaw.split('|').filter(Boolean);

      tipEl.style.borderLeftColor = color;
      tipEl.style.borderColor = color;
      tipEl.innerHTML = `
        <div class="chart-tip-title" style="color:${color};">${title}</div>
        <div class="chart-tip-body">
          ${lines.map((l) => `<div>${l}</div>`).join('')}
        </div>
      `;
      tipEl.classList.add('visible');
      positionTooltipAtCoords(clientX, clientY);
    };

    this.root.addEventListener('mouseover', (e) => {
      const target = (e.target)?.closest?.('[data-chart-tip-title]');
      if (!target) return;
      showTooltipForTarget(target, e.clientX, e.clientY);
    });

    this.root.addEventListener('mousemove', (e) => {
      if (!tipEl.classList.contains('visible')) return;
      const target = (e.target)?.closest?.('[data-chart-tip-title]');
      if (!target) {
        tipEl.classList.remove('visible');
        return;
      }
      positionTooltipAtCoords(e.clientX, e.clientY);
    });

    // Mobil Dokunmatik (Touch) Desteği: Grafik noktasına dokununca detayı açar
    this.root.addEventListener(
      'touchstart',
      (e) => {
        const target = (e.target)?.closest?.('[data-chart-tip-title]');
        if (!target) {
          tipEl.classList.remove('visible');
          return;
        }
        const touch = e.touches[0];
        if (touch) {
          showTooltipForTarget(target, touch.clientX, Math.max(40, touch.clientY - 70));
        }
      },
      { passive: true }
    );

    this.root.addEventListener('mouseout', (e) => {
      const related = e.relatedTarget;
      if (related && !related.closest?.('[data-chart-tip-title]')) {
        tipEl.classList.remove('visible');
      }
    });

    this.root.addEventListener('mouseleave', () => {
      tipEl.classList.remove('visible');
    });
  }

  renderNavButtons() {
    const st = this.engine.state;
    const lowStockCount = Object.values(st.inventory).filter((i) => i.amount < 30).length;
    const activeTierQuests = QuestSystem.getAllQuestStatuses(st, this.engine.getNetWorth()).filter(
      (q) => !q.locked && !q.completed
    ).length;
    const hqAlertCount =
      (st.chainManagement?.pendingDecisions?.length || 0) +
      ManagementSystem.getTroubledBranchAlerts(st).length;

    const tabs = [
      { id: 'dukkan', icon: '📊', label: 'Dükkan & Operasyon' },
      {
        id: 'genel_merkez',
        icon: '🏢',
        label: 'Genel Merkez',
        badge: hqAlertCount > 0 ? `${hqAlertCount} !` : st.chainManagement?.tier?.toUpperCase() || 'USTA'
      },
      { id: 'harita', icon: '🗺️', label: 'Harita & Şubeler', badge: `${st.branches?.length || 1} Şube` },
      { id: 'gorevler', icon: '🎯', label: 'Görevler & Yetki', badge: activeTierQuests > 0 ? activeTierQuests : '✓' },
      { id: 'sokak', icon: '🤝', label: 'Esnaf & Mahalle' },
      { id: 'menu', icon: '🌯', label: 'Menü & Sosyal Çevre' },
      { id: 'depo', icon: '📦', label: 'Depo & Tedarik', badge: lowStockCount > 0 ? lowStockCount : undefined },
      { id: 'personel', icon: '👨‍🍳', label: 'Personel & Paket', badge: st.staff.length || undefined },
      { id: 'aile', icon: '🏠', label: 'Aile & Miras' },
      { id: 'yatirim', icon: '💼', label: 'Yatırım & Banka' },
      { id: 'defter', icon: '📈', label: 'Defter & Analiz' },
      { id: 'ayarlar', icon: '⚙️', label: 'Kayıt & Ayarlar' }
    ];

    return tabs
      .map(
        (t) => `
      <button class="nav-btn ${this.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
        <span class="nav-btn-left">
          <span class="nav-icon">${t.icon}</span>
          <span>${t.label}</span>
        </span>
        ${t.badge !== undefined ? `<span class="nav-badge">${t.badge}</span>` : ''}
      </button>
    `
      )
      .join('');
  }

  bindShellEvents() {
    this.root.querySelectorAll('[data-speed]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const spd = Number((btn).getAttribute('data-speed'));
        this.engine.setSpeed(spd);
        this.root.querySelectorAll('[data-speed]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    const themeBtn = this.root.querySelector('#btn-theme-toggle');
    themeBtn?.addEventListener('click', () => {
      this.engine.state.theme = this.engine.state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', this.engine.state.theme);
      themeBtn.textContent = this.engine.state.theme === 'dark' ? '☀️' : '🌙';
      SaveManager.saveAuto(this.engine.state);
    });

    const branchSwitcher = this.root.querySelector('#top-branch-switcher');
    branchSwitcher?.addEventListener('change', () => {
      BranchSystem.switchActiveBranch(this.engine.state, branchSwitcher.value);
      this.renderMainShell();
    });

    this.bindNavClicks();
  }

  bindNavClicks() {
    this.root.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn).getAttribute('data-tab');
        if (tab && tab !== this.activeTab) {
          this.activeTab = tab;
          this.updateTopBarLive();
          this.updateNavHighlight();
          this.renderActiveTab(false);
        }
      });
    });
  }

  updateNavHighlight() {
    const nav = this.root.querySelector('#side-nav');
    if (nav) {
      nav.innerHTML = this.renderNavButtons();
      this.bindNavClicks();
    }
  }

  updateTopBarLive() {
    // Arka plan sekmesindeyken gereksiz DOM manipülasyonunu atla (Mobil pil tasarrufu)
    if (document.hidden) return;
    const st = this.engine.state;
    const setTxt = (id, val) => {
      const el = this.root.querySelector(id);
      if (el) el.textContent = val;
    };

    const repHud = ReputationSystem.getHudReputationInfo(st, this.activeTab);
    setTxt('#top-shop-title', `🌯 ${st.shop.name}`);
    setTxt('#top-cash', `${Math.round(st.finance.cash).toLocaleString('tr-TR')} ₺`);
    setTxt('#top-inflation', `x${st.finance.inflationIndex.toFixed(2)}`);
    setTxt('#top-rep-label', repHud.contextLabel);
    setTxt('#top-rep', repHud.primaryValue);
    setTxt('#top-branches', `${st.branches?.length || 1}/${st.quests?.maxAllowedBranches === 99 ? '∞' : st.quests?.maxAllowedBranches || 1}`);
    setTxt('#top-hyg', `%${Math.round(st.shop.hygiene)}`);
    setTxt('#top-energy', `%${Math.round(st.player.energy)}`);
    setTxt('#top-clock', `${this.formatClock(st.time.minuteOfDay)} • ${this.getPhaseLabel(st.time.phase)}`);
    setTxt('#top-date', `📅 Gün ${st.time.day} • ${st.time.season} (Yıl ${st.time.year})`);

    this.root.querySelectorAll('[data-speed]').forEach((b) => {
      const spd = Number((b).getAttribute('data-speed'));
      b.classList.toggle('active', spd === st.time.speed);
    });

    if (this.activeTab === 'dukkan') {
      setTxt('#live-today-rev', `${Math.round(st.finance.todayStats.revenue).toLocaleString('tr-TR')} ₺`);
      setTxt('#live-today-profit', `${Math.round(st.finance.todayStats.revenue - st.finance.todayStats.ingredientCost).toLocaleString('tr-TR')} ₺`);
      setTxt('#live-today-cust', `${st.finance.todayStats.customersServed} Servis (${st.finance.todayStats.customersLost} Kaçan)`);
      setTxt('#live-doner-kg', `${st.shop.donerRollKg.toFixed(1)} / ${st.shop.donerMaxKg} kg`);
    }
  }

  updateLiveDashboardCharts() {
    if (document.hidden) return;
    const st = this.engine.state;
    const chartBox = this.root.querySelector('#live-intraday-chart-box');
    // Kullanıcı grafiğin üzerinde imleçle nokta inceliyorsa DOM'u yenileyip tooltip'i kapatma
    if (chartBox && !chartBox.matches(':hover')) {
      chartBox.innerHTML = ChartRenderer.renderIntradayAreaChart(st.finance.hourlyStats);
    }
  }

  renderActiveTab(preserveScroll = true) {
    const content = this.root.querySelector('#main-content');
    if (!content) return;

    // TÜM SEKMELER VE İÇ LİSTELER İÇİN TAM SCROLL KORUMA:
    const oldPanelScroll = content.querySelector('.panel-scroll');
    const prevScroll = preserveScroll && oldPanelScroll ? oldPanelScroll.scrollTop : 0;

    // İç kaydırılabilir kutuların (sokak günlüğü, yorumlar, başarımlar vb.) scroll konumlarını da kaydet
    const innerScrolls = {};
    if (preserveScroll) {
      content.querySelectorAll('[data-inner-scroll]').forEach((el) => {
        const key = el.getAttribute('data-inner-scroll');
        if (key) innerScrolls[key] = (el).scrollTop;
      });
    }

    switch (this.activeTab) {
      case 'dukkan':
        this.renderShopTab(content);
        break;
      case 'genel_merkez':
        HqTab.render(content, this.engine, (nextTab) => {
          this.activeTab = nextTab;
          this.updateTopBarLive();
          this.updateNavHighlight();
          this.renderActiveTab(false);
        });
        break;
      case 'harita':
        this.renderMapAndBranchesTab(content);
        break;
      case 'gorevler':
        this.renderQuestsTab(content);
        break;
      case 'sokak':
        this.renderStreetTab(content);
        break;
      case 'menu':
        this.renderMenuTab(content);
        break;
      case 'depo':
        this.renderInventoryTab(content);
        break;
      case 'personel':
        this.renderStaffTab(content);
        break;
      case 'aile':
        this.renderFamilyTab(content);
        break;
      case 'yatirim':
        this.renderFinanceTab(content);
        break;
      case 'defter':
        this.renderLedgerTab(content);
        break;
      case 'ayarlar':
        this.renderSettingsTab(content);
        break;
    }

    const restoreAllScrolls = () => {
      if (preserveScroll && prevScroll > 0) {
        const nextScrollEl = content.querySelector('.panel-scroll');
        if (nextScrollEl) {
          nextScrollEl.scrollTop = prevScroll;
        }
      }
      if (preserveScroll) {
        content.querySelectorAll('[data-inner-scroll]').forEach((el) => {
          const key = el.getAttribute('data-inner-scroll');
          if (key && innerScrolls[key] !== undefined) {
            (el).scrollTop = innerScrolls[key];
          }
        });
      }
    };

    restoreAllScrolls();
    window.requestAnimationFrame(restoreAllScrolls);
  }

  // ==========================================================================
  // YENİ: 3 SEVİYELİ HARİTA, ŞUBE AÇMA VE ZİNCİR YÖNETİM PANELİ (harita)
  // ==========================================================================

  renderMapAndBranchesTab(container) {
    MapTab.render(this, container);
  }

  // ==========================================================================
  // YENİ: KADEMELİ GÖREV SİSTEMİ VE BAYİLEŞME YETKİ PANELİ (gorevler)
  // ==========================================================================

  renderQuestsTab(container) {
    QuestsTab.render(container, this.engine);
  }

  // ==========================================================================
  // 1. DÜKKAN & OPERASYON MERKEZİ (Organik Olaylar & Gerçekçi Müşteri Yoğunluğu)
  // ==========================================================================

  renderShopTab(container) {
    ShopTab.render(this, container);
  }

  // ==========================================================================
  // 2. ESNAF & MAHALLE (Tamamen Yazılı İlişki, Ortaklık Tablosu & Sokak Halkı)
  // ==========================================================================

  renderStreetTab(container) {
    StreetTab.render(this, container);
  }

  // ==========================================================================
  // 3. MENÜ YÖNETİMİ, SOKAĞIN SOSYAL ÇEVRESİNE GÖRE MENÜ & FİYATLANDIRMA
  // ==========================================================================

  renderMenuTab(container) {
    MenuTab.render(this, container);
  }

  // ==========================================================================
  // 4. DEPO, DENGELİ STOKLAR, OTOMATİK TEDARİK VE DOLULUK GRAFİĞİ
  // ==========================================================================

  renderInventoryTab(container) {
    InventoryTab.render(this, container);
  }

  // ==========================================================================
  // 5. PERSONEL YÖNETİMİ VE ONLİNE PAKET SERVİS
  // ==========================================================================

  renderStaffTab(container) {
    StaffTab.render(this, container);
  }

  // ==========================================================================
  // 6. AİLE SİSTEMİ, EV EKONOMİSİ VE NESİLLER ARASI DEVİR
  // ==========================================================================

  renderFamilyTab(container) {
    FamilyTab.render(this, container);
  }

  // ==========================================================================
  // 7. YATIRIM, ORTAKLIK, VERESİYE DEFTERİ VE BANKA KREDİLERİ
  // ==========================================================================

  renderFinanceTab(container) {
    FinanceTab.render(this, container);
  }

  // ==========================================================================
  // 8. DEFTER, ÇOKLU FİNANS & ENFLASYON GRAFİKLERİ, YORUMLAR VE BAŞARIMLAR
  // ==========================================================================

  renderLedgerTab(container) {
    LedgerTab.render(container, this.engine);
  }

  renderSettingsTab(container) {
    SettingsTab.render(
      container,
      this.root,
      this.engine,
      () => this.renderActiveTab(true),
      () => {
        this.activeTab = 'dukkan';
        this.renderMainShell();
      },
      (title, text, type) => this.showToast(title, text, type)
    );
  }

  showToast(title, text, type = 'info') {
    const container = this.root.querySelector('#toast-container');
    if (!container) return;

    const colors = {
      info: '#63b3ed',
      success: '#38d39f',
      warning: '#f5c76b',
      danger: '#fc8181'
    };

    const toast = document.createElement('div');
    toast.className = 'toast-card';
    toast.style.borderLeftColor = colors[type] || '#f5c76b';
    toast.innerHTML = `
      <div style="font-weight:800;font-size:0.86rem;margin-bottom:2px;">${title}</div>
      <div style="font-size:0.78rem;color:var(--text-secondary);">${text}</div>
    `;
    toast.addEventListener('click', () => toast.remove());
    container.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 4500);
  }

  showRandomEventModal(ev) {
    const layer = this.root.querySelector('#modal-layer');
    if (!layer) return;

    const catLabels = {
      hijyen: '🧼 İnteraktif Hijyen & Denetim Olayı',
      musteri_akisi: '🚶 Sokak & Müşteri Yoğunluğu Olayı',
      esnaf: '🤝 Mahalle Esnaf Olayı',
      aile: '🏠 Aile İçi Karar',
      ekonomi: '📈 Piyasa & Enflasyon Olayı'
    };

    layer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-box" style="max-width:580px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:2.2rem;">${ev.icon}</span>
            <div>
              <span class="badge badge-warning">${catLabels[ev.category] || 'Günlük Olay'}</span>
              <h2 style="font-size:1.25rem;font-weight:900;margin-top:4px;">${ev.title}</h2>
            </div>
          </div>
          <p style="font-size:0.94rem;line-height:1.55;color:var(--text-secondary);background:var(--bg-input);padding:14px 16px;border-radius:10px;border:1px solid var(--border-color);">
            ${ev.description}
          </p>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${ev.choices
              .map(
                (c, idx) => `
              <button class="btn btn-primary" style="justify-content:flex-start;text-align:left;padding:12px 15px;border-radius:10px;" data-ev-choice="${idx}">
                ▸ ${c.label}
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;

    layer.querySelectorAll('[data-ev-choice]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number((btn).getAttribute('data-ev-choice'));
        layer.innerHTML = '';
        this.engine.applyEventChoice(ev.id, idx);
      });
    });
  }

  showEndOfDayModal(entry) {
    const layer = this.root.querySelector('#modal-layer');
    if (!layer) return;

    this.engine.setSpeed(0);

    layer.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-box" style="max-width:540px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h2 style="font-size:1.3rem;font-weight:900;color:var(--accent-secondary);">🌙 Gün ${entry.day} Kapanış Z Raporu</h2>
            <span class="badge badge-info">${entry.dateLabel}</span>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;background:var(--bg-input);padding:14px;border-radius:10px;font-size:0.9rem;">
            <div style="display:flex;justify-content:space-between;">
              <span>🟢 Dükkan Satış Cirosu (${entry.customersServed} Müşteri):</span>
              <strong style="color:var(--emerald);">+${entry.revenue.toLocaleString('tr-TR')} ₺</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span>🟢 Yatırım & Esnaf Ortaklık Geliri:</span>
              <strong style="color:var(--emerald);">+${entry.investmentIncome.toLocaleString('tr-TR')} ₺</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span>🔴 Kullanılan Malzeme & Tedarik Maliyeti:</span>
              <strong style="color:var(--danger-light);">-${entry.ingredientCost.toLocaleString('tr-TR')} ₺</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span>🔴 Dükkan Kira, Personel, Bakım & Kredi:</span>
              <strong style="color:var(--danger-light);">-${entry.operatingCost.toLocaleString('tr-TR')} ₺</strong>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span>🔴 Aile & Ev Geçim Masrafı:</span>
              <strong style="color:var(--danger-light);">-${entry.familyCost.toLocaleString('tr-TR')} ₺</strong>
            </div>
            <hr style="border:none;border-top:1px solid var(--border-color);margin:4px 0;" />
            <div style="display:flex;justify-content:space-between;font-size:1.05rem;">
              <strong>GÜN SONU NET KÂR / ZARAR:</strong>
              <strong style="color:${entry.netProfit >= 0 ? 'var(--emerald)' : 'var(--danger-light)'};">
                ${entry.netProfit >= 0 ? '+' : ''}${entry.netProfit.toLocaleString('tr-TR')} ₺
              </strong>
            </div>
          </div>

          <div style="font-size:0.8rem;color:var(--text-secondary);">
            Güncel Enflasyon Endeksi: <strong>x${this.engine.state.finance.inflationIndex.toFixed(2)}</strong> •
            Kaçan Müşteri: <strong>${entry.customersLost} kişi</strong>
          </div>

          <button class="btn btn-primary btn-block" id="btn-next-morning" style="padding:12px;">
            🌅 Yeni Güne Bismillah De ve Kepenk Aç!
          </button>
        </div>
      </div>
    `;

    layer.querySelector('#btn-next-morning')?.addEventListener('click', () => {
      layer.innerHTML = '';
      this.engine.setSpeed(1);
    });
  }
}
