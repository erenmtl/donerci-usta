// ============================================================================
// SOKAK GÖRÜNÜMÜ BİNALARI VE ESNAF NPC VERİLERİ
// ============================================================================


export const STREET_NPCS = [
  {
    id: 'kasap_hasan',
    name: 'Kasap Hasan Abi',
    shopName: 'Öz Güven Kasabı',
    shopType: 'Kasap',
    icon: '🥩',
    buildingColor: '#7f2424',
    signColor: '#ef5350',
    personality: 'Babacan, dobra, veresiyeden hoşlanmaz ama dürüst esnafı kollar.',
    backstory: '35 yıldır aynı tezgâhta satır sallıyor. Trakya ve Balıkesir besicilerini bizzat tanır.',
    canPartner: true,
    partnerBaseValuation: 160000,
    dailyDividendBase: 2200,
    dealOffer: {
      minRelation: 70,
      title: 'Toptan Yaprak & Tavuk Eti İndirimi (%18)',
      description: 'Kasap Hasan Abi sana özel et ve tavuk tedarikinde %18 esnaf indirimi yapar.',
      effectKey: 'meat_discount_18'
    },
    dialogues: [
      {
        greeting: 'Bereketli olsun komşu! Senin dönerin kokusu yine bütün sokağı sardı.',
        options: [
          {
            text: 'Sağ ol Hasan Abi, gel bir çayımı iç, etlerin terbiyesini konuşalım.',
            relationDelta: 8,
            energyCost: 6,
            reply: 'Eyvallah usta! Bak sana söyleyeyim, sinirini iyi ayıklarsan senin dönerin üstüne kimse çıkamaz.'
          },
          {
            text: 'Hasan Abi, bu et fiyatlarına yine zam gelmiş, bize bir güzellik yapamaz mısın?',
            relationDelta: 4,
            reply: 'Vallahi yem fiyatları uçtu komşu. Ama aramız iyi oldukça seni ezdirmem, sözüm söz.',
            specialAction: 'activate_deal'
          },
          {
            text: 'Senin kasap dükkanını büyütmeyi düşünüyor musun? Ortaklık konuşalım.',
            relationDelta: 3,
            reply: 'Soğuk hava deposunu yenilemek istiyorum. Sermaye koyarsan kârı hakça bölüşürüz.',
            specialAction: 'partner_info'
          }
        ]
      }
    ]
  },
  {
    id: 'firinci_ayse',
    name: 'Fırıncı Ayşe Abla',
    shopName: 'Bereket Taş Fırını',
    shopType: 'Fırın',
    icon: '🥖',
    buildingColor: '#8d5524',
    signColor: '#ffb74d',
    personality: 'Çalışkan, sabah 4’te fırını açar, mahallenin ablasıdır.',
    backstory: 'Eşiyle kurduğu taş fırını yıllardır tek başına çekip çeviriyor. Tombik pidesi ve lavaşı meşhurdur.',
    canPartner: true,
    partnerBaseValuation: 130000,
    dailyDividendBase: 1750,
    dealOffer: {
      minRelation: 65,
      title: 'Sıcak Lavaş & Tombik Ekmek Anlaşması (%20 İndirim)',
      description: 'Lavaş ve ekmek maliyetin %20 düşer, tazelik süresi +2 gün uzar.',
      effectKey: 'bread_discount_20'
    },
    dialogues: [
      {
        greeting: 'Hoş geldin ustam! Fırından yeni susamlı tombik çıkardım, dumanı üstünde.',
        options: [
          {
            text: 'Ellerine sağlık Ayşe Abla, senin pideler olmasa bizim döner yarım kalır.',
            relationDelta: 9,
            energyCost: 5,
            reply: 'Estağfurullah komşum, o senin elinin lezzeti! Sabah ilk tepsiyi hep senin dükkana ayırıyorum.'
          },
          {
            text: 'Ayşe Abla, günlük düzenli lavaş-pide anlaşması yapalım mı?',
            relationDelta: 5,
            reply: 'Sen yeter ki iste! Aramızdaki güven tamamsa sana fırın geliş fiyatından veririm.',
            specialAction: 'activate_deal'
          }
        ]
      }
    ]
  },
  {
    id: 'cayci_riza',
    name: 'Çaycı Rıza Amca',
    shopName: 'Çınaraltı Çay Ocağı',
    shopType: 'Çay Ocağı',
    icon: '☕',
    buildingColor: '#2e5736',
    signColor: '#81c784',
    personality: 'Mahallenin haber ajansı. Kimin borcu var, zabıta ne zaman gelecek her şeyi bilir.',
    backstory: 'Emekli olduktan sonra çay ocağını açtı. Bütün esnafa askısıyla çay dağıtır.',
    canPartner: true,
    partnerBaseValuation: 75000,
    dailyDividendBase: 1100,
    dealOffer: {
      minRelation: 60,
      title: 'Mahalle İstihbaratı & Müşteri Yönlendirme',
      description: 'Rıza Amca çay içmeye gelenleri senin dükkana yönlendirir (+8 İtibar ve denetim uyarısı).',
      effectKey: 'tea_intel_boost'
    },
    dialogues: [
      {
        greeting: 'Gel bakalım dönerlerin sultanı! Tavşan kanı çayım yeni demlendi.',
        options: [
          {
            text: 'Bütün esnafa benden çay dağıt Rıza Amca! (250 TL)',
            relationDelta: 14,
            cashCost: 250,
            reply: 'Hay yaşa be! Esnaf dediğin eli açık olur, bütün çarşı senin hayrına içiyor şimdi.'
          },
          {
            text: 'Mahallede ne var ne yok Rıza Amca? Kulağına bir şey çalındı mı?',
            relationDelta: 6,
            energyCost: 5,
            reply: 'Belediye zabıtası bu hafta hijyen denetimine çıkacakmış diyorlar. Bir de altın fiyatları hareketli!',
            specialAction: 'gossip'
          },
          {
            text: 'Rıza Amca senin çayları bizim müşterilere de ikram edelim, ortak çalışalım.',
            relationDelta: 5,
            reply: 'Başım üstüne! Yemek üstü çayı benden içen müşteriye senin döneri överim.',
            specialAction: 'activate_deal'
          }
        ]
      }
    ]
  },
  {
    id: 'manav_cevdet',
    name: 'Manav Cevdet',
    shopName: 'Yeşilova Manavı',
    shopType: 'Manav',
    icon: '🍅',
    buildingColor: '#33691e',
    signColor: '#aed581',
    personality: 'Biraz tez canlı, sabah halden en iyi domatesi ve patatesi seçer.',
    backstory: 'Babası da hallerde komisyoncuydu. Salkım domatesin ve kızartmalık Afyon patatesinin ustasıdır.',
    canPartner: true,
    partnerBaseValuation: 95000,
    dailyDividendBase: 1350,
    dealOffer: {
      minRelation: 65,
      title: 'Hal Fiyatına Sebze & Patates (%20 İndirim)',
      description: 'Sebze garnitür ve patates alımlarında %20 indirim sağlar.',
      effectKey: 'veggie_discount_20'
    },
    dialogues: [
      {
        greeting: 'Ustam bak bu domatesler tarladan bu sabah geldi, dönerin içinde lokum gibi erir!',
        options: [
          {
            text: 'Senin seçtiğin mal hiç çürük çıkmaz Cevdet, hal işini biliyorsun.',
            relationDelta: 8,
            energyCost: 5,
            reply: 'Eyvallah ustam! Esnaf esnafın aynasıdır, sana kötü domates verirsem benim adım kirlenir.'
          },
          {
            text: 'Cevdet, sebze ve patateste haftalık sabit anlaşma yapalım mı?',
            relationDelta: 4,
            reply: 'Halden kendi kasamla senin kasayı bir getiririm, nakliyeden düşeriz!',
            specialAction: 'activate_deal'
          }
        ]
      }
    ]
  },
  {
    id: 'emlakci_murat',
    name: 'Emlakçı Murat Bey',
    shopName: 'Kral Emlak & Yatırım',
    shopType: 'Emlakçı',
    icon: '🏢',
    buildingColor: '#1a4367',
    signColor: '#4fc3f7',
    personality: 'Kurnaz, ağzı iyi laf yapar, mahalledeki her kiralık/satılık mülkü takip eder.',
    backstory: 'Mahalledeki kentsel dönüşüm ve dükkan devirlerinden komisyon alarak büyüdü.',
    canPartner: false,
    partnerBaseValuation: 200000,
    dailyDividendBase: 2500,
    dealOffer: {
      minRelation: 70,
      title: 'Gayrimenkul & Yan Şube İndirimi (%15)',
      description: 'Dükkan büyütme, yeni şube açma ve emlak yatırımlarında %15 komisyon indirimi sağlar.',
      effectKey: 'realestate_discount_15'
    },
    dialogues: [
      {
        greeting: 'Ooo mahallemizin parlayan yıldızı! İşler tıkırında bakıyorum, kasalar doluyor.',
        options: [
          {
            text: 'Şükür Murat Bey, gel bugün öğlen sana özel tereyağlı İskender ikram edeyim.',
            relationDelta: 10,
            cashCost: 150,
            reply: 'İşte vizyoner esnaf! Senin İskender’e hayır denmez, kelepir dükkan düşerse ilk sana haber vereceğim.'
          },
          {
            text: 'Murat Bey, dükkanı büyütmek veya yan sokağa şube açmak için fırsat var mı?',
            relationDelta: 5,
            reply: 'Elimde çok güzel portföyler var. Dostluğumuz pekişirse komisyonda sana büyük kıyak geçerim.',
            specialAction: 'activate_deal'
          }
        ]
      }
    ]
  },
  {
    id: 'kafe_berkay',
    name: 'Barista Berkay',
    shopName: 'Üçüncü Nesil Roast Cafe',
    shopType: 'Kafe',
    icon: '🧋',
    buildingColor: '#4a354f',
    signColor: '#ce93d8',
    personality: 'Sosyal medya kurdu, gençlerle arası çok iyi, influencer tanıdıkları var.',
    backstory: 'Üniversiteden mezun olunca mahallede modern bir kahveci açtı.',
    canPartner: true,
    partnerBaseValuation: 145000,
    dailyDividendBase: 1950,
    dealOffer: {
      minRelation: 65,
      title: 'Sosyal Medya & Influencer Tanıtımı',
      description: 'Berkay gençleri ve gurme bloggerları dükkanına yönlendirir (Öğrenci & Turist akışı +%15).',
      effectKey: 'social_media_boost'
    },
    dialogues: [
      {
        greeting: 'Selam Usta! Dün senin tavuk dürümden yedim, story attım 500 kişi sordu valla!',
        options: [
          {
            text: 'Eyvallah Berkay! Gençlerin dilinden sen anlıyorsun, bize de sosyal medyayı öğret.',
            relationDelta: 9,
            energyCost: 5,
            reply: 'Ne demek usta! Döner keserken bir Reels çekeriz, bütün şehir senin dükkanı konuşur.'
          },
          {
            text: 'Menü sonrası kahve-döner çapraz kampanyası yapalım mı?',
            relationDelta: 5,
            reply: 'Harika fikir! Senin fişle gelene kahve indirimli, benim müşteriye senin döner önerili!',
            specialAction: 'activate_deal'
          }
        ]
      }
    ]
  },
  {
    id: 'rakip_sahin',
    name: 'Rakip Şahin Usta',
    shopName: 'Şahin Mega Döner',
    shopType: 'Rakip Dönerci',
    icon: '⚔️',
    buildingColor: '#5c1919',
    signColor: '#ff5252',
    personality: 'Hırslı, fiyat kırarak müşteri çalmaya çalışır ama saygı duyarsa centilmence yarışır.',
    backstory: 'Sokağın diğer ucunda kampanyalı döner satıyor. İlişkin çok düşerse fiyat savaşı başlatır.',
    canPartner: true,
    partnerBaseValuation: 210000,
    dailyDividendBase: 2800,
    dealOffer: {
      minRelation: 75,
      title: 'Esnaf Centilmenlik Anlaşması (Fiyat Savaşı Biter)',
      description: 'Şahin Usta fiyat kırmayı bırakır, yoğun günlerde taşan müşterileri birbirinize paslarsınız.',
      effectKey: 'rival_truce'
    },
    dialogues: [
      {
        greeting: 'Bakıyorum yine kapının önünde kuyruk yapmaya çalışıyorsun komşu...',
        options: [
          {
            text: 'Rızkı veren Allah Şahin Usta, bu sokakta ikimize de ekmek var. Gel çay içelim.',
            relationDelta: 10,
            energyCost: 6,
            reply: 'Doğru dedin usta... Ucuz etle fiyat kırmaktan ben de yoruldum, kaliteyle yarışalım.'
          },
          {
            text: 'Fiyat kırmayı bırakıp mahallede ortak taban fiyat belirleyelim.',
            relationDelta: 5,
            reply: 'Bak bu aklıma yattı. Aramızdaki güven tamamsa birbirimizin ayağına basmayalım.',
            specialAction: 'activate_deal'
          }
        ]
      }
    ]
  }
];
