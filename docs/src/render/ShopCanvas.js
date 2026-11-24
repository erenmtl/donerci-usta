// ============================================================================
// 2.5D ÜSTTEN AÇILI (TOP-DOWN RPG) DÜKKAN CANVAS ÇİZİCİ VE İNTERAKTİF GRİD
// ============================================================================

import { FURNITURE_CATALOG, WALL_STYLES, FLOOR_STYLES } from '../data/furniture.js';


export class ShopCanvas {
  canvas;
  ctx;
  engine;
  animFrameId = null;
  tickCount = 0;

  // İnteraktif Dekorasyon Modu
  selectedPlacedInstanceId = null;
  pendingBuyItemId = null;
  hoverCell = null;
  onCellClickCallback = null;

  constructor(canvas, engine, onCellClick) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D başlatılamadı');
    this.ctx = context;
    this.engine = engine;
    this.onCellClickCallback = onCellClick;

    this.bindEvents();
    this.startRenderLoop();
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const cell = this.pixelToGrid(e);
      this.hoverCell = cell;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverCell = null;
    });

    this.canvas.addEventListener('click', (e) => {
      const cell = this.pixelToGrid(e);
      if (cell && this.onCellClickCallback) {
        this.onCellClickCallback(cell.gx, cell.gy);
      }
    });
  }

  getGridMetrics() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cols = this.engine.state.shop.gridCols;
    const rows = this.engine.state.shop.gridRows;

    const wallHeight = Math.round(h * 0.22);
    const sidewalkHeight = Math.round(h * 0.14);
    const floorAvailH = h - wallHeight - sidewalkHeight - 16;
    const floorAvailW = w - 32;

    const cellSize = Math.floor(Math.min(floorAvailW / cols, floorAvailH / rows));
    const gridW = cellSize * cols;
    const gridH = cellSize * rows;
    const startX = Math.floor((w - gridW) / 2);
    const startY = wallHeight + 8;

    return { w, h, cols, rows, wallHeight, sidewalkHeight, cellSize, gridW, gridH, startX, startY };
  }

  pixelToGrid(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    const m = this.getGridMetrics();
    const gx = Math.floor((px - m.startX) / m.cellSize);
    const gy = Math.floor((py - m.startY) / m.cellSize);

    if (gx >= 0 && gx < m.cols && gy >= 0 && gy < m.rows) {
      return { gx, gy };
    }
    return null;
  }

  startRenderLoop() {
    const render = () => {
      this.tickCount += 1;
      this.draw();
      this.animFrameId = window.requestAnimationFrame(render);
    };
    this.animFrameId = window.requestAnimationFrame(render);
  }

  destroy() {
    if (this.animFrameId !== null) {
      window.cancelAnimationFrame(this.animFrameId);
    }
  }

  draw() {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (rect && (this.canvas.width !== Math.floor(rect.width) || this.canvas.height !== Math.floor(rect.height))) {
      this.canvas.width = Math.max(480, Math.floor(rect.width));
      this.canvas.height = Math.max(340, Math.floor(rect.height));
    }

    const ctx = this.ctx;
    const st = this.engine.state;
    const m = this.getGridMetrics();

    ctx.clearRect(0, 0, m.w, m.h);

    // 1. ARKA PLAN & DUVAR (Üstten Açılı 2.5D Duvar Görünümü)
    const wallStyle = WALL_STYLES.find((ws) => ws.id === st.shop.wallColor) || WALL_STYLES[0];
    ctx.fillStyle = wallStyle.color;
    ctx.fillRect(m.startX - 8, 8, m.gridW + 16, m.wallHeight);

    // Duvar alt süpürgelik çizgisi
    ctx.fillStyle = '#1b1410';
    ctx.fillRect(m.startX - 8, m.wallHeight + 2, m.gridW + 16, 6);

    // Pencereler (Gündüz/Akşam gökyüzü rengi)
    const isNight = st.time.minuteOfDay >= 1140;
    const isEvening = st.time.minuteOfDay >= 1020 && st.time.minuteOfDay < 1140;
    const skyColor = isNight ? '#101b33' : isEvening ? '#c9653b' : '#57a8e8';

    ctx.fillStyle = skyColor;
    ctx.fillRect(m.startX + 14, 18, 68, m.wallHeight - 28);
    ctx.strokeStyle = '#d7ccc8';
    ctx.lineWidth = 3;
    ctx.strokeRect(m.startX + 14, 18, 68, m.wallHeight - 28);

    // Dükkan Tabelası (Duvarda)
    ctx.fillStyle = '#261812';
    ctx.fillRect(m.startX + m.gridW / 2 - 110, 14, 220, 34);
    ctx.strokeStyle = '#ff8f00';
    ctx.lineWidth = 2;
    ctx.strokeRect(m.startX + m.gridW / 2 - 110, 14, 220, 34);

    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 13px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🔥 ${st.shop.name.toUpperCase()} 🔥`, m.startX + m.gridW / 2, 35);

    // 2.Kat Balkon Göstergesi
    if (st.shop.hasSecondFloor) {
      ctx.fillStyle = '#ffb74d';
      ctx.font = 'bold 11px Nunito, sans-serif';
      ctx.fillText('✨ 2. KAT AİLE SALONU AÇIK ✨', m.startX + m.gridW - 95, 28);
    }

    // 2. ZEMİN GRİD ÇİZİMİ
    const floorStyle = FLOOR_STYLES.find((fs) => fs.id === st.shop.floorStyle) || FLOOR_STYLES[0];
    for (let r = 0; r < m.rows; r++) {
      for (let c = 0; c < m.cols; c++) {
        const cx = m.startX + c * m.cellSize;
        const cy = m.startY + r * m.cellSize;

        // Satrançlı karo efekti
        const isAlt = (r + c) % 2 === 1;
        ctx.fillStyle = isAlt ? floorStyle.gridColor : floorStyle.color;
        ctx.fillRect(cx, cy, m.cellSize, m.cellSize);

        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx, cy, m.cellSize, m.cellSize);
      }
    }

    // Hover Hücre Vurgusu (Dekorasyon yerleştirme/taşıma modunda)
    if (this.hoverCell) {
      const hx = m.startX + this.hoverCell.gx * m.cellSize;
      const hy = m.startY + this.hoverCell.gy * m.cellSize;
      ctx.fillStyle = this.pendingBuyItemId || this.selectedPlacedInstanceId
        ? 'rgba(102, 187, 106, 0.35)'
        : 'rgba(255, 167, 38, 0.16)';
      ctx.fillRect(hx, hy, m.cellSize, m.cellSize);
      ctx.strokeStyle = '#ffa726';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + 1, hy + 1, m.cellSize - 2, m.cellSize - 2);
    }

    // 3. YERLEŞTİRİLMİŞ DÜKKAN EŞYALARI
    for (const placed of st.shop.placedItems) {
      const def = FURNITURE_CATALOG.find((f) => f.id === placed.itemId);
      if (!def) continue;

      const ix = m.startX + placed.gx * m.cellSize;
      const iy = def.zone === 'wall'
        ? Math.max(16, m.wallHeight - 38)
        : m.startY + placed.gy * m.cellSize;
      const iw = def.width * m.cellSize;
      const ih = def.zone === 'wall' ? 36 : def.height * m.cellSize;

      // Eşya Gölgesi
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(ix + 4, iy + 6, iw - 6, ih - 6);

      // Eşya Gövdesi
      ctx.fillStyle = def.color;
      this.roundRect(ctx, ix + 3, iy + 3, iw - 6, ih - 6, 8);
      ctx.fill();

      // Seçili Eşya Çerçevesi
      if (this.selectedPlacedInstanceId === placed.instanceId) {
        ctx.strokeStyle = '#00e676';
        ctx.lineWidth = 3;
        ctx.strokeRect(ix + 2, iy + 2, iw - 4, ih - 4);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ix + 3, iy + 3, iw - 6, ih - 6);
      }

      // Özel Döner Ocağı Animasyonu (Dönen Et Şişi ve Ateş!)
      if (def.id.includes('doner_ocagi')) {
        const fillRatio = Math.max(0.15, st.shop.donerRollKg / Math.max(1, st.shop.donerMaxKg));
        const coneR = Math.max(8, (m.cellSize * 0.28) * fillRatio);
        // Radyan ateşi parlaması
        const flicker = Math.sin(this.tickCount * 0.2) * 3;
        ctx.fillStyle = '#ff6d00';
        ctx.fillRect(ix + iw / 2 - 12, iy + 8, 24, 8);
        // Döner et şişi
        ctx.beginPath();
        ctx.arc(ix + iw / 2, iy + ih / 2 + 2, coneR + flicker * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = st.shop.donerRollKg > 0.5 ? '#a14925' : '#555';
        ctx.fill();
        ctx.strokeStyle = '#ffcc80';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // İkon ve Kısa İsim
        ctx.font = `${Math.max(16, Math.floor(m.cellSize * 0.38))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(def.icon, ix + iw / 2, iy + ih / 2 + 5);
      }

      ctx.font = 'bold 10px Nunito, sans-serif';
      ctx.fillStyle = '#fff3e0';
      ctx.textAlign = 'center';
      const shortName = def.name.split(' ').slice(-2).join(' ');
      ctx.fillText(shortName, ix + iw / 2, iy + ih - 7);
    }

    // 4. USTA VE PERSONEL KARAKTERLERİ
    this.drawChefAndStaff(ctx, m);

    // 5. KALDIRIM VE GİRİŞ KAPISI
    const sidewalkY = m.startY + m.gridH + 4;
    ctx.fillStyle = '#23201e';
    ctx.fillRect(m.startX - 8, sidewalkY, m.gridW + 16, m.sidewalkHeight);

    // Giriş Paspası
    ctx.fillStyle = '#8d3b24';
    ctx.fillRect(m.startX + m.gridW / 2 - 36, sidewalkY + 2, 72, 18);
    ctx.fillStyle = '#ffe0b2';
    ctx.font = 'bold 10px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOŞ GELDİNİZ', m.startX + m.gridW / 2, sidewalkY + 14);

    // Kaldırım Masa İzni Varsa Açık Hava Masaları
    if (st.shop.hasSidewalkPermit) {
      for (let k = 0; k < 2; k++) {
        const tx = k === 0 ? m.startX + 45 : m.startX + m.gridW - 45;
        const ty = sidewalkY + m.sidewalkHeight / 2 + 2;
        ctx.beginPath();
        ctx.arc(tx, ty, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#c62828';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '11px sans-serif';
        ctx.fillText('⛱️', tx, ty + 4);
      }
    }

    // 6. CANLI MÜŞTERİLER VE KONUŞMA/EMOJİ BALONLARI
    for (const cust of this.engine.visualCustomers) {
      const cx = m.startX + cust.x * m.gridW;
      const cy = m.startY + cust.y * (m.gridH + m.sidewalkHeight * 0.6);
      const bob = Math.sin(this.tickCount * 0.25 + cx) * 2;

      // Müşteri gövde
      ctx.beginPath();
      ctx.arc(cx, cy + bob, 12, 0, Math.PI * 2);
      ctx.fillStyle = cust.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Müşteri tipi etiketi
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cust.name, cx, cy + bob + 22);

      // Sipariş / Memnuniyet Konuşma Balonu
      const bubbleW = 76;
      const bubbleH = 20;
      ctx.fillStyle = 'rgba(20, 17, 15, 0.9)';
      this.roundRect(ctx, cx - bubbleW / 2, cy + bob - 34, bubbleW, bubbleH, 6);
      ctx.fill();
      ctx.strokeStyle = cust.state === 'leaving_angry' ? '#ef5350' : '#ffb74d';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px Nunito, sans-serif';
      ctx.fillText(cust.emoji, cx, cy + bob - 20);
    }
  }

  drawChefAndStaff(ctx, m) {
    const st = this.engine.state;
    // Oyuncu / Baş Usta Tezgahın Arkasında
    const chefX = m.startX + m.cellSize * 1.6 + Math.sin(this.tickCount * 0.08) * 8;
    const chefY = m.startY + m.cellSize * 0.85;

    ctx.beginPath();
    ctx.arc(chefX, chefY, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#ff7043';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👨‍🍳', chefX, chefY + 5);

    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 10px Nunito, sans-serif';
    ctx.fillText(st.player.name.split(' ')[0], chefX, chefY - 18);

    // İşe Alınan Personeller
    st.staff.forEach((member, idx) => {
      const sx = m.startX + m.cellSize * (2.6 + idx * 0.9) + Math.cos(this.tickCount * 0.07 + idx) * 6;
      const sy = m.startY + m.cellSize * (member.role === 'komi' ? 2.1 : 0.9);

      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#26a69a';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const roleIcon = member.role === 'usta' ? '🔪' : member.role === 'kasiyer' ? '📟' : member.role === 'kurye' ? '🛵' : '🧹';
      ctx.font = '12px sans-serif';
      ctx.fillText(roleIcon, sx, sy + 4);
      ctx.fillStyle = '#e0f2f1';
      ctx.font = 'bold 9px Nunito, sans-serif';
      ctx.fillText(member.name.split(' ')[0], sx, sy - 15);
    });
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
