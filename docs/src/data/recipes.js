// ============================================================================
// MENÜ REÇETELERİ, SOSYAL ÇEVRE UYUMU VE MÜŞTERİ TERCİH AĞIRLIKLARI
// (Mahallenin Sosyal Çevresine Göre Özelleştirilebilir 14 Zengin Ürün)
// ============================================================================


export const RECIPES = [
  // ÖĞRENCİ & GENÇ ÇEVRESİ ÜRÜNLERİ
  {
    id: 'eko_tavuk_durum',
    name: 'Eko Öğrenci Tavuk Dürüm',
    icon: '🌯',
    category: 'ana_yemek',
    socialTag: 'ogrenci_favorisi',
    socialTagLabel: '🎓 Öğrenci & Genç Favorisi',
    description: 'Harçlık dostu, bol patatesli ve özel soslu pratik tavuk dürüm. Öğrenci mahallesinde sürümden kazandırır.',
    ingredients: [
      { ingredientId: 'tavuk_eti', amount: 0.8 },
      { ingredientId: 'lavas', amount: 1 },
      { ingredientId: 'patates', amount: 0.6 },
      { ingredientId: 'ozel_sos', amount: 0.8 }
    ],
    baseSuggestedPrice: 75,
    prepComplexity: 0.8,
    appeal: { ogrenci: 100, isci: 70, aile: 45, turist: 30, esnaf: 60 }
  },
  {
    id: 'tavuk_durum',
    name: 'Hatay Usulü Soslu Zurna Dürüm (70cm)',
    icon: '🌯',
    category: 'ana_yemek',
    socialTag: 'ogrenci_favorisi',
    socialTagLabel: '🎓 Öğrenci & Genç Favorisi',
    description: 'Çift tandır lavaşı içinde kızarmış soslu, turşulu, sarımsaklı mayonezli dev zurna tavuk döner.',
    ingredients: [
      { ingredientId: 'tavuk_eti', amount: 1.2 },
      { ingredientId: 'lavas', amount: 1.5 },
      { ingredientId: 'sebze_garnitur', amount: 1 },
      { ingredientId: 'ozel_sos', amount: 1.2 }
    ],
    baseSuggestedPrice: 110,
    prepComplexity: 1.0,
    appeal: { ogrenci: 98, isci: 82, aile: 65, turist: 55, esnaf: 72 }
  },

  // SANAYİ & ESNAF ÇARŞISI ÜRÜNLERİ
  {
    id: 'ekmek_arasi_tavuk',
    name: 'Sıcak Tombik / Gobit Ekmek Arası Tavuk',
    icon: '🥪',
    category: 'ana_yemek',
    socialTag: 'sanayi_esnaf',
    socialTagLabel: '🛠️ Sanayi & Çarşı Esnafı',
    description: 'Fırından yeni çıkmış susamlı tombik pide arasında bol domates, sumaklı soğan ve tavuk döner.',
    ingredients: [
      { ingredientId: 'tavuk_eti', amount: 1 },
      { ingredientId: 'tombik_ekmek', amount: 1 },
      { ingredientId: 'sebze_garnitur', amount: 1 }
    ],
    baseSuggestedPrice: 90,
    prepComplexity: 0.85,
    appeal: { ogrenci: 88, isci: 94, aile: 55, turist: 45, esnaf: 88 }
  },
  {
    id: 'somun_et_doner',
    name: 'Tam Somun Ekmek Arası Bol Yaprak Et',
    icon: '🥖',
    category: 'ana_yemek',
    socialTag: 'sanayi_esnaf',
    socialTagLabel: '🛠️ Sanayi & Çarşı Esnafı',
    description: 'Ağır iş yapan sanayi ustaları ve çarşı esnafı için tam ekmek arası doyurucu yaprak et döner.',
    ingredients: [
      { ingredientId: 'yaprak_et', amount: 1.15 },
      { ingredientId: 'tombik_ekmek', amount: 1.2 },
      { ingredientId: 'sebze_garnitur', amount: 1 },
      { ingredientId: 'patates', amount: 0.6 }
    ],
    baseSuggestedPrice: 165,
    prepComplexity: 1.0,
    appeal: { ogrenci: 50, isci: 100, aile: 68, turist: 65, esnaf: 96 }
  },
  {
    id: 'et_durum',
    name: 'Lavaşta Yaprak Et Döner Dürüm',
    icon: '🌯',
    category: 'ana_yemek',
    socialTag: 'sanayi_esnaf',
    socialTagLabel: '🛠️ Sanayi & Çarşı Esnafı',
    description: '%100 yaprak dana döner, közlenmiş biber, soğan ve ince tandır lavaşı.',
    ingredients: [
      { ingredientId: 'yaprak_et', amount: 1 },
      { ingredientId: 'lavas', amount: 1 },
      { ingredientId: 'sebze_garnitur', amount: 1 }
    ],
    baseSuggestedPrice: 175,
    prepComplexity: 1.1,
    appeal: { ogrenci: 60, isci: 90, aile: 85, turist: 88, esnaf: 92 }
  },

  // KÖKLÜ AİLE SEMTİ ÜRÜNLERİ
  {
    id: 'porsiyon_et_doner',
    name: 'Pilav Üstü Servis Porsiyon Yaprak Döner',
    icon: '🍽️',
    category: 'ana_yemek',
    socialTag: 'aile_klasik',
    socialTagLabel: '👨‍👩‍👧 Aile Semti Klasiği',
    description: 'Tereyağlı pirinç pilavı ve lavaş yataklı, köz domates ve patates eşliğinde bol porsiyon.',
    ingredients: [
      { ingredientId: 'yaprak_et', amount: 1.3 },
      { ingredientId: 'lavas', amount: 1 },
      { ingredientId: 'sebze_garnitur', amount: 1 },
      { ingredientId: 'patates', amount: 1 }
    ],
    baseSuggestedPrice: 245,
    prepComplexity: 1.3,
    appeal: { ogrenci: 30, isci: 75, aile: 96, turist: 92, esnaf: 86 }
  },
  {
    id: 'bursa_iskender',
    name: 'Tereyağlı Özel Bursa İskender Kebap',
    icon: '🥘',
    category: 'ana_yemek',
    socialTag: 'aile_klasik',
    socialTagLabel: '👨‍👩‍👧 Aile Semti Klasiği',
    description: 'Küp pide üzerinde yaprak döner, sıcak domates sosu, cızırdayan tereyağı ve tava yoğurdu.',
    ingredients: [
      { ingredientId: 'yaprak_et', amount: 1.4 },
      { ingredientId: 'tombik_ekmek', amount: 1 },
      { ingredientId: 'ozel_sos', amount: 1.8 },
      { ingredientId: 'sebze_garnitur', amount: 1 }
    ],
    baseSuggestedPrice: 285,
    prepComplexity: 1.5,
    appeal: { ogrenci: 25, isci: 60, aile: 100, turist: 98, esnaf: 82 }
  },

  // TURİSTİK & GURME ÇARŞI ÜRÜNLERİ
  {
    id: 'gurme_odun_doner',
    name: 'Odun Ateşi Gurme Kuzu-Dana Saray Döneri',
    icon: '👑',
    category: 'ana_yemek',
    socialTag: 'turist_gurme',
    socialTagLabel: '📸 Turistik & Gurme Spesiyal',
    description: 'Turistlerin ve gurmelerin yüksek fiyat ödediği, bakırahanede sunulan özel zırh/yaprak döner.',
    ingredients: [
      { ingredientId: 'yaprak_et', amount: 1.6 },
      { ingredientId: 'lavas', amount: 1.2 },
      { ingredientId: 'ozel_sos', amount: 1.5 },
      { ingredientId: 'sebze_garnitur', amount: 1.2 }
    ],
    baseSuggestedPrice: 360,
    prepComplexity: 1.6,
    appeal: { ogrenci: 10, isci: 30, aile: 85, turist: 100, esnaf: 60 }
  },

  // ÇORBA, YAN ÜRÜNLER, İÇECEK VE TATLILAR
  {
    id: 'mercimek_corbasi',
    name: 'Tereyağlı Süzme Mercimek Çorbası',
    icon: '🥣',
    category: 'yan_urun',
    socialTag: 'sanayi_esnaf',
    socialTagLabel: '🛠️ Esnaf & Kış Başlangıcı',
    description: 'Döner öncesi limonlu, kıtır ekmekli sıcak esnaf çorbası.',
    ingredients: [
      { ingredientId: 'ozel_sos', amount: 0.6 },
      { ingredientId: 'tombik_ekmek', amount: 0.5 }
    ],
    baseSuggestedPrice: 55,
    prepComplexity: 0.4,
    appeal: { ogrenci: 70, isci: 95, aile: 85, turist: 75, esnaf: 98 }
  },
  {
    id: 'patates_porsiyon',
    name: 'Çıtır Baharatlı Patates Sepeti',
    icon: '🍟',
    category: 'yan_urun',
    socialTag: 'ogrenci_favorisi',
    socialTagLabel: '🎓 Öğrenci & Çocuk Favorisi',
    description: 'Dönerin yanına sıcak çıtır Afyon patates kızartması.',
    ingredients: [
      { ingredientId: 'patates', amount: 1.4 }
    ],
    baseSuggestedPrice: 50,
    prepComplexity: 0.5,
    appeal: { ogrenci: 92, isci: 55, aile: 85, turist: 75, esnaf: 50 }
  },
  {
    id: 'yayik_ayran',
    name: 'Bol Köpüklü Bakır Yayık Ayran',
    icon: '🥛',
    category: 'icecek',
    socialTag: 'genel',
    socialTagLabel: '🌟 Tüm Mahallede Yok Satar',
    description: 'Bakır maşrapada buz gibi köpüklü yayık ayranı.',
    ingredients: [
      { ingredientId: 'ayran', amount: 1 }
    ],
    baseSuggestedPrice: 30,
    prepComplexity: 0.2,
    appeal: { ogrenci: 95, isci: 98, aile: 92, turist: 90, esnaf: 98 }
  },
  {
    id: 'kutu_icecek',
    name: 'Soğuk Kola / Acılı Adana Şalgamı',
    icon: '🥤',
    category: 'icecek',
    socialTag: 'genel',
    socialTagLabel: '🌟 Tüm Mahallede Yok Satar',
    description: 'Buzdolabından soğuk kutu meşrubat veya gerçek havuçlu şalgam suyu.',
    ingredients: [
      { ingredientId: 'gazli_icecek', amount: 1 }
    ],
    baseSuggestedPrice: 45,
    prepComplexity: 0.2,
    appeal: { ogrenci: 90, isci: 85, aile: 85, turist: 88, esnaf: 80 }
  },
  {
    id: 'firin_sutlac',
    name: 'Fındıklı Hamsiköy Fırın Sütlaç',
    icon: '🍮',
    category: 'tatli',
    socialTag: 'aile_klasik',
    socialTagLabel: '👨‍👩‍👧 Aile & Esnaf Tatlısı',
    description: 'Güveçte nar gibi kızarmış bol fındıklı fırın sütlaç.',
    ingredients: [
      { ingredientId: 'tatli_sutlac', amount: 1 }
    ],
    baseSuggestedPrice: 75,
    prepComplexity: 0.4,
    appeal: { ogrenci: 50, isci: 65, aile: 92, turist: 88, esnaf: 85 }
  },
  {
    id: 'antep_kunefe',
    name: 'Antep Fıstıklı Sıcak Peynirli Künefe',
    icon: '🧀',
    category: 'tatli',
    socialTag: 'turist_gurme',
    socialTagLabel: '📸 Aile & Turist Gurme Tatlısı',
    description: 'İskender ve yaprak döner üstüne şerbetli, uzayan peynirli sıcak künefe.',
    ingredients: [
      { ingredientId: 'tatli_sutlac', amount: 1.3 },
      { ingredientId: 'ozel_sos', amount: 0.5 }
    ],
    baseSuggestedPrice: 120,
    prepComplexity: 0.8,
    appeal: { ogrenci: 40, isci: 50, aile: 95, turist: 100, esnaf: 80 }
  }
];
