import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

/**
 * Yemek sorgusu yapar. Önce Firestore (kendi veritabanımız) kontrol edilir.
 * Eğer yoksa Groq API'ye (Llama 3) sorulur ve sonuç veritabanına kaydedilir.
 */
export const searchFood = async (query, language = 'tr') => {
  if (!query) return [];
  const normalizedQuery = `${query.toLowerCase().trim()}_${language}`;

  try {
    // 1. ADIM: FIRESTORE CACHE KONTROLÜ
    const foodDocRef = doc(db, 'foods', 'v2_' + normalizedQuery);
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
1. Eğer genel bir kelime girildiyse, o yemeğin en popüler 3 ila 5 farklı çeşidini üret. Spesifikse, sadece onu ve 1-2 benzerini üret.
2. DİKKAT: Makro değerlerini (calories, protein, carbs, fat) KESİNLİKLE 100 gram üzerinden DEĞİL, aşağıda belirleyeceğin 1 BİRİM (1 Adet veya 1 Porsiyon) üzerinden hesapla ve yaz.
3. BİRİM KURALLARI:
   - Eğer ürün tekli tüketilebiliyorsa (Kutu İçecek, Yumurta, Meyve, Gofret, Enerji İçeceği, Burger), bunu ADET (pieceWeight > 0) olarak kabul et. Kalori ve makroları TAM OLARAK 1 ADET (örn: 1 kutu 330ml/500ml) için yaz. Bu durumda portionWeight'i 0 yapabilirsin veya adet gramajıyla aynı yapabilirsin.
   - Eğer ürün sıvı (bardakla/şişeyle içilenler hariç zeytinyağı vb.) veya taneli (pilav, yulaf, çorba) ise, ADET OLAMAZ. Bu durumda pieceWeight değerini KESİNLİKLE 0 yap. Kalori ve makroları TAM OLARAK 1 PORSİYON (portionWeight, örn: 200g) için yaz.
4. ÖZEL UYARI: "Monster White, Diet Coke, Zero Kola, Şekersiz İçecek, Sade Kahve" gibi kalorisiz/şekersiz ürünler girildiğinde, 1 Kutu veya 1 Bardak kalorisini KESİNLİKLE 3 ile 15 kcal arasında tut. Enerji içeceği (Monster vb.) 1 Kutu (500ml) adet kabul edilmelidir.
5. SADECE GEÇERLİ BİR JSON DİZİSİ (ARRAY) DÖNDÜR! Markdown veya ek metin KESİNLİKLE KULLANMA.
6. ÖNEMLİ: Yemek isimlerini (name) kesinlikle ve her zaman ${language === 'en' ? 'İngilizce (English)' : 'Türkçe'} dilinde döndür. Ancak JSON formatı değişmesin.
Format şu şekilde bir DİZİ olmalı:
[
  {"name": "Monster Ultra White (1 Kutu)", "calories": 10, "protein": 0, "carbs": 4, "fat": 0, "pieceWeight": 500, "portionWeight": 0},
  {"name": "Etli Kuru Fasulye (1 Porsiyon)", "calories": 320, "protein": 18, "carbs": 35, "fat": 12, "pieceWeight": 0, "portionWeight": 250},
  {"name": "Haşlanmış Yumurta", "calories": 78, "protein": 6, "carbs": 0.5, "fat": 5, "pieceWeight": 50, "portionWeight": 0}
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
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
    const cleanJsonString = jsonMatch ? jsonMatch[0] : textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
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
      type: language === 'en' ? 'AI & Community' : 'Yapay Zeka & Topluluk',
      description: language === 'en' 
        ? `1 Unit: ${parsedItem.calories} kcal | P: ${parsedItem.protein}g | C: ${parsedItem.carbs}g | F: ${parsedItem.fat}g` 
        : `1 Birim: ${parsedItem.calories} kcal | P: ${parsedItem.protein}g | K: ${parsedItem.carbs}g | Y: ${parsedItem.fat}g`,
      baseAmount: 1,
      pieceWeight: parsedItem.pieceWeight !== undefined && parsedItem.pieceWeight !== null ? Number(parsedItem.pieceWeight) : 0,
      portionWeight: parsedItem.portionWeight !== undefined && parsedItem.portionWeight !== null ? Number(parsedItem.portionWeight) : 200,
      macros: {
        calories: parseFloat(parsedItem.calories) || 0,
        protein: parseFloat(parsedItem.protein) || 0,
        carbs: parseFloat(parsedItem.carbs) || 0,
        fat: parseFloat(parsedItem.fat) || 0,
      }
    }));

    // 3. ADIM: SONUCU FIRESTORE'A KAYDET (Öğrenen Veritabanı)
    // Firestore'da listeyi bir array field olarak saklıyoruz.
    try {
      await setDoc(foodDocRef, {
        query: normalizedQuery,
        results: formattedItems,
        createdAt: serverTimestamp()
      });
      console.log('Yeni varyasyonlar Firestore veritabanına eklendi!');
    } catch (err) {
      console.error('Veritabanına eklenirken hata oluştu:', err);
    }

    return formattedItems;

  } catch (error) {
    console.error('Besin Arama/Cache Hatası:', error);
    // Mock fallback on error to prevent crashes
    return [{
      id: `mock_${Date.now()}`,
      name: language === 'en' ? 'Mock Data (AI Error)' : 'Örnek Veri (Yapay Zeka Hatası)',
      type: language === 'en' ? 'System Fallback' : 'Sistem Yedeği',
      description: language === 'en' ? '1 Unit: 100 kcal | P: 10g' : '1 Birim: 100 kcal | P: 10g',
      baseAmount: 1,
      pieceWeight: 0,
      portionWeight: 100,
      macros: { calories: 100, protein: 10, carbs: 10, fat: 5 }
    }];
  }
};

/**
 * OpenFoodFacts API üzerinden barkod sorgusu yapar.
 */
export const searchFoodByBarcode = async (barcode) => {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      const p = data.product;
      const nutriments = p.nutriments || {};
      
      const calories = nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0;
      const protein = nutriments.proteins_100g || nutriments.proteins || 0;
      const carbs = nutriments.carbohydrates_100g || nutriments.carbohydrates || 0;
      const fat = nutriments.fat_100g || nutriments.fat || 0;
      
      // We assume default portion is 100g unless package says otherwise, but we'll return per 100g base for simplicity
      // Or we can return it as an array to match the searchFood format
      const isEn = barcode.includes('en'); // A simple placeholder if we needed lang, but we don't have it here easily
      const formattedItem = {
        id: `barcode_${barcode}`,
        name: p.product_name || 'Bilinmeyen Ürün',
        type: p.brands || 'Paketli Gıda',
        description: `100g: ${Math.round(calories)} kcal | P: ${Math.round(protein)}g | K: ${Math.round(carbs)}g | Y: ${Math.round(fat)}g`,
        baseAmount: 1,
        pieceWeight: 0,
        portionWeight: 100, // 1 Porsiyon = 100g as default for barcodes
        macros: {
          calories: parseFloat(calories) || 0,
          protein: parseFloat(protein) || 0,
          carbs: parseFloat(carbs) || 0,
          fat: parseFloat(fat) || 0,
        }
      };
      return [formattedItem];
    }
    return [];
  } catch (error) {
    console.error('Barcode error:', error);
    return [];
  }
};

export const analyzeFoodFromImage = async (base64Image, language = 'tr') => {
  console.log('[FoodService] Image analysis is disabled.');
  throw new Error('Image analysis features are currently unavailable.');
};

