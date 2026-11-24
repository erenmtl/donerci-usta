// ============================================================================
// 81 İL TÜRKİYE HARİTASI VE ŞEHİR İLÇE HARİTALARI VERİ SETİ (turkey_map.ts)
// Modüler yapı: Yeni ilçe veya şehir detayı eklemek için sadece listeye obje ekleyin.
// ============================================================================

import { ISTANBUL_REAL_SVG_PATHS } from './real_maps_svg.js';



// ============================================================================
// İSTANBUL VE BÜYÜKŞEHİRLERİN DETAYLI İLÇE HARİTASI VERİLERİ
// ============================================================================
export const CITY_DISTRICTS = {
  istanbul: [
    // AVRUPA YAKASI İLÇELERİ
    {
      id: 'ist_besiktas',
      provinceId: 'istanbul',
      name: 'Beşiktaş',
      side: 'Avrupa Yakası',
      mapX: 430,
      mapY: 195,
      neighborhoodType: 'universite_mahallesi',
      openingCostBase: 55000,
      dailyRentBase: 720,
      customerPotential: 94,
      minCityRep: 55,
      minCountryRep: 45,
      requiredQuestTier: 1,
      description: 'Üniversite öğrencileri, çarşı kalabalığı ve maç günleriyle 24 saat yaşayan çok hareketli merkez.'
    },
    {
      id: 'ist_fatih',
      provinceId: 'istanbul',
      name: 'Fatih / Sultanahmet',
      side: 'Avrupa Yakası',
      mapX: 390,
      mapY: 255,
      neighborhoodType: 'turistik_merkez',
      openingCostBase: 72000,
      dailyRentBase: 920,
      customerPotential: 98,
      minCityRep: 62,
      minCountryRep: 55,
      requiredQuestTier: 1,
      description: 'Tarihi yarımada ve Kapalıçarşı. Kira yüksektir ama yerli-yabancı turistler gurme dönere servet öder.'
    },
    {
      id: 'ist_beyoglu',
      provinceId: 'istanbul',
      name: 'Beyoğlu / Taksim',
      side: 'Avrupa Yakası',
      mapX: 405,
      mapY: 215,
      neighborhoodType: 'turistik_merkez',
      openingCostBase: 68000,
      dailyRentBase: 860,
      customerPotential: 95,
      minCityRep: 60,
      minCountryRep: 52,
      requiredQuestTier: 1,
      description: 'İstiklal Caddesi yaya trafiği. Gece gündüz dürüm ve porsiyon döner satışı hiç durmaz.'
    },
    {
      id: 'ist_sisli',
      provinceId: 'istanbul',
      name: 'Şişli / Mecidiyeköy',
      side: 'Avrupa Yakası',
      mapX: 395,
      mapY: 170,
      neighborhoodType: 'carsi_sanayi',
      openingCostBase: 60000,
      dailyRentBase: 780,
      customerPotential: 92,
      minCityRep: 58,
      minCountryRep: 48,
      requiredQuestTier: 1,
      description: 'İş merkezleri ve plazaların kalbi. Öğle paydosunda binlerce çalışan hızlı menü arar.'
    },
    {
      id: 'ist_bakirkoy',
      provinceId: 'istanbul',
      name: 'Bakırköy',
      side: 'Avrupa Yakası',
      mapX: 325,
      mapY: 280,
      neighborhoodType: 'aile_semti',
      openingCostBase: 54000,
      dailyRentBase: 690,
      customerPotential: 88,
      minCityRep: 55,
      minCountryRep: 45,
      requiredQuestTier: 1,
      description: 'Köklü ailelerin ve alışveriş caddesinin merkezi. İskender ve servis porsiyon çok sevilir.'
    },
    {
      id: 'ist_bagcilar',
      provinceId: 'istanbul',
      name: 'Bağcılar',
      side: 'Avrupa Yakası',
      mapX: 300,
      mapY: 225,
      neighborhoodType: 'carsi_sanayi',
      openingCostBase: 36000,
      dailyRentBase: 460,
      customerPotential: 86,
      minCityRep: 45,
      minCountryRep: 40,
      requiredQuestTier: 1,
      description: 'Kira makul, nüfus çok yoğun! Ekonomik dürüm ve ekmek arası sürümden yüksek ciro bırakır.'
    },
    {
      id: 'ist_basaksehir',
      provinceId: 'istanbul',
      name: 'Başakşehir / İkitelli Sanayi',
      side: 'Avrupa Yakası',
      mapX: 270,
      mapY: 165,
      neighborhoodType: 'carsi_sanayi',
      openingCostBase: 40000,
      dailyRentBase: 510,
      customerPotential: 87,
      minCityRep: 48,
      minCountryRep: 42,
      requiredQuestTier: 1,
      description: 'Türkiye’nin en büyük organize sanayi sitesi girişi. Ustalar tam somun et döner için sıraya girer.'
    },
    {
      id: 'ist_sariyer',
      provinceId: 'istanbul',
      name: 'Sarıyer / Maslak',
      side: 'Avrupa Yakası',
      mapX: 435,
      mapY: 110,
      neighborhoodType: 'aile_semti',
      openingCostBase: 58000,
      dailyRentBase: 740,
      customerPotential: 85,
      minCityRep: 60,
      minCountryRep: 50,
      requiredQuestTier: 1,
      description: 'Boğaz hattı ve üniversite/plaza bölgesi. Yüksek kâr marjlı kaliteli porsiyon satışına uygundur.'
    },
    {
      id: 'ist_esenyurt',
      provinceId: 'istanbul',
      name: 'Esenyurt / Beylikdüzü',
      side: 'Avrupa Yakası',
      mapX: 195,
      mapY: 255,
      neighborhoodType: 'universite_mahallesi',
      openingCostBase: 34000,
      dailyRentBase: 430,
      customerPotential: 89,
      minCityRep: 42,
      minCountryRep: 38,
      requiredQuestTier: 1,
      description: 'Çok yüksek nüfus yoğunluğu ve düşük kira! Paket servis ve zurna dürüm rekor kırar.'
    },
    {
      id: 'ist_eyupsultan',
      provinceId: 'istanbul',
      name: 'Eyüpsultan',
      side: 'Avrupa Yakası',
      mapX: 355,
      mapY: 155,
      neighborhoodType: 'aile_semti',
      openingCostBase: 42000,
      dailyRentBase: 530,
      customerPotential: 83,
      minCityRep: 50,
      minCountryRep: 44,
      requiredQuestTier: 1,
      description: 'Manevi atmosferi ve aile ziyaretçileriyle hafta sonu porsiyon ve tatlı satışları çok güçlüdür.'
    },

    // ANADOLU YAKASI İLÇELERİ
    {
      id: 'ist_kadikoy',
      provinceId: 'istanbul',
      name: 'Kadıköy / Moda',
      side: 'Anadolu Yakası',
      mapX: 495,
      mapY: 270,
      neighborhoodType: 'universite_mahallesi',
      openingCostBase: 58000,
      dailyRentBase: 750,
      customerPotential: 96,
      minCityRep: 56,
      minCountryRep: 46,
      requiredQuestTier: 1,
      description: 'Anadolu yakasının en işlek çarşısı. Hem gençler hem köklü aileler tarafından çok tercih edilir.'
    },
    {
      id: 'ist_uskudar',
      provinceId: 'istanbul',
      name: 'Üsküdar',
      side: 'Anadolu Yakası',
      mapX: 485,
      mapY: 215,
      neighborhoodType: 'aile_semti',
      openingCostBase: 48000,
      dailyRentBase: 610,
      customerPotential: 89,
      minCityRep: 52,
      minCountryRep: 45,
      requiredQuestTier: 1,
      description: 'Vapur iskelesi ve tarihi çarşı çevresi. Geleneksel yaprak döner ve İskender müdavimleri boldur.'
    },
    {
      id: 'ist_atasehir',
      provinceId: 'istanbul',
      name: 'Ataşehir / Finans Merkezi',
      side: 'Anadolu Yakası',
      mapX: 555,
      mapY: 245,
      neighborhoodType: 'aile_semti',
      openingCostBase: 56000,
      dailyRentBase: 710,
      customerPotential: 90,
      minCityRep: 58,
      minCountryRep: 48,
      requiredQuestTier: 1,
      description: 'Modern siteler ve finans plazaları. Online paket sipariş ve yüksek fiyatlı menü potansiyeli yüksektir.'
    },
    {
      id: 'ist_umraniye',
      provinceId: 'istanbul',
      name: 'Ümraniye',
      side: 'Anadolu Yakası',
      mapX: 545,
      mapY: 195,
      neighborhoodType: 'carsi_sanayi',
      openingCostBase: 42000,
      dailyRentBase: 540,
      customerPotential: 88,
      minCityRep: 48,
      minCountryRep: 42,
      requiredQuestTier: 1,
      description: 'Alemdağ Caddesi esnaf yoğunluğu ve sanayi komşuluğuyla dengeli kira ve yüksek müşteri sunar.'
    },
    {
      id: 'ist_maltepe',
      provinceId: 'istanbul',
      name: 'Maltepe / Bostancı',
      side: 'Anadolu Yakası',
      mapX: 575,
      mapY: 295,
      neighborhoodType: 'aile_semti',
      openingCostBase: 46000,
      dailyRentBase: 580,
      customerPotential: 85,
      minCityRep: 50,
      minCountryRep: 44,
      requiredQuestTier: 1,
      description: 'Sahil yolu ve aile mahalleleri. Akşam servisi ve hafta sonu aile yemekleri çok bereketlidir.'
    },
    {
      id: 'ist_pendik',
      provinceId: 'istanbul',
      name: 'Pendik / Kartal',
      side: 'Anadolu Yakası',
      mapX: 650,
      mapY: 315,
      neighborhoodType: 'carsi_sanayi',
      openingCostBase: 38000,
      dailyRentBase: 480,
      customerPotential: 84,
      minCityRep: 45,
      minCountryRep: 40,
      requiredQuestTier: 1,
      description: 'Uygun kira ve hızla büyüyen çarşı nüfusu. Yeni şube açmak için güvenli ve kârlı bir başlangıç noktası.'
    }
  ],

  // ANKARA İLÇE HARİTASI
  ankara: [
    {
      id: 'ank_kizilay',
      provinceId: 'ankara',
      name: 'Çankaya / Kızılay',
      side: 'Merkez',
      mapX: 400,
      mapY: 210,
      neighborhoodType: 'universite_mahallesi',
      openingCostBase: 52000,
      dailyRentBase: 660,
      customerPotential: 94,
      minCityRep: 50,
      minCountryRep: 55,
      requiredQuestTier: 2,
      description: 'Başkentin kalbi! Memurlar, bakanlık çalışanları ve üniversite öğrencileriyle öğle saatinde dolup taşar.'
    },
    {
      id: 'ank_ostim',
      provinceId: 'ankara',
      name: 'Yenimahalle / OSTİM Sanayi',
      side: 'Batı Merkez',
      mapX: 290,
      mapY: 175,
      neighborhoodType: 'carsi_sanayi',
      openingCostBase: 40000,
      dailyRentBase: 500,
      customerPotential: 90,
      minCityRep: 45,
      minCountryRep: 50,
      requiredQuestTier: 2,
      description: 'Ankara yaprak dönerinin kalesi! Sanayi ustaları bol etli somun ve porsiyon döner için sıraya girer.'
    },
    {
      id: 'ank_bahcelievler',
      provinceId: 'ankara',
      name: 'Bahçelievler 7. Cadde',
      side: 'Merkez',
      mapX: 350,
      mapY: 235,
      neighborhoodType: 'aile_semti',
      openingCostBase: 48000,
      dailyRentBase: 610,
      customerPotential: 88,
      minCityRep: 50,
      minCountryRep: 52,
      requiredQuestTier: 2,
      description: 'Ailelerin ve gençlerin akşam yürüyüş caddesi. Şık dekorasyonlu şubeler yüksek ciro yapar.'
    },
    {
      id: 'ank_kecioren',
      provinceId: 'ankara',
      name: 'Keçiören',
      side: 'Kuzey',
      mapX: 410,
      mapY: 130,
      neighborhoodType: 'aile_semti',
      openingCostBase: 36000,
      dailyRentBase: 450,
      customerPotential: 86,
      minCityRep: 42,
      minCountryRep: 48,
      requiredQuestTier: 2,
      description: 'Düşük kira ve çok kalabalık aile nüfusu. Ekonomik menülerle yüksek kârlılık sağlar.'
    }
  ],

  // İZMİR İLÇE HARİTASI
  izmir: [
    {
      id: 'izm_konak',
      provinceId: 'izmir',
      name: 'Konak / Kemeraltı Çarşısı',
      side: 'Merkez Körfez',
      mapX: 390,
      mapY: 235,
      neighborhoodType: 'carsi_sanayi',
      openingCostBase: 48000,
      dailyRentBase: 620,
      customerPotential: 93,
      minCityRep: 50,
      minCountryRep: 55,
      requiredQuestTier: 2,
      description: 'Tarihi Kemeraltı esnafı ve alışveriş kalabalığı. Tombik döner ve şalgam-ayran yok satar.'
    },
    {
      id: 'izm_karsiyaka',
      provinceId: 'izmir',
      name: 'Karşıyaka Çarşı',
      side: 'Kuzey Körfez',
      mapX: 375,
      mapY: 150,
      neighborhoodType: 'aile_semti',
      openingCostBase: 46000,
      dailyRentBase: 590,
      customerPotential: 90,
      minCityRep: 50,
      minCountryRep: 52,
      requiredQuestTier: 2,
      description: 'Köklü Karşıyaka aileleri ve yaya çarşısı. Hijyen ve lezzet yüksek olursa sadık müşteri kitlesi oluşur.'
    },
    {
      id: 'izm_bornova',
      provinceId: 'izmir',
      name: 'Bornova / Küçükpark',
      side: 'Doğu',
      mapX: 485,
      mapY: 185,
      neighborhoodType: 'universite_mahallesi',
      openingCostBase: 42000,
      dailyRentBase: 520,
      customerPotential: 92,
      minCityRep: 45,
      minCountryRep: 50,
      requiredQuestTier: 2,
      description: 'Ege Üniversitesi kampüs yanı! Öğrenci dürümleri ve gece paket servisi rekor kırar.'
    },
    {
      id: 'izm_cesme',
      provinceId: 'izmir',
      name: 'Çeşme / Alaçatı',
      side: 'Batı Yarımada',
      mapX: 195,
      mapY: 265,
      neighborhoodType: 'turistik_merkez',
      openingCostBase: 64000,
      dailyRentBase: 810,
      customerPotential: 94,
      minCityRep: 60,
      minCountryRep: 62,
      requiredQuestTier: 3,
      description: 'Turistik tatil beldesi! Gurme yaprak döner ve İskender en yüksek fiyattan alıcı bulur.'
    }
  ],

  // BURSA İLÇE HARİTASI
  bursa: [
    {
      id: 'brs_osmangazi',
      provinceId: 'bursa',
      name: 'Osmangazi / Heykel & Kayhan',
      side: 'Tarihi Merkez',
      mapX: 420,
      mapY: 220,
      neighborhoodType: 'aile_semti',
      openingCostBase: 46000,
      dailyRentBase: 580,
      customerPotential: 93,
      minCityRep: 50,
      minCountryRep: 54,
      requiredQuestTier: 2,
      description: 'İskender kebabın doğduğu tarihi çarşı! Tereyağlı İskender ve şıra/ayran satışları zirve yapar.'
    },
    {
      id: 'brs_gorukle',
      provinceId: 'bursa',
      name: 'Nilüfer / Görükle Kampüs',
      side: 'Batı',
      mapX: 280,
      mapY: 205,
      neighborhoodType: 'universite_mahallesi',
      openingCostBase: 38000,
      dailyRentBase: 470,
      customerPotential: 90,
      minCityRep: 45,
      minCountryRep: 48,
      requiredQuestTier: 2,
      description: 'Uludağ Üniversitesi öğrenci kenti. Ekonomik zurna dürüm ve patates sepeti kapış kapış gider.'
    },
    {
      id: 'brs_inegol',
      provinceId: 'bursa',
      name: 'İnegöl Mobilya Sanayi',
      side: 'Doğu',
      mapX: 575,
      mapY: 240,
      neighborhoodType: 'carsi_sanayi',
      openingCostBase: 36000,
      dailyRentBase: 450,
      customerPotential: 86,
      minCityRep: 42,
      minCountryRep: 46,
      requiredQuestTier: 2,
      description: 'Üretim ve mobilya esnafının merkezi. Öğle servisinde doyurucu et döner talebi çok yüksektir.'
    }
  ]
};

// ============================================================================
// 81 İL TÜRKİYE HARİTASI VERİLERİ (Coğrafi SVG Koordinatlı)
// ============================================================================
export const TURKEY_PROVINCES = [
  { id: 'istanbul', plate: '34', name: 'İstanbul', region: 'Marmara', mapX: 195, mapY: 105, logisticsDistanceFactor: 1.0, openingCostBase: 48000, dailyRentBase: 620, customerPotential: 96, minCountryRep: 40, requiredQuestTier: 1, hasDetailedCityMap: true },
  { id: 'ankara', plate: '06', name: 'Ankara', region: 'İç Anadolu', mapX: 405, mapY: 195, logisticsDistanceFactor: 1.18, openingCostBase: 42000, dailyRentBase: 540, customerPotential: 92, minCountryRep: 52, requiredQuestTier: 2, hasDetailedCityMap: true },
  { id: 'izmir', plate: '35', name: 'İzmir', region: 'Ege', mapX: 120, mapY: 270, logisticsDistanceFactor: 1.22, openingCostBase: 44000, dailyRentBase: 560, customerPotential: 92, minCountryRep: 52, requiredQuestTier: 2, hasDetailedCityMap: true },
  { id: 'bursa', plate: '16', name: 'Bursa', region: 'Marmara', mapX: 210, mapY: 165, logisticsDistanceFactor: 1.08, openingCostBase: 40000, dailyRentBase: 510, customerPotential: 90, minCountryRep: 48, requiredQuestTier: 2, hasDetailedCityMap: true },
  { id: 'antalya', plate: '07', name: 'Antalya', region: 'Akdeniz', mapX: 315, mapY: 365, logisticsDistanceFactor: 1.32, openingCostBase: 46000, dailyRentBase: 590, customerPotential: 94, minCountryRep: 58, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'adana', plate: '01', name: 'Adana', region: 'Akdeniz', mapX: 545, mapY: 365, logisticsDistanceFactor: 1.38, openingCostBase: 38000, dailyRentBase: 480, customerPotential: 89, minCountryRep: 56, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'konya', plate: '42', name: 'Konya', region: 'İç Anadolu', mapX: 405, mapY: 300, logisticsDistanceFactor: 1.26, openingCostBase: 36000, dailyRentBase: 450, customerPotential: 87, minCountryRep: 54, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'gaziantep', plate: '27', name: 'Gaziantep', region: 'Güneydoğu Anadolu', mapX: 645, mapY: 365, logisticsDistanceFactor: 1.45, openingCostBase: 39000, dailyRentBase: 490, customerPotential: 91, minCountryRep: 60, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'hatay', plate: '31', name: 'Hatay', region: 'Akdeniz', mapX: 585, mapY: 415, logisticsDistanceFactor: 1.45, openingCostBase: 37000, dailyRentBase: 470, customerPotential: 92, minCountryRep: 58, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'kocaeli', plate: '41', name: 'Kocaeli', region: 'Marmara', mapX: 245, mapY: 120, logisticsDistanceFactor: 1.05, openingCostBase: 39000, dailyRentBase: 500, customerPotential: 88, minCountryRep: 46, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'mersin', plate: '33', name: 'Mersin', region: 'Akdeniz', mapX: 485, mapY: 375, logisticsDistanceFactor: 1.36, openingCostBase: 37000, dailyRentBase: 470, customerPotential: 87, minCountryRep: 55, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'eskisehir', plate: '26', name: 'Eskişehir', region: 'İç Anadolu', mapX: 295, mapY: 195, logisticsDistanceFactor: 1.14, openingCostBase: 37000, dailyRentBase: 470, customerPotential: 89, minCountryRep: 50, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'kayseri', plate: '38', name: 'Kayseri', region: 'İç Anadolu', mapX: 545, mapY: 260, logisticsDistanceFactor: 1.30, openingCostBase: 36000, dailyRentBase: 450, customerPotential: 86, minCountryRep: 55, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'samsun', plate: '55', name: 'Samsun', region: 'Karadeniz', mapX: 565, mapY: 105, logisticsDistanceFactor: 1.32, openingCostBase: 36000, dailyRentBase: 450, customerPotential: 86, minCountryRep: 55, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'trabzon', plate: '61', name: 'Trabzon', region: 'Karadeniz', mapX: 745, mapY: 120, logisticsDistanceFactor: 1.48, openingCostBase: 38000, dailyRentBase: 480, customerPotential: 88, minCountryRep: 58, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'diyarbakir', plate: '21', name: 'Diyarbakır', region: 'Güneydoğu Anadolu', mapX: 775, mapY: 320, logisticsDistanceFactor: 1.55, openingCostBase: 35000, dailyRentBase: 440, customerPotential: 86, minCountryRep: 58, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'sanliurfa', plate: '63', name: 'Şanlıurfa', region: 'Güneydoğu Anadolu', mapX: 715, mapY: 365, logisticsDistanceFactor: 1.52, openingCostBase: 34000, dailyRentBase: 430, customerPotential: 85, minCountryRep: 58, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'erzurum', plate: '25', name: 'Erzurum', region: 'Doğu Anadolu', mapX: 815, mapY: 185, logisticsDistanceFactor: 1.58, openingCostBase: 34000, dailyRentBase: 420, customerPotential: 85, minCountryRep: 58, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'van', plate: '65', name: 'Van', region: 'Doğu Anadolu', mapX: 920, mapY: 270, logisticsDistanceFactor: 1.68, openingCostBase: 33000, dailyRentBase: 410, customerPotential: 84, minCountryRep: 60, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'malatya', plate: '44', name: 'Malatya', region: 'Doğu Anadolu', mapX: 675, mapY: 275, logisticsDistanceFactor: 1.44, openingCostBase: 33000, dailyRentBase: 410, customerPotential: 83, minCountryRep: 55, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'kahramanmaras', plate: '46', name: 'Kahramanmaraş', region: 'Akdeniz', mapX: 615, mapY: 325, logisticsDistanceFactor: 1.40, openingCostBase: 33000, dailyRentBase: 410, customerPotential: 84, minCountryRep: 55, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'denizli', plate: '20', name: 'Denizli', region: 'Ege', mapX: 235, mapY: 315, logisticsDistanceFactor: 1.24, openingCostBase: 35000, dailyRentBase: 440, customerPotential: 85, minCountryRep: 52, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'mugla', plate: '48', name: 'Muğla', region: 'Ege', mapX: 185, mapY: 355, logisticsDistanceFactor: 1.30, openingCostBase: 45000, dailyRentBase: 580, customerPotential: 91, minCountryRep: 56, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'aydin', plate: '09', name: 'Aydın', region: 'Ege', mapX: 155, mapY: 310, logisticsDistanceFactor: 1.25, openingCostBase: 35000, dailyRentBase: 440, customerPotential: 84, minCountryRep: 52, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'manisa', plate: '45', name: 'Manisa', region: 'Ege', mapX: 145, mapY: 235, logisticsDistanceFactor: 1.20, openingCostBase: 35000, dailyRentBase: 440, customerPotential: 85, minCountryRep: 50, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'balikesir', plate: '10', name: 'Balıkesir', region: 'Marmara', mapX: 155, mapY: 185, logisticsDistanceFactor: 1.12, openingCostBase: 36000, dailyRentBase: 450, customerPotential: 86, minCountryRep: 48, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'canakkale', plate: '17', name: 'Çanakkale', region: 'Marmara', mapX: 100, mapY: 165, logisticsDistanceFactor: 1.15, openingCostBase: 35000, dailyRentBase: 430, customerPotential: 84, minCountryRep: 48, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'tekirdag', plate: '59', name: 'Tekirdağ', region: 'Marmara', mapX: 130, mapY: 110, logisticsDistanceFactor: 1.06, openingCostBase: 36000, dailyRentBase: 450, customerPotential: 85, minCountryRep: 46, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'edirne', plate: '22', name: 'Edirne', region: 'Marmara', mapX: 90, mapY: 85, logisticsDistanceFactor: 1.12, openingCostBase: 34000, dailyRentBase: 420, customerPotential: 83, minCountryRep: 48, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'kirklareli', plate: '39', name: 'Kırklareli', region: 'Marmara', mapX: 135, mapY: 75, logisticsDistanceFactor: 1.10, openingCostBase: 31000, dailyRentBase: 380, customerPotential: 79, minCountryRep: 46, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'sakarya', plate: '54', name: 'Sakarya', region: 'Marmara', mapX: 280, mapY: 125, logisticsDistanceFactor: 1.07, openingCostBase: 36000, dailyRentBase: 450, customerPotential: 85, minCountryRep: 46, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'yalova', plate: '77', name: 'Yalova', region: 'Marmara', mapX: 210, mapY: 135, logisticsDistanceFactor: 1.05, openingCostBase: 33000, dailyRentBase: 410, customerPotential: 81, minCountryRep: 46, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'bilecik', plate: '11', name: 'Bilecik', region: 'Marmara', mapX: 255, mapY: 165, logisticsDistanceFactor: 1.10, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 76, minCountryRep: 46, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'duzce', plate: '81', name: 'Düzce', region: 'Karadeniz', mapX: 315, mapY: 125, logisticsDistanceFactor: 1.10, openingCostBase: 31000, dailyRentBase: 380, customerPotential: 79, minCountryRep: 48, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'bolu', plate: '14', name: 'Bolu', region: 'Karadeniz', mapX: 345, mapY: 140, logisticsDistanceFactor: 1.12, openingCostBase: 32000, dailyRentBase: 400, customerPotential: 82, minCountryRep: 48, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'zonguldak', plate: '67', name: 'Zonguldak', region: 'Karadeniz', mapX: 355, mapY: 95, logisticsDistanceFactor: 1.16, openingCostBase: 32000, dailyRentBase: 400, customerPotential: 80, minCountryRep: 50, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'bartin', plate: '74', name: 'Bartın', region: 'Karadeniz', mapX: 385, mapY: 85, logisticsDistanceFactor: 1.18, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 76, minCountryRep: 50, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'karabuk', plate: '78', name: 'Karabük', region: 'Karadeniz', mapX: 395, mapY: 115, logisticsDistanceFactor: 1.18, openingCostBase: 30000, dailyRentBase: 370, customerPotential: 78, minCountryRep: 50, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'kastamonu', plate: '37', name: 'Kastamonu', region: 'Karadeniz', mapX: 445, mapY: 95, logisticsDistanceFactor: 1.22, openingCostBase: 30000, dailyRentBase: 370, customerPotential: 78, minCountryRep: 50, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'sinop', plate: '57', name: 'Sinop', region: 'Karadeniz', mapX: 505, mapY: 75, logisticsDistanceFactor: 1.28, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 77, minCountryRep: 52, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'corum', plate: '19', name: 'Çorum', region: 'Karadeniz', mapX: 505, mapY: 155, logisticsDistanceFactor: 1.24, openingCostBase: 31000, dailyRentBase: 380, customerPotential: 80, minCountryRep: 52, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'amasya', plate: '05', name: 'Amasya', region: 'Karadeniz', mapX: 550, mapY: 145, logisticsDistanceFactor: 1.28, openingCostBase: 30000, dailyRentBase: 370, customerPotential: 79, minCountryRep: 52, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'tokat', plate: '60', name: 'Tokat', region: 'Karadeniz', mapX: 595, mapY: 165, logisticsDistanceFactor: 1.32, openingCostBase: 31000, dailyRentBase: 380, customerPotential: 80, minCountryRep: 54, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'ordu', plate: '52', name: 'Ordu', region: 'Karadeniz', mapX: 635, mapY: 115, logisticsDistanceFactor: 1.38, openingCostBase: 33000, dailyRentBase: 410, customerPotential: 82, minCountryRep: 55, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'giresun', plate: '28', name: 'Giresun', region: 'Karadeniz', mapX: 685, mapY: 125, logisticsDistanceFactor: 1.42, openingCostBase: 32000, dailyRentBase: 390, customerPotential: 81, minCountryRep: 55, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'rize', plate: '53', name: 'Rize', region: 'Karadeniz', mapX: 795, mapY: 115, logisticsDistanceFactor: 1.52, openingCostBase: 33000, dailyRentBase: 410, customerPotential: 82, minCountryRep: 58, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'artvin', plate: '08', name: 'Artvin', region: 'Karadeniz', mapX: 845, mapY: 110, logisticsDistanceFactor: 1.58, openingCostBase: 30000, dailyRentBase: 370, customerPotential: 77, minCountryRep: 58, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'gumushane', plate: '29', name: 'Gümüşhane', region: 'Karadeniz', mapX: 735, mapY: 160, logisticsDistanceFactor: 1.46, openingCostBase: 28000, dailyRentBase: 350, customerPotential: 75, minCountryRep: 55, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'bayburt', plate: '69', name: 'Bayburt', region: 'Karadeniz', mapX: 775, mapY: 165, logisticsDistanceFactor: 1.50, openingCostBase: 27000, dailyRentBase: 340, customerPotential: 74, minCountryRep: 55, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'kutahya', plate: '43', name: 'Kütahya', region: 'Ege', mapX: 245, mapY: 215, logisticsDistanceFactor: 1.15, openingCostBase: 31000, dailyRentBase: 380, customerPotential: 80, minCountryRep: 48, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'usak', plate: '64', name: 'Uşak', region: 'Ege', mapX: 225, mapY: 255, logisticsDistanceFactor: 1.18, openingCostBase: 30000, dailyRentBase: 370, customerPotential: 78, minCountryRep: 50, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'afyon', plate: '03', name: 'Afyonkarahisar', region: 'Ege', mapX: 285, mapY: 255, logisticsDistanceFactor: 1.18, openingCostBase: 33000, dailyRentBase: 410, customerPotential: 83, minCountryRep: 50, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'isparta', plate: '32', name: 'Isparta', region: 'Akdeniz', mapX: 305, mapY: 310, logisticsDistanceFactor: 1.25, openingCostBase: 32000, dailyRentBase: 390, customerPotential: 81, minCountryRep: 52, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'burdur', plate: '15', name: 'Burdur', region: 'Akdeniz', mapX: 275, mapY: 325, logisticsDistanceFactor: 1.26, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 77, minCountryRep: 52, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'karaman', plate: '70', name: 'Karaman', region: 'İç Anadolu', mapX: 435, mapY: 350, logisticsDistanceFactor: 1.32, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 77, minCountryRep: 54, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'aksaray', plate: '68', name: 'Aksaray', region: 'İç Anadolu', mapX: 465, mapY: 275, logisticsDistanceFactor: 1.26, openingCostBase: 31000, dailyRentBase: 380, customerPotential: 80, minCountryRep: 52, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'nigde', plate: '51', name: 'Niğde', region: 'İç Anadolu', mapX: 505, mapY: 310, logisticsDistanceFactor: 1.30, openingCostBase: 30000, dailyRentBase: 370, customerPotential: 78, minCountryRep: 54, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'nevsehir', plate: '50', name: 'Nevşehir / Kapadokya', region: 'İç Anadolu', mapX: 505, mapY: 265, logisticsDistanceFactor: 1.28, openingCostBase: 38000, dailyRentBase: 470, customerPotential: 89, minCountryRep: 55, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'kirsehir', plate: '40', name: 'Kırşehir', region: 'İç Anadolu', mapX: 475, mapY: 225, logisticsDistanceFactor: 1.24, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 77, minCountryRep: 52, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'kirikkale', plate: '71', name: 'Kırıkkale', region: 'İç Anadolu', mapX: 450, mapY: 195, logisticsDistanceFactor: 1.20, openingCostBase: 30000, dailyRentBase: 370, customerPotential: 78, minCountryRep: 50, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'cankiri', plate: '18', name: 'Çankırı', region: 'İç Anadolu', mapX: 445, mapY: 145, logisticsDistanceFactor: 1.20, openingCostBase: 28000, dailyRentBase: 350, customerPotential: 75, minCountryRep: 50, requiredQuestTier: 2, hasDetailedCityMap: false },
  { id: 'yozgat', plate: '66', name: 'Yozgat', region: 'İç Anadolu', mapX: 525, mapY: 205, logisticsDistanceFactor: 1.26, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 77, minCountryRep: 52, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'sivas', plate: '58', name: 'Sivas', region: 'İç Anadolu', mapX: 625, mapY: 215, logisticsDistanceFactor: 1.36, openingCostBase: 33000, dailyRentBase: 410, customerPotential: 83, minCountryRep: 55, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'osmaniye', plate: '80', name: 'Osmaniye', region: 'Akdeniz', mapX: 585, mapY: 365, logisticsDistanceFactor: 1.40, openingCostBase: 31000, dailyRentBase: 380, customerPotential: 80, minCountryRep: 56, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'kilis', plate: '79', name: 'Kilis', region: 'Güneydoğu Anadolu', mapX: 630, mapY: 395, logisticsDistanceFactor: 1.46, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 77, minCountryRep: 56, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'adiyaman', plate: '02', name: 'Adıyaman', region: 'Güneydoğu Anadolu', mapX: 680, mapY: 325, logisticsDistanceFactor: 1.46, openingCostBase: 31000, dailyRentBase: 380, customerPotential: 80, minCountryRep: 56, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'elazig', plate: '23', name: 'Elazığ', region: 'Doğu Anadolu', mapX: 730, mapY: 265, logisticsDistanceFactor: 1.48, openingCostBase: 33000, dailyRentBase: 410, customerPotential: 82, minCountryRep: 56, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'tunceli', plate: '62', name: 'Tunceli', region: 'Doğu Anadolu', mapX: 745, mapY: 230, logisticsDistanceFactor: 1.50, openingCostBase: 28000, dailyRentBase: 350, customerPotential: 75, minCountryRep: 56, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'erzincan', plate: '24', name: 'Erzincan', region: 'Doğu Anadolu', mapX: 730, mapY: 195, logisticsDistanceFactor: 1.46, openingCostBase: 30000, dailyRentBase: 370, customerPotential: 78, minCountryRep: 56, requiredQuestTier: 3, hasDetailedCityMap: false },
  { id: 'bingol', plate: '12', name: 'Bingöl', region: 'Doğu Anadolu', mapX: 790, mapY: 245, logisticsDistanceFactor: 1.54, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 77, minCountryRep: 58, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'mus', plate: '49', name: 'Muş', region: 'Doğu Anadolu', mapX: 840, mapY: 245, logisticsDistanceFactor: 1.58, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 77, minCountryRep: 58, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'bitlis', plate: '13', name: 'Bitlis', region: 'Doğu Anadolu', mapX: 865, mapY: 275, logisticsDistanceFactor: 1.62, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 77, minCountryRep: 58, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'batman', plate: '72', name: 'Batman', region: 'Güneydoğu Anadolu', mapX: 825, mapY: 315, logisticsDistanceFactor: 1.58, openingCostBase: 32000, dailyRentBase: 400, customerPotential: 82, minCountryRep: 58, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'mardin', plate: '47', name: 'Mardin', region: 'Güneydoğu Anadolu', mapX: 805, mapY: 365, logisticsDistanceFactor: 1.58, openingCostBase: 35000, dailyRentBase: 440, customerPotential: 86, minCountryRep: 58, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'siirt', plate: '56', name: 'Siirt', region: 'Güneydoğu Anadolu', mapX: 865, mapY: 315, logisticsDistanceFactor: 1.62, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 77, minCountryRep: 58, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'sirnak', plate: '73', name: 'Şırnak', region: 'Güneydoğu Anadolu', mapX: 890, mapY: 350, logisticsDistanceFactor: 1.66, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 77, minCountryRep: 60, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'hakkari', plate: '30', name: 'Hakkari', region: 'Doğu Anadolu', mapX: 945, mapY: 345, logisticsDistanceFactor: 1.74, openingCostBase: 28000, dailyRentBase: 350, customerPotential: 75, minCountryRep: 60, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'agri', plate: '04', name: 'Ağrı', region: 'Doğu Anadolu', mapX: 905, mapY: 205, logisticsDistanceFactor: 1.66, openingCostBase: 29000, dailyRentBase: 360, customerPotential: 77, minCountryRep: 60, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'igdir', plate: '76', name: 'Iğdır', region: 'Doğu Anadolu', mapX: 945, mapY: 185, logisticsDistanceFactor: 1.70, openingCostBase: 28000, dailyRentBase: 350, customerPotential: 76, minCountryRep: 60, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'kars', plate: '36', name: 'Kars', region: 'Doğu Anadolu', mapX: 905, mapY: 145, logisticsDistanceFactor: 1.66, openingCostBase: 31000, dailyRentBase: 380, customerPotential: 80, minCountryRep: 60, requiredQuestTier: 4, hasDetailedCityMap: false },
  { id: 'ardahan', plate: '75', name: 'Ardahan', region: 'Doğu Anadolu', mapX: 890, mapY: 105, logisticsDistanceFactor: 1.65, openingCostBase: 28000, dailyRentBase: 350, customerPotential: 75, minCountryRep: 60, requiredQuestTier: 4, hasDetailedCityMap: false }
];

/**
 * Herhangi bir il için ilçe listesini döndürür.
 * Özel tanımlı şehir haritası varsa onu, yoksa o ile ait 3 standart ilçeyi üretir.
 */
export function getDistrictsForProvince(provinceId) {
  if (provinceId === 'istanbul') {
    const baseList = CITY_DISTRICTS['istanbul'] || [];
    const byId = {};
    for (const d of baseList) {
      const realGeo = ISTANBUL_REAL_SVG_PATHS[d.id];
      byId[d.id] = {
        ...d,
        mapX: realGeo ? realGeo.cx : d.mapX,
        mapY: realGeo ? realGeo.cy : d.mapY
      };
    }
    // İstanbul'un 39 gerçek ilçesinin tamamını harita verisinden tamamla
    const asianSet = new Set([
      'ist_adalar', 'ist_atasehir', 'ist_beykoz', 'ist_cekmekoy', 'ist_kadikoy',
      'ist_kartal', 'ist_maltepe', 'ist_pendik', 'ist_sancaktepe', 'ist_sultanbeyli',
      'ist_sile', 'ist_tuzla', 'ist_umraniye', 'ist_uskudar'
    ]);
    for (const distId of Object.keys(ISTANBUL_REAL_SVG_PATHS)) {
      if (!byId[distId]) {
        const geo = ISTANBUL_REAL_SVG_PATHS[distId];
        const isAsian = asianSet.has(distId);
        const isAdalar = distId === 'ist_adalar';
        byId[distId] = {
          id: distId,
          provinceId: 'istanbul',
          name: geo.name,
          side: isAsian ? 'Anadolu Yakası' : 'Avrupa Yakası',
          mapX: geo.cx,
          mapY: geo.cy,
          neighborhoodType: isAdalar ? 'turistik_merkez' : isAsian ? 'aile_semti' : 'carsi_sanayi',
          openingCostBase: isAdalar ? 52000 : 39000,
          dailyRentBase: isAdalar ? 660 : 490,
          customerPotential: 85,
          minCityRep: 46,
          minCountryRep: 42,
          requiredQuestTier: 1,
          description: `İstanbul ${isAsian ? 'Anadolu Yakası' : 'Avrupa Yakası'} ${geo.name} ilçesi çarşı ve yerleşim merkezi.`
        };
      }
    }
    return Object.values(byId);
  }
  if (CITY_DISTRICTS[provinceId]) {
    return CITY_DISTRICTS[provinceId];
  }
  const prov = TURKEY_PROVINCES.find((p) => p.id === provinceId) || TURKEY_PROVINCES[0];
  return [
    {
      id: `${prov.id}_merkez`,
      provinceId: prov.id,
      name: `${prov.name} Merkez Çarşı`,
      side: 'Şehir Merkezi',
      mapX: 390,
      mapY: 205,
      neighborhoodType: 'aile_semti',
      openingCostBase: prov.openingCostBase,
      dailyRentBase: prov.dailyRentBase,
      customerPotential: prov.customerPotential,
      minCityRep: 45,
      minCountryRep: prov.minCountryRep,
      requiredQuestTier: prov.requiredQuestTier,
      description: `${prov.name} ilinin en işlek yaya ve aile alışveriş caddesi.`
    },
    {
      id: `${prov.id}_sanayi`,
      provinceId: prov.id,
      name: `${prov.name} Organize Sanayi & Esnaf`,
      side: 'Sanayi Bölgesi',
      mapX: 240,
      mapY: 235,
      neighborhoodType: 'carsi_sanayi',
      openingCostBase: Math.round(prov.openingCostBase * 0.85),
      dailyRentBase: Math.round(prov.dailyRentBase * 0.85),
      customerPotential: Math.max(65, prov.customerPotential - 4),
      minCityRep: 40,
      minCountryRep: Math.max(40, prov.minCountryRep - 4),
      requiredQuestTier: prov.requiredQuestTier,
      description: `${prov.name} sanayi esnafı ve ustalarının öğle yemeği merkezi.`
    },
    {
      id: `${prov.id}_kampus`,
      provinceId: prov.id,
      name: `${prov.name} Üniversite & Yeni Mahalle`,
      side: 'Kampüs Çevresi',
      mapX: 540,
      mapY: 195,
      neighborhoodType: 'universite_mahallesi',
      openingCostBase: Math.round(prov.openingCostBase * 0.9),
      dailyRentBase: Math.round(prov.dailyRentBase * 0.88),
      customerPotential: Math.max(68, prov.customerPotential - 2),
      minCityRep: 42,
      minCountryRep: Math.max(40, prov.minCountryRep - 2),
      requiredQuestTier: prov.requiredQuestTier,
      description: `${prov.name} üniversite öğrencileri ve genç nüfusun yoğun olduğu hareketli semt.`
    }
  ];
}
