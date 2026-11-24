// ============================================================================
// BAŞLANGIÇ SENARYOLARI, ŞEHİR/MAHALLE TİPLERİ VE AİLE ŞABLONLARI
// ============================================================================

export const NEIGHBORHOOD_TYPES = [
  {
    id: 'universite_mahallesi',
    name: 'Üniversite & Öğrenci Mahallesi (Görükle / Beşiktaş / Bosna)',
    description: 'Öğrenci nüfusu çok yoğun. Ucuz tavuk dürüm ve ayran kapış kapış gider, paket servis talebi yüksektir.',
    rentMultiplier: 1.0,
    customerWeights: { ogrenci: 50, isci: 15, aile: 15, turist: 5, esnaf: 15 }
  },
  {
    id: 'carsi_sanayi',
    name: 'Esnaf Çarşısı & Sanayi Girişi (İkitelli / Ostim / Kemeraltı)',
    description: 'Öğle saatlerinde esnaf ve ustalar akın eder. Doyurucu ekmek arası ve porsiyon et döner çok sevilir.',
    rentMultiplier: 0.9,
    customerWeights: { ogrenci: 15, isci: 45, aile: 10, turist: 5, esnaf: 25 }
  },
  {
    id: 'aile_semti',
    name: 'Köklü Aile Mahallesi (Kadıköy / Karşıyaka / Bahçelievler)',
    description: 'Aileler akşam yemeğine gelir. Dekorasyon, hijyen ve İskender/porsiyon kalitesi çok önemlidir.',
    rentMultiplier: 1.15,
    customerWeights: { ogrenci: 20, isci: 15, aile: 45, turist: 5, esnaf: 15 }
  },
  {
    id: 'turistik_merkez',
    name: 'Tarihi & Turistik Çarşı (Sultanahmet / Kaleiçi / Kordon)',
    description: 'Kira yüksektir ama turistler ve aileler yüksek fiyatlı kaliteli yaprak dönere cömert para öder.',
    rentMultiplier: 1.45,
    customerWeights: { ogrenci: 10, isci: 10, aile: 25, turist: 40, esnaf: 15 }
  }
];

export const STARTING_SCENARIOS = [
  {
    id: 'babadan_miras',
    title: 'Babadan Kalma Emektar Dükkan',
    subtitle: 'Borç yok, mahalle seni tanıyor ama dükkan biraz eski.',
    story: 'Rahmetli baban "Oğlum bu ocağın ateşi hiç sönmesin" diyerek 30 yıllık küçük dükkanı sana bıraktı. Esnaf seni çocukluğundan beri tanır.',
    startingCash: 45000,
    startingDebt: 0,
    startingReputation: 62,
    startingHygiene: 75,
    bonusRelation: 15
  },
  {
    id: 'krediyle_sifirdan',
    title: 'Kredi Çekip Sıfırdan Kurulan Hayal',
    subtitle: 'Cebinde iyi sermaye var ama bankaya aylık taksit ödüyorsun.',
    story: 'Yıllarca başkalarının yanında çalıştıktan sonra bankadan esnaf kredisi çektin. Kasanda nakit var ama her gün kredi taksiti işliyor!',
    startingCash: 110000,
    startingDebt: 75000,
    startingReputation: 45,
    startingHygiene: 90,
    bonusRelation: 0
  },
  {
    id: 'usta_ciragi',
    title: 'Baş Ustanın Çırağı (Az Sermaye, Yüksek İtibar)',
    subtitle: 'Birikimin kısıtlı ama elinin lezzeti şimdiden konuşuluyor.',
    story: 'Şehrin en meşhur dönercisinde 10 yıl bıçak salladın. Küçük bir birikimle kendi ocağını açtın. Paranı çok dikkatli yönetmelisin.',
    startingCash: 26000,
    startingDebt: 0,
    startingReputation: 72,
    startingHygiene: 88,
    bonusRelation: 10
  },
  {
    id: 'son_sans',
    title: 'Aile Birikimiyle Son Şans (Zorlu Mücadele)',
    subtitle: 'Düşük sermaye, biraz borç, yüksek motivasyon.',
    story: 'Eski işin ters gitti, eşinin bileziklerini ve son birikimi bozdurup bu dükkanı devraldın. Başarısız olma lüksün yok!',
    startingCash: 22000,
    startingDebt: 25000,
    startingReputation: 40,
    startingHygiene: 70,
    bonusRelation: -5
  }
];

export const FAMILY_TEMPLATES = {
  bekar: {
    label: 'Bekar (Tek Başına)',
    description: 'Ev masrafın düşük, tüm vaktini dükkana harcayabilirsin ama akşamları ev biraz ıssız.',
    houseRentBase: 8500,
    createMembers: (_playerAge) => []
  },
  evli: {
    label: 'Evli (Eşinle Birlikte)',
    description: 'Eşin manevi destek sağlar, moralin yüksek kalır. İstersen dükkanda kasaya da yardıma gelebilir.',
    houseRentBase: 12000,
    createMembers: (playerAge) => [
      {
        id: 'spouse_1',
        name: 'Elif',
        relation: 'Eş',
        age: Math.max(18, playerAge - 2),
        happiness: 82,
        health: 90,
        worksInShop: false,
        monthlyExpense: 3500,
        statusText: 'Ev işleriyle ilgileniyor, sana güveniyor.'
      }
    ]
  },
  evli_cocuklu: {
    label: 'Evli ve 2 Çocuklu (Çekirdek Aile)',
    description: 'Okul ve mutfak masrafı yüksektir ama çocukların büyüyünce dükkanda çalışıp işi devralabilir!',
    houseRentBase: 15500,
    createMembers: (playerAge) => [
      {
        id: 'spouse_1',
        name: 'Zeynep',
        relation: 'Eş',
        age: Math.max(20, playerAge - 1),
        happiness: 78,
        health: 88,
        worksInShop: false,
        monthlyExpense: 3500,
        statusText: 'Çocukların okulu ve ev bütçesiyle ilgileniyor.'
      },
      {
        id: 'child_1',
        name: 'Emir',
        relation: 'Çocuk',
        age: Math.max(6, Math.min(17, playerAge - 20)),
        happiness: 85,
        health: 95,
        worksInShop: false,
        monthlyExpense: 4200,
        statusText: 'Okula gidiyor, harçlık ve kitap ihtiyacı var.'
      },
      {
        id: 'child_2',
        name: 'Defne',
        relation: 'Çocuk',
        age: Math.max(4, Math.min(14, playerAge - 23)),
        happiness: 88,
        health: 92,
        worksInShop: false,
        monthlyExpense: 3200,
        statusText: 'Evin neşesi, babasının dönerini çok seviyor.'
      }
    ]
  },
  anne_baba_bakimli: {
    label: 'Emektar Anne-Babaya Bakan Hayırlı Evlat',
    description: 'Yaşlı anne ve baban seninle yaşıyor. İlaç ve doktor masrafları var ama hayır duaları bereket getirir.',
    houseRentBase: 13500,
    createMembers: (playerAge) => [
      {
        id: 'parent_1',
        name: 'Hacı Mehmet Baba',
        relation: 'Baba',
        age: playerAge + 28,
        happiness: 80,
        health: 68,
        worksInShop: false,
        monthlyExpense: 4000,
        statusText: 'Eski esnaf, arada dükkana uğrayıp nasihat verir.'
      },
      {
        id: 'parent_2',
        name: 'Fatma Anne',
        relation: 'Anne',
        age: playerAge + 25,
        happiness: 84,
        health: 72,
        worksInShop: false,
        monthlyExpense: 3800,
        statusText: 'Tansiyon ilaçlarını düzenli kullanması gerekiyor.'
      }
    ]
  }
};
