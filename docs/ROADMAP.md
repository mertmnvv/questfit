# QuestFit Community Features Roadmap

Bu belge, QuestFit uygulamasının topluluk paneli (Community Screen) için eklenecek olan yeni özelliklerin planlamasını ve çalışma mantığını içerir. İki ana özellik harmanlanarak entegre edilecektir: **Başarı/Level Paylaşımları** ve **Kopyalanabilir Antrenmanlar**.

## 1. Veritabanı (Firebase) ve Veri Modeli Güncellemeleri
Mevcut `communityPosts` koleksiyonuna yeni gönderi tipleri eklenecek.
*   **Mevcut Tip:** `type: "image"` veya `type: "text"`
*   **Yeni Tipler:** `type: "achievement"` ve `type: "workout_share"`

### Achievement (Başarım) Modeli Örneği
```json
{
  "type": "achievement",
  "achievementType": "level_up", // "streak", "quest_completed", "level_up"
  "title": "Seviye Atladı!",
  "description": "Seviye 5'e ulaştı ve yeni bir unvan kazandı.",
  "metadata": {
    "level": 5,
    "xpGained": 500,
    "badgeIcon": "star-circle"
  }
}
```

### Workout Share (Antrenman Paylaşımı) Modeli Örneği
```json
{
  "type": "workout_share",
  "title": "Üst Vücut Patlatma Programı",
  "description": "Yapay zekanın bana yazdığı harika omuz ve göğüs rutini!",
  "workoutData": {
    "name": "Upper Body Pump",
    "burnedCalories": 450,
    "exercises": [
      { "name": "Bench Press", "sets": 3, "reps": 12 },
      { "name": "Shoulder Press", "sets": 3, "reps": 10 }
    ]
  }
}
```

## 2. Arayüz (UI) Geliştirmeleri (`CommunityScreen.js`)

### A. Başarım (Achievement) Kartı UI
*   Normal gönderilerin aksine, etrafında renkli ve parlayan bir border (glow effect) olacak.
*   İçerisinde sadece metin değil, başarıma özel büyük ve renkli ikonlar (veya 3D emojiler) bulunacak.
*   Örn: "30 Günlük Seri" için alev ikonu etrafında dönen bir çember animasyonu.

### B. Antrenman Paylaşım (Workout Share) Kartı UI
*   Gönderinin orta kısmında, antrenmanın kaç hareketten oluştuğunu ve kaç kalori yaktıracağını gösteren özet bir bilgi kutusu olacak.
*   Alt kısımda büyük ve belirgin bir buton: **"Bu Programı Kaydet" (Save this Routine)**
*   Butona basıldığında `workoutData` içeriği `userStore.js` içindeki `saveCustomRoutine` fonksiyonuna gönderilerek doğrudan kullanıcının profiline kopyalanacak.

## 3. Otomasyon ve Tetikleyiciler (Triggers)

### Başarım Otomasyonu
1.  `userStore.js` içindeki `addXp` fonksiyonunda level atlama gerçekleştiğinde, kullanıcıya bir pop-up gösterilecek: "Bu başarını toplulukla paylaşmak ister misin?"
2.  Kullanıcı "Evet" derse, arka planda otomatik olarak `createPost` fonksiyonu `type: "achievement"` ile çağrılacak.
3.  Aynı mantık `checkDailyReset` içindeki Streak (seri) 7, 14, 30. günlere ulaştığında da devreye girecek.

### Antrenman Paylaşım Otomasyonu
1.  `WorkoutsScreen.js` (veya yapay zeka antrenman üretim ekranı) içerisindeki oluşturulan her özel veya AI antrenmanın yanına bir **"Toplulukta Paylaş"** butonu konulacak.
2.  Butona tıklandığında, rutin JSON formatında `CommunityScreen` servisine gönderilip `type: "workout_share"` olarak akışa eklenecek.

## 4. Faz ve Önceliklendirme
*   **Faz 1:** Firebase gönderi şemalarının (`workout_share` ve `achievement`) ayarlanması ve `CommunityScreen.js` içinde bu tipleri destekleyecek render bloklarının (UI) kodlanması.
*   **Faz 2:** "Bu Programı Kaydet" butonunun işlevselleştirilip `userStore`'a bağlanması.
*   **Faz 3:** Level ve Streak otomasyonlarının `userStore.js` tetikleyicilerine (trigger) eklenmesi.
*   **Faz 4:** Görsel efektlerin (Parlamalar, özel ikonlar, animasyonlar) eklenmesi.
