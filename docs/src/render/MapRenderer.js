// ============================================================================
// GERÇEK COĞRAFİ 81 İL TÜRKİYE HARİTASI VE 39 İLÇE İSTANBUL HARİTASI ÇİZİCİ
// (MapRenderer.ts - Gerçek Poligon Sınırları ile İnteraktif SVG Harita)
// ============================================================================

import { TURKEY_PROVINCES, getDistrictsForProvince } from '../data/turkey_map.js';
import { TURKEY_REAL_SVG_PATHS, ISTANBUL_REAL_SVG_PATHS } from '../data/real_maps_svg.js';

export class MapRenderer {
  static istanbulZoomCenter = false;

  static esc(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  /**
   * Gerçek Coğrafi 81 İl Türkiye Haritası (SVG Poligon)
   * Şube olan iller zümrüt yeşili (#38d39f), seçili il altın (#f5c76b), diğerleri nötr arduvaz.
   */
  static renderTurkeyMapSVG(state) {
    const selectedProvId = state.mapView?.selectedProvinceId || 'istanbul';
    const inf = state.finance.inflationIndex;

    // Seçili ili en son çizmek yerine tüm poligonları çizip etiketleri üst katmana koyuyoruz
    const polygonsHtml = TURKEY_PROVINCES.map((prov) => {
      const geo = TURKEY_REAL_SVG_PATHS[prov.id];
      if (!geo) return '';

      const branchCount = (state.branches || []).filter((b) => b.provinceId === prov.id).length;
      const hasBranch = branchCount > 0;
      const isSelected = prov.id === selectedProvId;
      const cityRep = Math.round(state.reputation?.cityReputations?.[prov.id] || 48);
      const openCost = Math.round(prov.openingCostBase * inf);

      const repAlpha = (0.48 + (cityRep / 100) * 0.42).toFixed(2);
      const fillColor = hasBranch
        ? '#177e5d'
        : isSelected
        ? '#9c6b19'
        : `rgba(26, 49, 70, ${repAlpha})`;

      const strokeColor = hasBranch
        ? '#38d39f'
        : isSelected
        ? '#f5c76b'
        : '#355470';

      const strokeW = hasBranch || isSelected ? '1.8' : '0.85';

      const tipLines = [
        `Bölge: ${prov.region} (Plaka: ${prov.plate})`,
        `🏙️ Şehir İtibarı: ${cityRep}/100`,
        `🏪 Aktif Şube Sayısı: ${branchCount} Şube`,
        `💵 Baz Açılış Maliyeti: ${openCost.toLocaleString('tr-TR')} ₺`,
        `🚚 Lojistik Uzaklık Çarpanı: x${prov.logisticsDistanceFactor.toFixed(2)}`
      ].join('|');

      return `
        <path class="chart-hover-target"
              style="cursor:pointer;transition:fill 0.15s ease;"
              d="${geo.d}"
              fill="${fillColor}"
              stroke="${strokeColor}"
              stroke-width="${strokeW}"
              stroke-linejoin="round"
              data-map-province="${prov.id}"
              data-chart-tip-title="📍 ${prov.plate} ${prov.name}"
              data-chart-tip-lines="${this.esc(tipLines)}"
              data-chart-tip-color="${hasBranch ? '#38d39f' : '#f5c76b'}" />
      `;
    }).join('');

    const labelsHtml = TURKEY_PROVINCES.map((prov) => {
      const geo = TURKEY_REAL_SVG_PATHS[prov.id];
      if (!geo) return '';
      const branchCount = (state.branches || []).filter((b) => b.provinceId === prov.id).length;
      const hasBranch = branchCount > 0;
      const isSelected = prov.id === selectedProvId;

      return `
        <g style="pointer-events:none;">
          <text x="${geo.cx}" y="${geo.cy - 1}"
                fill="${hasBranch ? '#a7f3d0' : isSelected ? '#fde68a' : '#8ba5be'}"
                font-size="${hasBranch || isSelected ? '8.5' : '7.2'}"
                font-family="JetBrains Mono, monospace"
                font-weight="900"
                text-anchor="middle"
                style="text-shadow: 0 1px 3px rgba(0,0,0,0.9);">
            ${prov.plate}${hasBranch ? `★${branchCount}` : ''}
          </text>
          <text x="${geo.cx}" y="${geo.cy + 7.5}"
                fill="${hasBranch || isSelected ? '#ffffff' : '#d0deeb'}"
                font-size="${hasBranch || isSelected ? '8.2' : '6.8'}"
                font-weight="800"
                text-anchor="middle"
                style="text-shadow: 0 1px 3px rgba(0,0,0,0.95);">
            ${prov.name.split('/')[0].trim()}
          </text>
        </g>
      `;
    }).join('');

    return `
      <svg viewBox="0 0 1000 450" style="width:100%;height:auto;min-height:320px;max-height:470px;display:block;background:radial-gradient(circle at 50% 45%, #0d2033, #06101a);border-radius:12px;border:1px solid var(--border-color);user-select:none;">
        <!-- Deniz İsimleri -->
        <text x="510" y="24" fill="rgba(99,179,237,0.32)" font-size="12" font-weight="900" letter-spacing="5" text-anchor="middle">KARADENİZ</text>
        <text x="38" y="250" fill="rgba(99,179,237,0.32)" font-size="10" font-weight="900" letter-spacing="2" text-anchor="middle">EGE DENİZİ</text>
        <text x="340" y="438" fill="rgba(99,179,237,0.32)" font-size="12" font-weight="900" letter-spacing="5" text-anchor="middle">AKDENİZ</text>

        <!-- 81 İl Gerçek Coğrafi Poligonları -->
        <g>${polygonsHtml}</g>

        <!-- Şubeler Arası Lojistik Tedarik Hatları -->
        <g>${this.renderLogisticsLines(state)}</g>

        <!-- İl Plaka ve İsim Etiketleri -->
        <g>${labelsHtml}</g>
      </svg>
    `;
  }

  static renderLogisticsLines(state) {
    if (!state.branches || state.branches.length <= 1) return '';
    const hq = state.branches[0];
    const hqGeo = TURKEY_REAL_SVG_PATHS[hq.provinceId];
    if (!hqGeo) return '';

    const uniqueProvs = Array.from(new Set(state.branches.map((b) => b.provinceId)));
    return uniqueProvs
      .filter((pId) => pId !== hq.provinceId)
      .map((pId) => {
        const targetGeo = TURKEY_REAL_SVG_PATHS[pId];
        if (!targetGeo) return '';
        return `
          <line x1="${hqGeo.cx}" y1="${hqGeo.cy}"
                x2="${targetGeo.cx}" y2="${targetGeo.cy}"
                stroke="#f5c76b" stroke-width="2" stroke-dasharray="6 4" opacity="0.85" />
        `;
      })
      .join('');
  }

  /**
   * Şehir İlçe Haritası:
   * - İstanbul için 39 İlçenin Gerçek Coğrafi Sınır Poligonlarını (ISTANBUL_REAL_SVG_PATHS) çizer!
   * - Diğer iller için il sınır poligonunu arka plana alıp ilçeleri üzerine yerleştirir.
   */
  static renderCityDistrictMapSVG(state, provinceId) {
    const prov = TURKEY_PROVINCES.find((p) => p.id === provinceId) || TURKEY_PROVINCES[0];
    const districts = getDistrictsForProvince(provinceId);
    const selectedDistId = state.mapView?.selectedDistrictId || districts[0]?.id;
    const inf = state.finance.inflationIndex;

    if (provinceId === 'istanbul') {
      // İstanbul için Tam Görünüm (39 İlçe) veya Boğaz & Merkez Yakınlaştırılmış Görünüm
      const viewBox = this.istanbulZoomCenter ? '320 195 365 245' : '0 0 960 460';
      const fontSizeBase = this.istanbulZoomCenter ? 6.2 : 8.5;

      const istPolys = districts
        .map((dist) => {
          const geo = ISTANBUL_REAL_SVG_PATHS[dist.id];
          if (!geo) return '';

          const branchHere = (state.branches || []).find((b) => b.districtId === dist.id);
          const hasBranch = Boolean(branchHere);
          const isSelected = dist.id === selectedDistId;
          const openCost = Math.round(dist.openingCostBase * inf);
          const rent = Math.round(dist.dailyRentBase * inf);

          const fillColor = hasBranch
            ? '#177e5d'
            : isSelected
            ? '#9c6b19'
            : dist.side === 'Anadolu Yakası'
            ? '#1b354b'
            : '#162c40';

          const strokeColor = hasBranch
            ? '#38d39f'
            : isSelected
            ? '#f5c76b'
            : '#3b5c7a';

          const strokeW = hasBranch || isSelected
            ? this.istanbulZoomCenter ? '1.3' : '2.0'
            : this.istanbulZoomCenter ? '0.6' : '0.9';

          const tipLines = [
            `Yaka: ${dist.side || 'İstanbul'} • ${hasBranch ? '🏪 ŞUBEMİZ AÇIK' : '⚪ Şube Yok'}`,
            `👥 Müşteri Potansiyeli: %${dist.customerPotential}`,
            `💵 Açılış Maliyeti: ${openCost.toLocaleString('tr-TR')} ₺`,
            `🏢 Günlük Kira: ${rent.toLocaleString('tr-TR')} ₺/gün`,
            `⭐ Gerekli Şehir İtibarı: ${dist.minCityRep} | Görev: Kademe ${dist.requiredQuestTier}`
          ].join('|');

          return `
            <path class="chart-hover-target"
                  style="cursor:pointer;transition:fill 0.15s ease;"
                  d="${geo.d}"
                  fill="${fillColor}"
                  stroke="${strokeColor}"
                  stroke-width="${strokeW}"
                  stroke-linejoin="round"
                  data-map-district="${dist.id}"
                  data-chart-tip-title="🏘️ ${dist.name} (İstanbul)"
                  data-chart-tip-lines="${this.esc(tipLines)}"
                  data-chart-tip-color="${hasBranch ? '#38d39f' : '#f5c76b'}" />
          `;
        })
        .join('');

      const istLabels = districts
        .map((dist) => {
          const geo = ISTANBUL_REAL_SVG_PATHS[dist.id];
          if (!geo) return '';
          const branchHere = (state.branches || []).find((b) => b.districtId === dist.id);
          const hasBranch = Boolean(branchHere);
          const isSelected = dist.id === selectedDistId;

          return `
            <g style="pointer-events:none;">
              <text x="${geo.cx}" y="${geo.cy + 2}"
                    fill="${hasBranch ? '#a7f3d0' : isSelected ? '#fde68a' : '#e2ecf5'}"
                    font-size="${hasBranch || isSelected ? fontSizeBase + 1.2 : fontSizeBase}"
                    font-weight="900"
                    text-anchor="middle"
                    style="text-shadow: 0 1px 3px rgba(0,0,0,0.95);">
                ${hasBranch ? '★ ' : ''}${dist.name.split('/')[0].trim()}
              </text>
            </g>
          `;
        })
        .join('');

      return `
        <div style="position:relative;">
          <div style="position:absolute;top:10px;right:10px;z-index:5;display:flex;gap:6px;">
            <button class="btn btn-sm ${!this.istanbulZoomCenter ? 'btn-primary' : ''}" id="btn-ist-zoom-full">
              🗺️ Tüm İstanbul (39 İlçe)
            </button>
            <button class="btn btn-sm ${this.istanbulZoomCenter ? 'btn-primary' : ''}" id="btn-ist-zoom-center">
              🔍 Boğaz & Merkez İlçeler Yakınlaştır
            </button>
          </div>
          <svg viewBox="${viewBox}" style="width:100%;height:auto;min-height:320px;max-height:460px;display:block;background:radial-gradient(circle at 50% 55%, #0c2238, #06101a);border-radius:12px;border:1px solid var(--border-color);user-select:none;">
            ${
              !this.istanbulZoomCenter
                ? `
              <text x="480" y="34" fill="rgba(99,179,237,0.32)" font-size="13" font-weight="900" letter-spacing="5" text-anchor="middle">KARADENİZ</text>
              <text x="380" y="438" fill="rgba(99,179,237,0.32)" font-size="13" font-weight="900" letter-spacing="5" text-anchor="middle">MARMARA DENİZİ</text>
            `
                : ''
            }
            <g>${istPolys}</g>
            <g>${istLabels}</g>
          </svg>
        </div>
      `;
    }

    // Diğer 80 İl İçin: O İlin Gerçek Coğrafi Sınır Poligonunu Arka Plana Çiz + İlçeleri Göster
    const provGeo = TURKEY_REAL_SVG_PATHS[provinceId];

    return `
      <svg viewBox="0 0 780 390" style="width:100%;height:auto;min-height:300px;max-height:430px;display:block;background:radial-gradient(circle at 50% 50%, #0e2236, #07111b);border-radius:12px;border:1px solid var(--border-color);user-select:none;">
        <text x="390" y="34" fill="rgba(168,190,209,0.38)" font-size="14" font-weight="900" letter-spacing="2" text-anchor="middle">
          ${prov.plate} • ${prov.name.toUpperCase()} İL SINIRLARI VE İLÇE MERKEZLERİ
        </text>

        ${
          provGeo
            ? `
          <!-- İlin Gerçek Coğrafi Poligon Silüeti (Merkeze Ölçeklenmiş) -->
          <g transform="translate(390, 200) scale(3.2) translate(-${provGeo.cx}, -${provGeo.cy})">
            <path d="${provGeo.d}" fill="rgba(26, 54, 78, 0.65)" stroke="#38d39f" stroke-width="0.9" stroke-linejoin="round" opacity="0.65" />
          </g>
        `
            : ''
        }

        <!-- İlçeler Arası Bağlantı -->
        ${districts
          .map((d, i) => {
            if (i === 0) return '';
            const prev = districts[i - 1];
            return `<line x1="${prev.mapX}" y1="${prev.mapY}" x2="${d.mapX}" y2="${d.mapY}" stroke="rgba(245,199,107,0.35)" stroke-width="2" stroke-dasharray="5 4" />`;
          })
          .join('')}

        <!-- İlçe Noktaları -->
        ${districts
          .map((dist) => {
            const branchHere = (state.branches || []).find((b) => b.districtId === dist.id);
            const hasBranch = Boolean(branchHere);
            const isSelected = dist.id === selectedDistId;
            const openCost = Math.round(dist.openingCostBase * inf);
            const rent = Math.round(dist.dailyRentBase * inf);

            const fillColor = hasBranch ? '#177e5d' : isSelected ? '#9c6b19' : '#172b3d';
            const strokeColor = hasBranch ? '#38d39f' : isSelected ? '#f5c76b' : '#4a6b8a';

            const tipLines = [
              `Durum: ${hasBranch ? '🏪 ŞUBEMİZ AÇIK' : '⚪ Şube Yok (Açılabilir)'}`,
              `👥 Müşteri Potansiyeli: %${dist.customerPotential}`,
              `💵 Açılış Maliyeti: ${openCost.toLocaleString('tr-TR')} ₺`,
              `🏢 Günlük Kira: ${rent.toLocaleString('tr-TR')} ₺/gün`,
              `⭐ Gerekli Şehir İtibarı: ${dist.minCityRep} | Görev: Kademe ${dist.requiredQuestTier}`
            ].join('|');

            const w = 132;
            const h = 46;

            return `
              <g class="chart-hover-target"
                 style="cursor:pointer;"
                 data-map-district="${dist.id}"
                 data-chart-tip-title="🏘️ ${dist.name} (${prov.name})"
                 data-chart-tip-lines="${this.esc(tipLines)}"
                 data-chart-tip-color="${hasBranch ? '#38d39f' : '#f5c76b'}">
                <rect x="${dist.mapX - w / 2}" y="${dist.mapY - h / 2}"
                      width="${w}" height="${h}" rx="10"
                      fill="${fillColor}" stroke="${strokeColor}" stroke-width="${hasBranch || isSelected ? '2.5' : '1.4'}" />
                <text x="${dist.mapX}" y="${dist.mapY - 4}"
                      fill="#f1f6fa" font-size="10.2" font-weight="900" text-anchor="middle">
                  ${dist.name.split('/')[0].trim()}
                </text>
                <text x="${dist.mapX}" y="${dist.mapY + 11}"
                      fill="${hasBranch ? '#a7f3d0' : isSelected ? '#fde68a' : '#a8bed1'}"
                      font-size="8.8" font-family="JetBrains Mono, monospace" font-weight="800" text-anchor="middle">
                  ${hasBranch ? `★ ŞUBE (${branchHere?.neighborhoodReputation}★)` : `${(openCost / 1000).toFixed(0)}B ₺ • Pot:%${dist.customerPotential}`}
                </text>
              </g>
            `;
          })
          .join('')}
      </svg>
    `;
  }
}
