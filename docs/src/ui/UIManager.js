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
    const st = this.engine.state;
    ReputationSystem.syncReputations(st);

    if (!st.mapView) {
      st.mapView = {
        level: 'city',
        selectedProvinceId: st.branches[0]?.provinceId || 'istanbul',
        selectedDistrictId: st.branches[0]?.districtId || 'ist_besiktas'
      };
    }

    const activeBranch = st.branches.find((b) => b.id === st.activeBranchId) || st.branches[0];
    const selectedProv =
      TURKEY_PROVINCES.find((p) => p.id === st.mapView.selectedProvinceId) || TURKEY_PROVINCES[0];
    const districts = getDistrictsForProvince(selectedProv.id);
    const selectedDist =
      districts.find((d) => d.id === st.mapView.selectedDistrictId) || districts[0];
    st.mapView.selectedDistrictId = selectedDist.id;

    const evalInfo = BranchSystem.evaluateDistrictOpening(st, selectedProv.id, selectedDist);
    const existingBranchInDist = st.branches.find((b) => b.districtId === selectedDist.id);

    const localRep = Math.round(activeBranch.neighborhoodReputation);
    const cityRep = Math.round(st.reputation.cityReputations[selectedProv.id] || localRep);
    const countryRep = Math.round(st.reputation.countryReputation);

    const hoodProfile =
      NEIGHBORHOOD_TYPES.find((n) => n.id === selectedDist.neighborhoodType) || NEIGHBORHOOD_TYPES[0];

    // Toplu zincir özeti
    const totalChainRev = st.branches.reduce((s, b) => s + (b.todayRevenue || 0), 0);
    const totalChainIng = st.branches.reduce((s, b) => s + (b.todayIngredientCost || 0), 0);
    const totalChainLog = st.branches.reduce((s, b) => s + (b.todayLogisticsCost || 0), 0);
    const totalChainRent = st.branches.reduce((s, b) => s + (b.todayRentAndTax || 0) + Math.round(b.dailyRentBase * st.finance.inflationIndex), 0);

    container.innerHTML = `
      <div class="panel-scroll">
        ${
          st.finance.cash < 0
            ? `
          <div class="game-card" style="margin-bottom:16px;border-color:var(--danger-light);background:rgba(214,69,69,0.16);">
            <div class="card-head">
              <div>
                <span class="card-kicker" style="color:var(--danger-light);">🚨 İFLAS RİSKİ UYARISI</span>
                <div class="card-title">Kasadaki Nakit Negatife Düştü (${Math.round(st.finance.cash).toLocaleString('tr-TR')} ₺)!</div>
                <div class="card-subtitle">Aşağıdaki şube tablosundan zarardaki şubelerinizi kapatıp demirbaş bedelini (%42) nakde çevirebilir veya Yatırım & Banka sekmesinden kredi/dayanışma paketi kullanabilirsiniz.</div>
              </div>
            </div>
          </div>
        `
            : ''
        }

        <!-- ÜST BREADCRUMB & 3 SEVİYELİ HARİTA GEÇİŞ BARI -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
          <div class="sub-tabs" style="margin-bottom:0;">
            <button class="sub-tab-btn ${st.mapView.level === 'turkey' ? 'active' : ''}" data-map-level="turkey">
              🇹🇷 Türkiye Haritası (81 İl)
            </button>
            <button class="sub-tab-btn ${st.mapView.level === 'city' ? 'active' : ''}" data-map-level="city">
              🏙️ ${selectedProv.name} Şehir Haritası (${districts.length} İlçe)
            </button>
            <button class="sub-tab-btn" id="btn-goto-active-branch-shop">
              🏘️ Aktif Şube Yönetimi: ${activeBranch.districtName}
            </button>
          </div>

          <!-- Breadcrumb Navigasyon -->
          <div style="display:flex;align-items:center;gap:6px;font-size:0.82rem;font-weight:800;background:var(--bg-card);padding:6px 14px;border-radius:999px;border:1px solid var(--border-color);">
            <span style="cursor:pointer;color:var(--accent-secondary);" data-map-level="turkey">🇹🇷 Türkiye</span>
            <span style="color:var(--text-muted);">›</span>
            <span style="cursor:pointer;color:var(--emerald);" data-map-level="city">🏙️ ${selectedProv.name} (${selectedProv.plate})</span>
            <span style="color:var(--text-muted);">›</span>
            <span style="color:var(--text-primary);">📍 ${selectedDist.name}</span>
          </div>
        </div>

        <!-- 3 KATMANLI İTİBAR HİYERARŞİSİ (MAHALLE -> ŞEHİR -> ÜLKE MARKA) -->
        <div class="kpi-strip">
          <div class="kpi-box" style="${st.mapView.level === 'branch' ? 'border-color:var(--accent-secondary);' : ''}">
            <span class="kpi-label">1. KATMAN • MAHALLE İTİBARI (${activeBranch.districtName.toUpperCase()})</span>
            <span class="kpi-value" style="color:var(--emerald);">${localRep} / 100</span>
            <span class="kpi-sub">Hijyen, servis hızı ve fiyat uyumundan doğrudan etkilenir</span>
          </div>
          <div class="kpi-box" style="${st.mapView.level === 'city' ? 'border-color:var(--accent-secondary);' : ''}">
            <span class="kpi-label">2. KATMAN • ${selectedProv.name.toUpperCase()} ŞEHİR İTİBARI</span>
            <span class="kpi-value" style="color:var(--accent-secondary);">${cityRep} / 100</span>
            <span class="kpi-sub">${selectedProv.name} ilindeki tüm şubelerinizin ağırlıklı ortalaması</span>
          </div>
          <div class="kpi-box" style="${st.mapView.level === 'turkey' ? 'border-color:var(--accent-secondary);' : ''}">
            <span class="kpi-label">3. KATMAN • TÜRKİYE (ÜLKE MARKA) İTİBARI</span>
            <span class="kpi-value" style="color:var(--sky);">${countryRep} / 100</span>
            <span class="kpi-sub">Tüm şehirlerin ortalaması + ulusal yayılım (${st.branches.length} Şube)</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">ŞUBE AÇMA YETKİSİ & KONTENJAN</span>
            <span class="kpi-value">${st.branches.length} / ${st.quests.maxAllowedBranches === 99 ? 'Sınırsız' : st.quests.maxAllowedBranches} Şube</span>
            <span class="kpi-sub">Aktif Görev Kademesi: Kademe ${st.quests.currentTier}/5</span>
          </div>
        </div>

        <!-- SOL: İNTERAKTİF HARİTA (TÜRKİYE 81 İL VEYA ŞEHİR İLÇELERİ) | SAĞ: LOKASYON SEÇİM & ŞUBE AÇMA EKRANI -->
        <div class="dashboard-2col">
          <!-- SOL HARİTA KARTI -->
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">
                  ${st.mapView.level === 'turkey' ? '81 İL TÜRKİYE GENİŞLEME HARİTASI' : `${selectedProv.plate} • ${selectedProv.name.toUpperCase()} İLÇE BAZLI ŞEHİR HARİTASI`}
                </span>
                <div class="card-title">
                  ${
                    st.mapView.level === 'turkey'
                      ? '🗺️ Türkiye 81 İl Haritası (İle tıklayarak şehir haritasına veya şube açılışına geçin)'
                      : `🏙️ ${selectedProv.name} İlçeleri (İlçeye tıklayarak maliyetleri görün ve şube açın)`
                  }
                </div>
              </div>
              <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <select id="map-heatmap-mode" class="form-select" style="padding:5px 10px;font-size:0.78rem;">
                  <option value="standard" ${(st.mapView.heatmapMode || 'standard') === 'standard' ? 'selected' : ''}>🗺️ Katman: Standart (★ Şube / ◆ Bayi)</option>
                  <option value="profit" ${st.mapView.heatmapMode === 'profit' ? 'selected' : ''}>💰 Katman: Kâr / Zarar Isı Haritası</option>
                  <option value="reputation" ${st.mapView.heatmapMode === 'reputation' ? 'selected' : ''}>⭐ Katman: İtibar Isı Haritası</option>
                </select>
                <select id="map-province-select" class="form-select" style="padding:5px 10px;font-size:0.78rem;">
                  ${TURKEY_PROVINCES.map(
                    (p) =>
                      `<option value="${p.id}" ${p.id === selectedProv.id ? 'selected' : ''}>${p.plate} - ${p.name} (${st.branches.filter((b) => b.provinceId === p.id).length} Şube)</option>`
                  ).join('')}
                </select>
              </div>
            </div>

            <!-- SVG HARİTA ÇİZİMİ -->
            <div>
              ${
                st.mapView.level === 'turkey'
                  ? MapRenderer.renderTurkeyMapSVG(st)
                  : MapRenderer.renderCityDistrictMapSVG(st, selectedProv.id)
              }
            </div>

            <!-- Harita Renk Skalası Açıklaması -->
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:0.77rem;font-weight:700;color:var(--text-secondary);">
              <div style="display:flex;gap:14px;flex-wrap:wrap;">
                <span><strong style="color:#38d39f;">▉ ★ Yeşil:</strong> Öz Şubemiz Açık</span>
                <span><strong style="color:#f6ad55;">▉ ◆ Turuncu:</strong> Franchise Bayi</span>
                <span><strong style="color:#f5c76b;">▉ Altın Çerçeveli:</strong> Seçili Lokasyon</span>
                <span><strong style="color:#6c869e;">▉ Arduvaz:</strong> Şube Yok</span>
              </div>
              ${
                st.mapView.level === 'turkey'
                  ? `<button class="btn btn-primary btn-sm" id="btn-zoom-into-city">🔍 ${selectedProv.name} İlçe Haritasını Aç</button>`
                  : `<button class="btn btn-sm" data-map-level="turkey">⬅ Türkiye (81 İl) Haritasına Dön</button>`
              }
            </div>
          </div>

          <!-- SAĞ: LOKASYON SEÇİM, MALİYET & ŞUBE AÇMA KARTI -->
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">LOKASYON ANALİZİ & ŞUBE YATIRIM FİZİBİLİTESİ</span>
                <div class="card-title">📍 ${selectedProv.name} › ${selectedDist.name}</div>
                <div class="card-subtitle">${selectedDist.description}</div>
              </div>
              <span class="badge ${existingBranchInDist ? 'badge-success' : evalInfo.canOpen ? 'badge-info' : 'badge-warning'}">
                ${existingBranchInDist ? '🏪 Şubemiz Var' : evalInfo.canOpen ? '✓ Açılışa Uygun' : '🔒 Koşul Eksik'}
              </span>
            </div>

            <!-- İlçe Seçim Hapları -->
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${districts
                .map((d) => {
                  const hasBr = st.branches.some((b) => b.districtId === d.id);
                  return `
                    <button class="btn btn-sm ${d.id === selectedDist.id ? 'btn-primary' : ''}"
                            style="${hasBr && d.id !== selectedDist.id ? 'border-color:#38d39f;color:#38d39f;' : ''}"
                            data-pick-district="${d.id}">
                      ${hasBr ? '★ ' : ''}${d.name.split('/')[0].trim()}
                    </button>
                  `;
                })
                .join('')}
            </div>

            <!-- Maliyet, Kira, Lojistik ve Potansiyel Tablosu -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:var(--bg-input);padding:12px;border-radius:10px;border:1px solid var(--border-color);font-size:0.81rem;">
              <div>
                <div style="color:var(--text-muted);font-size:0.7rem;font-weight:800;">AÇILIŞ & KURULUM MALİYETİ</div>
                <div style="font-weight:900;font-size:0.98rem;color:var(--accent-secondary);">${evalInfo.openingCost.toLocaleString('tr-TR')} ₺</div>
              </div>
              <div>
                <div style="color:var(--text-muted);font-size:0.7rem;font-weight:800;">GÜNLÜK KİRA YÜKÜMLÜLÜĞÜ</div>
                <div style="font-weight:900;font-size:0.98rem;">${evalInfo.dailyRent.toLocaleString('tr-TR')} ₺ / gün</div>
              </div>
              <div>
                <div style="color:var(--text-muted);font-size:0.7rem;font-weight:800;">TEDARİK & UZAK ŞEHİR LOJİSTİĞİ</div>
                <div style="font-weight:800;color:${evalInfo.logisticsMultiplier > 1.15 ? 'var(--danger-light)' : 'var(--emerald)'};">
                  x${evalInfo.logisticsMultiplier.toFixed(2)} (~${evalInfo.estDailyLogistics.toLocaleString('tr-TR')} ₺/gün)
                </div>
              </div>
              <div>
                <div style="color:var(--text-muted);font-size:0.7rem;font-weight:800;">HOLDİNG YÖNETİM & VERGİ YÜKÜ</div>
                <div style="font-weight:800;">+${evalInfo.estHoldingOverhead.toLocaleString('tr-TR')} ₺/gün + %6 Vergi</div>
              </div>
              <div>
                <div style="color:var(--text-muted);font-size:0.7rem;font-weight:800;">MÜŞTERİ POTANSİYELİ</div>
                <div style="font-weight:900;color:var(--emerald);">%${selectedDist.customerPotential} Yoğunluk</div>
              </div>
              <div>
                <div style="color:var(--text-muted);font-size:0.7rem;font-weight:800;">SOSYAL ÇEVRE PROFİLİ</div>
                <div style="font-weight:800;color:var(--sky);">${hoodProfile.name.split('(')[0].trim()}</div>
              </div>
            </div>

            <!-- Şube Açma İki Zorunlu Koşul Kontrol Kutusu -->
            <div style="background:var(--bg-row);padding:11px 13px;border-radius:10px;border:1px solid var(--border-color);font-size:0.79rem;display:flex;flex-direction:column;gap:5px;">
              <div style="font-weight:900;font-size:0.74rem;color:var(--text-muted);text-transform:uppercase;">Şube Açılışı Zorunlu Koşullar Kontrolü:</div>
              <div style="display:flex;justify-content:space-between;">
                <span>1a. Kademe ${selectedDist.requiredQuestTier} Görev Seti & Şube Hakkı:</span>
                <strong style="color:${evalInfo.isQuestTierCompleted && evalInfo.hasBranchSlot ? 'var(--emerald)' : 'var(--danger-light)'};">
                  ${evalInfo.isQuestTierCompleted && evalInfo.hasBranchSlot ? '✓ Tamamlandı' : `🔒 Görevler Sekmesini Tamamlayın`}
                </strong>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span>1b. Minimum Şehir (${selectedDist.minCityRep}) & Ülke (${selectedDist.minCountryRep}) İtibarı:</span>
                <strong style="color:${evalInfo.meetsCityRep && evalInfo.meetsCountryRep ? 'var(--emerald)' : 'var(--danger-light)'};">
                  ${evalInfo.meetsCityRep && evalInfo.meetsCountryRep ? `✓ Uygun (${evalInfo.cityRep}/${evalInfo.countryRep})` : `🔒 Yetersiz (${evalInfo.cityRep}/${evalInfo.countryRep})`}
                </strong>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <span>2. Yeterli Nakit Sermaye (${evalInfo.openingCost.toLocaleString('tr-TR')} ₺):</span>
                <strong style="color:${evalInfo.hasEnoughCash ? 'var(--emerald)' : 'var(--danger-light)'};">
                  ${evalInfo.hasEnoughCash ? '✓ Bakiye Yeterli' : '⚠️ Nakit Yetersiz'}
                </strong>
              </div>
            </div>

            ${
              existingBranchInDist
                ? `
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;">
                ${
                  existingBranchInDist.isFranchise
                    ? `<button class="btn btn-outline" style="flex:1;" data-audit-branch="${existingBranchInDist.id}">🔍 Bayiyi Denetle (${existingBranchInDist.districtName})</button>`
                    : `<button class="btn btn-primary" style="flex:1;" data-switch-branch="${existingBranchInDist.id}">🎛️ Bu Şubeyi Yönet (${existingBranchInDist.districtName})</button>`
                }
                ${
                  !existingBranchInDist.isHeadquarters
                    ? `<button class="btn btn-danger btn-sm" data-close-branch="${existingBranchInDist.id}">🛑 ${existingBranchInDist.isFranchise ? 'Sözleşmeyi Feshet' : 'Şubeyi Kapat / Sat'}</button>`
                    : ''
                }
              </div>
            `
                : `
              <div style="display:flex;flex-direction:column;gap:8px;margin-top:auto;">
                <button class="btn btn-primary btn-block" id="btn-open-branch-here" ${!evalInfo.canOpen ? 'disabled' : ''}>
                  ${evalInfo.canOpen ? `★ ${selectedProv.name} / ${selectedDist.name} Öz Şube Aç (-${evalInfo.openingCost.toLocaleString('tr-TR')} ₺ • Başlangıç İtibar: ${evalInfo.estimatedInitialRep}★)` : `🔒 ${evalInfo.reasons[0] || 'Koşullar Eksik'}`}
                </button>
                <button class="btn btn-outline btn-block" id="btn-grant-franchise-here" ${!evalInfo.canGrantFranchise ? 'disabled' : ''} style="border-color:#f6ad55;color:#f6ad55;">
                  ${
                    evalInfo.canGrantFranchise
                      ? `◆ Bayilik (Franchise) Ver (+${evalInfo.franchiseUpfrontFee.toLocaleString('tr-TR')} ₺ Peşin İsim Hakkı + %${evalInfo.franchiseRoyaltyPct} Günlük Ciro Payı • Sıfır Kira/Maaş)`
                      : `🔒 Bayilik Vermek İçin: En Az 3 Şube, Kontenjan ve 58+ Ülke İtibarı Gerekir`
                  }
                </button>
              </div>
            `
            }
          </div>
        </div>

        <!-- TÜM ŞUBELER VE TOPLU ZİNCİR GELİR-GİDER TABLOSU -->
        <div class="game-card">
          <div class="card-head">
            <div>
              <span class="card-kicker">TÜRKİYE ZİNCİR OPERASYONU • ${st.branches.length} AKTİF ŞUBE</span>
              <div class="card-title">🏪 Şubeler Arası Geçiş, Şube Bazlı Gelir-Gider ve Toplu Zincir Özeti</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <span class="badge badge-success">Zincir Günlük Ciro: +${Math.round(totalChainRev).toLocaleString('tr-TR')} ₺</span>
              <span class="badge badge-warning">Kira+Vergi+Lojistik: -${Math.round(totalChainRent + totalChainLog).toLocaleString('tr-TR')} ₺/gün</span>
            </div>
          </div>

          <div class="exec-row-list">
            ${st.branches
              .map((b, idx) => {
                const isActive = b.id === st.activeBranchId;
                const colors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4'];
                const col = colors[idx % colors.length];
                const estDailyFixed = Math.round(b.dailyRentBase * st.finance.inflationIndex * b.logisticsMultiplier);
                const liveNet = b.todayRevenue - b.todayIngredientCost - estDailyFixed;

                return `
                  <div class="exec-row" style="${isActive ? 'border-color:var(--accent-secondary);background:var(--bg-row-hover);' : ''}">
                    <div class="exec-row-entity">
                      <span class="exec-accent-bar" style="background:${col};"></span>
                      <div>
                        <div class="exec-entity-title">
                          🏪 ${b.provinceName} • ${b.districtName}
                          ${b.isHeadquarters ? `<span class="badge badge-info">Merkez</span>` : ''}
                          ${isActive ? `<span class="badge badge-success">Aktif Yönetilen</span>` : ''}
                        </div>
                        <div class="exec-entity-sub">
                          Mahalle İtibarı: ${b.neighborhoodReputation}/100 • Hijyen: %${Math.round(b.hygiene)} • Personel: ${b.staffCount} Kişi • Lojistik: x${b.logisticsMultiplier.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div class="exec-big-pct" style="color:${col};">
                      ${b.todayCustomers} Müşteri
                    </div>

                    <div class="exec-metric-col">
                      <span class="exec-metric-label">BUGÜNKÜ CİRO</span>
                      <span class="exec-metric-val" style="color:var(--emerald);">+${Math.round(b.todayRevenue).toLocaleString('tr-TR')} ₺</span>
                    </div>

                    <div class="exec-metric-col">
                      <span class="exec-metric-label">MALZEME GİDERİ</span>
                      <span class="exec-metric-val" style="color:var(--danger-light);">-${Math.round(b.todayIngredientCost).toLocaleString('tr-TR')} ₺</span>
                    </div>

                    <div class="exec-metric-col">
                      <span class="exec-metric-label">KİRA & LOJİSTİK</span>
                      <span class="exec-metric-val" style="color:var(--accent-secondary);">-${estDailyFixed.toLocaleString('tr-TR')} ₺/gün</span>
                    </div>

                    <div class="exec-metric-col">
                      <span class="exec-metric-label">TAHMİNİ NET</span>
                      <span class="exec-metric-val" style="color:${liveNet >= 0 ? 'var(--emerald)' : 'var(--danger-light)'};">
                        ${liveNet >= 0 ? '+' : ''}${Math.round(liveNet).toLocaleString('tr-TR')} ₺
                      </span>
                    </div>

                    <div style="display:flex;gap:6px;">
                      <button class="btn ${isActive ? 'btn-success' : 'btn-primary'} btn-sm" data-switch-branch="${b.id}">
                        ${isActive ? '✓ Yönetiliyor' : '🎛️ Yönet'}
                      </button>
                      ${
                        !b.isHeadquarters
                          ? `<button class="btn btn-danger btn-sm" data-close-branch="${b.id}" title="Şubeyi Kapat / Devret (%42 İade)">🛑 Kapat</button>`
                          : ''
                      }
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      </div>
    `;

    // Harita seviyesi geçişleri (Türkiye <-> Şehir)
    container.querySelectorAll('[data-map-level]').forEach((el) => {
      el.addEventListener('click', () => {
        const lvl = (el).getAttribute('data-map-level');
        if (lvl) {
          st.mapView.level = lvl;
          this.updateTopBarLive();
          this.renderActiveTab(true);
        }
      });
    });

    container.querySelector('#btn-zoom-into-city')?.addEventListener('click', () => {
      st.mapView.level = 'city';
      this.updateTopBarLive();
      this.renderActiveTab(true);
    });

    container.querySelector('#btn-ist-zoom-full')?.addEventListener('click', () => {
      MapRenderer.istanbulZoomCenter = false;
      this.renderActiveTab(true);
    });

    container.querySelector('#btn-ist-zoom-center')?.addEventListener('click', () => {
      MapRenderer.istanbulZoomCenter = true;
      this.renderActiveTab(true);
    });

    container.querySelector('#btn-goto-active-branch-shop')?.addEventListener('click', () => {
      this.activeTab = 'dukkan';
      this.updateNavHighlight();
      this.renderActiveTab(false);
    });

    // Harita ısı katmanı seçimi
    container.querySelector('#map-heatmap-mode')?.addEventListener('change', (e) => {
      st.mapView.heatmapMode = (e.target).value;
      this.renderActiveTab(true);
    });

    // İl seçimi (Select kutusu veya Türkiye SVG Haritası üzerindeki 81 il kutuları)
    container.querySelector('#map-province-select')?.addEventListener('change', (e) => {
      const provId = (e.target).value;
      st.mapView.selectedProvinceId = provId;
      const dists = getDistrictsForProvince(provId);
      st.mapView.selectedDistrictId = dists[0]?.id || '';
      this.updateTopBarLive();
      this.renderActiveTab(true);
    });

    container.querySelectorAll('[data-map-province]').forEach((el) => {
      el.addEventListener('click', () => {
        const provId = (el).getAttribute('data-map-province');
        if (!provId) return;
        // Eğer zaten seçili olan ile tekrar tıklandıysa doğrudan o ilin Şehir/İlçe haritasına gir
        if (st.mapView.selectedProvinceId === provId) {
          st.mapView.level = 'city';
        } else {
          st.mapView.selectedProvinceId = provId;
          const dists = getDistrictsForProvince(provId);
          st.mapView.selectedDistrictId = dists[0]?.id || '';
        }
        this.updateTopBarLive();
        this.renderActiveTab(true);
      });
    });

    // İlçe seçimi (Şehir SVG Haritası üzerinden veya sağdaki ilçe butonlarından)
    container.querySelectorAll('[data-map-district], [data-pick-district]').forEach((el) => {
      el.addEventListener('click', () => {
        const distId =
          (el).getAttribute('data-map-district') ||
          (el).getAttribute('data-pick-district');
        if (distId) {
          st.mapView.selectedDistrictId = distId;
          this.renderActiveTab(true);
        }
      });
    });

    // Yeni şube açma butonu
    container.querySelector('#btn-open-branch-here')?.addEventListener('click', () => {
      const res = BranchSystem.openNewBranch(st, selectedProv.id, selectedDist.id);
      if (!res.ok) {
        this.showToast('Şube Açılamadı', res.msg, 'warning');
      } else {
        ManagementSystem.checkAndAdvanceManagementTier(st);
        QuestSystem.evaluateQuests(st, this.engine.getNetWorth());
        this.renderMainShell();
      }
    });

    // Faz 5: Bayilik (Franchise) verme butonu
    container.querySelector('#btn-grant-franchise-here')?.addEventListener('click', () => {
      const res = BranchSystem.grantFranchiseBranch(st, selectedProv.id, selectedDist.id);
      if (!res.ok) {
        this.showToast('Bayilik Verilemedi', res.msg, 'warning');
      } else {
        ManagementSystem.checkAndAdvanceManagementTier(st);
        QuestSystem.evaluateQuests(st, this.engine.getNetWorth());
        this.renderMainShell();
      }
    });

    // Bayi veya şube teftişi
    container.querySelectorAll('[data-audit-branch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bId = (btn).getAttribute('data-audit-branch');
        if (bId) {
          ManagementSystem.auditManagerOrBranch(st, bId);
          this.renderActiveTab(true);
        }
      });
    });

    // Şube yönetimine geçiş
    container.querySelectorAll('[data-switch-branch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bId = (btn).getAttribute('data-switch-branch');
        if (bId) {
          BranchSystem.switchActiveBranch(st, bId);
          this.activeTab = 'dukkan';
          this.renderMainShell();
        }
      });
    });

    // Şube kapatma / satma
    container.querySelectorAll('[data-close-branch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bId = (btn).getAttribute('data-close-branch');
        if (bId) {
          BranchSystem.closeOrSellBranch(st, bId);
          this.renderMainShell();
        }
      });
    });
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
    const st = this.engine.state;
    const specialDay = SPECIAL_CALENDAR_DAYS[st.time.day % 30 || 30];
    const ct = st.finance.todayStats.byCustomerType || { ogrenci: 8, isci: 5, aile: 4, turist: 2, esnaf: 4 };
    const menuFit = this.engine.getNeighborhoodMenuFitScore();
    const trafficPct = Math.round((st.shop.trafficMultiplier || 1.0) * 100);

    const topRecipes = RECIPES.filter((r) => st.menu[r.id]?.active)
      .slice(0, 5)
      .map((r, idx) => {
        const colors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4'];
        const ms = st.menu[r.id];
        return {
          label: r.name,
          subLabel: `${ms.soldTotal} adet`,
          value: Math.max(1, ms.soldTotal * ms.price),
          color: colors[idx % colors.length]
        };
      });

    container.innerHTML = `
      <div class="panel-scroll">
        <!-- ÜST PİLL ALT SEKMELER VE HIZLI AKSİYONLAR (Manuel Olay Butonu Kaldırıldı, Olaylar Organik Gelişir) -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
          <div class="sub-tabs" style="margin-bottom:0;">
            <button class="sub-tab-btn ${this.shopSubTab === 'operasyon' ? 'active' : ''}" data-shop-sub="operasyon">📊 Canlı Operasyon & Grafikler</button>
            <button class="sub-tab-btn ${this.shopSubTab === 'dekorasyon' ? 'active' : ''}" data-shop-sub="dekorasyon">🪑 Salon Ekipmanları (${st.shop.placedItems.length})</button>
            <button class="sub-tab-btn ${this.shopSubTab === 'genisletme' ? 'active' : ''}" data-shop-sub="genisletme">🏗️ Salon Büyütme & Mimari</button>
          </div>

          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span class="badge ${trafficPct >= 100 ? 'badge-success' : 'badge-warning'}" title="Gün içi rastgele gelişen olaylar ve hijyen müşteri akışını etkiler">
              🚶 Sokak Akışı: ${st.shop.trafficReason || `Normal (%${trafficPct})`}
            </span>
            <span class="badge ${menuFit >= 75 ? 'badge-success' : 'badge-info'}">
              🎯 Sosyal Çevre Menü Uyumu: %${menuFit}
            </span>
            ${
              specialDay
                ? `<span class="badge badge-warning">🎉 ${specialDay.name}</span>`
                : ''
            }
            <button class="btn btn-primary btn-sm" id="btn-restock-doner">🔥 Şişe Taze Döner Tak</button>
            <button class="btn btn-sm" id="btn-clean-shop">🧼 Salon Temizliği (+22 Hijyen)</button>
            <button class="btn btn-danger btn-sm" id="btn-finish-day-early">🌙 Günü Kapat (Z Raporu)</button>
          </div>
        </div>

        <!-- ÜST KPI KARTLARI -->
        <div class="kpi-strip">
          <div class="kpi-box">
            <span class="kpi-label">BUGÜNKÜ CANLI CİRO</span>
            <span class="kpi-value" style="color:var(--emerald);" id="live-today-rev">${Math.round(st.finance.todayStats.revenue).toLocaleString('tr-TR')} ₺</span>
            <span class="kpi-sub">+${st.finance.todayStats.tipsEarned} ₺ Bahşiş • ${st.finance.todayStats.onlineOrdersServed} Online Paket</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">BRÜT SATIŞ KÂRI</span>
            <span class="kpi-value" style="color:var(--accent-secondary);" id="live-today-profit">${Math.round(st.finance.todayStats.revenue - st.finance.todayStats.ingredientCost).toLocaleString('tr-TR')} ₺</span>
            <span class="kpi-sub">Malzeme Gideri: ${Math.round(st.finance.todayStats.ingredientCost).toLocaleString('tr-TR')} ₺</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">MÜŞTERİ TRAFİĞİ</span>
            <span class="kpi-value" id="live-today-cust">${st.finance.todayStats.customersServed} Servis (${st.finance.todayStats.customersLost} Kaçan)</span>
            <span class="kpi-sub">Kapasite: ${st.shop.seatingCapacity} Koltuk • Yoğunluk Çarpanı: %${trafficPct}</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">OCAKTAKİ DÖNER ŞİŞİ</span>
            <span class="kpi-value" style="color:var(--sky);" id="live-doner-kg">${st.shop.donerRollKg.toFixed(1)} / ${st.shop.donerMaxKg} kg</span>
            <span class="kpi-sub">
              <label style="cursor:pointer;display:inline-flex;align-items:center;gap:5px;">
                <input type="checkbox" id="chk-auto-doner" ${st.shop.autoRestockDoner ? 'checked' : ''} /> Otomatik Şiş Tak
              </label>
            </span>
          </div>
          <div class="kpi-box">
            <span class="kpi-label">SALON DEKOR & HİJYEN</span>
            <span class="kpi-value">${st.shop.decorScore} Dekor • %${Math.round(st.shop.hygiene)} Hijyen</span>
            <span class="kpi-sub">${st.shop.hygiene < 70 ? '⚠️ Hijyen Düşük! Denetim/Şikayet Riski' : '✓ Hijyen Güvenli Seviyede'}</span>
          </div>
        </div>

        ${
          this.shopSubTab === 'operasyon'
            ? `
          <div class="dashboard-2col">
            <div class="game-card">
              <div class="card-head">
                <div>
                  <span class="card-kicker">CANLI MÜŞTERİ DAĞILIMI</span>
                  <div class="card-title">Müşteri Profili & Segment Payları</div>
                </div>
                <span class="badge badge-info">Toplam Kapasite: ${st.shop.seatingCapacity} Kişi</span>
              </div>
              ${ChartRenderer.renderSegmentedBar([
                { label: 'Öğrenci', value: ct.ogrenci || 8, color: '#f5c76b' },
                { label: 'Sanayi / İşçi', value: ct.isci || 6, color: '#38d39f' },
                { label: 'Aile', value: ct.aile || 5, color: '#63b3ed' },
                { label: 'Komşu Esnaf', value: ct.esnaf || 4, color: '#b794f4' },
                { label: 'Turist', value: ct.turist || 2, color: '#f68773' }
              ])}
            </div>

            <div class="game-card">
              <div class="card-head">
                <div>
                  <span class="card-kicker">AKTİF MENÜ CİRO PAYLARI</span>
                  <div class="card-title">En Çok Kazandıran Döner & Menü Ürünleri</div>
                </div>
                <span class="badge badge-warning">Enflasyon x${st.finance.inflationIndex.toFixed(2)}</span>
              </div>
              ${ChartRenderer.renderSegmentedBar(topRecipes)}
            </div>
          </div>

          <div class="dashboard-2col">
            <div class="game-card">
              <div class="card-head">
                <div>
                  <span class="card-kicker">GÜN İÇİ CANLI TELEMETRİ</span>
                  <div class="card-title">📈 Saatlik Kümülatif Ciro & Maliyet Akış Grafiği</div>
                </div>
                <span class="badge badge-success">Canlı Güncellenir</span>
              </div>
              <div id="live-intraday-chart-box">
                ${ChartRenderer.renderIntradayAreaChart(st.finance.hourlyStats)}
              </div>
            </div>

            <div class="game-card">
              <div class="card-head">
                <div>
                  <span class="card-kicker">FİNANSAL PERFORMANS TRENDİ</span>
                  <div class="card-title">📊 Günlük Ciro, Toplam Gider ve Net Kâr Grafiği</div>
                </div>
                <span class="badge badge-neutral">Son ${st.finance.ledgerHistory.length} Gün</span>
              </div>
              ${ChartRenderer.renderProfitLineChart(st.finance.ledgerHistory)}
            </div>
          </div>

          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">AKTİF SALON DONANIMI • ${st.shop.placedItems.length} BİRİM</span>
                <div class="card-title">Kurulu Ocaklar, Tezgahlar ve Oturma Grupları</div>
              </div>
              <button class="btn btn-primary btn-sm" data-goto-shop-sub="dekorasyon">➕ Yeni Ekipman Ekle</button>
            </div>

            <div class="exec-row-list">
              ${st.shop.placedItems
                .map((placed, idx) => {
                  const def = FURNITURE_CATALOG.find((f) => f.id === placed.itemId);
                  if (!def) return '';
                  const accentColors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4'];
                  const col = accentColors[idx % accentColors.length];
                  const valNow = Math.round(def.basePrice * st.finance.inflationIndex);
                  const upkeepNow = Math.round(def.dailyUpkeep * st.finance.inflationIndex);
                  const mainEffect = def.effects.seating
                    ? `+${def.effects.seating} Koltuk`
                    : def.effects.donerMaxKgBonus
                    ? `+${def.effects.donerMaxKgBonus}kg Ocak`
                    : def.effects.speedBonus
                    ? `+%${def.effects.speedBonus} Hız`
                    : `+${def.effects.decorBonus || 5} Dekor`;

                  return `
                    <div class="exec-row">
                      <div class="exec-row-entity">
                        <span class="exec-accent-bar" style="background:${col};"></span>
                        <div>
                          <div class="exec-entity-title">${def.icon} ${def.name}</div>
                          <div class="exec-entity-sub">${def.description}</div>
                        </div>
                      </div>
                      <div class="exec-big-pct" style="color:${col};">${mainEffect}</div>
                      <div class="exec-metric-col">
                        <span class="exec-metric-label">DEĞER</span>
                        <span class="exec-metric-val">${valNow.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div class="exec-metric-col">
                        <span class="exec-metric-label">GÜNLÜK BAKIM</span>
                        <span class="exec-metric-val" style="color:var(--accent-secondary);">${upkeepNow} ₺</span>
                      </div>
                      <div class="exec-metric-col">
                        <span class="exec-metric-label">DEKOR KATKISI</span>
                        <span class="exec-metric-val" style="color:var(--emerald);">+${def.effects.decorBonus || 0} Puan</span>
                      </div>
                      <div>
                        <div class="exec-dual-bar">
                          <div style="width:22%;background:#f5c76b;"></div>
                          <div style="width:78%;background:#38d39f;"></div>
                        </div>
                      </div>
                      <button class="btn btn-sm" data-sell-item="${placed.instanceId}" title="İkinci El Sat (%50 İade)">Sat</button>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          this.shopSubTab === 'dekorasyon'
            ? `
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">DONANIM & DEKORASYON MAĞAZASI</span>
                <div class="card-title">Dükkan Kapasitesini, Hızını ve Müşteri Çekimini Artıran Ekipmanlar</div>
              </div>
              <span class="badge badge-info">Kurulu Ekipman: ${st.shop.placedItems.length} Adet</span>
            </div>

            <div class="exec-row-list">
              ${FURNITURE_CATALOG.map((item, idx) => {
                const price = Math.round(item.basePrice * st.finance.inflationIndex);
                const upkeep = Math.round(item.dailyUpkeep * st.finance.inflationIndex);
                const installedCount = st.shop.placedItems.filter((p) => p.itemId === item.id).length;
                const accentColors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4'];
                const col = accentColors[idx % accentColors.length];

                return `
                  <div class="exec-row">
                    <div class="exec-row-entity">
                      <span class="exec-accent-bar" style="background:${col};"></span>
                      <div>
                        <div class="exec-entity-title">${item.icon} ${item.name} ${installedCount > 0 ? `<span class="badge badge-success">${installedCount} Kurulu</span>` : ''}</div>
                        <div class="exec-entity-sub">${item.description}</div>
                      </div>
                    </div>
                    <div class="exec-big-pct" style="color:${col};">
                      ${item.effects.seating ? `+${item.effects.seating} Koltuk` : item.effects.speedBonus ? `+%${item.effects.speedBonus} Hız` : `+${item.effects.decorBonus || 5} Dekor`}
                    </div>
                    <div class="exec-metric-col">
                      <span class="exec-metric-label">KURULUM FİYATI</span>
                      <span class="exec-metric-val">${price.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    <div class="exec-metric-col">
                      <span class="exec-metric-label">GÜNLÜK BAKIM</span>
                      <span class="exec-metric-val" style="color:var(--accent-secondary);">${upkeep} ₺/gün</span>
                    </div>
                    <div class="exec-metric-col">
                      <span class="exec-metric-label">EK BONUS</span>
                      <span class="exec-metric-val" style="color:var(--emerald);">+${item.effects.decorBonus || 0} Dekor / +${item.effects.hygieneBonus || 0} Hijyen</span>
                    </div>
                    <div>
                      <div class="exec-dual-bar">
                        <div style="width:35%;background:${col};"></div>
                        <div style="width:65%;background:#38d39f;"></div>
                      </div>
                    </div>
                    <button class="btn btn-primary btn-sm" data-buy-furniture="${item.id}">
                      ➕ Satın Al & Kur
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          this.shopSubTab === 'genisletme'
            ? `
          <div class="game-card" style="margin-bottom:16px;">
            <div class="card-head">
              <div>
                <span class="card-kicker">MİMARİ BÜYÜME & RUHSATLAR</span>
                <div class="card-title">Küçük Salondan Mega İki Katlı Döner Restoranına Geçiş</div>
              </div>
            </div>
            <div class="exec-row-list">
              <div class="exec-row">
                <div class="exec-row-entity">
                  <span class="exec-accent-bar" style="background:#f5c76b;"></span>
                  <div>
                    <div class="exec-entity-title">🏪 ${SHOP_UPGRADES.expandLevel2.name}</div>
                    <div class="exec-entity-sub">${SHOP_UPGRADES.expandLevel2.description}</div>
                  </div>
                </div>
                <div class="exec-big-pct" style="color:#f5c76b;">Seviye 2</div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">MALİYET</span>
                  <span class="exec-metric-val">${Math.round(SHOP_UPGRADES.expandLevel2.basePrice * st.finance.inflationIndex).toLocaleString('tr-TR')} ₺</span>
                </div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">KAPASİTE</span>
                  <span class="exec-metric-val" style="color:var(--emerald);">Orta Salon</span>
                </div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">DURUM</span>
                  <span class="exec-metric-val">${st.shop.level >= 2 ? 'Aktif' : 'Kilitli'}</span>
                </div>
                <div><div class="exec-dual-bar"><div style="width:${st.shop.level >= 2 ? 100 : 30}%;background:#38d39f;"></div></div></div>
                ${
                  st.shop.level >= 2
                    ? `<span class="badge badge-success">✓ Tamamlandı</span>`
                    : `<button class="btn btn-primary btn-sm" id="btn-upg-level2">Genişlet</button>`
                }
              </div>

              <div class="exec-row">
                <div class="exec-row-entity">
                  <span class="exec-accent-bar" style="background:#38d39f;"></span>
                  <div>
                    <div class="exec-entity-title">⛱️ ${SHOP_UPGRADES.sidewalkPermit.name}</div>
                    <div class="exec-entity-sub">${SHOP_UPGRADES.sidewalkPermit.description}</div>
                  </div>
                </div>
                <div class="exec-big-pct" style="color:#38d39f;">+6 Koltuk</div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">RUHSAT BEDELİ</span>
                  <span class="exec-metric-val">${Math.round(SHOP_UPGRADES.sidewalkPermit.basePrice * st.finance.inflationIndex).toLocaleString('tr-TR')} ₺</span>
                </div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">DEKOR KATKISI</span>
                  <span class="exec-metric-val" style="color:var(--emerald);">+8 Puan</span>
                </div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">DURUM</span>
                  <span class="exec-metric-val">${st.shop.hasSidewalkPermit ? 'İzinli' : 'Yok'}</span>
                </div>
                <div><div class="exec-dual-bar"><div style="width:${st.shop.hasSidewalkPermit ? 100 : 25}%;background:#38d39f;"></div></div></div>
                ${
                  st.shop.hasSidewalkPermit
                    ? `<span class="badge badge-success">✓ İzin Alındı</span>`
                    : `<button class="btn btn-primary btn-sm" id="btn-upg-sidewalk">Ruhsat Al</button>`
                }
              </div>

              <div class="exec-row">
                <div class="exec-row-entity">
                  <span class="exec-accent-bar" style="background:#63b3ed;"></span>
                  <div>
                    <div class="exec-entity-title">👑 ${SHOP_UPGRADES.secondFloor.name}</div>
                    <div class="exec-entity-sub">${SHOP_UPGRADES.secondFloor.description}</div>
                  </div>
                </div>
                <div class="exec-big-pct" style="color:#63b3ed;">+8 Koltuk</div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">YATIRIM BEDELİ</span>
                  <span class="exec-metric-val">${Math.round(SHOP_UPGRADES.secondFloor.basePrice * st.finance.inflationIndex).toLocaleString('tr-TR')} ₺</span>
                </div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">PRESTİJ</span>
                  <span class="exec-metric-val" style="color:var(--emerald);">+16 Dekor</span>
                </div>
                <div class="exec-metric-col">
                  <span class="exec-metric-label">DURUM</span>
                  <span class="exec-metric-val">${st.shop.hasSecondFloor ? '2. Kat Açık' : 'Kapalı'}</span>
                </div>
                <div><div class="exec-dual-bar"><div style="width:${st.shop.hasSecondFloor ? 100 : 20}%;background:#63b3ed;"></div></div></div>
                ${
                  st.shop.hasSecondFloor
                    ? `<span class="badge badge-success">✓ 2. Kat Açık</span>`
                    : `<button class="btn btn-primary btn-sm" id="btn-upg-floor2">2. Katı Aç</button>`
                }
              </div>
            </div>
          </div>

          <div class="game-card">
            <div class="card-title">🎨 İç Mimari Duvar & Zemin Konsepti</div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              ${WALL_STYLES.map(
                (w) => `
                <button class="btn btn-sm ${st.shop.wallColor === w.id ? 'btn-primary' : ''}" data-wall-style="${w.id}">
                  Duvar: ${w.name} (+${w.decorBonus} Dekor • ${Math.round(w.price * st.finance.inflationIndex).toLocaleString('tr-TR')} ₺)
                </button>
              `
              ).join('')}
              ${FLOOR_STYLES.map(
                (f) => `
                <button class="btn btn-sm ${st.shop.floorStyle === f.id ? 'btn-primary' : ''}" data-floor-style="${f.id}">
                  Zemin: ${f.name} (+${f.decorBonus} Dekor • ${Math.round(f.price * st.finance.inflationIndex).toLocaleString('tr-TR')} ₺)
                </button>
              `
              ).join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;

    container.querySelectorAll('[data-shop-sub]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.shopSubTab = (btn).getAttribute('data-shop-sub');
        this.renderActiveTab(true);
      });
    });

    container.querySelector('[data-goto-shop-sub]')?.addEventListener('click', () => {
      this.shopSubTab = 'dekorasyon';
      this.renderActiveTab(true);
    });

    container.querySelector('#btn-restock-doner')?.addEventListener('click', () => this.engine.restockDonerSkewer(false));
    container.querySelector('#btn-clean-shop')?.addEventListener('click', () => this.engine.cleanShopAction());
    container.querySelector('#chk-auto-doner')?.addEventListener('change', (e) => {
      st.shop.autoRestockDoner = (e.target).checked;
      SaveManager.saveAuto(st);
    });
    container.querySelector('#btn-finish-day-early')?.addEventListener('click', () => this.engine.finishDay());

    container.querySelectorAll('[data-buy-furniture]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const itemId = (btn).getAttribute('data-buy-furniture');
        if (!itemId) return;
        const res = this.engine.buyAndPlaceFurniture(itemId, 0, 0);
        this.showToast(res.ok ? 'Ekipman Kuruldu' : 'İşlem Başarısız', res.msg, res.ok ? 'success' : 'warning');
      });
    });

    container.querySelectorAll('[data-sell-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const instId = (btn).getAttribute('data-sell-item');
        if (instId) this.engine.sellPlacedFurniture(instId);
      });
    });

    const realEstateMult = st.npcs['emlakci_murat']?.hasActiveDeal ? 0.85 : 1.0;

    container.querySelector('#btn-upg-level2')?.addEventListener('click', () => {
      const cost = Math.round(SHOP_UPGRADES.expandLevel2.basePrice * st.finance.inflationIndex * realEstateMult);
      if (st.finance.cash < cost) {
        this.showToast('Yetersiz Bakiye', `${cost.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= cost;
      st.shop.level = 2;
      this.engine.recalculateShopStats();
      this.showToast('Orta Salon Açıldı! 🎉', 'Dükkanınız Seviye 2 geniş salona büyüdü.', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelector('#btn-upg-sidewalk')?.addEventListener('click', () => {
      const cost = Math.round(SHOP_UPGRADES.sidewalkPermit.basePrice * st.finance.inflationIndex);
      if (st.finance.cash < cost) {
        this.showToast('Yetersiz Bakiye', `${cost.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= cost;
      st.shop.hasSidewalkPermit = true;
      this.engine.recalculateShopStats();
      this.showToast('Kaldırım Masa İzni Alındı! ⛱️', '+6 Açık hava koltuk kapasitesi eklendi.', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelector('#btn-upg-floor2')?.addEventListener('click', () => {
      const cost = Math.round(SHOP_UPGRADES.secondFloor.basePrice * st.finance.inflationIndex * realEstateMult);
      if (st.finance.cash < cost) {
        this.showToast('Yetersiz Bakiye', `${cost.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= cost;
      st.shop.level = 3;
      st.shop.hasSecondFloor = true;
      this.engine.recalculateShopStats();
      this.engine.checkAchievements();
      this.showToast('2. Kat Mega Aile Salonu Açıldı! 👑', 'Dükkanınız iki katlı meşhur bir restorana dönüştü!', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelectorAll('[data-wall-style]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-wall-style');
        const ws = WALL_STYLES.find((w) => w.id === id);
        if (!ws) return;
        const cost = Math.round(ws.price * st.finance.inflationIndex);
        if (st.shop.wallColor !== ws.id && st.finance.cash < cost) {
          this.showToast('Yetersiz Bakiye', `${cost.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
          return;
        }
        if (st.shop.wallColor !== ws.id) st.finance.cash -= cost;
        st.shop.wallColor = ws.id;
        this.engine.recalculateShopStats();
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-floor-style]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-floor-style');
        const fs = FLOOR_STYLES.find((f) => f.id === id);
        if (!fs) return;
        const cost = Math.round(fs.price * st.finance.inflationIndex);
        if (st.shop.floorStyle !== fs.id && st.finance.cash < cost) {
          this.showToast('Yetersiz Bakiye', `${cost.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
          return;
        }
        if (st.shop.floorStyle !== fs.id) st.finance.cash -= cost;
        st.shop.floorStyle = fs.id;
        this.engine.recalculateShopStats();
        bus.emit('state:updated', st);
      });
    });
  }

  // ==========================================================================
  // 2. ESNAF & MAHALLE (Tamamen Yazılı İlişki, Ortaklık Tablosu & Sokak Halkı)
  // ==========================================================================

  renderStreetTab(container) {
    const st = this.engine.state;
    const selectedNpc = STREET_NPCS.find((n) => n.id === this.selectedStreetNpcId) || STREET_NPCS[0];
    const selectedState = st.npcs[selectedNpc.id];
    const dlg = selectedNpc.dialogues[0];
    const shareCost10 = Math.round(selectedNpc.partnerBaseValuation * st.finance.inflationIndex * 0.10);
    const estDailyDiv10 = Math.round(selectedNpc.dailyDividendBase * st.finance.inflationIndex * 0.10);

    const streetColors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4', '#4fd1c5', '#fbd38d'];
    const streetSlices = STREET_NPCS.slice(0, 5).map((npc, i) => ({
      label: npc.shopName,
      subLabel: `İlişki ${st.npcs[npc.id]?.relation || 50}`,
      value: Math.max(10, (st.npcs[npc.id]?.relation || 50) + (st.npcs[npc.id]?.partnerShare || 0) * 2),
      color: streetColors[i % streetColors.length]
    }));

    const activeDealsCount = Object.values(st.npcs).filter((n) => n.hasActiveDeal).length;
    const activePartnersCount = Object.values(st.npcs).filter((n) => n.partnerShare > 0).length;

    container.innerHTML = `
      <div class="panel-scroll">
        <div class="game-card" style="margin-bottom:18px;">
          <div class="card-head">
            <div>
              <span class="card-kicker">MAHALLE ESNAF MECLİSİ • ${STREET_NPCS.length} KOMŞU DÜKKAN</span>
              <div class="card-title">Komşu Esnaflar, Tedarik Anlaşmaları ve Ortaklık Payları</div>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
              <span class="badge badge-success">🤝 Aktif Anlaşma: ${activeDealsCount}</span>
              <span class="badge badge-warning">👑 Ortak Olunan Dükkan: ${activePartnersCount}</span>
            </div>
          </div>

          ${ChartRenderer.renderSegmentedBar(streetSlices)}

          <div class="exec-row-list" style="margin-top:6px;">
            ${STREET_NPCS.map((npc, idx) => {
              const ns = st.npcs[npc.id];
              const col = streetColors[idx % streetColors.length];
              const valuation = Math.round(npc.partnerBaseValuation * st.finance.inflationIndex);
              const myDividend = Math.round(npc.dailyDividendBase * st.finance.inflationIndex * (ns.partnerShare / 100));
              const isSelected = npc.id === selectedNpc.id;

              return `
                <div class="exec-row" style="${isSelected ? 'border-color:var(--accent-secondary);background:var(--bg-row-hover);' : ''}">
                  <div class="exec-row-entity">
                    <span class="exec-accent-bar" style="background:${col};"></span>
                    <div>
                      <div class="exec-entity-title">
                        ${npc.icon} ${npc.name} • ${npc.shopName}
                        ${ns.hasActiveDeal ? `<span class="badge badge-success" style="margin-left:6px;">Anlaşmalı</span>` : ''}
                      </div>
                      <div class="exec-entity-sub">${npc.shopType} • ${npc.dealOffer.title}</div>
                    </div>
                  </div>

                  <div class="exec-big-pct" style="color:${col};" title="Esnaf Dostluk & Güven Oranı">
                    %${ns.relation}
                  </div>

                  <div class="exec-metric-col">
                    <span class="exec-metric-label">DÜKKAN DEĞERİ</span>
                    <span class="exec-metric-val">${valuation.toLocaleString('tr-TR')} ₺</span>
                  </div>

                  <div class="exec-metric-col">
                    <span class="exec-metric-label">ORTAKLIK PAYIN</span>
                    <span class="exec-metric-val" style="color:var(--accent-secondary);">%${ns.partnerShare} Hisse</span>
                  </div>

                  <div class="exec-metric-col">
                    <span class="exec-metric-label">GÜNLÜK KÂR PAYI</span>
                    <span class="exec-metric-val" style="color:var(--emerald);">+${myDividend.toLocaleString('tr-TR')} ₺/gün</span>
                  </div>

                  <div>
                    <div class="exec-dual-bar" title="İlişki: %${ns.relation} / Dükkan Sağlığı: %${ns.shopHealth}">
                      <div style="width:${Math.min(45, ns.partnerShare + 15)}%;background:#f5c76b;"></div>
                      <div style="width:${Math.max(20, ns.relation - 20)}%;background:#38d39f;"></div>
                    </div>
                  </div>

                  <div style="display:flex;gap:6px;">
                    <button class="btn ${isSelected ? 'btn-primary' : ''} btn-sm" data-pick-npc="${npc.id}">
                      💬 Yazılı Görüş
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="dashboard-2col">
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">YAZILI ESNAF GÖRÜŞMESİ & MÜZAKERE</span>
                <div class="card-title">${selectedNpc.icon} ${selectedNpc.name} (${selectedNpc.shopName})</div>
                <div class="card-subtitle">${selectedNpc.backstory}</div>
              </div>
              <span class="badge ${selectedState.relation >= 65 ? 'badge-success' : 'badge-warning'}">
                Dostluk & Güven: %${selectedState.relation}
              </span>
            </div>

            <div style="background:var(--bg-input);border-left:4px solid var(--accent-secondary);padding:13px 15px;border-radius:8px;font-size:0.9rem;line-height:1.5;">
              <div style="font-size:0.72rem;font-weight:900;color:var(--accent-secondary);text-transform:uppercase;margin-bottom:4px;">
                ${selectedNpc.name} Diyor Ki:
              </div>
              "${selectedState.lastDialogueReply || dlg.greeting}"
            </div>

            <div style="display:flex;flex-direction:column;gap:8px;">
              ${dlg.options
                .map(
                  (opt, idx) => `
                <button class="btn" style="justify-content:space-between;text-align:left;padding:10px 14px;border-radius:10px;" data-npc-opt="${idx}">
                  <span>✍️ "${opt.text}"</span>
                  <span class="badge badge-info">+${opt.relationDelta} Güven</span>
                </button>
              `
                )
                .join('')}
            </div>

            <div style="background:var(--bg-row);padding:12px 14px;border-radius:10px;border:1px solid var(--border-color);display:flex;flex-direction:column;gap:8px;margin-top:4px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:800;font-size:0.88rem;">🤝 Özel Ticari Anlaşma: ${selectedNpc.dealOffer.title}</span>
                ${
                  selectedState.hasActiveDeal
                    ? `<span class="badge badge-success">✓ Anlaşma Yürürlükte</span>`
                    : `<span class="badge badge-neutral">Şart: %${selectedNpc.dealOffer.minRelation} Güven</span>`
                }
              </div>
              <div style="font-size:0.8rem;color:var(--text-secondary);">${selectedNpc.dealOffer.description}</div>

              ${
                selectedNpc.canPartner
                  ? `
                <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-color);padding-top:8px;margin-top:4px;flex-wrap:wrap;gap:8px;">
                  <div style="font-size:0.8rem;">
                    %10 Ortaklık Bedeli: <strong>${shareCost10.toLocaleString('tr-TR')} ₺</strong> (Günlük Kâr Payı: <strong style="color:var(--emerald);">+${estDailyDiv10.toLocaleString('tr-TR')} ₺</strong>)
                  </div>
                  <button class="btn btn-primary btn-sm" id="btn-buy-npc-share" ${selectedState.partnerShare >= 50 ? 'disabled' : ''}>
                    ${selectedState.partnerShare >= 50 ? 'Maksimum Ortaklık (%50)' : `👑 +%10 Hisse Al (${shareCost10.toLocaleString('tr-TR')} ₺)`}
                  </button>
                </div>
              `
                  : ''
              }
            </div>
          </div>

          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">MAHALLE HALKI & SOKAK GÜNLÜĞÜ</span>
                <div class="card-title">📜 Sokak Sakinleri ve Esnafla Yazılı Diyalog Akışı</div>
                <div class="card-subtitle">Mahalle halkıyla kurduğunuz yazılı etkileşimler itibarınızı ve müşteri sadakatini belirler</div>
              </div>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" id="btn-street-tea">
                ☕ Esnaf Kahvesine & Sokak Halkına Çay İkram Et (${Math.round(350 * st.finance.inflationIndex)} ₺ • +Tüm Esnaf Güven)
              </button>
              <button class="btn btn-sm" id="btn-street-askma">
                🥖 Mahalledeki Öğrencilere Askıda Dürüm Bırak (${Math.round(600 * st.finance.inflationIndex)} ₺ • +5 İtibar)
              </button>
            </div>

            <div data-inner-scroll="street-feed" style="display:flex;flex-direction:column;gap:8px;max-height:330px;overflow-y:auto;padding-right:4px;">
              ${(st.streetFeed || [])
                .map(
                  (item) => `
                <div style="background:var(--bg-row);border:1px solid var(--border-color);border-left:4px solid ${
                  item.tone === 'good' ? 'var(--emerald)' : item.tone === 'warn' ? 'var(--accent-secondary)' : 'var(--sky)'
                };padding:10px 13px;border-radius:8px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-weight:800;font-size:0.86rem;">
                      ${item.speaker} <span style="color:var(--text-muted);font-weight:700;">• ${item.role} (${item.timeLabel})</span>
                    </span>
                    <span class="badge ${item.tone === 'good' ? 'badge-success' : 'badge-info'}">${item.impactLabel}</span>
                  </div>
                  <div style="font-size:0.83rem;color:var(--text-secondary);line-height:1.4;">"${item.text}"</div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-pick-npc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-pick-npc');
        if (id) {
          this.selectedStreetNpcId = id;
          this.renderActiveTab(true);
        }
      });
    });

    container.querySelectorAll('[data-npc-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number((btn).getAttribute('data-npc-opt'));
        const opt = dlg.options[idx];
        if (!opt) return;

        if (opt.cashCost) {
          const scaled = Math.round(opt.cashCost * st.finance.inflationIndex);
          if (st.finance.cash < scaled) {
            this.showToast('Yetersiz Nakit', `${scaled} TL gerekli.`, 'warning');
            return;
          }
          st.finance.cash -= scaled;
        }
        if (opt.energyCost) {
          if (st.player.energy < opt.energyCost) {
            this.showToast('Yorgunsun Usta!', 'Görüşme için yeterli enerjin kalmadı.', 'warning');
            return;
          }
          st.player.energy -= opt.energyCost;
        }

        selectedState.relation = Math.min(100, selectedState.relation + opt.relationDelta);
        selectedState.lastDialogueReply = opt.reply;

        st.streetFeed.unshift({
          id: 'sf_dlg_' + Date.now(),
          timeLabel: this.formatClock(st.time.minuteOfDay),
          speaker: selectedNpc.name,
          role: selectedNpc.shopName,
          text: opt.reply,
          impactLabel: `+${opt.relationDelta} Güven`,
          tone: 'good'
        });

        if (opt.specialAction === 'activate_deal' || selectedState.relation >= selectedNpc.dealOffer.minRelation) {
          if (selectedState.relation >= selectedNpc.dealOffer.minRelation && !selectedState.hasActiveDeal) {
            selectedState.hasActiveDeal = true;
            if (selectedNpc.id === 'cayci_riza') st.shop.reputation = Math.min(100, st.shop.reputation + 8);
            this.showToast('Esnaf Anlaşması İmzalandı! 🤝', `${selectedNpc.name}: ${selectedNpc.dealOffer.title} aktif oldu!`, 'success');
          }
        }

        this.engine.checkAchievements();
        bus.emit('state:updated', st);
      });
    });

    container.querySelector('#btn-buy-npc-share')?.addEventListener('click', () => {
      if (selectedState.relation < 55) {
        this.showToast('Güven Yetersiz', `${selectedNpc.name} ile ortak olmak için güven puanı en az %55 olmalı.`, 'warning');
        return;
      }
      if (st.finance.cash < shareCost10) {
        this.showToast('Yetersiz Sermaye', `${shareCost10.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= shareCost10;
      selectedState.partnerShare = Math.min(50, selectedState.partnerShare + 10);
      selectedState.relation = Math.min(100, selectedState.relation + 8);
      st.streetFeed.unshift({
        id: 'sf_part_' + Date.now(),
        timeLabel: this.formatClock(st.time.minuteOfDay),
        speaker: selectedNpc.name,
        role: selectedNpc.shopName,
        text: `Hayırlı uğurlu olsun ortağım! ${selectedNpc.shopName} kazancının %${selectedState.partnerShare} payı artık her akşam kasana akacak.`,
        impactLabel: `%${selectedState.partnerShare} Ortaklık`,
        tone: 'good'
      });
      this.engine.checkAchievements();
      this.showToast('Hayırlı Ortaklık! 👑', `${selectedNpc.shopName} ortaklık payınız %${selectedState.partnerShare} oldu!`, 'success');
      bus.emit('state:updated', st);
    });

    container.querySelector('#btn-street-tea')?.addEventListener('click', () => {
      const cost = Math.round(350 * st.finance.inflationIndex);
      if (st.finance.cash < cost) {
        this.showToast('Yetersiz Bakiye', `${cost} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= cost;
      for (const npc of STREET_NPCS) {
        st.npcs[npc.id].relation = Math.min(100, st.npcs[npc.id].relation + 4);
      }
      st.streetFeed.unshift({
        id: 'sf_tea_' + Date.now(),
        timeLabel: this.formatClock(st.time.minuteOfDay),
        speaker: 'Çaycı Rıza Amca',
        role: 'Çınaraltı Çay Ocağı',
        text: 'Dönerci Ustamızdan bütün sokağa sıcak çay ikramı var! Allah kesene Halil İbrahim bereketi versin komşum.',
        impactLabel: '+4 Tüm Esnaf Güven',
        tone: 'good'
      });
      this.engine.checkAchievements();
      this.showToast('Esnafa Çay Dağıtıldı ☕', 'Tüm komşu esnaflarla ilişkiniz +4 güçlendi!', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelector('#btn-street-askma')?.addEventListener('click', () => {
      const cost = Math.round(600 * st.finance.inflationIndex);
      if (st.finance.cash < cost) {
        this.showToast('Yetersiz Bakiye', `${cost} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= cost;
      st.shop.reputation = Math.min(100, st.shop.reputation + 5);
      st.streetFeed.unshift({
        id: 'sf_ask_' + Date.now(),
        timeLabel: this.formatClock(st.time.minuteOfDay),
        speaker: 'Mahalle Muhtarı & Öğrenciler',
        role: 'Sokak Halkı',
        text: 'Askıda döner panosunu gören bütün mahalleli duygulandı. Esnaflığın parmakla gösteriliyor!',
        impactLabel: '+5 İtibar',
        tone: 'good'
      });
      this.showToast('Askıda Dürüm Hayrı 🥖', 'Mahalle halkı gönülden teşekkür etti (+5 İtibar).', 'success');
      bus.emit('state:updated', st);
    });
  }

  // ==========================================================================
  // 3. MENÜ YÖNETİMİ, SOKAĞIN SOSYAL ÇEVRESİNE GÖRE MENÜ & FİYATLANDIRMA
  // ==========================================================================

  renderMenuTab(container) {
    const st = this.engine.state;
    const hood = NEIGHBORHOOD_TYPES.find((n) => n.id === st.player.neighborhoodType) || NEIGHBORHOOD_TYPES[0];
    const menuFit = this.engine.getNeighborhoodMenuFitScore();

    const filteredRecipes = RECIPES.filter((r) => {
      if (this.menuCategoryFilter === 'tumu') return true;
      return r.socialTag === this.menuCategoryFilter || r.socialTag === 'genel';
    });

    const chartRows = filteredRecipes.map((rec) => ({
      name: rec.name,
      icon: rec.icon,
      price: st.menu[rec.id].price,
      cost: this.engine.getRecipeUnitCost(rec.id),
      suggested: this.engine.getSuggestedPrice(rec.id),
      sold: st.menu[rec.id].soldTotal
    }));

    container.innerHTML = `
      <div class="panel-scroll">
        <!-- SOKAĞIN SOSYAL ÇEVRESİ & HAZIR MENÜ STRATEJİLERİ KARTI -->
        <div class="game-card" style="margin-bottom:18px;border-color:var(--accent-primary);">
          <div class="card-head">
            <div>
              <span class="card-kicker">SOKAĞIN SOSYAL ÇEVRESİ & ALIM GÜCÜ ANALİZİ</span>
              <div class="card-title">🏘️ ${hood.name}</div>
              <div class="card-subtitle">${hood.description}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span class="badge ${menuFit >= 75 ? 'badge-success' : 'badge-warning'}" style="font-size:0.86rem;padding:6px 12px;">
                🎯 Sosyal Çevre Menü & Fiyat Uyumu: %${menuFit}
              </span>
            </div>
          </div>

          <!-- Sokağın Demografik Ağırlık Çubuğu -->
          ${ChartRenderer.renderSegmentedBar([
            { label: 'Öğrenci Nüfusu', value: hood.customerWeights.ogrenci, color: '#f5c76b' },
            { label: 'Sanayi / İşçi', value: hood.customerWeights.isci, color: '#38d39f' },
            { label: 'Aile Sakinleri', value: hood.customerWeights.aile, color: '#63b3ed' },
            { label: 'Çarşı Esnafı', value: hood.customerWeights.esnaf, color: '#b794f4' },
            { label: 'Turist / Misafir', value: hood.customerWeights.turist, color: '#f68773' }
          ])}

          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;border-top:1px solid var(--border-color);padding-top:10px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span style="font-size:0.8rem;font-weight:800;color:var(--text-secondary);">Hazır Menü & Fiyat Şablonları:</span>
              <button class="btn btn-primary btn-sm" data-menu-preset="social_optimal">
                🎯 Bu Sokağın Sosyal Çevresine Göre Optimize Et
              </button>
              <button class="btn btn-sm" data-menu-preset="ekonomik_surum">
                🎓 Öğrenci & Ekonomik Sürüm Menüsü
              </button>
              <button class="btn btn-sm" data-menu-preset="orta_dengeli">
                🛠️ Sanayi & Esnaf Doyurucu Menü
              </button>
              <button class="btn btn-sm" data-menu-preset="prestij_gurme">
                👑 Aile & Turistik Gurme Restoran Menüsü
              </button>
            </div>

            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:0.78rem;color:var(--text-muted);font-weight:700;">Şube / Mahalle Çevresi:</span>
              <select id="sel-change-hood" class="form-select" style="padding:5px 10px;font-size:0.8rem;">
                ${NEIGHBORHOOD_TYPES.map(
                  (n) => `<option value="${n.id}" ${n.id === st.player.neighborhoodType ? 'selected' : ''}>${n.name.split('(')[0].trim()}</option>`
                ).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- FİLTRE SEKMELERİ VE TÜMÜNÜ GÜNCELLE BUTONU -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
          <div class="sub-tabs" style="margin-bottom:0;">
            <button class="sub-tab-btn ${this.menuCategoryFilter === 'tumu' ? 'active' : ''}" data-menu-cat="tumu">Tüm Menü (${RECIPES.length})</button>
            <button class="sub-tab-btn ${this.menuCategoryFilter === 'ogrenci_favorisi' ? 'active' : ''}" data-menu-cat="ogrenci_favorisi">🎓 Öğrenci & Genç</button>
            <button class="sub-tab-btn ${this.menuCategoryFilter === 'sanayi_esnaf' ? 'active' : ''}" data-menu-cat="sanayi_esnaf">🛠️ Sanayi & Esnaf</button>
            <button class="sub-tab-btn ${this.menuCategoryFilter === 'aile_klasik' ? 'active' : ''}" data-menu-cat="aile_klasik">👨‍👩‍👧 Aile Semti</button>
            <button class="sub-tab-btn ${this.menuCategoryFilter === 'turist_gurme' ? 'active' : ''}" data-menu-cat="turist_gurme">📸 Turistik & Gurme</button>
          </div>

          <button class="btn btn-primary btn-sm" id="btn-sync-all-prices">
            📈 Tüm Fiyatları Güncel Enflasyon Önerisine Eşitle (x${st.finance.inflationIndex.toFixed(2)})
          </button>
        </div>

        <!-- MENÜ MALİYET vs KÂR MARJI GRAFİĞİ -->
        <div class="game-card" style="margin-bottom:18px;">
          <div class="card-head">
            <div>
              <span class="card-kicker">ÜRÜN KARLILIK ANALİZİ</span>
              <div class="card-title">📊 Menü Ürünleri Birim Maliyet ve Net Kâr Marjı Grafiği</div>
            </div>
          </div>
          ${ChartRenderer.renderMenuMarginChart(chartRows)}
        </div>

        <!-- ÜRÜN KARTLARI -->
        <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr));">
          ${filteredRecipes.map((rec) => {
            const ms = st.menu[rec.id];
            const cost = this.engine.getRecipeUnitCost(rec.id);
            const suggested = this.engine.getSuggestedPrice(rec.id);
            const demand = this.engine.getNeighborhoodRecipeDemand(rec.id);
            const profit = ms.price - cost;
            const marginPct = ms.price > 0 ? Math.round((profit / ms.price) * 100) : 0;
            const hasStock = this.engine.hasIngredientsForRecipe(rec.id);
            const overBudget = ms.price > demand.maxBudgetPrice;

            return `
              <div class="game-card" style="${!ms.active ? 'opacity:0.6;' : ''}">
                <div class="card-head">
                  <div>
                    <span class="card-kicker">${rec.socialTagLabel}</span>
                    <div class="card-title">${rec.icon} ${rec.name}</div>
                    <div class="card-subtitle">${rec.description}</div>
                  </div>
                  <label style="display:flex;align-items:center;gap:5px;font-size:0.78rem;font-weight:800;cursor:pointer;">
                    <input type="checkbox" data-toggle-recipe="${rec.id}" ${ms.active ? 'checked' : ''} />
                    Menüde
                  </label>
                </div>

                <!-- Sosyal Çevre Talep Gücü & Bütçe Tavanı -->
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <span class="badge ${demand.badgeClass}">${demand.label} (%${demand.score})</span>
                  <span class="badge ${overBudget ? 'badge-danger' : 'badge-neutral'}">
                    ${overBudget ? `⚠️ Tavanı Aşıyor (Max ${demand.maxBudgetPrice} ₺)` : `Mahalle Tavanı: ${demand.maxBudgetPrice} ₺`}
                  </span>
                </div>

                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <span class="badge ${hasStock ? 'badge-success' : 'badge-danger'}">
                    ${hasStock ? '✓ Stok Hazır' : '⚠️ Malzeme Eksik'}
                  </span>
                  <span class="badge badge-neutral">Maliyet: ${cost} ₺</span>
                  <span class="badge badge-info">Önerilen: ${suggested} ₺</span>
                  <span class="badge ${profit > 0 ? 'badge-success' : 'badge-danger'}">
                    Net Kâr: ${profit} ₺ (%${marginPct})
                  </span>
                </div>

                <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.8rem;background:var(--bg-input);padding:6px 10px;border-radius:8px;">
                  <span style="font-weight:700;">Porsiyon Gramajı:</span>
                  <div style="display:flex;gap:4px;">
                    <button class="btn btn-sm ${ms.portionFactor === 0.8 ? 'btn-primary' : ''}" data-portion="${rec.id}:0.8">Az (0.8x)</button>
                    <button class="btn btn-sm ${ms.portionFactor === 1.0 ? 'btn-primary' : ''}" data-portion="${rec.id}:1.0">Tam (1x)</button>
                    <button class="btn btn-sm ${ms.portionFactor === 1.25 ? 'btn-primary' : ''}" data-portion="${rec.id}:1.25">Bol (1.25x)</button>
                  </div>
                </div>

                <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                  <button class="btn btn-sm" data-price-step="${rec.id}:-5">-5 ₺</button>
                  <input type="number" class="form-input" style="width:90px;text-align:center;" data-price-input="${rec.id}" value="${ms.price}" min="5" max="5000" />
                  <button class="btn btn-sm" data-price-step="${rec.id}:5">+5 ₺</button>
                  <button class="btn btn-primary btn-sm" style="flex:1;" data-price-suggest="${rec.id}">
                    Önerilen (${suggested} ₺)
                  </button>
                </div>

                <div style="display:flex;justify-content:space-between;font-size:0.76rem;color:var(--text-muted);border-top:1px solid var(--border-color);padding-top:6px;">
                  <span>Bugün Satılan: <strong>${ms.soldToday} adet</strong></span>
                  <span>Toplam Satış: <strong>${ms.soldTotal} adet</strong></span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('[data-menu-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.menuCategoryFilter = (btn).getAttribute('data-menu-cat');
        this.renderActiveTab(true);
      });
    });

    container.querySelectorAll('[data-menu-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = (btn).getAttribute('data-menu-preset');
        if (preset) {
          this.engine.applyNeighborhoodMenuPreset(preset, false);
        }
      });
    });

    container.querySelector('#sel-change-hood')?.addEventListener('change', (e) => {
      st.player.neighborhoodType = (e.target).value;
      const found = NEIGHBORHOOD_TYPES.find((n) => n.id === st.player.neighborhoodType);
      this.showToast(
        'Sosyal Çevre Güncellendi 🏘️',
        `Hedef mahalle profili "${found?.name.split('(')[0].trim()}" olarak değiştirildi. Menünüzü yeni çevreye göre optimize edebilirsiniz.`,
        'info'
      );
      bus.emit('state:updated', st);
    });

    container.querySelector('#btn-sync-all-prices')?.addEventListener('click', () => {
      for (const rec of RECIPES) {
        st.menu[rec.id].price = this.engine.getSuggestedPrice(rec.id);
      }
      this.showToast('Fiyatlar Güncellendi 📈', 'Tüm menü fiyatları güncel enflasyon önerisine eşitlendi.', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelectorAll('[data-toggle-recipe]').forEach((chk) => {
      chk.addEventListener('change', (e) => {
        const id = (chk).getAttribute('data-toggle-recipe');
        if (id) {
          st.menu[id].active = (e.target).checked;
          bus.emit('state:updated', st);
        }
      });
    });

    container.querySelectorAll('[data-portion]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = (btn).getAttribute('data-portion') || '';
        const [id, factor] = raw.split(':');
        if (id && st.menu[id]) {
          st.menu[id].portionFactor = Number(factor);
          bus.emit('state:updated', st);
        }
      });
    });

    container.querySelectorAll('[data-price-step]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = (btn).getAttribute('data-price-step') || '';
        const [id, step] = raw.split(':');
        if (id && st.menu[id]) {
          st.menu[id].price = Math.max(5, st.menu[id].price + Number(step));
          bus.emit('state:updated', st);
        }
      });
    });

    container.querySelectorAll('[data-price-input]').forEach((inp) => {
      inp.addEventListener('change', (e) => {
        const id = (inp).getAttribute('data-price-input');
        const val = Math.max(5, Math.round(Number((e.target).value) || 50));
        if (id && st.menu[id]) {
          st.menu[id].price = val;
          bus.emit('state:updated', st);
        }
      });
    });

    container.querySelectorAll('[data-price-suggest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-price-suggest');
        if (id && st.menu[id]) {
          st.menu[id].price = this.engine.getSuggestedPrice(id);
          bus.emit('state:updated', st);
        }
      });
    });
  }

  // ==========================================================================
  // 4. DEPO, DENGELİ STOKLAR, OTOMATİK TEDARİK VE DOLULUK GRAFİĞİ
  // ==========================================================================

  renderInventoryTab(container) {
    const st = this.engine.state;

    const catTotals = {
      et: 0,
      unlu: 0,
      sebze_sos: 0,
      icecek_tatli: 0
    };
    for (const ing of INGREDIENTS) {
      catTotals[ing.category] += Math.round(st.inventory[ing.id]?.amount || 0);
    }

    container.innerHTML = `
      <div class="panel-scroll">
        <div class="section-title">
          <div>
            <h2>📦 Depo Stokları, Otomatik Tedarik & Raf Ömrü (SKT)</h2>
            <p style="font-size:0.84rem;color:var(--text-secondary);font-weight:600;">
              Toptan paketler 100–150 porsiyonluktur ve uzun süre dayanır. Otomatik Toptancı Siparişi açıkken azalan stoklarınız kesintisiz tamamlanır.
            </p>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <label class="badge badge-success" style="padding:8px 14px;cursor:pointer;font-size:0.82rem;">
              <input type="checkbox" id="chk-auto-order-ing" ${st.shop.autoOrderIngredients ? 'checked' : ''} />
              🔄 Otomatik Toptancı Siparişi (Stok 20 Altına Düşünce Tamamla)
            </label>
            <button class="btn btn-primary" id="btn-restock-all-low">
              🚚 Eksik Tüm Malzemeleri Toptan Doldur
            </button>
          </div>
        </div>

        <div class="game-card" style="margin-bottom:18px;">
          <div class="card-head">
            <div>
              <span class="card-kicker">DEPO ENVANTER DAĞILIMI</span>
              <div class="card-title">📊 Kategori Bazlı Mevcut Stok Hacmi</div>
            </div>
          </div>
          ${ChartRenderer.renderSegmentedBar([
            { label: 'Et & Tavuk Grubu', subLabel: `${catTotals.et} porsiyon`, value: Math.max(1, catTotals.et), color: '#f68773' },
            { label: 'Lavaş & Tombik Ekmek', subLabel: `${catTotals.unlu} adet`, value: Math.max(1, catTotals.unlu), color: '#f5c76b' },
            { label: 'Sebze, Patates & Özel Sos', subLabel: `${catTotals.sebze_sos} porsiyon`, value: Math.max(1, catTotals.sebze_sos), color: '#38d39f' },
            { label: 'Ayran, İçecek & Tatlı', subLabel: `${catTotals.icecek_tatli} adet`, value: Math.max(1, catTotals.icecek_tatli), color: '#63b3ed' }
          ])}
        </div>

        <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr));">
          ${INGREDIENTS.map((ing) => {
            const stock = st.inventory[ing.id];
            const fillPct = Math.min(100, Math.round((stock.amount / (ing.packSize * 2)) * 100));
            const barClass = stock.amount < 30 ? 'bad' : stock.amount < 80 ? 'warn' : 'good';

            return `
              <div class="game-card">
                <div class="card-head">
                  <div>
                    <div class="card-title">${ing.icon} ${ing.name}</div>
                    <div class="card-subtitle">Toptan Paket: ${ing.packSize} ${ing.unit} • Raf Ömrü: ${ing.shelfLifeDays} gün</div>
                  </div>
                  <span class="badge ${stock.amount < 30 ? 'badge-danger' : 'badge-success'}">
                    ${Math.round(stock.amount)} ${ing.unit}
                  </span>
                </div>

                <div class="progress-bar">
                  <div class="progress-fill ${barClass}" style="width:${fillPct}%"></div>
                </div>

                <div style="display:flex;justify-content:space-between;font-size:0.78rem;">
                  <span>🕒 Kalan Tazelik (SKT): <strong>${stock.freshnessDays} Gün</strong></span>
                  <span>Tedarikçi: <strong>${SUPPLIER_TIERS[stock.supplierTier].name.split(' ')[0]}</strong></span>
                </div>

                <div style="display:flex;flex-direction:column;gap:6px;margin-top:4px;">
                  ${(['ucuz', 'standart', 'kaliteli'])
                    .map((tierKey) => {
                      const tDef = SUPPLIER_TIERS[tierKey];
                      const uCost = this.engine.getIngredientUnitCost(ing.id, tierKey);
                      const packCost = Math.round(uCost * ing.packSize);
                      return `
                        <button class="btn btn-sm ${tierKey === 'standart' ? 'btn-primary' : ''}" style="justify-content:space-between;" data-order-ing="${ing.id}:${tierKey}">
                          <span>+${ing.packSize} ${ing.unit} (${tDef.name.split(' ')[0]})</span>
                          <strong>${packCost.toLocaleString('tr-TR')} ₺</strong>
                        </button>
                      `;
                    })
                    .join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.querySelector('#chk-auto-order-ing')?.addEventListener('change', (e) => {
      st.shop.autoOrderIngredients = (e.target).checked;
      SaveManager.saveAuto(st);
      this.showToast(
        'Otomatik Tedarik',
        st.shop.autoOrderIngredients ? 'Otomatik toptancı siparişi aktif edildi.' : 'Otomatik sipariş kapatıldı.',
        'info'
      );
    });

    container.querySelectorAll('[data-order-ing]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = (btn).getAttribute('data-order-ing') || '';
        const [ingId, tier] = raw.split(':');
        const res = this.engine.orderIngredientPack(ingId, tier);
        this.showToast(res.ok ? 'Tedarik Siparişi Geldi' : 'Sipariş Hatası', res.msg, res.ok ? 'success' : 'warning');
      });
    });

    container.querySelector('#btn-restock-all-low')?.addEventListener('click', () => {
      let ordered = 0;
      for (const ing of INGREDIENTS) {
        if (st.inventory[ing.id].amount < ing.packSize * 1.2) {
          const res = this.engine.orderIngredientPack(ing.id, 'standart');
          if (res.ok) ordered++;
        }
      }
      this.showToast(
        ordered > 0 ? 'Toplu Tedarik Tamamlandı 🚚' : 'Depo Zaten Dolu',
        ordered > 0 ? `${ordered} kalem malzeme depoya eklendi.` : 'Tüm stoklarınız zaten yüksek seviyede.',
        ordered > 0 ? 'success' : 'info'
      );
    });
  }

  // ==========================================================================
  // 5. PERSONEL YÖNETİMİ VE ONLİNE PAKET SERVİS
  // ==========================================================================

  renderStaffTab(container) {
    const st = this.engine.state;
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
      this.showToast(
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
        const res = this.engine.hireStaff({
          name: cand.name,
          role: cand.role,
          skill: cand.skill,
          morale: cand.morale,
          baseSalary: cand.baseSalary
        });
        this.showToast(res.ok ? 'Yeni Personel' : 'İşe Alım Hatası', res.msg, res.ok ? 'success' : 'warning');
      });
    });

    container.querySelectorAll('[data-train-staff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-train-staff');
        if (id) this.engine.trainStaff(id);
      });
    });

    container.querySelectorAll('[data-fire-staff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-fire-staff');
        if (id) this.engine.fireStaff(id);
      });
    });
  }

  // ==========================================================================
  // 6. AİLE SİSTEMİ, EV EKONOMİSİ VE NESİLLER ARASI DEVİR
  // ==========================================================================

  renderFamilyTab(container) {
    const st = this.engine.state;
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
      st.player.familyTimeRatio = Number((e.target).value);
      bus.emit('state:updated', st);
    });

    container.querySelector('#btn-family-dinner')?.addEventListener('click', () => {
      const cost = Math.round(2200 * inf);
      if (st.finance.cash < cost) {
        this.showToast('Yetersiz Bakiye', `${cost} TL gerekli.`, 'warning');
        return;
      }
      st.finance.cash -= cost;
      for (const m of st.family.members) {
        m.happiness = Math.min(100, m.happiness + 18);
      }
      st.family.avgHappiness = Math.min(100, st.family.avgHappiness + 18);
      this.showToast('Harika Bir Aile Akşamı ❤️', 'Ailenizle çok güzel vakit geçirdiniz, herkesin yüzü gülüyor!', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelectorAll('[data-fam-gift]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-fam-gift');
        const m = st.family.members.find((x) => x.id === id);
        const cost = Math.round(900 * inf);
        if (!m || st.finance.cash < cost) return;
        st.finance.cash -= cost;
        m.happiness = Math.min(100, m.happiness + 15);
        this.showToast('Harçlık & Hediye Verildi 🎁', `${m.name} çok sevindi!`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-fam-doc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-fam-doc');
        const m = st.family.members.find((x) => x.id === id);
        const cost = Math.round(1200 * inf);
        if (!m || st.finance.cash < cost) return;
        st.finance.cash -= cost;
        m.health = Math.min(100, m.health + 22);
        this.showToast('Sağlık Kontrolü Yapıldı 🩺', `${m.name} sağlığına kavuştu.`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-fam-work]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-fam-work');
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
        this.engine.recalculateShopStats();
        this.engine.checkAchievements();
        this.showToast('Aile Dükkanı! 👨‍👦', `${m.name} artık dükkanda maaşsız aile üyesi olarak çalışıyor!`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-fam-succeed]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-fam-succeed');
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
        this.engine.checkAchievements();
        this.showToast('2. Kuşak Ustabaşı! 👑', `${m.name} dükkanın yönetimini devraldı!`, 'success');
        bus.emit('state:updated', st);
      });
    });
  }

  // ==========================================================================
  // 7. YATIRIM, ORTAKLIK, VERESİYE DEFTERİ VE BANKA KREDİLERİ
  // ==========================================================================

  renderFinanceTab(container) {
    const st = this.engine.state;
    const netWorth = this.engine.getNetWorth();

    const holdingsVal = st.finance.holdings.reduce((s, h) => s + h.units * h.currentUnitValue, 0);
    let partnerVal = 0;
    for (const npc of STREET_NPCS) {
      const ns = st.npcs[npc.id];
      if (ns && ns.partnerShare > 0) {
        partnerVal += Math.round(npc.partnerBaseValuation * st.finance.inflationIndex * (ns.partnerShare / 100));
      }
    }

    container.innerHTML = `
      <div class="panel-scroll">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
          <div class="sub-tabs" style="margin-bottom:0;">
            <button class="sub-tab-btn ${this.financeSubTab === 'yatirim' ? 'active' : ''}" data-fin-sub="yatirim">🪙 Altın, Döviz, Araç & 2. Şube</button>
            <button class="sub-tab-btn ${this.financeSubTab === 'ortaklik' ? 'active' : ''}" data-fin-sub="ortaklik">🤝 Komşu Dükkan Ortaklıkları</button>
            <button class="sub-tab-btn ${this.financeSubTab === 'veresiye' ? 'active' : ''}" data-fin-sub="veresiye">📓 Veresiye Defteri (${st.finance.veresiyeList.length})</button>
            <button class="sub-tab-btn ${this.financeSubTab === 'banka' ? 'active' : ''}" data-fin-sub="banka">🏦 Banka & Esnaf Kredisi</button>
          </div>
          <div style="display:flex;gap:10px;align-items:center;">
            <span class="badge badge-success" style="font-size:0.86rem;padding:6px 14px;">
              Net Servet: ${netWorth.toLocaleString('tr-TR')} ₺
            </span>
            ${
              st.finance.cash < 0
                ? `<button class="btn btn-danger btn-sm" id="btn-emergency-rescue">🆘 Esnaf Dayanışma Paketi (+25.000 ₺)</button>`
                : ''
            }
          </div>
        </div>

        <div class="dashboard-2col">
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">VARLIK PORTFÖYÜ</span>
                <div class="card-title">📊 Servet ve Yatırım Dağılım Grafiği</div>
              </div>
            </div>
            ${ChartRenderer.renderPortfolioDonut([
              { label: 'Kasadaki Nakit', value: Math.max(0, st.finance.cash), color: '#38d39f' },
              { label: 'Altın, Döviz, Araç & Şube', value: holdingsVal, color: '#f5c76b' },
              { label: 'Komşu Esnaf Ortaklıkları', value: partnerVal, color: '#63b3ed' }
            ])}
          </div>

          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">PORTFÖY AĞIRLIK ÇUBUĞU</span>
                <div class="card-title">📈 Varlık Sınıfları Paylaşımı</div>
              </div>
            </div>
            ${ChartRenderer.renderSegmentedBar([
              { label: 'Nakit', value: Math.max(1, st.finance.cash), color: '#38d39f' },
              { label: 'Yatırım & Şube', value: Math.max(0, holdingsVal), color: '#f5c76b' },
              { label: 'Esnaf Ortaklığı', value: Math.max(0, partnerVal), color: '#63b3ed' }
            ])}
            <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:6px;">
              Gram Altın Kuru: <strong>${st.finance.goldPrice.toLocaleString('tr-TR')} ₺</strong> •
              Dolar Kuru: <strong>${st.finance.usdPrice.toLocaleString('tr-TR')} ₺</strong> •
              Banka Kredi Borcu: <strong style="color:var(--danger-light);">${st.finance.bankDebt.toLocaleString('tr-TR')} ₺</strong>
            </div>
          </div>
        </div>

        ${
          this.financeSubTab === 'yatirim'
            ? `
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">YATIRIM ARAÇLARI & YENİ ŞUBE</span>
                <div class="card-title">Enflasyona Karşı Koruma ve Pasif Gelir Yatırımları</div>
              </div>
            </div>
            <div class="exec-row-list">
              ${INVESTMENT_CATALOG.map((inv, idx) => {
                const holding = st.finance.holdings.find((h) => h.id === inv.id);
                const currentPrice = holding
                  ? holding.currentUnitValue
                  : Math.round(inv.baseUnitValue * st.finance.inflationIndex);
                const units = holding?.units || 0;
                const colors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4', '#4fd1c5'];
                const col = colors[idx % colors.length];

                return `
                  <div class="exec-row">
                    <div class="exec-row-entity">
                      <span class="exec-accent-bar" style="background:${col};"></span>
                      <div>
                        <div class="exec-entity-title">${inv.icon} ${inv.name}</div>
                        <div class="exec-entity-sub">${inv.description}</div>
                      </div>
                    </div>
                    <div class="exec-big-pct" style="color:${col};">${units} Adet</div>
                    <div class="exec-metric-col">
                      <span class="exec-metric-label">BİRİM FİYAT</span>
                      <span class="exec-metric-val">${currentPrice.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    <div class="exec-metric-col">
                      <span class="exec-metric-label">TOPLAM DEĞER</span>
                      <span class="exec-metric-val" style="color:var(--emerald);">${(units * currentPrice).toLocaleString('tr-TR')} ₺</span>
                    </div>
                    <div class="exec-metric-col">
                      <span class="exec-metric-label">GÜNLÜK GETİRİ</span>
                      <span class="exec-metric-val" style="color:var(--accent-secondary);">+%${(inv.dailyYieldRate * 100).toFixed(2)}</span>
                    </div>
                    <div>
                      <div class="exec-dual-bar">
                        <div style="width:${Math.min(100, units * 20)}%;background:${col};"></div>
                      </div>
                    </div>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-primary btn-sm" data-buy-inv="${inv.id}">➕ Al</button>
                      <button class="btn btn-sm" data-sell-inv="${inv.id}" ${units <= 0 ? 'disabled' : ''}>➖ Sat</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          this.financeSubTab === 'ortaklik'
            ? `
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">ORTAKLAR • KOMŞU ESNAF HİSSELERİ</span>
                <div class="card-title">Komşu Dükkanlara Ortak Olun, Kazanç Paylara Göre Bölünsün</div>
              </div>
            </div>
            <div class="exec-row-list">
              ${STREET_NPCS.filter((n) => n.canPartner)
                .map((npc, idx) => {
                  const ns = st.npcs[npc.id];
                  const cost10 = Math.round(npc.partnerBaseValuation * st.finance.inflationIndex * 0.10);
                  const dailyDiv = Math.round(npc.dailyDividendBase * st.finance.inflationIndex * (ns.partnerShare / 100));
                  const colors = ['#f5c76b', '#38d39f', '#63b3ed', '#f68773', '#b794f4', '#4fd1c5'];
                  const col = colors[idx % colors.length];

                  return `
                    <div class="exec-row">
                      <div class="exec-row-entity">
                        <span class="exec-accent-bar" style="background:${col};"></span>
                        <div>
                          <div class="exec-entity-title">${npc.icon} ${npc.shopName} • ${npc.name}</div>
                          <div class="exec-entity-sub">Dostluk: %${ns.relation} • Dükkan Sağlığı: %${ns.shopHealth}</div>
                        </div>
                      </div>
                      <div class="exec-big-pct" style="color:${col};">%${ns.partnerShare}</div>
                      <div class="exec-metric-col">
                        <span class="exec-metric-label">%10 HİSSE BEDELİ</span>
                        <span class="exec-metric-val">${cost10.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div class="exec-metric-col">
                        <span class="exec-metric-label">GÜNLÜK KÂR PAYI</span>
                        <span class="exec-metric-val" style="color:var(--emerald);">+${dailyDiv.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div class="exec-metric-col">
                        <span class="exec-metric-label">MAKSİMUM PAY</span>
                        <span class="exec-metric-val">%50 Ortak</span>
                      </div>
                      <div>
                        <div class="exec-dual-bar">
                          <div style="width:${ns.partnerShare * 2}%;background:${col};"></div>
                        </div>
                      </div>
                      <button class="btn btn-primary btn-sm" data-partner-npc="${npc.id}" ${ns.partnerShare >= 50 ? 'disabled' : ''}>
                        ${ns.partnerShare >= 50 ? 'Tamamlandı' : `+%10 Ortak Ol`}
                      </button>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          this.financeSubTab === 'veresiye'
            ? `
          <div class="game-card">
            <div class="card-head">
              <div>
                <span class="card-kicker">MAHALLE ALACAKLARI</span>
                <div class="card-title">📓 Veresiye Defteri</div>
              </div>
            </div>
            ${
              st.finance.veresiyeList.length === 0
                ? `<div style="padding:18px;text-align:center;color:var(--text-muted);">Veresiye defterinde alacak kaydı yok.</div>`
                : `
              <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Borçlu Komşu</th>
                    <th>Not</th>
                    <th>Tutar</th>
                    <th>Güven</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  ${st.finance.veresiyeList
                    .map(
                      (v) => `
                    <tr>
                      <td><strong>${v.debtorName}</strong></td>
                      <td>${v.note}</td>
                      <td style="font-weight:800;color:var(--accent-secondary);">${v.amount.toLocaleString('tr-TR')} ₺</td>
                      <td>%${v.trustScore}</td>
                      <td style="display:flex;gap:6px;">
                        <button class="btn btn-primary btn-sm" data-collect-ver="${v.id}">💵 Tahsil Et</button>
                        <button class="btn btn-sm" data-forgive-ver="${v.id}">❤️ Helal Et (+4 İtibar)</button>
                      </td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
              </div>
            `
            }
          </div>
        `
            : ''
        }

        ${
          this.financeSubTab === 'banka'
            ? `
          <div class="card-grid">
            ${LOAN_PACKAGES.map((pkg) => {
              const scaledPrincipal = Math.round(pkg.principal * st.finance.inflationIndex);
              const scaledTotal = Math.round(pkg.totalRepayment * st.finance.inflationIndex);
              const dailyInst = Math.round(scaledTotal / pkg.days);
              return `
                <div class="game-card">
                  <div class="card-head">
                    <div class="card-title">🏦 ${pkg.name}</div>
                    <span class="badge badge-success">+${scaledPrincipal.toLocaleString('tr-TR')} ₺ Nakit</span>
                  </div>
                  <div style="font-size:0.8rem;color:var(--text-secondary);">
                    Toplam Geri Ödeme: <strong>${scaledTotal.toLocaleString('tr-TR')} ₺</strong> (${pkg.days} gün boyunca günlük <strong>${dailyInst.toLocaleString('tr-TR')} ₺</strong> taksit)
                  </div>
                  <button class="btn btn-primary btn-sm" data-take-loan="${pkg.id}">Krediyi Kullan</button>
                </div>
              `;
            }).join('')}
          </div>

          <div class="game-card" style="margin-top:16px;">
            <div class="card-title">📋 Aktif Kredi Taksitleriniz (Toplam Borç: ${st.finance.bankDebt.toLocaleString('tr-TR')} ₺)</div>
            ${
              st.finance.loans.length === 0
                ? `<div style="color:var(--text-muted);font-size:0.84rem;">Bankaya hiçbir kredi borcunuz bulunmuyor!</div>`
                : st.finance.loans
                    .map(
                      (l) => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--bg-row);border-radius:8px;">
                    <span><strong>${l.name}</strong> • Kalan: ${l.remainingPrincipal.toLocaleString('tr-TR')} ₺ (${l.remainingDays} gün)</span>
                    <button class="btn btn-success btn-sm" data-payoff-loan="${l.id}">Borcu Erken Kapat</button>
                  </div>
                `
                    )
                    .join('')
            }
          </div>
        `
            : ''
        }
      </div>
    `;

    container.querySelectorAll('[data-fin-sub]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.financeSubTab = (btn).getAttribute('data-fin-sub');
        this.renderActiveTab(true);
      });
    });

    container.querySelector('#btn-emergency-rescue')?.addEventListener('click', () => {
      st.finance.cash += 25000;
      st.shop.reputation = Math.max(20, st.shop.reputation - 5);
      this.showToast('Esnaf Dayanışması! 🤝', 'Aileniz ve mahalle esnafı aralarında 25.000 TL toplayıp kasanıza destek oldu!', 'success');
      bus.emit('state:updated', st);
    });

    container.querySelectorAll('[data-buy-inv]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-buy-inv');
        const cat = INVESTMENT_CATALOG.find((c) => c.id === id);
        if (!cat) return;
        let holding = st.finance.holdings.find((h) => h.id === id);
        const price = holding ? holding.currentUnitValue : Math.round(cat.baseUnitValue * st.finance.inflationIndex);
        if (st.finance.cash < price) {
          this.showToast('Yetersiz Bakiye', `${price.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
          return;
        }
        st.finance.cash -= price;
        if (!holding) {
          st.finance.holdings.push({
            id: cat.id,
            type: cat.type,
            name: cat.name,
            units: 1,
            avgCost: price,
            currentUnitValue: price,
            dailyYieldRate: cat.dailyYieldRate
          });
        } else {
          holding.units += 1;
        }
        this.engine.checkAchievements();
        this.showToast('Yatırım Yapıldı 💼', `1 adet ${cat.name} portföyünüze eklendi.`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-sell-inv]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-sell-inv');
        const idx = st.finance.holdings.findIndex((h) => h.id === id);
        if (idx === -1) return;
        const holding = st.finance.holdings[idx];
        st.finance.cash += holding.currentUnitValue;
        holding.units -= 1;
        if (holding.units <= 0) st.finance.holdings.splice(idx, 1);
        this.showToast('Varlık Bozduruldu 💵', `${holding.currentUnitValue.toLocaleString('tr-TR')} TL kasaya eklendi.`, 'info');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-partner-npc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const npcId = (btn).getAttribute('data-partner-npc');
        const npc = STREET_NPCS.find((n) => n.id === npcId);
        if (!npc) return;
        const ns = st.npcs[npc.id];
        const cost10 = Math.round(npc.partnerBaseValuation * st.finance.inflationIndex * 0.10);
        if (st.finance.cash < cost10) {
          this.showToast('Yetersiz Bakiye', `${cost10.toLocaleString('tr-TR')} TL gerekli.`, 'warning');
          return;
        }
        st.finance.cash -= cost10;
        ns.partnerShare = Math.min(50, ns.partnerShare + 10);
        this.engine.checkAchievements();
        this.showToast('Ortaklık Artırıldı 👑', `${npc.shopName} ortaklık payınız %${ns.partnerShare} oldu!`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-collect-ver]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-collect-ver');
        const idx = st.finance.veresiyeList.findIndex((v) => v.id === id);
        if (idx === -1) return;
        const ver = st.finance.veresiyeList[idx];
        st.finance.cash += ver.amount;
        st.finance.veresiyeList.splice(idx, 1);
        this.showToast('Veresiye Tahsil Edildi 💵', `${ver.debtorName} borcu olan ${ver.amount} TL'yi ödedi.`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-forgive-ver]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-forgive-ver');
        const idx = st.finance.veresiyeList.findIndex((v) => v.id === id);
        if (idx === -1) return;
        const ver = st.finance.veresiyeList[idx];
        st.finance.veresiyeList.splice(idx, 1);
        st.shop.reputation = Math.min(100, st.shop.reputation + 4);
        this.showToast('Borç Helal Edildi ❤️', `${ver.debtorName} hayır duası etti (+4 İtibar).`, 'info');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-take-loan]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-take-loan');
        const pkg = LOAN_PACKAGES.find((p) => p.id === id);
        if (!pkg) return;
        const scaledPrincipal = Math.round(pkg.principal * st.finance.inflationIndex);
        const scaledTotal = Math.round(pkg.totalRepayment * st.finance.inflationIndex);
        st.finance.cash += scaledPrincipal;
        st.finance.loans.push({
          id: 'loan_' + Date.now(),
          name: pkg.name,
          remainingPrincipal: scaledTotal,
          dailyInstallment: Math.round(scaledTotal / pkg.days),
          remainingDays: pkg.days,
          missedPayments: 0
        });
        st.finance.bankDebt = st.finance.loans.reduce((s, l) => s + l.remainingPrincipal, 0);
        this.showToast('Kredi Onaylandı 🏦', `${scaledPrincipal.toLocaleString('tr-TR')} TL hesabınıza geçti.`, 'success');
        bus.emit('state:updated', st);
      });
    });

    container.querySelectorAll('[data-payoff-loan]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn).getAttribute('data-payoff-loan');
        const idx = st.finance.loans.findIndex((l) => l.id === id);
        if (idx === -1) return;
        const loan = st.finance.loans[idx];
        if (st.finance.cash < loan.remainingPrincipal) {
          this.showToast('Yetersiz Bakiye', 'Borcu kapatmak için nakit yetersiz.', 'warning');
          return;
        }
        st.finance.cash -= loan.remainingPrincipal;
        st.finance.loans.splice(idx, 1);
        st.finance.bankDebt = st.finance.loans.reduce((s, l) => s + l.remainingPrincipal, 0);
        this.showToast('Kredi Borcu Kapatıldı! 🎉', 'Bankaya olan borcunuzu kapattınız.', 'success');
        bus.emit('state:updated', st);
      });
    });
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
