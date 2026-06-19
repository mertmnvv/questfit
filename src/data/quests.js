/**
 * QuestFit — Günlük Görev Havuzu (Quest Pool)
 * 20 Beslenme + 20 Antrenman = 40 Görev
 * Her gün bu havuzdan rastgele 3 Beslenme, 3 Antrenman seçilir.
 */

export const NUTRITION_QUESTS = [
  { id: 'n1', titleKey: 'Çöl Savaşçısı', descKey: 'Günlük su hedefinin %100\'ünü tamamla.', type: 'water', targetPercent: 100, icon: 'cup-water', color: '#4DABF7', xp: 50 },
  { id: 'n2', titleKey: 'Protein Ustası', descKey: 'Günlük protein hedefinin %100\'ünü tamamla.', type: 'protein', targetPercent: 100, icon: 'arm-flex', color: '#FF6B6B', xp: 60 },
  { id: 'n3', titleKey: 'Enerji Deposu', descKey: 'Günlük karbonhidrat limitini doldur.', type: 'carbs', targetPercent: 100, icon: 'lightning-bolt', color: '#FCC419', xp: 50 },
  { id: 'n4', titleKey: 'Lif Kahramanı', descKey: 'Günlük lif hedefine ulaş.', type: 'fiber', targetPercent: 100, icon: 'leaf', color: '#94D82D', xp: 40 },
  { id: 'n5', titleKey: 'Sabah Kuşu', descKey: 'Bugün kahvaltı yap (en az 1 besin ekle).', type: 'meal_count', mealType: 'Kahvaltı', targetCount: 1, icon: 'egg-fried', color: '#FFB347', xp: 30 },
  { id: 'n6', titleKey: 'Dengeli Öğünler', descKey: '3 farklı öğünde yemek kaydet.', type: 'meal_variety', targetCount: 3, icon: 'silverware-fork-knife', color: '#C084FC', xp: 60 },
  { id: 'n7', titleKey: 'Yağ Kontrolü', descKey: 'Günlük yağ hedefini %90-110 aralığında tut.', type: 'fat_balance', targetMin: 90, targetMax: 110, icon: 'oil', color: '#FFE066', xp: 50 },
  { id: 'n8', titleKey: 'Kalori Disiplini', descKey: 'Günlük kalori hedefini aşma.', type: 'calorie_control', icon: 'shield-check', color: '#5EEAD4', xp: 70 },
  { id: 'n9', titleKey: 'Su Perisi', descKey: 'Bugün en az 6 bardak su iç.', type: 'water_glasses', targetGlasses: 6, icon: 'water', color: '#38BDF8', xp: 40 },
  { id: 'n10', titleKey: 'Protein Bombası', descKey: 'Protein hedefinin %80\'ine ulaş.', type: 'protein', targetPercent: 80, icon: 'food-steak', color: '#E879A0', xp: 40 },
  { id: 'n11', titleKey: 'Yeşil Güç', descKey: 'Bugün en az 2 öğünde yemek kaydet.', type: 'meal_variety', targetCount: 2, icon: 'food-apple', color: '#4ADE80', xp: 30 },
  { id: 'n12', titleKey: 'Makro Savaşçısı', descKey: 'Protein VE karbonhidrat hedeflerinin %75\'ine ulaş.', type: 'dual_macro', targetPercent: 75, icon: 'chart-donut', color: '#A78BFA', xp: 60 },
  { id: 'n13', titleKey: 'Hidrasyon Ustası', descKey: 'Bugün en az 8 bardak su iç.', type: 'water_glasses', targetGlasses: 8, icon: 'cup-water', color: '#22D3EE', xp: 50 },
  { id: 'n14', titleKey: 'Hafif Atıştırmalık', descKey: 'Atıştırmalık öğününe en az 1 besin ekle.', type: 'meal_count', mealType: 'Atıştırmalık', targetCount: 1, icon: 'cookie', color: '#FB923C', xp: 20 },
  { id: 'n15', titleKey: 'Tam Gaz Beslenme', descKey: 'Bugün 4 öğünün hepsine yemek ekle.', type: 'meal_variety', targetCount: 4, icon: 'food-variant', color: '#F472B6', xp: 80 },
  { id: 'n16', titleKey: 'Karb Kontrolü', descKey: 'Karbonhidrat hedefinin %90\'ına ulaş ama aşma.', type: 'carbs_balance', targetMin: 80, targetMax: 100, icon: 'grain', color: '#FBBF24', xp: 50 },
  { id: 'n17', titleKey: 'Yarım Yolda Kal', descKey: 'Protein hedefinin en az %50\'sini tamamla.', type: 'protein', targetPercent: 50, icon: 'percent', color: '#F87171', xp: 25 },
  { id: 'n18', titleKey: 'Su Çeşmesi', descKey: 'Bugün en az 4 bardak su iç.', type: 'water_glasses', targetGlasses: 4, icon: 'water-outline', color: '#60A5FA', xp: 25 },
  { id: 'n19', titleKey: 'Akşam Yemeği Usta', descKey: 'Akşam yemeğine en az 1 besin ekle.', type: 'meal_count', mealType: 'Akşam Yemeği', targetCount: 1, icon: 'pot-steam', color: '#E11D48', xp: 30 },
  { id: 'n20', titleKey: 'Kalori Bilinci', descKey: 'Günlük kalori hedefinin %70\'ine ulaş.', type: 'calorie_percent', targetPercent: 70, icon: 'fire', color: '#FB7185', xp: 40 },
];

export const WORKOUT_QUESTS = [
  { id: 'w1', titleKey: 'İlk Adım', descKey: 'Bugün en az 1 antrenman yap.', type: 'workout_count', targetCount: 1, icon: 'dumbbell', color: '#8B5CF6', xp: 50 },
  { id: 'w2', titleKey: 'Kalori Fırını', descKey: 'Bugün en az 200 kcal yak.', type: 'burn_calories', targetBurn: 200, icon: 'fire', color: '#EF4444', xp: 60 },
  { id: 'w3', titleKey: 'Dayanıklılık Testi', descKey: 'Bugün en az 300 kcal yak.', type: 'burn_calories', targetBurn: 300, icon: 'flash', color: '#F59E0B', xp: 80 },
  { id: 'w4', titleKey: 'Çelik İrade', descKey: 'Bugün 2 farklı antrenman yap.', type: 'workout_count', targetCount: 2, icon: 'sword-cross', color: '#6366F1', xp: 100 },
  { id: 'w5', titleKey: 'Kısa ve Etkili', descKey: 'Bugün en az 100 kcal yak.', type: 'burn_calories', targetBurn: 100, icon: 'run-fast', color: '#14B8A6', xp: 30 },
  { id: 'w6', titleKey: 'Göğüs Günü', descKey: 'Bugün göğüs kasını çalıştıran bir antrenman yap.', type: 'muscle_group', targetGroup: 'Göğüs', icon: 'human-handsup', color: '#EC4899', xp: 50 },
  { id: 'w7', titleKey: 'Sırt Gücü', descKey: 'Bugün sırt kasını çalıştıran bir antrenman yap.', type: 'muscle_group', targetGroup: 'Sırt', icon: 'human', color: '#3B82F6', xp: 50 },
  { id: 'w8', titleKey: 'Bacak Günü', descKey: 'Bugün bacak antrenmanı yap.', type: 'muscle_group', targetGroup: 'Bacak', icon: 'walk', color: '#10B981', xp: 50 },
  { id: 'w9', titleKey: 'Omuz Savaşçısı', descKey: 'Bugün omuz antrenmanı yap.', type: 'muscle_group', targetGroup: 'Omuz', icon: 'shield', color: '#F97316', xp: 50 },
  { id: 'w10', titleKey: 'Kol Gücü', descKey: 'Bugün kol antrenmanı yap.', type: 'muscle_group', targetGroup: 'Kollar', icon: 'arm-flex', color: '#D946EF', xp: 50 },
  { id: 'w11', titleKey: 'Karın Kasları', descKey: 'Bugün karın antrenmanı yap.', type: 'muscle_group', targetGroup: 'Karın', icon: 'human-greeting', color: '#EAB308', xp: 50 },
  { id: 'w12', titleKey: 'Full Body Savaşçı', descKey: 'Bugün en az 400 kcal yak.', type: 'burn_calories', targetBurn: 400, icon: 'trophy', color: '#FFD700', xp: 100 },
  { id: 'w13', titleKey: 'Ev Antrenmanı', descKey: 'Bugün evde bir antrenman yap.', type: 'workout_category', targetCategory: 'Evde Antrenman', icon: 'home', color: '#34D399', xp: 40 },
  { id: 'w14', titleKey: 'Gym Savaşçısı', descKey: 'Bugün salon antrenmanı yap.', type: 'workout_category', targetCategory: 'Gym', icon: 'weight-lifter', color: '#60A5FA', xp: 50 },
  { id: 'w15', titleKey: 'Calisthenics Pro', descKey: 'Bugün vücut ağırlığı antrenmanı yap.', type: 'workout_category', targetCategory: 'Calisthenics', icon: 'gymnastics', color: '#A78BFA', xp: 50 },
  { id: 'w16', titleKey: 'Süper Set', descKey: 'Bugün en az 150 kcal yak.', type: 'burn_calories', targetBurn: 150, icon: 'lightning-bolt', color: '#FBBF24', xp: 40 },
  { id: 'w17', titleKey: 'Kararlılık', descKey: 'Streak\'ini koru! Bugün bir antrenman yap.', type: 'workout_count', targetCount: 1, icon: 'calendar-check', color: '#22C55E', xp: 40 },
  { id: 'w18', titleKey: 'Terle ve Kazan', descKey: 'Bugün en az 250 kcal yak.', type: 'burn_calories', targetBurn: 250, icon: 'water-alert', color: '#F43F5E', xp: 70 },
  { id: 'w19', titleKey: 'Çift Kas Grubu', descKey: 'Bugün 2 farklı kas grubunu çalıştır.', type: 'muscle_group_variety', targetCount: 2, icon: 'chart-bar', color: '#818CF8', xp: 70 },
  { id: 'w20', titleKey: 'Efsanevi Antrenman', descKey: 'Bugün en az 500 kcal yak.', type: 'burn_calories', targetBurn: 500, icon: 'star', color: '#FFD700', xp: 120 },
];

/**
 * Belirli bir gün için görevleri seç.
 * Günün tarihine göre deterministik rastgele seçim yapar (aynı gün aynı görevler).
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {{ nutritionQuests: Array, workoutQuests: Array }}
 */
export const getDailyQuests = (dateStr) => {
  // Tarih stringinden basit bir seed oluştur
  const seed = dateStr.split('-').join('');
  const seedNum = parseInt(seed, 10);

  // Fisher-Yates benzeri deterministik shuffle
  const shuffle = (arr, s) => {
    const shuffled = [...arr];
    let m = s;
    for (let i = shuffled.length - 1; i > 0; i--) {
      m = (m * 9301 + 49297) % 233280;
      const j = Math.floor((m / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const shuffledNutrition = shuffle(NUTRITION_QUESTS, seedNum);
  const shuffledWorkout = shuffle(WORKOUT_QUESTS, seedNum + 1);

  return {
    nutritionQuests: shuffledNutrition.slice(0, 3),
    workoutQuests: shuffledWorkout.slice(0, 3),
  };
};
