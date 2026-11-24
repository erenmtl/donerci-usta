// ============================================================================
// 2D YANDAN GÖRÜNÜM (SIDE-VIEW) MAHALLE SOKAĞI VE ESNAF DÜKKANLARI ÇİZİCİ
// ============================================================================

import { STREET_NPCS } from '../data/npcs.js';

export class StreetCanvas {
  canvas;
  ctx;
  engine;
  animFrameId = null;
  tickCount = 0;
  selectedNpcId = STREET_NPCS[0].id;
  onSelectNpc;
  buildingBoxes = [];

  constructor(canvas, engine, onSelectNpc) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('StreetCanvas 2D başlatılamadı');
    this.ctx = context;
    this.engine = engine;
    this.onSelectNpc = onSelectNpc;

    this.bindEvents();
    this.startLoop();
  }

  bindEvents() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;

      for (const box of this.buildingBoxes) {
        if (px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h) {
          this.selectedNpcId = box.npcId;
          if (this.onSelectNpc) {
            this.onSelectNpc(box.npcId);
          }
          break;
        }
      }
    });
  }

  startLoop() {
    const loop = () => {
      this.tickCount += 1;
      this.draw();
      this.animFrameId = window.requestAnimationFrame(loop);
    };
    this.animFrameId = window.requestAnimationFrame(loop);
  }

  destroy() {
    if (this.animFrameId !== null) {
      window.cancelAnimationFrame(this.animFrameId);
    }
  }

  draw() {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (rect && (this.canvas.width !== Math.floor(rect.width) || this.canvas.height !== Math.floor(rect.height))) {
      this.canvas.width = Math.max(540, Math.floor(rect.width));
      this.canvas.height = Math.max(300, Math.floor(rect.height));
    }

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const st = this.engine.state;

    ctx.clearRect(0, 0, w, h);

    // 1. GÖKYÜZÜ (Saate göre değişen atmosfer)
    const min = st.time.minuteOfDay;
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    if (min >= 1140) {
      grad.addColorStop(0, '#0b132b');
      grad.addColorStop(1, '#1c2541');
    } else if (min >= 1000) {
      grad.addColorStop(0, '#3d2645');
      grad.addColorStop(1, '#da624a');
    } else {
      grad.addColorStop(0, '#1e88e5');
      grad.addColorStop(1, '#90caf9');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Güneş veya Ay
    ctx.beginPath();
    ctx.arc(w - 65, 42, 20, 0, Math.PI * 2);
    ctx.fillStyle = min >= 1140 ? '#fff9c4' : '#ffd54f';
    ctx.fill();

    // 2. KALDIRIM VE ASFALT CADDE
    const sidewalkY = Math.floor(h * 0.72);
    const roadY = Math.floor(h * 0.82);

    ctx.fillStyle = '#4e4640';
    ctx.fillRect(0, sidewalkY, w, roadY - sidewalkY);

    ctx.fillStyle = '#262322';
    ctx.fillRect(0, roadY, w, h - roadY);

    // Yol Kesikli Çizgiler
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 16]);
    ctx.beginPath();
    ctx.moveTo(0, roadY + (h - roadY) / 2);
    ctx.lineTo(w, roadY + (h - roadY) / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. SOKAKTAKİ ESNAF DÜKKANLARI + BİZİM DÖNERCİ
    this.buildingBoxes = [];
    const totalBuildings = STREET_NPCS.length + 1; // +1 bizim dükkan ortada
    const gap = 8;
    const bWidth = Math.floor((w - gap * (totalBuildings + 1)) / totalBuildings);
    const bHeight = Math.floor(h * 0.50);
    const bTop = sidewalkY - bHeight;

    let currentX = gap;

    for (let i = 0; i < STREET_NPCS.length; i++) {
      // Ortaya bizim döner dükkanını çiz
      if (i === 3) {
        this.drawPlayerShopBuilding(ctx, currentX, bTop - 16, bWidth, bHeight + 16);
        currentX += bWidth + gap;
      }

      const npc = STREET_NPCS[i];
      const npcState = st.npcs[npc.id];
      const isSelected = this.selectedNpcId === npc.id;

      this.buildingBoxes.push({ npcId: npc.id, x: currentX, y: bTop, w: bWidth, h: bHeight });

      // Bina Gövdesi
      ctx.fillStyle = npc.buildingColor;
      ctx.fillRect(currentX, bTop, bWidth, bHeight);

      ctx.strokeStyle = isSelected ? '#ffd54f' : 'rgba(255,255,255,0.22)';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeRect(currentX, bTop, bWidth, bHeight);

      // Çatı / Tente
      ctx.fillStyle = npc.signColor;
      ctx.fillRect(currentX - 2, bTop, bWidth + 4, 24);

      // Dükkan Tabelası
      ctx.fillStyle = '#14110f';
      ctx.font = 'bold 10px Nunito, sans-serif';
      ctx.textAlign = 'center';
      const shortShop = npc.shopName.split(' ').slice(0, 2).join(' ');
      ctx.fillText(shortShop, currentX + bWidth / 2, bTop + 16);

      // Vitrin & İkon
      ctx.fillStyle = 'rgba(20, 16, 14, 0.55)';
      ctx.fillRect(currentX + 8, bTop + 34, bWidth - 16, 52);

      ctx.font = '24px sans-serif';
      ctx.fillText(npc.icon, currentX + bWidth / 2, bTop + 68);

      // Ortaklık ve Anlaşma Rozetleri
      if (npcState?.partnerShare > 0) {
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(currentX + 4, bTop - 20, bWidth - 8, 17);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Nunito, sans-serif';
        ctx.fillText(`👑 %${npcState.partnerShare} ORTAK`, currentX + bWidth / 2, bTop - 8);
      } else if (npcState?.hasActiveDeal) {
        ctx.fillStyle = '#ef6c00';
        ctx.fillRect(currentX + 6, bTop - 19, bWidth - 12, 16);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Nunito, sans-serif';
        ctx.fillText('🤝 ANLAŞMALI', currentX + bWidth / 2, bTop - 8);
      }

      // Esnaf Karakteri Kapı Önünde
      const npcY = sidewalkY - 16 + Math.sin(this.tickCount * 0.08 + i) * 2;
      ctx.beginPath();
      ctx.arc(currentX + bWidth / 2, npcY, 11, 0, Math.PI * 2);
      ctx.fillStyle = npc.signColor;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // İsim & İlişki Puanı
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Nunito, sans-serif';
      ctx.fillText(npc.name.split(' ')[1] || npc.name, currentX + bWidth / 2, sidewalkY + 12);

      // İlişki Barı
      const barW = bWidth - 16;
      ctx.fillStyle = '#1b1613';
      ctx.fillRect(currentX + 8, bTop + bHeight - 14, barW, 6);
      ctx.fillStyle = (npcState?.relation || 50) >= 65 ? '#66bb6a' : '#ffb74d';
      ctx.fillRect(currentX + 8, bTop + bHeight - 14, (barW * (npcState?.relation || 50)) / 100, 6);

      currentX += bWidth + gap;
    }

    // 4. YOLDAN GEÇEN KURYE MOTORU VE SOKAK KEDİSİ
    const motoX = ((this.tickCount * 2.5) % (w + 120)) - 60;
    ctx.font = '20px sans-serif';
    ctx.fillText('🛵', motoX, roadY + 24);
    ctx.font = '14px sans-serif';
    ctx.fillText('🐈', w * 0.48 + Math.sin(this.tickCount * 0.03) * 18, sidewalkY + 14);
  }

  drawPlayerShopBuilding(ctx, x, y, w, h) {
    const st = this.engine.state;
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#ff8f00';
    ctx.fillRect(x - 3, y, w + 6, 26);

    ctx.fillStyle = '#1a120b';
    ctx.font = 'bold 10px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ BİZİM DÜKKAN ★', x + w / 2, y + 16);

    ctx.fillStyle = 'rgba(255, 213, 79, 0.2)';
    ctx.fillRect(x + 8, y + 34, w - 16, 62);

    ctx.font = '28px sans-serif';
    ctx.fillText('🌯', x + w / 2, y + 74);

    ctx.fillStyle = '#ffe082';
    ctx.font = 'bold 9px Nunito, sans-serif';
    ctx.fillText(`Seviye ${st.shop.level}`, x + w / 2, y + h - 10);
  }
}
