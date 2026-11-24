// ============================================================================
// YÜKSEK ÇÖZÜNÜRLÜKLÜ İNTERAKTİF GRAFİK MOTORU (ChartRenderer)
// İmleç (Hover) ile Nokta, Sütun ve Dilim Detayı Gösteren SVG & Veri Grafikleri
// ============================================================================

import type { DailyLedgerEntry, HourlyPoint } from '../types/index.ts';

export interface SegmentSlice {
  label: string;
  subLabel?: string;
  value: number;
  color: string;
}

export interface RecipeChartRow {
  name: string;
  icon: string;
  price: number;
  cost: number;
  suggested: number;
  sold: number;
}

export class ChartRenderer {
  private static esc(s: string): string {
    return String(s).replace(/"/g, '&quot;');
  }

  /**
   * Referans görseldeki (%40 | %35 | %25) yatay segmentli dağılım çubuğu (Hover Detaylı)
   */
  public static renderSegmentedBar(slices: any, showLegend = true): string {
    const valid = (slices || []).filter((s: any) => s.value > 0);
    const total = valid.reduce((sum: number, s: any) => sum + s.value, 0);

    if (total <= 0) {
      return `
        <div class="segmented-bar-wrap">
          <div class="segmented-bar-track">
            <div class="segmented-bar-slice" style="width:100%;background:#233a4f;color:#a8bed1;">Veri Bekleniyor</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="segmented-bar-wrap">
        <div class="segmented-bar-track">
          ${valid
            .map((s: any) => {
              const pct = Math.max(2, Math.round((s.value / total) * 100));
              const exactPct = ((s.value / total) * 100).toFixed(1);
              const tipLines = [
                `Pay Oranı: %${exactPct}`,
                `Değer: ${Math.round(s.value).toLocaleString('tr-TR')}${s.subLabel ? ` (${s.subLabel})` : ''}`
              ].join('|');

              return `
                <div class="segmented-bar-slice chart-hover-target"
                     style="width:${(s.value / total) * 100}%;background:${s.color};"
                     data-chart-tip-title="${this.esc(s.label)}"
                     data-chart-tip-lines="${this.esc(tipLines)}"
                     data-chart-tip-color="${s.color}">
                  ${pct >= 7 ? `%${pct}` : ''}
                </div>
              `;
            })
            .join('')}
        </div>
        ${
          showLegend
            ? `
          <div class="segmented-legend">
            ${valid
              .map((s: any) => {
                const pct = Math.round((s.value / total) * 100);
                const exactPct = ((s.value / total) * 100).toFixed(1);
                const tipLines = [
                  `Pay Oranı: %${exactPct}`,
                  `Değer: ${Math.round(s.value).toLocaleString('tr-TR')}${s.subLabel ? ` (${s.subLabel})` : ''}`
                ].join('|');

                return `
                  <span class="segmented-legend-item chart-hover-target"
                        data-chart-tip-title="${this.esc(s.label)}"
                        data-chart-tip-lines="${this.esc(tipLines)}"
                        data-chart-tip-color="${s.color}">
                    <span class="segmented-dot" style="background:${s.color};"></span>
                    <span>${s.label}: <strong style="color:var(--text-primary);">%${pct}</strong> ${s.subLabel ? `(${s.subLabel})` : ''}</span>
                  </span>
                `;
              })
              .join('')}
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  /**
   * Canlı Saatlik Satış & Müşteri Akışı Alan Grafiği (İmleç ile Nokta & Saat Detaylı)
   */
  public static renderIntradayAreaChart(points: any): string {
    const list: HourlyPoint[] = points && points.length > 0 ? points : [];
    if (list.length === 0) {
      return `<div style="padding:20px;color:var(--text-muted);">Saatlik veri yükleniyor...</div>`;
    }

    const width = 760;
    const height = 225;
    const padL = 60;
    const padR = 26;
    const padT = 24;
    const padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const maxRev = Math.max(1500, ...list.map((p) => p.revenue), ...list.map((p) => p.cost));

    const toX = (i: number) => padL + (list.length <= 1 ? plotW / 2 : (i / (list.length - 1)) * plotW);
    const toY = (val: number) => padT + plotH - (Math.max(0, val) / maxRev) * plotH;

    const revCoords = list.map((p, i) => `${toX(i).toFixed(1)},${toY(p.revenue).toFixed(1)}`).join(' ');
    const costCoords = list.map((p, i) => `${toX(i).toFixed(1)},${toY(p.cost).toFixed(1)}`).join(' ');

    const areaPath =
      `M ${toX(0).toFixed(1)} ${(padT + plotH).toFixed(1)} L ` +
      list.map((p, i) => `${toX(i).toFixed(1)} ${toY(p.revenue).toFixed(1)}`).join(' L ') +
      ` L ${toX(list.length - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

    const gridSteps = [0, 0.25, 0.5, 0.75, 1];
    const colW = plotW / Math.max(1, list.length);

    return `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:220px;display:block;background:var(--bg-input);border-radius:10px;border:1px solid var(--border-color);">
        <defs>
          <linearGradient id="emeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38d39f" stop-opacity="0.38" />
            <stop offset="100%" stop-color="#38d39f" stop-opacity="0.02" />
          </linearGradient>
        </defs>

        ${gridSteps
          .map((g) => {
            const y = (padT + plotH * (1 - g)).toFixed(1);
            const labelVal = Math.round(maxRev * g).toLocaleString('tr-TR');
            return `
              <line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="rgba(168,190,209,0.12)" stroke-dasharray="4 4" />
              <text x="${padL - 8}" y="${Number(y) + 4}" fill="#6c869e" font-size="10" font-family="JetBrains Mono, monospace" text-anchor="end">${labelVal}₺</text>
            `;
          })
          .join('')}

        <path d="${areaPath}" fill="url(#emeraldAreaGrad)" />
        <polyline fill="none" stroke="#f5c76b" stroke-width="2.2" stroke-dasharray="5 4" points="${costCoords}" />
        <polyline fill="none" stroke="#38d39f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${revCoords}" />

        ${list
          .map((p, i) => {
            const cx = toX(i);
            const cyRev = toY(p.revenue);
            const cyCost = toY(p.cost);
            const gross = p.revenue - p.cost;
            const tipLines = [
              `🟢 Kümülatif Ciro: ${Math.round(p.revenue).toLocaleString('tr-TR')} ₺`,
              `🟡 Toplam Maliyet: ${Math.round(p.cost).toLocaleString('tr-TR')} ₺`,
              `💰 Brüt Kâr: ${gross >= 0 ? '+' : ''}${Math.round(gross).toLocaleString('tr-TR')} ₺`,
              `👥 Servis Edilen: ${p.customers} Müşteri`
            ].join('|');

            return `
              <!-- İnteraktif Sütun Yakalama Alanı -->
              <rect class="chart-hit-col"
                    x="${(cx - colW / 2).toFixed(1)}" y="${padT}"
                    width="${colW.toFixed(1)}" height="${plotH}"
                    data-chart-tip-title="🕒 Saat ${p.hourLabel} Durumu"
                    data-chart-tip-lines="${this.esc(tipLines)}"
                    data-chart-tip-color="#38d39f" />

              <!-- Maliyet Noktası -->
              <circle class="chart-point-dot"
                      cx="${cx.toFixed(1)}" cy="${cyCost.toFixed(1)}" r="4"
                      fill="#09121b" stroke="#f5c76b" stroke-width="2.2"
                      data-chart-tip-title="🕒 Saat ${p.hourLabel} • Maliyet"
                      data-chart-tip-lines="${this.esc(tipLines)}"
                      data-chart-tip-color="#f5c76b" />

              <!-- Ciro Noktası -->
              <circle class="chart-point-dot"
                      cx="${cx.toFixed(1)}" cy="${cyRev.toFixed(1)}" r="4.8"
                      fill="#09121b" stroke="#38d39f" stroke-width="2.6"
                      data-chart-tip-title="🕒 Saat ${p.hourLabel} • Canlı Ciro"
                      data-chart-tip-lines="${this.esc(tipLines)}"
                      data-chart-tip-color="#38d39f" />

              <text x="${cx.toFixed(1)}" y="${height - 10}" fill="#a8bed1" font-size="10" font-weight="700" text-anchor="middle">${p.hourLabel}</text>
            `;
          })
          .join('')}
      </svg>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:0.78rem;font-weight:700;color:var(--text-secondary);">
        <div style="display:flex;gap:16px;">
          <span style="color:#38d39f;">● Saatlik Kümülatif Satış Cirosu</span>
          <span style="color:#f5c76b;">┄ Saatlik Malzeme & İşletme Maliyeti</span>
        </div>
        <span>💡 Detay için imleci noktaların üzerine getirin</span>
      </div>
    `;
  }

  /**
   * Günlük Ciro, Toplam Gider ve Net Kâr Çoklu Çizgi & Alan Grafiği (Hover Detaylı)
   */
  public static renderProfitLineChart(history: DailyLedgerEntry[]): string {
    if (!history || history.length === 0) {
      return `<div style="padding:24px;text-align:center;color:var(--text-muted);font-weight:700;">Veri hazırlanıyor...</div>`;
    }

    const recent = history.slice(-14);
    const width = 760;
    const height = 235;
    const padL = 64;
    const padR = 24;
    const padT = 24;
    const padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const values = recent.flatMap((d) => [d.revenue, d.ingredientCost + d.operatingCost + d.familyCost, d.netProfit]);
    const maxVal = Math.max(5000, ...values);
    const minVal = Math.min(0, ...values);
    const range = Math.max(1, maxVal - minVal);

    const toX = (i: number) => padL + (recent.length === 1 ? plotW / 2 : (i / (recent.length - 1)) * plotW);
    const toY = (v: number) => padT + plotH - ((v - minVal) / range) * plotH;

    const revPoints = recent.map((d, i) => `${toX(i).toFixed(1)},${toY(d.revenue).toFixed(1)}`).join(' ');
    const costPoints = recent
      .map((d, i) => `${toX(i).toFixed(1)},${toY(d.ingredientCost + d.operatingCost + d.familyCost).toFixed(1)}`)
      .join(' ');
    const netPoints = recent.map((d, i) => `${toX(i).toFixed(1)},${toY(d.netProfit).toFixed(1)}`).join(' ');

    const zeroY = toY(0).toFixed(1);
    const areaRev =
      `M ${toX(0).toFixed(1)} ${zeroY} L ` +
      recent.map((d, i) => `${toX(i).toFixed(1)} ${toY(d.revenue).toFixed(1)}`).join(' L ') +
      ` L ${toX(recent.length - 1).toFixed(1)} ${zeroY} Z`;

    const colW = plotW / Math.max(1, recent.length);

    return `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:230px;display:block;background:var(--bg-input);border-radius:10px;border:1px solid var(--border-color);">
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38d39f" stop-opacity="0.28" />
            <stop offset="100%" stop-color="#38d39f" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <line x1="${padL}" y1="${padT}" x2="${width - padR}" y2="${padT}" stroke="rgba(168,190,209,0.12)" stroke-dasharray="4 4" />
        <line x1="${padL}" y1="${zeroY}" x2="${width - padR}" y2="${zeroY}" stroke="rgba(168,190,209,0.25)" stroke-dasharray="4 4" />

        <text x="${padL - 8}" y="${padT + 4}" fill="#6c869e" font-size="10" font-family="JetBrains Mono, monospace" text-anchor="end">${Math.round(maxVal).toLocaleString('tr-TR')}₺</text>
        <text x="${padL - 8}" y="${Number(zeroY) + 4}" fill="#6c869e" font-size="10" font-family="JetBrains Mono, monospace" text-anchor="end">0₺</text>

        <path d="${areaRev}" fill="url(#revGrad)" />
        <polyline fill="none" stroke="#fc8181" stroke-width="2.4" points="${costPoints}" />
        <polyline fill="none" stroke="#38d39f" stroke-width="3" points="${revPoints}" />
        <polyline fill="none" stroke="#f5c76b" stroke-width="3" points="${netPoints}" />

        ${recent
          .map((d, i) => {
            const cx = toX(i);
            const totalCost = d.ingredientCost + d.operatingCost + d.familyCost;
            const tipLines = [
              `🟢 Günlük Ciro: +${Math.round(d.revenue).toLocaleString('tr-TR')} ₺`,
              `🔴 Toplam Gider: -${Math.round(totalCost).toLocaleString('tr-TR')} ₺`,
              `   • Malzeme: ${Math.round(d.ingredientCost).toLocaleString('tr-TR')} ₺ | İşletme: ${Math.round(d.operatingCost).toLocaleString('tr-TR')} ₺`,
              `🟡 Net Kâr: ${d.netProfit >= 0 ? '+' : ''}${Math.round(d.netProfit).toLocaleString('tr-TR')} ₺`,
              `👥 Müşteri: ${d.customersServed} Servis (${d.customersLost} Kaçan)`
            ].join('|');

            return `
              <rect class="chart-hit-col"
                    x="${(cx - colW / 2).toFixed(1)}" y="${padT}"
                    width="${colW.toFixed(1)}" height="${plotH}"
                    data-chart-tip-title="📅 Gün ${d.day} (${d.dateLabel})"
                    data-chart-tip-lines="${this.esc(tipLines)}"
                    data-chart-tip-color="#38d39f" />

              <circle class="chart-point-dot"
                      cx="${cx.toFixed(1)}" cy="${toY(totalCost).toFixed(1)}" r="4"
                      fill="#09121b" stroke="#fc8181" stroke-width="2.2"
                      data-chart-tip-title="📅 Gün ${d.day} • Toplam Gider"
                      data-chart-tip-lines="${this.esc(tipLines)}"
                      data-chart-tip-color="#fc8181" />

              <circle class="chart-point-dot"
                      cx="${cx.toFixed(1)}" cy="${toY(d.revenue).toFixed(1)}" r="4.5"
                      fill="#09121b" stroke="#38d39f" stroke-width="2.5"
                      data-chart-tip-title="📅 Gün ${d.day} • Günlük Ciro"
                      data-chart-tip-lines="${this.esc(tipLines)}"
                      data-chart-tip-color="#38d39f" />

              <circle class="chart-point-dot"
                      cx="${cx.toFixed(1)}" cy="${toY(d.netProfit).toFixed(1)}" r="4.5"
                      fill="#09121b" stroke="#f5c76b" stroke-width="2.5"
                      data-chart-tip-title="📅 Gün ${d.day} • Net Kâr"
                      data-chart-tip-lines="${this.esc(tipLines)}"
                      data-chart-tip-color="#f5c76b" />

              <text x="${cx.toFixed(1)}" y="${height - 10}" fill="#a8bed1" font-size="10" font-weight="700" text-anchor="middle">Gün ${d.day}</text>
            `;
          })
          .join('')}
      </svg>
      <div style="display:flex;gap:18px;justify-content:center;margin-top:8px;font-size:0.79rem;font-weight:800;">
        <span style="color:#38d39f;">● Günlük Toplam Ciro</span>
        <span style="color:#fc8181;">● Toplam Gider (Malzeme + Kira + Aile)</span>
        <span style="color:#f5c76b;">● Gün Sonu Net Kâr</span>
      </div>
    `;
  }

  /**
   * Enflasyon Endeksi & Müşteri Trafiği Çift Eksenli Trend Grafiği (Hover Detaylı)
   */
  public static renderInflationTrendChart(history: DailyLedgerEntry[]): string {
    const recent = (history || []).slice(-14);
    if (recent.length === 0) return '';

    const width = 760;
    const height = 200;
    const padL = 56;
    const padR = 52;
    const padT = 22;
    const padB = 32;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    const maxCust = Math.max(30, ...recent.map((d) => d.customersServed));
    const maxInf = Math.max(1.2, ...recent.map((d) => d.inflationIndex));
    const minInf = Math.min(0.95, ...recent.map((d) => d.inflationIndex));

    const toX = (i: number) => padL + (recent.length === 1 ? plotW / 2 : (i / (recent.length - 1)) * plotW);
    const toYCust = (c: number) => padT + plotH - (c / maxCust) * plotH;
    const toYInf = (inf: number) => padT + plotH - ((inf - minInf) / Math.max(0.05, maxInf - minInf)) * plotH;

    const infPoints = recent.map((d, i) => `${toX(i).toFixed(1)},${toYInf(d.inflationIndex).toFixed(1)}`).join(' ');
    const barW = Math.min(28, Math.floor(plotW / Math.max(4, recent.length * 1.8)));

    return `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:195px;display:block;background:var(--bg-input);border-radius:10px;border:1px solid var(--border-color);">
        <line x1="${padL}" y1="${padT}" x2="${width - padR}" y2="${padT}" stroke="rgba(168,190,209,0.12)" stroke-dasharray="4 4" />
        <line x1="${padL}" y1="${padT + plotH}" x2="${width - padR}" y2="${padT + plotH}" stroke="rgba(168,190,209,0.22)" />

        <text x="${padL - 8}" y="${padT + 6}" fill="#63b3ed" font-size="10" font-family="JetBrains Mono, monospace" text-anchor="end">${maxCust} Kişi</text>
        <text x="${width - padR + 6}" y="${padT + 6}" fill="#f5c76b" font-size="10" font-family="JetBrains Mono, monospace">x${maxInf.toFixed(2)}</text>

        ${recent
          .map((d, i) => {
            const x = toX(i) - barW / 2;
            const y = toYCust(d.customersServed);
            const h = padT + plotH - y;
            const tipLines = [
              `👥 Servis Edilen Müşteri: ${d.customersServed} Kişi`,
              `🚪 Kapıdan Dönen / Kaçan: ${d.customersLost} Kişi`,
              `📈 Enflasyon Endeksi: x${d.inflationIndex.toFixed(2)}`,
              `💵 Günlük Ciro: ${Math.round(d.revenue).toLocaleString('tr-TR')} ₺`
            ].join('|');

            return `
              <rect class="chart-hover-target"
                    x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${Math.max(2, h).toFixed(1)}" rx="4"
                    fill="rgba(99, 179, 237, 0.38)" stroke="#63b3ed" stroke-width="1"
                    data-chart-tip-title="📅 Gün ${d.day} • Müşteri & Enflasyon"
                    data-chart-tip-lines="${this.esc(tipLines)}"
                    data-chart-tip-color="#63b3ed" />
              <text x="${toX(i).toFixed(1)}" y="${height - 9}" fill="#a8bed1" font-size="10" font-weight="700" text-anchor="middle">G${d.day}</text>
            `;
          })
          .join('')}

        <polyline fill="none" stroke="#f5c76b" stroke-width="3" points="${infPoints}" />
        ${recent
          .map((d, i) => {
            const tipLines = [
              `📈 Enflasyon Endeksi: x${d.inflationIndex.toFixed(2)}`,
              `👥 Servis Edilen Müşteri: ${d.customersServed} Kişi`,
              `💰 Net Kâr: ${Math.round(d.netProfit).toLocaleString('tr-TR')} ₺`
            ].join('|');
            return `
              <circle class="chart-point-dot"
                      cx="${toX(i).toFixed(1)}" cy="${toYInf(d.inflationIndex).toFixed(1)}" r="4.5"
                      fill="#09121b" stroke="#f5c76b" stroke-width="2.4"
                      data-chart-tip-title="📅 Gün ${d.day} • Enflasyon x${d.inflationIndex.toFixed(2)}"
                      data-chart-tip-lines="${this.esc(tipLines)}"
                      data-chart-tip-color="#f5c76b" />
            `;
          })
          .join('')}
      </svg>
      <div style="display:flex;gap:18px;justify-content:center;margin-top:8px;font-size:0.79rem;font-weight:800;">
        <span style="color:#63b3ed;">▉ Günlük Servis Edilen Müşteri Sayısı</span>
        <span style="color:#f5c76b;">● Enflasyon Endeksi (x${recent[recent.length - 1].inflationIndex.toFixed(2)})</span>
      </div>
    `;
  }

  /**
   * Menü Ürünleri Maliyet vs Satış Fiyatı vs Kâr Marjı Görsel Karşılaştırma Grafiği (Hover Detaylı)
   */
  public static renderMenuMarginChart(rows: any): string {
    const list: RecipeChartRow[] = rows || [];
    const maxPrice = Math.max(100, ...list.map((r) => Math.max(r.price, r.suggested)));

    return `
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${list
          .map((r) => {
            const costPct = Math.min(100, Math.round((r.cost / maxPrice) * 100));
            const profitVal = Math.max(0, r.price - r.cost);
            const profitPct = Math.min(100 - costPct, Math.round((profitVal / maxPrice) * 100));
            const marginRate = r.price > 0 ? Math.round(((r.price - r.cost) / r.price) * 100) : 0;

            const tipLines = [
              `💵 Satış Fiyatı: ${r.price} ₺ (Önerilen: ${r.suggested} ₺)`,
              `🔴 Birim Maliyet: ${r.cost} ₺`,
              `🟢 Birim Net Kâr: +${r.price - r.cost} ₺ (%${marginRate} Kâr Marjı)`,
              `📦 Toplam Satılan: ${r.sold} Adet`
            ].join('|');

            return `
              <div class="menu-margin-row chart-hover-target"
                   data-chart-tip-title="${this.esc(`${r.icon} ${r.name}`)}"
                   data-chart-tip-lines="${this.esc(tipLines)}"
                   data-chart-tip-color="#38d39f">
                <div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${r.icon} ${r.name}
                </div>
                <div style="height:16px;background:var(--bg-input);border-radius:6px;overflow:hidden;display:flex;border:1px solid var(--border-color);">
                  <div style="width:${costPct}%;background:#fc8181;"></div>
                  <div style="width:${profitPct}%;background:#38d39f;"></div>
                </div>
                <div style="font-family:'JetBrains Mono',monospace;font-weight:800;text-align:right;">
                  ${r.price}₺ <span style="color:${marginRate >= 35 ? '#38d39f' : '#f5c76b'};">(%${marginRate})</span>
                </div>
              </div>
            `;
          })
          .join('')}
        <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);font-weight:700;margin-top:4px;">
          <div style="display:flex;gap:16px;">
            <span><strong style="color:#fc8181;">▉</strong> Birim Malzeme Maliyeti</span>
            <span><strong style="color:#38d39f;">▉</strong> Birim Net Kâr Marjı</span>
          </div>
          <span>💡 Detay için imleci ürün satırlarının üzerine getirin</span>
        </div>
      </div>
    `;
  }

  /**
   * Yüksek Çözünürlüklü Servet & Portföy Halka (Donut) Grafiği (Hover Detaylı)
   */
  public static renderPortfolioDonut(slices: Array<{ label: string; value: number; color: string }>): string {
    const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
    if (total <= 0) {
      return `<div style="padding:16px;text-align:center;color:var(--text-muted);">Varlık bulunmuyor.</div>`;
    }

    let acc = 0;
    const gradientParts = slices.map((s) => {
      const pct = (Math.max(0, s.value) / total) * 100;
      const start = acc;
      acc += pct;
      return `${s.color} ${start.toFixed(1)}% ${acc.toFixed(1)}%`;
    });

    const donutTip = slices
      .map((s) => `${s.label}: ${Math.round(s.value).toLocaleString('tr-TR')} ₺ (%${Math.round((Math.max(0, s.value) / total) * 100)})`)
      .join('|');

    return `
      <div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap;">
        <div class="chart-hover-target"
             style="width:124px;height:124px;border-radius:50%;background:conic-gradient(${gradientParts.join(', ')});display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-md);flex-shrink:0;"
             data-chart-tip-title="💼 Toplam Portföy: ${Math.round(total).toLocaleString('tr-TR')} ₺"
             data-chart-tip-lines="${this.esc(donutTip)}"
             data-chart-tip-color="#f5c76b">
          <div style="width:74px;height:74px;border-radius:50%;background:var(--bg-card);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;">
            <span style="font-size:0.65rem;color:var(--text-muted);font-weight:800;">TOPLAM</span>
            <span style="font-size:0.78rem;font-weight:900;font-family:'JetBrains Mono',monospace;">%100</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;flex:1;">
          ${slices
            .map((s) => {
              const pct = Math.round((Math.max(0, s.value) / total) * 100);
              const exactPct = ((Math.max(0, s.value) / total) * 100).toFixed(1);
              const tipLines = [
                `Varlık Tutarı: ${Math.round(s.value).toLocaleString('tr-TR')} ₺`,
                `Portföy Ağırlığı: %${exactPct}`,
                `Toplam Servet: ${Math.round(total).toLocaleString('tr-TR')} ₺`
              ].join('|');

              return `
                <div class="chart-hover-target"
                     style="display:flex;align-items:center;justify-content:space-between;font-size:0.84rem;background:var(--bg-row);padding:7px 12px;border-radius:8px;border:1px solid var(--border-color);"
                     data-chart-tip-title="${this.esc(s.label)}"
                     data-chart-tip-lines="${this.esc(tipLines)}"
                     data-chart-tip-color="${s.color}">
                  <span style="display:flex;align-items:center;gap:8px;font-weight:800;">
                    <span style="width:11px;height:11px;border-radius:3px;background:${s.color};display:inline-block;"></span>
                    ${s.label}
                  </span>
                  <span style="font-family:'JetBrains Mono',monospace;font-weight:800;">
                    ${Math.round(s.value).toLocaleString('tr-TR')} ₺ <span style="color:var(--accent-secondary);">(%${pct})</span>
                  </span>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }
}
