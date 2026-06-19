import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

/**
 * Yemek sorgusu yapar. Önce Firestore (kendi veritabanımız) kontrol edilir.
 * Eğer yoksa Groq API'ye (Llama 3) sorulur ve sonuç veritabanına kaydedilir.
 */
export const searchFood = async (query) => {
  if (!query) return [];
  const normalizedQuery = query.toLowerCase().trim();

  try {
    // 1. ADIM: FIRESTORE CACHE KONTROLÜ
    const foodDocRef = doc(db, 'foods', normalizedQuery);
    const foodDocSnap = await getDoc(foodDocRef);

    if (foodDocSnap.exists()) {
      const docData = foodDocSnap.data();
      // Eğer eski tekil formatta kayıtlıysa (results dizisi yoksa) cache'i yoksay ve yeni AI sisteminden detayları çek!
      if (docData.results && Array.isArray(docData.results)) {
        console.log('Besin Firestore Cache üzerinden getirildi!');
        return docData.results;
      }
    }

    // 2. ADIM: GROQ API İLE YAPAY ZEKA SORGUSU
    console.log('Besin veritabanında bulunamadı, Groq AI hesaplıyor...');
    
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
            content: `Sen uzman bir diyetisyen ve veri bilimcisin. Kullanıcı sana genel bir yemek adı (örn: "kuru fasulye" veya "tavuk") veya spesifik bir isim verecek.
Görevlerin:
1. Eğer genel bir kelime girildiyse, o yemeğin en popüler 3 ila 5 farklı çeşidini (Örn: Etli, Etsiz, Zeytinyağlı, Haşlama vb.) üret.
2. Eğer zaten çok spesifik bir yemek girdiyse (Örn: "Zeytinyağlı Kuru Fasulye"), sadece o yemeği ve 1-2 çok yakın benzerini üret.
4. Ayrıca her yemek için ortalama 1 adetinin (pieceWeight) kaç gram olduğunu ve ortalama 1 porsiyonunun (portionWeight) kaç gram olduğunu ekle. Eğer sıvı veya adetle sayılmayan bir besinse (örn: zeytinyağı, pilav, yulaf) pieceWeight değerini KESİNLİKLE 0 yap.
5. SADECE GEÇERLİ BİR JSON DİZİSİ (ARRAY) DÖNDÜR! Markdown, açıklama veya ek metin KESİNLİKLE KULLANMA.
Format şu şekilde bir DİZİ olmalı:
[
  {"name": "Etli Kuru Fasulye", "calories": 130, "protein": 8, "carbs": 15, "fat": 5, "pieceWeight": 0, "portionWeight": 250},
  {"name": "Haşlanmış Yumurta", "calories": 155, "protein": 13, "carbs": 1.1, "fat": 11, "pieceWeight": 50, "portionWeight": 100}
]`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2 // Çeşitlilik için hafif artırıldı ama formatı bozmayacak seviyede
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const textResponse = data.choices[0].message.content;
    const cleanJsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // AI'dan artık bir DİZİ (Array) bekliyoruz
    let parsedArray = [];
    try {
      parsedArray = JSON.parse(cleanJsonString);
      if (!Array.isArray(parsedArray)) {
        parsedArray = [parsedArray]; // Eğer hata yapıp tek obje dönerse diziye çevir
      }
    } catch (e) {
      console.error("JSON Parse Hatası:", e, textResponse);
      throw new Error("Yapay zeka veriyi yanlış formatta gönderdi.");
    }

    // Gelen dizideki her elemanı uygulamamızın beklediği formata çevir
    const formattedItems = parsedArray.map((parsedItem, index) => ({
      id: `${normalizedQuery}_${index}`,
      name: parsedItem.name || query,
      type: 'Yapay Zeka & Topluluk',
      description: `100g: ${parsedItem.calories} kcal | P: ${parsedItem.protein}g | K: ${parsedItem.carbs}g | Y: ${parsedItem.fat}g`,
      baseAmount: 100,
      pieceWeight: parseFloat(parsedItem.pieceWeight) || 100,
      portionWeight: parseFloat(parsedItem.portionWeight) || 200,
      macros: {
        calories: parseFloat(parsedItem.calories) || 0,
        protein: parseFloat(parsedItem.protein) || 0,
        carbs: parseFloat(parsedItem.carbs) || 0,
        fat: parseFloat(parsedItem.fat) || 0,
      }
    }));

    // 3. ADIM: SONUCU FIRESTORE'A KAYDET (Öğrenen Veritabanı)
    // Firestore'da listeyi bir array field olarak saklıyoruz.
    await setDoc(foodDocRef, {
      query: normalizedQuery,
      results: formattedItems,
      createdAt: serverTimestamp()
    });
    console.log('Yeni varyasyonlar Firestore veritabanına eklendi!');

    return formattedItems;

  } catch (error) {
    console.error('Besin Arama/Cache Hatası:', error);
    throw new Error('Yapay zeka bu yemeği analiz edemedi veya bağlantı koptu.');
  }
};
