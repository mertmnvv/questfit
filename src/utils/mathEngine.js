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
 * @param {string} gender - 'male' | 'female'
 * @returns {number} Hedef Kalori (kcal)
 */
export const calculateTargetCalories = (tdee, goal, gender = 'male') => {
  let target = tdee;
  
  if (goal === 'lose' || goal === 'Lose Weight') {
    // Çok hızlı kilo vermek yerine daha güvenli bir açık: %20 veya 500 kcal
    const deficit = Math.min(500, tdee * 0.20); 
    target = Math.round(tdee - deficit);
  } else if (goal === 'gain' || goal === 'Build Muscle') {
    // Kas yapmak için yavaş ve temiz büyüme (clean bulk): +300 veya 500
    target = Math.round(tdee + 400); 
  }

  // Medikal Güvenlik Kilidi: Kadınlar 1200, Erkekler 1500 kalorinin altına inmemelidir.
  const minCals = gender === 'female' ? 1200 : 1500;
  if (target < minCals) {
    target = minCals;
  }

  return target;
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
  let proteinRatio, fatRatio, carbsRatio;

  if (macroSplit === 'keto') {
    // Keto: %20 Protein, %75 Yağ, %5 Karb
    proteinRatio = 0.20;
    fatRatio = 0.75;
    carbsRatio = 0.05;
  } else if (macroSplit === 'high_protein') {
    // Yüksek Protein: %30 Protein, %30 Yağ, %40 Karb
    proteinRatio = 0.30;
    fatRatio = 0.30;
    carbsRatio = 0.40;
  } else {
    // Balanced (Dengeli): Vücut tipine göre dinamik sağlıklı oranlar
    if (bodyType === 'ectomorph') {
      // Ektomorf (Hızlı metabolizma, karbonhidratı iyi tolere eder)
      proteinRatio = 0.20;
      fatRatio = 0.25;
      carbsRatio = 0.55; 
    } else if (bodyType === 'endomorph') {
      // Endomorf (Yavaş metabolizma, yağı karbonhidrattan daha iyi tolere eder)
      proteinRatio = 0.25;
      fatRatio = 0.45;
      carbsRatio = 0.30; 
    } else {
      // Mesomorf (Standart atletik yapı)
      proteinRatio = 0.25;
      fatRatio = 0.30;
      carbsRatio = 0.45;
    }
  }

  // Güvenlik: Düşük kalorili diyetlerde (Zayıflama vb.) protein kas kaybını önlemek için 
  // gramaj olarak kilonun 1.2 katının altına inmesin (eğer yüzde hesaplaması yetersiz kalırsa).
  let proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
  const minProteinGrams = Math.round(weight * 1.2);
  
  if (proteinGrams < minProteinGrams) {
    proteinGrams = minProteinGrams;
    const proteinCals = proteinGrams * 4;
    const remainingCals = targetCalories - proteinCals;
    
    // Karbonhidrat ve Yağı kalan kaloriye göre yeniden dağıt
    const dynamicCarbRatio = carbsRatio / (carbsRatio + fatRatio);
    const dynamicFatRatio = fatRatio / (carbsRatio + fatRatio);
    
    return {
      protein: proteinGrams,
      fat: Math.round((remainingCals * dynamicFatRatio) / 9),
      carbs: Math.round((remainingCals * dynamicCarbRatio) / 4),
    };
  }

  return {
    protein: proteinGrams,
    fat: Math.round((targetCalories * fatRatio) / 9),
    carbs: Math.round((targetCalories * carbsRatio) / 4),
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
  const targetCalories = calculateTargetCalories(tdee, profileData.goal, profileData.gender);
  
  // Diyet planı varsa macroSplit bilgisini al, yoksa balanced kullan
  let macroSplit = profileData.macroSplit || 'balanced';
  if (typeof profileData.dietPlan === 'object' && profileData.dietPlan?.macroSplit) {
    macroSplit = profileData.dietPlan.macroSplit;
  }
  const bodyType = profileData.bodyType || 'mesomorph';
  const macros = calculateMacros(profileData.weight, targetCalories, profileData.goal, macroSplit, bodyType);

  // Default mikrolar (kullanıcı daha sonra ayarlardan ezebilir)
  // Su: Kilo başına 35ml ortalama, minimum 2.0L, maksimum 4.5L (Su zehirlenmesini önlemek için)
  let waterLiters = parseFloat(((profileData.weight * 35) / 1000).toFixed(1));
  if (waterLiters < 2.0) waterLiters = 2.0;
  if (waterLiters > 4.5) waterLiters = 4.5;

  // Lif: Ortalama her 1000 kalori için 14g, minimum 25g, maksimum 50g (Sindirim sorunlarını önlemek için)
  let fiberGrams = Math.round((targetCalories / 1000) * 14);
  if (fiberGrams < 25) fiberGrams = 25;
  if (fiberGrams > 50) fiberGrams = 50;

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
