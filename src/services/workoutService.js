import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

/**
 * Antrenman/Egzersiz sorgusu yapar. Önce Firestore'a bakar.
 * Eğer yoksa Groq AI ile yaktığı kaloriyi tahmin edip veritabanına kaydeder.
 */
export const searchWorkout = async (query, weightKg = 75) => {
  if (!query) return [];
  const normalizedQuery = query.toLowerCase().trim();

  try {
    // 1. ADIM: FIRESTORE CACHE KONTROLÜ
    const workoutDocRef = doc(db, 'workouts', normalizedQuery);
    const workoutDocSnap = await getDoc(workoutDocRef);

    if (workoutDocSnap.exists()) {
      const docData = workoutDocSnap.data();
      if (docData.results && Array.isArray(docData.results)) {
        console.log('Antrenman Firestore Cache üzerinden getirildi!');
        // Kaloriyi kullanıcının kilosuna göre oranla (veritabanındaki referans kilo ile)
        // Eğer daha önce 75 kg için 300 kcal kaydedildiyse, 90kg birisi için (90/75) * 300 yapar.
        return docData.results.map(item => ({
          ...item,
          burnedCalories: Math.round(item.burnedCalories * (weightKg / (item.referenceWeight || 75))),
        }));
      }
    }

    // 2. ADIM: GROQ API İLE YAPAY ZEKA SORGUSU
    console.log('Antrenman veritabanında bulunamadı, Groq AI hesaplıyor...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Sen uzman bir fitness antrenörü ve veri bilimcisin. Kullanıcı sana yaptığı egzersizi yazacak. 
Kullanıcının kilosu: ${weightKg} kg.
Görevlerin:
1. Bu egzersizin bu kilodaki bir insan için yaktırdığı ortalama kaloriyi hesapla.
2. SADECE GEÇERLİ BİR JSON DİZİSİ (ARRAY) DÖNDÜR! Asla markdown veya ek metin kullanma.
Format şu şekilde bir DİZİ olmalı (eğer belirsizse 1-2 varyasyon ekle):
[
  {"name": "45 Dk Tempolu Yürüyüş", "burnedCalories": 250, "durationMin": 45, "intensity": "Orta"},
  {"name": "45 Dk Yavaş Yürüyüş", "burnedCalories": 180, "durationMin": 45, "intensity": "Düşük"}
]`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1 // Tutarlı kalori hesaplaması için düşük sıcaklık
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const textResponse = data.choices[0].message.content;
    const cleanJsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedArray = [];
    try {
      parsedArray = JSON.parse(cleanJsonString);
      if (!Array.isArray(parsedArray)) {
        parsedArray = [parsedArray];
      }
    } catch (e) {
      console.error("JSON Parse Hatası:", e, textResponse);
      throw new Error("Yapay zeka antrenmanı yanlış formatta gönderdi.");
    }

    // Gelen diziyi formatla
    const formattedItems = parsedArray.map((item, index) => ({
      id: `${normalizedQuery}_${index}`,
      name: item.name || query,
      type: 'Egzersiz',
      description: `${item.durationMin || '?'} Dk | ${item.intensity || 'Orta'} Tempo | ${item.burnedCalories} kcal`,
      burnedCalories: parseFloat(item.burnedCalories) || 0,
      durationMin: parseFloat(item.durationMin) || 0,
      referenceWeight: weightKg, // Cache için referans kilo
    }));

    // 3. ADIM: SONUCU FIRESTORE'A KAYDET
    await setDoc(workoutDocRef, {
      query: normalizedQuery,
      results: formattedItems,
      createdAt: serverTimestamp()
    });
    console.log('Yeni antrenmanlar Firestore veritabanına eklendi!');

    return formattedItems;

  } catch (error) {
    console.error('Antrenman Arama Hatası:', error);
    throw error;
  }
};
