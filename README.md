# 🌯 Dönerci Usta – Web Tabanlı Döner Dükkanı & Mahalle Esnafı Simülasyonu

**Dönerci Usta**, Türkiye'de küçük bir mahallede sıfırdan döner dükkanı kurup büyüttüğünüz, ailenizi geçindirdiğiniz, komşu esnafla ilişkiler ve ortaklıklar kurduğunuz, dinamik enflasyon ekonomisinde fiyat ve stok yönettiğiniz zengin 2.5D/2D görsel destekli bir işletme simülasyonudur.

---

## 🚀 Nasıl Çalıştırılır?

Projeyi iki farklı yöntemle çalıştırabilirsiniz:

### Yöntem 1: Python Geliştirme Sunucusu ile (Sıfır Kurulum - Hemen Çalışır)
Bilgisayarınızda Node.js kurulu olmasa bile doğrudan Python 3 ile TypeScript dosyalarını anında derleyip sunan dahili sunucuyu başlatabilirsiniz:
```powershell
cd C:\Users\mutlu\.gemini\antigravity\scratch\donerci-usta
python dev_server.py
```
Ardından tarayıcınızda **`http://localhost:5173`** adresini açın.

### Yöntem 2: Vite + TypeScript ile (Node.js Kuruluysa)
```powershell
cd C:\Users\mutlu\.gemini\antigravity\scratch\donerci-usta
npm install
npm run dev
```

---

## 🎮 Özellikler ve Tamamlanan Milestone'lar

1. **Milestone 1 – Çekirdek Simülasyon, Karakter/Aile Kurulumu & Kayıt Sistemi**
   - İsim, yaş (18-55), cinsiyet, şehir, mahalle tipi (Öğrenci Mahallesi, Sanayi Girişi, Köklü Aile Semti, Turistik Merkez), aile durumu (Bekar, Evli, Evli ve Çocuklu, Anne-Baba Bakımlı) ve 4 farklı başlangıç senaryosu.
   - 1x / 2x / 4x / Duraklat hız kontrollü zaman döngüsü (Sabah Hazırlık → Açılış → Öğle Yoğunluğu → Akşam Servisi → Kapanış Z Raporu).
   - `localStorage` tabanlı otomatik kayıt + 3 adet manuel kayıt slotu.
2. **Milestone 2 – 2.5D Üstten Açılı Dükkan Görünümü & Grid Dekorasyon**
   - HTML5 Canvas üzerinde çalışan **Üstten Açılı 2.5D (Top-Down RPG)** dükkan içi görünümü.
   - Dönen döner şişi, radyan ateşi, usta ve personel animasyonları, kapıdan girip masalara oturan müşteriler ve konuşma/memnuniyet balonları.
   - Grid üzerine tıklayarak 15 farklı eşya yerleştirme, taşıma, ikinci el satma, duvar/zemin stili değiştirme, **8x6 Alan Genişletme**, **Belediye Kaldırım Masa İzni** ve **2. Kat Aile Salonu (10x7)**.
3. **Milestone 3 – Dinamik Enflasyon, Serbest Menü Fiyatlandırması, Depo & Personel**
   - Günümüz Türkiye ekonomisi ölçeğinde **dinamik enflasyon endeksi**.
   - Her menü ürünü için anlık malzeme maliyeti, **Enflasyona Göre Önerilen Piyasa Fiyatı**, kâr marjı göstergesi, serbest fiyat girişi ve porsiyon gramaj ayarı (`0.8x Az`, `1.0x Tam`, `1.25x Bol Kepçe`).
   - 3 tedarikçi kalitesi (Ucuz/Spot, Standart, Özel Çiftlik), SKT/bozulma takibi.
   - Usta, Kasiyer, Komi ve Kurye işe alımı, eğitimi ve **Online Sipariş Platformu ("DönerSepeti")** ortaklığı.
4. **Milestone 4 – Aile Ekonomisi, Yaşlanma, Nesiller Arası Devir & Veresiye Defteri**
   - İş vs Aile zaman dengesi, aylık ev kirası ve aile giderleri.
   - Yıllar geçtikçe büyüyen çocukların 16 yaşında dükkanda yardıma başlaması ve 18 yaşında **ustabaşılığı devralması (2. Kuşak Miras)**.
   - Günlük rastgele esnaf/aile/mahalle olay kartları ve **Veresiye Defteri** (Tahsil et / Helal et).
5. **Milestone 5 – 2D Yandan Görünüm Mahalle Sokağı & Esnaf NPC İlişkileri**
   - Gündüz/akşam/gece atmosferli 2D mahalle sokağı.
   - Kasap Hasan, Fırıncı Ayşe Abla, Çaycı Rıza Amca, Manav Cevdet, Emlakçı Murat, Barista Berkay ve Rakip Şahin Usta ile seçenekli diyaloglar ve %18-%20 tedarik indirim anlaşmaları.
6. **Milestone 6 – Yatırım, Komşu Dükkan Ortaklıkları, Grafikler & Başarımlar**
   - Komşu esnaf dükkanlarına %10-%50 arası ortak olup günlük kâr payı alma.
   - Gram Altın, Döviz Sepeti, Vadeli Mevduat, Kurye Motoru, Catering Minibüsü ve **2. Şube ("Dönerci Usta Express")** yatırımları.
   - Gelir-Gider-Net Kâr çizgi grafiği, Servet Dağılım pasta grafiği, müşteri yorumları, 7 esnaf başarımı ve Hayat Özeti.

---

## 🛠️ Veri Odaklı Genişletilebilir Mimari

Yeni bir eşya, yemek tarifi, NPC veya rastgele olay eklemek için kod değiştirmenize gerek yoktur; `src/data/` altındaki ilgili veri dosyasına (`furniture.ts`, `recipes.ts`, `npcs.ts`, `events.ts`) yeni bir satır/obje eklemeniz yeterlidir.
