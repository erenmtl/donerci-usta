// ============================================================================
// DÜKKAN EŞYALARI, OCAKLAR, MASALAR, DEKORASYON VE GENİŞLETME VERİLERİ
// ============================================================================

export interface FurnitureDef {
  id: string;
  name: string;
  icon: string;
  category: 'ocak_mutfak' | 'oturma' | 'dolap_icecek' | 'dekorasyon' | 'dis_cephe';
  zone: 'wall' | 'floor'; // Duvar veya Zemin grid eşyası
  width: number;          // Grid genişliği (hücre)
  height: number;         // Grid yüksekliği (hücre)
  basePrice: number;
  dailyUpkeep: number;
  effects: {
    seating?: number;
    speedBonus?: number;
    hygieneBonus?: number;
    decorBonus?: number;
    donerMaxKgBonus?: number;
    customerAppeal?: {
      ogrenci?: number;
      isci?: number;
      aile?: number;
      turist?: number;
    };
  };
  color: string;
  description: string;
}

export const FURNITURE_CATALOG: FurnitureDef[] = [
  // OCAK & MUTFAK
  {
    id: 'doner_ocagi_standart',
    name: '2 Radyanlı Klasik Döner Ocağı',
    icon: '🔥',
    category: 'ocak_mutfak',
    zone: 'floor',
    width: 1,
    height: 1,
    basePrice: 12000,
    dailyUpkeep: 80,
    effects: { donerMaxKgBonus: 15, speedBonus: 5 },
    color: '#d84315',
    description: 'Standart tüplü döner ocağı. Küçük dükkanın kalbi.'
  },
  {
    id: 'doner_ocagi_odunlu',
    name: 'Bakır Kubbeli Odun Ateşi Ocağı',
    icon: '🪵',
    category: 'ocak_mutfak',
    zone: 'floor',
    width: 1,
    height: 1,
    basePrice: 34000,
    dailyUpkeep: 160,
    effects: {
      donerMaxKgBonus: 30,
      speedBonus: 15,
      decorBonus: 14,
      customerAppeal: { aile: 15, turist: 25 }
    },
    color: '#bf360c',
    description: 'Meşe odunu ateşinde yaprak döner pişirir. Turist ve gurme aileleri mıknatıs gibi çeker.'
  },
  {
    id: 'mermer_tezgah',
    name: 'Paslanmaz & Mermer Servis Tezgahı',
    icon: '🔪',
    category: 'ocak_mutfak',
    zone: 'floor',
    width: 2,
    height: 1,
    basePrice: 9500,
    dailyUpkeep: 40,
    effects: { speedBonus: 10, hygieneBonus: 10 },
    color: '#90a4ae',
    description: 'Hızlı dürüm sarma ve hijyenik hazırlık alanı.'
  },
  {
    id: 'kasa_pos',
    name: 'Yeni Nesil Yazar Kasa & Sipariş Ekranı',
    icon: '📟',
    category: 'ocak_mutfak',
    zone: 'floor',
    width: 1,
    height: 1,
    basePrice: 8000,
    dailyUpkeep: 30,
    effects: { speedBonus: 12, decorBonus: 4 },
    color: '#37474f',
    description: 'Kuyruk bekleme süresini azaltır, kredi kartı ve temassız ödeme hızı sağlar.'
  },

  // SOĞUTUCU & DOLAP
  {
    id: 'endustriyel_buzdolabi',
    name: 'Çift Kapılı Sanayi Buzdolabı',
    icon: '🧊',
    category: 'dolap_icecek',
    zone: 'floor',
    width: 1,
    height: 1,
    basePrice: 14500,
    dailyUpkeep: 70,
    effects: { hygieneBonus: 14 },
    color: '#78909c',
    description: 'Etlerin ve sebzelerin bozulmasını geciktirir, zabıta denetiminde tam puan kazandırır.'
  },
  {
    id: 'bakir_yayik_ayran',
    name: 'Köpüklü Bakır Yayık Ayran Makinesi',
    icon: '🥛',
    category: 'dolap_icecek',
    zone: 'floor',
    width: 1,
    height: 1,
    basePrice: 16500,
    dailyUpkeep: 65,
    effects: {
      decorBonus: 10,
      speedBonus: 6,
      customerAppeal: { ogrenci: 12, isci: 15, turist: 18 }
    },
    color: '#d77a3b',
    description: 'Şırıl şırıl akan köpüklü ayran sesiyle müşterilerin iştahını kabartır.'
  },
  {
    id: 'camli_icecek_dolabi',
    name: 'Işıklı Camlı Meşrubat Dolabı',
    icon: '🥤',
    category: 'dolap_icecek',
    zone: 'floor',
    width: 1,
    height: 1,
    basePrice: 8500,
    dailyUpkeep: 50,
    effects: { speedBonus: 5, decorBonus: 5 },
    color: '#1e88e5',
    description: 'Buz gibi kola, şalgam ve gazoz satışlarını artırır.'
  },

  // OTURMA GRUBU
  {
    id: 'tabureli_masa',
    name: '2 Kişilik Esnaf Masası',
    icon: '🪑',
    category: 'oturma',
    zone: 'floor',
    width: 1,
    height: 1,
    basePrice: 3200,
    dailyUpkeep: 15,
    effects: {
      seating: 2,
      decorBonus: 2,
      customerAppeal: { ogrenci: 10, isci: 10 }
    },
    color: '#8d6e63',
    description: 'Az yer kaplar, hızlı yiyip kalkan öğrenci ve işçiler için idealdir.'
  },
  {
    id: 'aile_masasi_4',
    name: '4 Kişilik Ahşap Aile Masası',
    icon: '🍽️',
    category: 'oturma',
    zone: 'floor',
    width: 2,
    height: 1,
    basePrice: 7200,
    dailyUpkeep: 30,
    effects: {
      seating: 4,
      decorBonus: 8,
      customerAppeal: { aile: 16, turist: 10 }
    },
    color: '#6d4c41',
    description: 'Konforlu sandalyeleriyle ailelerin ve kalabalık grupların tercihi.'
  },
  {
    id: 'vip_loca_6',
    name: '6 Kişilik Deri Kaplama Loca Takımı',
    icon: '🛋️',
    category: 'oturma',
    zone: 'floor',
    width: 2,
    height: 2,
    basePrice: 18500,
    dailyUpkeep: 75,
    effects: {
      seating: 6,
      decorBonus: 18,
      customerAppeal: { aile: 25, turist: 22 }
    },
    color: '#8e2424',
    description: 'Restoran şıklığı katar, İskender ve porsiyon sipariş eden müşteri oranını yükseltir.'
  },

  // DEKORASYON & DUVAR / DIŞ CEPHE
  {
    id: 'salon_bitkisi',
    name: 'Bereket Çiçeği & Paşa Kılıcı Saksısı',
    icon: '🪴',
    category: 'dekorasyon',
    zone: 'floor',
    width: 1,
    height: 1,
    basePrice: 1800,
    dailyUpkeep: 5,
    effects: { decorBonus: 6, hygieneBonus: 3 },
    color: '#2e7d32',
    description: 'Dükkana ferahlık ve samimi bir mahalle havası verir.'
  },
  {
    id: 'duvar_tv',
    name: 'Maç Yayını Yapan Büyük Ekran LED TV',
    icon: '📺',
    category: 'dekorasyon',
    zone: 'wall',
    width: 1,
    height: 1,
    basePrice: 11500,
    dailyUpkeep: 45,
    effects: {
      decorBonus: 11,
      customerAppeal: { ogrenci: 15, isci: 18 }
    },
    color: '#263238',
    description: 'Sırada bekleyen müşterilerin sabrını artırır, maç günlerinde dükkanı doldurur.'
  },
  {
    id: 'nostaljik_tablo',
    name: 'Eski İstanbul & Nazar Boncuklu Hat Tablosu',
    icon: '🖼️',
    category: 'dekorasyon',
    zone: 'wall',
    width: 1,
    height: 1,
    basePrice: 2400,
    dailyUpkeep: 5,
    effects: {
      decorBonus: 7,
      customerAppeal: { aile: 8, turist: 14 }
    },
    color: '#c0ca33',
    description: 'Duvara geleneksel esnaf sıcaklığı katar.'
  },
  {
    id: 'neon_tabela',
    name: 'Işıklı "Meşhur Yaprak Dönercisi" Tabelası',
    icon: '🪧',
    category: 'dis_cephe',
    zone: 'wall',
    width: 2,
    height: 1,
    basePrice: 14000,
    dailyUpkeep: 60,
    effects: {
      decorBonus: 15,
      customerAppeal: { ogrenci: 12, turist: 20, aile: 12 }
    },
    color: '#ff6f00',
    description: 'Sokağın başından bile fark edilir, günlük müşteri akışını ciddi artırır.'
  },
  {
    id: 'kirmizi_tente',
    name: 'Kırmızı-Beyaz Çizgili Esnaf Tentesi & Vitrin',
    icon: '🎪',
    category: 'dis_cephe',
    zone: 'wall',
    width: 2,
    height: 1,
    basePrice: 9800,
    dailyUpkeep: 35,
    effects: {
      decorBonus: 12,
      hygieneBonus: 5,
      customerAppeal: { aile: 12, turist: 15 }
    },
    color: '#c62828',
    description: 'Yağmurda ve güneşte vitrini korur, dükkanın dış cephesini güzelleştirir.'
  }
];

export const WALL_STYLES = [
  { id: 'krem_siva', name: 'Sıcak Krem Sıva', color: '#3b3028', price: 0, decorBonus: 0 },
  { id: 'tugla_desen', name: 'Kırmızı Ateş Tuğlası', color: '#542920', price: 4500, decorBonus: 6 },
  { id: 'cini_seramik', name: 'İznik Çini & Beyaz Fayans', color: '#203b46', price: 7500, decorBonus: 10 },
  { id: 'modern_antrasit', name: 'Modern Antrasit & Ahşap', color: '#25282c', price: 9500, decorBonus: 12 }
];

export const FLOOR_STYLES = [
  { id: 'klasik_karo', name: 'Klasik Esnaf Karosu', color: '#2b231d', gridColor: '#3a3028', price: 0, decorBonus: 0 },
  { id: 'satrancli_mermer', name: 'Siyah-Beyaz Lokanta Mermeri', color: '#33312e', gridColor: '#484541', price: 5500, decorBonus: 7 },
  { id: 'masif_parke', name: 'Sıcak Ceviz Parke', color: '#422c1d', gridColor: '#573b27', price: 8500, decorBonus: 11 }
];

export const SHOP_UPGRADES = {
  expandLevel2: {
    name: 'Yan Depoyu Dükkana Kat (Alan Genişletme 8x6)',
    basePrice: 45000,
    newCols: 8,
    newRows: 6,
    description: 'Dükkan grid alanını 6x5\'ten 8x6\'ya büyütür, daha fazla masa ve ekipman sığar.'
  },
  sidewalkPermit: {
    name: 'Belediye Kaldırım Masa İzni',
    basePrice: 28000,
    seatingBonus: 6,
    decorBonus: 8,
    description: 'Dükkanın önüne 3 adet açık hava masası (+6 koltuk kapasitesi) ekler. Yazın müşteri akın eder.'
  },
  secondFloor: {
    name: 'Üst Kat Aile Salonu Açılışı (10x7 Grid + Aile Salonu)',
    basePrice: 110000,
    newCols: 10,
    newRows: 7,
    seatingBonus: 8,
    decorBonus: 16,
    description: 'Dükkanı iki katlı meşhur bir restorana dönüştürür, aile ve turist kapasitesi katlanır.'
  }
};
