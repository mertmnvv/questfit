/**
 * QuestFit — Core Math Engine
 * BMR, TDEE ve Makro hesaplamaları (Mifflin-St Jeor formülü kullanılmıştır)
 */

/**
 * Bazal Metabolizma Hızını (BMR) hesaplar
 * @param {string} gender - 'male' | 'female'
 * @param {number} weight - kg
 * @param {number} height - cm
 * @param {number} age - yıl
 * @returns {number} BMR (kcal)
 */
export const calculateBMR = (gender, weight, height, age) => {
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  return Math.round(bmr);
};

/**
 * Günlük Enerji Harcamasını (TDEE) hesaplar (Sabit Aktivite Çarpanı: 1.375 - Hafif Aktif)
 * @param {number} bmr
 * @param {number} activityMultiplier - Varsayılan 1.375
 * @returns {number} TDEE (kcal)
 */
export const calculateTDEE = (bmr, activityMultiplier = 1.375) => {
  return Math.round(bmr * activityMultiplier);
};

/**
 * Hedefe göre günlük alınması gereken kaloriyi hesaplar
 * @param {number} tdee
 * @param {string} goal - 'lose' | 'maintain' | 'gain'
 * @returns {number} Hedef Kalori (kcal)
 */
export const calculateTargetCalories = (tdee, goal) => {
  if (goal === 'lose' || goal === 'Lose Weight') {
    return tdee - 500;
  } else if (goal === 'gain' || goal === 'Build Muscle') {
    return tdee + 500;
  } else {
    return tdee;
  }
};

/**
 * Hedef kaloriye göre Protein, Karbonhidrat ve Yağ makrolarını hesaplar
 * @param {number} weight - kg
 * @param {number} targetCalories - Hedef kcal
 * @param {string} goal - 'lose' | 'maintain' | 'gain'
 * @param {string} macroSplit - 'balanced' | 'keto' | 'high_protein'
 * @param {string} bodyType - 'ectomorph' | 'mesomorph' | 'endomorph'
 * @returns {object} { protein, fat, carbs } (gram)
 */
export const calculateMacros = (weight, targetCalories, goal, macroSplit = 'balanced', bodyType = 'mesomorph') => {
  let proteinGrams, fatGrams, carbsGrams;

  if (macroSplit === 'keto') {
    // Keto: %25 Protein, %70 Yağ, %5 Karb
    proteinGrams = Math.round((targetCalories * 0.25) / 4);
    fatGrams = Math.round((targetCalories * 0.70) / 9);
    carbsGrams = Math.round((targetCalories * 0.05) / 4);
  } else if (macroSplit === 'high_protein') {
    // Yüksek Protein: %40 Protein, %30 Yağ, %30 Karb
    proteinGrams = Math.round((targetCalories * 0.40) / 4);
    fatGrams = Math.round((targetCalories * 0.30) / 9);
    carbsGrams = Math.round((targetCalories * 0.30) / 4);
  } else {
    // Balanced: Vücut tipine özel makro dağılımı
    let proteinRatio = 0.30;
    let fatRatio = 0.30;
    let carbsRatio = 0.40; // Default Mesomorph

    if (bodyType === 'ectomorph') {
      proteinRatio = 0.25;
      fatRatio = 0.25;
      carbsRatio = 0.50; // Yüksek Karb (Ektomorf)
    } else if (bodyType === 'endomorph') {
      proteinRatio = 0.35;
      fatRatio = 0.40;
      carbsRatio = 0.25; // Düşük Karb (Endomorf)
    }

    proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
    fatGrams = Math.round((targetCalories * fatRatio) / 9);
    carbsGrams = Math.round((targetCalories * carbsRatio) / 4);
  }

  return {
    protein: proteinGrams,
    fat: fatGrams,
    carbs: carbsGrams,
  };
};

/**
 * Profil verisinden tüm metrikleri tek seferde hesaplayıp döndürür
 */
export const calculateAllStats = (profileData) => {
  if (!profileData || !profileData.weight || !profileData.height || !profileData.age) {
    return null;
  }

  const bmr = calculateBMR(profileData.gender, profileData.weight, profileData.height, profileData.age);
  const tdee = calculateTDEE(bmr);
  const targetCalories = calculateTargetCalories(tdee, profileData.goal);
  
  // Diyet planı varsa macroSplit bilgisini al, yoksa balanced kullan
  let macroSplit = profileData.macroSplit || 'balanced';
  if (typeof profileData.dietPlan === 'object' && profileData.dietPlan?.macroSplit) {
    macroSplit = profileData.dietPlan.macroSplit;
  }
  const bodyType = profileData.bodyType || 'mesomorph';
  const macros = calculateMacros(profileData.weight, targetCalories, profileData.goal, macroSplit, bodyType);

  // Default mikrolar (kullanıcı daha sonra ayarlardan ezebilir)
  // Su: Kilo başına 35ml ortalama
  const waterLiters = parseFloat(((profileData.weight * 35) / 1000).toFixed(1));
  // Lif: Ortalama 30g sabit veya kaloriye göre hesaplanabilir (her 1000 kalori için 14g)
  const fiberGrams = Math.round((targetCalories / 1000) * 14);

  // Eğer kullanıcının özel mikro ayarları (customMicros) varsa onları kullan, yoksa defaultları ver
  const micros = {
    water: profileData.customMicros?.water || waterLiters,
    fiber: profileData.customMicros?.fiber || fiberGrams,
  };

  return {
    bmr,
    tdee,
    targetCalories,
    macros,
    micros,
  };
};
