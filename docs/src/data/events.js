// ============================================================================
// ORGANİK RASTGELE OLAYLAR: HİJYEN, MÜŞTERİ YOĞUNLUĞU, SOSYAL ÇEVRE VE AİLE
// (Manuel Tetiklenmez; Gün İçinde Duruma ve Şansa Göre Kendiliğinden Gelişir)
// ============================================================================


export const RANDOM_EVENTS = [
  // HİJYEN VE İNTERAKTİF DENETİM OLAYLARI
  {
    id: 'zabita_denetimi',
    category: 'hijyen',
    title: 'Sürpriz Belediye Gıda & Hijyen Denetimi!',
    icon: '👮',
    description: 'Belediye zabıta ve gıda kontrol ekipleri ellerinde termometre ve tutanakla dükkana girdi! Ocak davlumbazını, kesim tezgahını ve dolap soğukluğunu inceliyorlar.',
    choices: [
      {
        label: 'Hemen Profesyonel Buharlı Temizlik ve Filtre Değişimi Yaptır (-1.800 ₺)',
        outcomeText: 'Denetimden tam puan aldın! Cama "Beyaz Bayraklı Hijyenik Esnaf" etiketi yapıştırıldı, yoldan geçen müşterilerin güveni arttı.',
        effects: {
          cashDelta: -1800,
          hygieneDelta: 25,
          reputationDelta: 7,
          trafficMultiplierDelta: 0.25
        }
      },
      {
        label: 'Çırakla Hızlıca Tezgahı Тоparla ve Kendin İlgilen (-15 Enerji)',
        outcomeText: 'Ufak bir uyarı ile cezadan kurtuldun ama yorucu oldu.',
        effects: {
          energyDelta: -15,
          hygieneDelta: 10
        }
      },
      {
        label: 'Mevcut Halinle Denetime Gir ("Bizim Mutfağımız Açıktır Memur Bey")',
        outcomeText: 'Masalardaki yağ lekeleri yüzünden uyarı tutanağı tutuldu. Gören bazı müşteriler kapıdan döndü.',
        effects: {
          hygieneDelta: -8,
          reputationDelta: -5,
          trafficMultiplierDelta: -0.25
        }
      }
    ]
  },
  {
    id: 'davlumbaz_duman',
    category: 'hijyen',
    title: 'Döner Ocağı Davlumbazı Tıkandı, İçeriyi Duman Bastı!',
    icon: '💨',
    description: 'Öğle servisinin ortasında bacanın yağ filtresi tıkandı. Salonun içine ağır bir yağ kokusu ve duman yayılıyor, oturan müşteriler öksürmeye başladı!',
    choices: [
      {
        label: 'Acil Bacacı Çağır ve Havalandırmayı Yenile (-1.400 ₺)',
        outcomeText: 'Usta 20 dakikada filtreyi temizledi, dükkan ferahladı. Müşteriler duyarlılığını takdir etti.',
        effects: {
          cashDelta: -1400,
          hygieneDelta: 18,
          reputationDelta: 4,
          trafficMultiplierDelta: 0.15
        }
      },
      {
        label: 'Kapıyı Pencereyi Açıp Kendin Silmeye Çalış (-20 Enerji)',
        outcomeText: 'Duman biraz dağıldı ama içerisi soğudu ve bugün müşteri akışı yavaşladı.',
        effects: {
          energyDelta: -20,
          hygieneDelta: -5,
          trafficMultiplierDelta: -0.20
        }
      }
    ]
  },
  {
    id: 'musteri_hijyen_sikayeti',
    category: 'hijyen',
    title: 'Titiz Müşteriden Masa ve Bardak Şikayeti!',
    icon: '🧼',
    description: 'Salonda oturan bir aile müşterisi sesini yükseltti: "Ustam masalar yapış yapış, ayran maşrapası da tam yıkanmamış! Böyle esnaflık olur mu?"',
    choices: [
      {
        label: 'Özür Dile, Hesabı Alma ve Tüm Salonu Dezenfekte Et (-450 ₺, -10 Enerji)',
        outcomeText: 'Müşterinin gönlünü aldın, diğer masalar da temizliği görünce rahatladı.',
        effects: {
          cashDelta: -450,
          energyDelta: -10,
          hygieneDelta: 16,
          reputationDelta: 3
        }
      },
      {
        label: '"Yoğunluktan Yetişemiyoruz Kardeşim" Deyip Geç',
        outcomeText: 'Müşteri sinirle kalkıp sosyal medyada kötü yorum yazdı. Bugün dükkana giren çıkan azaldı!',
        effects: {
          hygieneDelta: -10,
          reputationDelta: -7,
          trafficMultiplierDelta: -0.30
        }
      }
    ]
  },

  // MÜŞTERİ YOĞUNLUĞUNU DOĞRUDAN ETKİLEYEN SOKAK & ÇEVRE OLAYLARI
  {
    id: 'belediye_kazi_calismasi',
    category: 'musteri_akisi',
    title: 'Dükkan Önünde Belediye Asfalt ve Boru Kazısı!',
    icon: '🚧',
    description: 'Sabah kepengi bir açtın ki belediye kepçesi dükkanın tam önündeki kaldırımı kazıyor! Toz toprak içinde kalan sokaktan yayalar geçemiyor.',
    choices: [
      {
        label: 'Geçici Ahşap Köprü Kur ve İşçilere Dürüm-Çay İkram Et (-750 ₺)',
        outcomeText: 'İşçiler senin dükkanın önünü hemen düzeltip geçiş açtı, üstüne şantiye ekibi de senden döner yedi!',
        effects: {
          cashDelta: -750,
          reputationDelta: 5,
          trafficMultiplierDelta: 0.15
        }
      },
      {
        label: 'Camları Kapatıp Kazının Bitmesini Bekle',
        outcomeText: 'Kaldırım kapalı olduğu için bugün yaya müşterilerin neredeyse yarısı dükkana giremedi.',
        effects: {
          hygieneDelta: -8,
          trafficMultiplierDelta: -0.40
        }
      }
    ]
  },
  {
    id: 'saganak_yagmur_firtina',
    category: 'musteri_akisi',
    title: 'Şiddetli Sağanak Yağmur Sokağı Boşalttı!',
    icon: '🌧️',
    description: 'Bardaktan boşanırcasına yağmur başladı. Sokakta yürüyen kimse kalmadı, yaya müşteri akışı bıçak gibi kesildi.',
    choices: [
      {
        label: 'Yağmurdan Kaçanlara Sıcak Mercimek Çorbası & Çay İkramı Duyur (-500 ₺)',
        outcomeText: 'Islanan mahalleli ve öğrenciler sığınmak için dükkanına doluştu, içerisi sıcacık muhabbetle doldu!',
        effects: {
          cashDelta: -500,
          reputationDelta: 6,
          trafficMultiplierDelta: 0.20
        }
      },
      {
        label: 'Ocağın Ateşini Kısıp Sakin Bir Gün Geçir (+15 Enerji)',
        outcomeText: 'Bugün müşteri çok az geldi ama sen de biraz soluklanmış oldun.',
        effects: {
          energyDelta: 15,
          trafficMultiplierDelta: -0.45
        }
      }
    ]
  },
  {
    id: 'rakip_fiyat_kampanyasi',
    category: 'musteri_akisi',
    title: 'Rakip Şahin Usta "Yarı Fiyatına Döner" Pankartı Astı!',
    icon: '📢',
    description: 'Sokağın başındaki rakip dönerci kapısına dev hoparlör koyup ucuz kampanya başlattı. Sokaktaki kalabalık oraya doğru kayıyor!',
    choices: [
      {
        label: 'Kaliteden Ödün Verme, Kapı Önünde Sıcak Yaprak Döner Tadımı Yap (-800 ₺)',
        outcomeText: 'Gerçek etin kokusunu ve lezzetini tadan müşteriler rakibin ucuz kıymalı dönerini bırakıp sana döndü!',
        effects: {
          cashDelta: -800,
          reputationDelta: 6,
          trafficMultiplierDelta: 0.25
        }
      },
      {
        label: 'Bugünlük Günlük İndirimli "Dürüm + Ayran" Menüsü Çıkar (-400 ₺)',
        outcomeText: 'Müşteri kaybını önledin, dükkanın temposu korundu.',
        effects: {
          cashDelta: -400,
          trafficMultiplierDelta: 0.05
        }
      },
      {
        label: 'Hiçbir Şey Yapma ("Herkesin Rızkı Kendine")',
        outcomeText: 'Fiyata duyarlı müşterilerin bir kısmı bugün rakibe gitti.',
        effects: {
          trafficMultiplierDelta: -0.35
        }
      }
    ]
  },
  {
    id: 'derbi_maci',
    category: 'musteri_akisi',
    title: 'Mahallede Büyük Derbi Heyecanı!',
    icon: '⚽',
    description: 'Bu akşam büyük maç var. Kahveler ve sokak şimdiden формаlı taraftarlarla dolmaya başladı.',
    choices: [
      {
        label: 'Şişe Ekstra Et Tak ve "Taraftar Dürüm + Şalgam" Kampanyası Başlat (-1.200 ₺)',
        outcomeText: 'Taraftarlar maç öncesi dükkanın önünde kuyruk oluşturdu, satışlar patladı!',
        effects: {
          cashDelta: -1200,
          reputationDelta: 5,
          energyDelta: -15,
          trafficMultiplierDelta: 0.50
        }
      },
      {
        label: 'Normal Hazırlıkla Devam Et',
        outcomeText: 'Maç hareketliliği sayesinde yine de güzel müşteri geldi.',
        effects: {
          trafficMultiplierDelta: 0.20
        }
      }
    ]
  },

  // ESNAF, VERESİYE VE AİLE OLAYLARI
  {
    id: 'veresiye_hamdi',
    category: 'esnaf',
    title: 'Emekli Hamdi Abi Veresiye İstiyor',
    icon: '📓',
    description: 'Mahallenin eski sakinlerinden Hamdi Abi mahcup bir şekilde kasaya yanaştı: "Ustam maaşa 10 gün kaldı, torunlar döner çekti, 4 porsiyonu deftere yazsak olur mu?"',
    choices: [
      {
        label: 'Deftere Yaz ve Yanına Tatlı İkram Et ("Lafı mı olur Hamdi Abi!")',
        outcomeText: 'Hamdi Abi gözleri dolarak teşekkür etti. Mahallede esnaflığın övüldü, veresiye defterine 850 TL yazıldı.',
        effects: {
          reputationDelta: 5,
          trafficMultiplierDelta: 0.15,
          addVeresiye: {
            debtorName: 'Emekli Hamdi Abi',
            amount: 850,
            trustScore: 88,
            note: 'Emekli maaşı yatınca ödeyecek'
          }
        }
      },
      {
        label: 'Sadece Dönerleri Veresiye Yaz',
        outcomeText: 'Hamdi Abi teşekkür edip paketleri aldı. Veresiye defterine 650 TL eklendi.',
        effects: {
          reputationDelta: 2,
          addVeresiye: {
            debtorName: 'Emekli Hamdi Abi',
            amount: 650,
            trustScore: 85,
            note: 'Torunlara döner paketi'
          }
        }
      },
      {
        label: 'Kibarca Reddet ("Vallahi toptancıya ödemem var abi")',
        outcomeText: 'Hamdi Abi boynunu büküp çıktı. Gören komşular biraz soğuk baktı.',
        effects: {
          reputationDelta: -4,
          trafficMultiplierDelta: -0.10
        }
      }
    ]
  },
  {
    id: 'kacan_musteri',
    category: 'esnaf',
    title: 'Hesabı Ödemeden Kaçan Müşteri!',
    icon: '🏃',
    description: 'Kalabalık öğle servisinde iki porsiyon İskender ve künefe yiyen bir müşteri telefonla konuşuyormuş gibi yapıp sokağa doğru koşmaya başladı!',
    choices: [
      {
        label: 'Önlüğü Çıkarıp Peşinden Koş! (-18 Enerji)',
        outcomeText: 'Sokağın başında yakaladın! Cüzdanından hesabı kuruşu kuruşuna aldın, esnaf alkışladı.',
        effects: {
          cashDelta: 650,
          energyDelta: -18,
          reputationDelta: 3
        }
      },
      {
        label: 'Dükkanı Boş Bırakma, Tezgahtaki Müşterilerle İlgilen',
        outcomeText: 'Hesap kaçtı ama o sırada tezgahtaki diğer müşterilerin siparişi aksamadı.',
        effects: {
          cashDelta: -450
        }
      }
    ]
  },
  {
    id: 'aile_erken_gel',
    category: 'aile',
    title: 'Evden Telefon: "Bu Akşam Erken Gel"',
    icon: '🏠',
    description: 'Ailen aradı: "Günlerdir yüzünü sadece gece yarısı görüyoruz. Bu akşam dükkanı biraz erken bırakıp birlikte sıcak bir yemek yiyelim."',
    choices: [
      {
        label: 'Akşam Servisini Çırağa Bırakıp Ailene Koş',
        outcomeText: 'Akşam müşteri akışı biraz yavaşladı ama evdeki kahkahalar ve huzur her şeye değdi.',
        effects: {
          familyHappinessDelta: 15,
          energyDelta: 15,
          trafficMultiplierDelta: -0.20
        }
      },
      {
        label: 'Eve Sıcak İskender ve Künefe Paketi Gönderip Çalışmaya Devam Et (-600 ₺)',
        outcomeText: 'Gönüllerini biraz aldın, dükkanın başından da ayrılmamış oldun.',
        effects: {
          cashDelta: -600,
          familyHappinessDelta: 4
        }
      },
      {
        label: '"Ekmek Parası Peşindeyiz" Deyip Kapanışa Kadar Kal',
        outcomeText: 'Dükkan tam kapasite çalıştı ama evde suratlar asıldı.',
        effects: {
          familyHappinessDelta: -10,
          energyDelta: -10
        }
      }
    ]
  },
  {
    id: 'enflasyon_dalgasi',
    category: 'ekonomi',
    title: 'Toptan Et, Un ve Enerji Fiyatlarına Zam!',
    icon: '📈',
    description: 'Piyasalardaki maliyet artışı nedeniyle toptancılar fiyat listesini güncelledi. Menü fiyatlarını ve sokağın alım gücünü dengelemen gerekiyor.',
    choices: [
      {
        label: 'Fiyatları Hemen Yansıtmak Üzere Menü Sekmesini Kontrol Et',
        outcomeText: 'Enflasyon endeksi yükseldi. Menü sekmesinden mahallenin sosyal çevresine uygun fiyat ayarlaması yapabilirsin.',
        effects: {
          inflationDelta: 0.04
        }
      }
    ]
  },

  // FAZ 6: ZİNCİR, ŞUBE VE MARKA KRİZ OLAY KARTLARI
  {
    id: 'zincir_bakanlik_teftisi',
    category: 'hijyen',
    title: 'Tarım ve Gıda Bakanlığı Zincir Genelinde Eşzamanlı Denetim Başlattı!',
    icon: '🔬',
    description: 'Bakanlık müfettişleri şubelerinizden et, sos ve kızartma yağı numuneleri alıyor. Tüm Türkiye basını denetim sonuçlarını bekliyor!',
    choices: [
      {
        label: 'Bağımsız Gıda Laboratuvarı Tut ve Tüm Şubeleri Dezenfekte Et (-3.200 ₺)',
        outcomeText: 'Numuneler %100 dana ve taze tavuk çıktı! Ulusal basında "Örnek Döner Zinciri" olarak haber oldunuz.',
        effects: {
          cashDelta: -3200,
          hygieneDelta: 22,
          reputationDelta: 9,
          trafficMultiplierDelta: 0.30
        }
      },
      {
        label: 'Şube Müdürlerine Güven ve Rutin Belgeleri Sun',
        outcomeText: 'Denetim sorunsuz geçti, müşterilerin markaya güveni tazelendi.',
        effects: {
          hygieneDelta: 6,
          reputationDelta: 3
        }
      }
    ]
  },
  {
    id: 'zincir_kurye_personel_grevi',
    category: 'esnaf',
    title: 'Şube Ustaları ve Paket Kuryeleri Prim & Maaş İyileştirmesi İstiyor!',
    icon: '✊',
    description: 'Artan hayat pahalılığı sonrası şubelerdeki ustalar ve kuryeler öğle servisi öncesi iş yavaşlatma eylemi yaptı.',
    choices: [
      {
        label: 'Tüm Kadroya Bayram İkramiyesi ve Sıcak Yemek Primi Dağıt (-2.800 ₺)',
        outcomeText: 'Personel alkışlarla ocağın başına döndü! Servis hızı ve güler yüz müşterileri mest etti.',
        effects: {
          cashDelta: -2800,
          reputationDelta: 6,
          trafficMultiplierDelta: 0.22
        }
      },
      {
        label: 'Sadece Performansı Yüksek Ustalara Zam Sözü Ver (-1.100 ₺)',
        outcomeText: 'Eylem sona erdi, servis normal seyrine döndü.',
        effects: {
          cashDelta: -1100,
          reputationDelta: 1
        }
      },
      {
        label: 'Talebi Reddet ("Beğenmeyen Önlüğü Bıraksın")',
        outcomeText: 'Bazı kuryeler işi bıraktı, siparişler gecikti ve müşteri şikayetleri arttı.',
        effects: {
          reputationDelta: -7,
          trafficMultiplierDelta: -0.28
        }
      }
    ]
  },
  {
    id: 'zincir_avm_kira_artisi',
    category: 'ekonomi',
    title: 'Dükkan Mülk Sahiplerinden Ek Kira ve Hava Parası Baskısı!',
    icon: '🏢',
    description: 'Merkezi caddedeki mülk sahipleri dönercinin önündeki kuyruğu görünce kira kontratını yenilemek için ek ödeme talep etti.',
    choices: [
      {
        label: 'Emlakçı Murat ve Avukatla Masaya Oturup Peşin Uzlaş (-2.400 ₺)',
        outcomeText: 'Kontrat 5 yıl uzatıldı, tabela ve vitrin yenilendi.',
        effects: {
          cashDelta: -2400,
          reputationDelta: 4
        }
      },
      {
        label: 'Mahalle Esnaf Odasını Devreye Sok (-12 Enerji)',
        outcomeText: 'Esnaf odası araya girdi, makul bir artışla tatlıya bağlandı.',
        effects: {
          energyDelta: -12,
          cashDelta: -950
        }
      }
    ]
  },
  {
    id: 'zincir_ulusal_gurme_haberi',
    category: 'musteri_akisi',
    title: 'Ünlü Gastronomi Kanalı ve Gazete Gurmesi Şubene Geldi!',
    icon: '📺',
    description: 'Türkiye’nin en çok izlenen sokak lezzetleri programı kamerasıyla ocağın önüne geldi. Tüm ülke senin yaprak döner kesimini izleyecek!',
    choices: [
      {
        label: 'Özel Tereyağlı İskender, Soslu Dürüm ve Künefe Şovu Yap (-1.600 ₺)',
        outcomeText: 'Video 2 milyon izlendi! "Türkiye’nin En İyi Döner Ustası" başlığıyla viral oldun, kapıda kuyruk oluştu!',
        effects: {
          cashDelta: -1600,
          reputationDelta: 10,
          trafficMultiplierDelta: 0.45
        }
      },
      {
        label: 'Doğal Esnaf Samimiyetiyle Klasik Dürüm İkram Et (-500 ₺)',
        outcomeText: 'Samimi sohbetin çok sevildi, mahalle ve şehir itibarın yükseldi.',
        effects: {
          cashDelta: -500,
          reputationDelta: 5,
          trafficMultiplierDelta: 0.20
        }
      }
    ]
  }
];


export const SPECIAL_CALENDAR_DAYS = {
  7:  { name: 'Mahalle Pazarı Günü', demandMultiplier: 1.25, description: 'Pazar alışverişine çıkan aileler ve esnaf dönerciye uğrar.' },
  15: { name: 'Maaş Günü & Çarşı Hareketliliği', demandMultiplier: 1.35, description: 'Maaşlar yattı! Porsiyon ve İskender siparişleri artar.' },
  22: { name: 'Hafta Sonu Maç Günü', demandMultiplier: 1.30, description: 'Öğrenci ve işçi müşteriler dürüm ve paket servise yüklenir.' },
  30: { name: 'Ay Sonu & Enflasyon Hesap Günü', demandMultiplier: 1.20, description: 'Aylık enflasyon güncellenir, ev kirası ve maaşlar ödenir.' }
};

export const REVIEW_TEMPLATES = {
  positive: [
    'Ustanın eli çok bol, tavuk dürümün sosu efsane! Mahallenin bir numarası.',
    'Yaprak döner gerçek etten, sinir yok kıyma yok. Yanındaki köpüklü ayran şahane.',
    'Ailecek İskender yedik, tereyağı cızır cızır geldi. Tertemiz esnaf lokantası.',
    'Mahallenin bütçesine uygun fiyatlar, sıcacık lavaş. Tek kurtarıcımız!'
  ],
  neutral: [
    'Lezzet güzel ama öğle saatinde biraz sıra bekledik, bir usta daha lazım.',
    'Döner lezzetliydi fakat fiyatlar geçen aya göre biraz artmış, enflasyon malum.',
    'Porsiyon doyurucu, salon biraz daha genişletilebilir.'
  ],
  negative: [
    'Fiyatlar bizim mahallenin bütçesine göre fazla pahalı kalmış!',
    'Masalar biraz geç siliniyor, hijyene ve havalandırmaya daha çok dikkat edilmeli.',
    'Çok sıra bekledik, istediğimiz menü kalmamış dediler.'
  ]
};
