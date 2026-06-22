# QuestFit

Next-Gen Gamified Fitness, Diet, and Wellness Consistency Companion

[English Description](#english) | [Türkçe Açıklama](#turkish)

---

<a name="english"></a>
## English Description

QuestFit is an advanced, gamified health, nutrition, and fitness mobile application built on top of React Native (Expo). It bridges the gap between traditional fitness diaries and modern habit-building mechanics to make healthy living engaging, rewarding, and consistent. Supported by state-of-the-art Generative AI (Groq), QuestFit acts as a virtual fitness coach and daily consistency tracker.

### Key Features
- **Consistency Level & Progress System:** Earn progress points by logging meals within your macronutrient targets, completing workouts, and maintaining hydration. Level up to build consistent fitness habits.
- **Daily Quests Pool:** Every midnight, the system rolls 4 unique daily quests from a pool of 30+ fitness, diet, and wellness challenges.
- **Streak Trackers:** Dual streak trackers (Activity Streaks and Step Streaks) reward consistency with progress multipliers.
- **AI-Powered Nutrition:** Search foods dynamically. If an item is missing in the database cache, Groq AI (Llama 3.3 70B) calculates its calories and macronutrient ratios per portion or unit size.
- **AI Workout Generator:** Generates personalized, equipment-aware, and environment-aware workout routines tailored to your target muscles, location (Gym or Home), and physical stats.
- **Muscle Fatigue Heatmap:** A fatigue tracker that analyzes your training history and calculates muscle recovery based on your body type. Lighter/recovery workouts are dynamically suggested for fatigued muscle groups.

### Architecture & Tech Stack
- **Framework:** React Native / Expo with Continuous Native Generation (CNG).
- **State Management:** Zustand configured with AsyncStorage persistence for a robust offline-first experience.
- **Database & Cache:** Cloud Firestore caches AI food and exercise lookup models (e.g., v2_ collections) to limit API usage, speed up user queries, and synchronize profile data across multiple devices.
- **Physical Tracking:** Integrates expo-sensors for background step tracking utilizing physical hardware pedometer sensors.
- **Localization:** Full English and Turkish support managed via i18next.
- **Aesthetic:** Minimalist flat UI design supporting both Light and Dark modes.

---

<a name="turkish"></a>
## Türkçe Açıklama

QuestFit, React Native (Expo) altyapısı üzerine inşa edilmiş; klasik spor ve diyet takibini modern alışkanlık kazanma dinamikleriyle birleştiren yenilikçi bir sağlık, beslenme ve fitness mobil uygulamasıdır. Sağlıklı yaşamı düzenli ve sürdürülebilir bir rutine çevirerek sağlıklı alışkanlıklar edinmenizi sağlar. Gücünü Generative AI (Groq) teknolojilerinden alan QuestFit; hem kişisel spor antrenörünüz hem de günlük istikrar takipçiniz olarak görev yapar.

### Temel Özellikler
- **İstikrar Seviyesi ve İlerleme Sistemi:** Günlük makro hedeflerinizi tutturarak, antrenmanları tamamlayarak ve su içerek ilerleme puanları kazanın. Düzenli sağlıklı yaşam alışkanlıkları oluşturmak için seviyenizi yükseltin.
- **Günlük Görev Havuzu:** Her gece yarısı, 30+ farklı görevden oluşan bir havuzdan rastgele 4 adet günlük görev atanır ve hedefler sıfırlanır.
- **Seri (Streak) Takipçileri:** Aktiflik ve Adım serileri ile düzenli alışkanlıklarınızı gelişim puanı çarpanlarıyla ödüllendirin.
- **Yapay Zeka Destekli Beslenme:** Arama çubuğunda bulamadığınız besinleri Groq AI (Llama 3.3 70B) sizin için porsiyon/adet bazında analiz eder, kalorilerini ve makrolarını hesaplayıp Firestore'a kaydeder.
- **AI Antrenman Oluşturucu:** Sahip olduğunuz ekipmanlara, antrenman yapmak istediğiniz yere (Ev veya Spor Salonu) ve fiziksel durumunuza özel kişiselleştirilmiş programlar hazırlar.
- **Kas Yorgunluğu Isı Haritası:** Geçmiş antrenmanlarınızı ve egzersiz türlerini analiz ederek 5 ana kas grubunun (Göğüs, Sırt, Bacak, Kollar, Karın) yorgunluğunu hesaplar ve aşırı antrenmanı (overtraining) engeller.

### Mimari ve Teknolojik Altyapı
- **Framework:** React Native / Expo altyapısı ve Continuous Native Generation (CNG) desteği.
- **Durum Yönetimi (State):** Zustand ve AsyncStorage entegrasyonuyla çevrimdışı öncelikli (offline-first) hızlı veri akışı.
- **Veritabanı & Bulut:** Firebase Firestore üzerinden anlık profil eşleştirme ve AI tarafından üretilen besinlerin (v2_ koleksiyonu) sunucu tarafında önbelleğe alınması.
- **Donanım Entegrasyonu:** expo-sensors aracılığıyla arka planda çalışan hassas fiziksel pedometre (adımsayar) entegrasyonu.
- **Yerelleştirme (Localization):** i18next altyapısı ile tamamen çift dilli (İngilizce & Türkçe) arayüz ve görev yapısı.
- **Arayüz Tasarımı:** Hem Açık (Light) hem de Karanlık (Dark) modları destekleyen minimalist düz tasarım sistemi.

---

## Getting Started / Kurulum ve Başlangıç

### Prerequisites / Gereksinimler
- Node.js (v18 or higher)
- Java 17 Development Kit (Required for local Android compilation due to Expo CNG setups)
- Expo Go app on your phone or configured Android/iOS Emulator

### Installation Steps / Kurulum Adımları

1. **Clone the repository / Projeyi Klonlayın:**
   ```bash
   git clone https://github.com/mertmnvv/questfit.git
   cd questfit
   ```

2. **Install dependencies / Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables / Çevre Değişkenlerini Ayarlayın:**
   Create a `.env` file in the root directory and add your API keys:
   ```env
   EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key
   EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Run Locally / Yerelde Çalıştırın:**
   - **For Expo Go / Expo Go ile Başlatmak İçin:**
     ```bash
     npm run start
     ```
   - **For Native Android Compilation / Android Geliştirme Derlemesi İçin:**
     Ensure `$env:JAVA_HOME` points to Java 17 and run:
     ```bash
     npm run android
     ```

---

## License / Lisans
Distributed under the MIT License. See `LICENSE` for more information.
