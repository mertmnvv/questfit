import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Modal, Dimensions, Platform, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import { useThemeColors } from '../hooks/useThemeColors';
import { searchFood, searchFoodByBarcode, analyzeFoodFromImage } from '../services/foodService';
import { useUserStore } from '../store/userStore';
import { SPACING, TYPOGRAPHY, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

// Debounce helper
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function MealsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const mealType = route.params?.mealType || 'breakfast'; // default
  
  const COLORS_THEME = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS_THEME), [COLORS_THEME]);
  const addFood = useUserStore(state => state.addFood);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 800);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [selectedFood, setSelectedFood] = useState(null);
  const [amount, setAmount] = useState(1);
  const [inputText, setInputText] = useState('1');
  const [unit, setUnit] = useState('piece'); // piece, portion, gram

  // Camera & Image Picker
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  // Search logic
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setErrorMsg(null);
      return;
    }
    const fetchFood = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await searchFood(debouncedQuery, i18n.language);
        setResults(data || []);
      } catch (err) {
        setErrorMsg(t('meals.aiError'));
      } finally {
        setLoading(false);
      }
    };
    fetchFood();
  }, [debouncedQuery]);

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    if (food.pieceWeight > 0) {
      setUnit('piece');
      setAmount(1);
      setInputText('1');
    } else if (food.portionWeight > 0) {
      setUnit('portion');
      setAmount(1);
      setInputText('1');
    } else {
      setUnit('gram');
      setAmount(100);
      setInputText('100');
    }
  };

  const getMultiplier = () => {
    if (!selectedFood) return 1;
    const baseUnitWeight = selectedFood.pieceWeight || selectedFood.portionWeight || 100;
    if (unit === 'gram') {
      return amount / baseUnitWeight;
    }
    return amount; // Piece or Portion
  };

  const currentMacros = useMemo(() => {
    if (!selectedFood) return { cals: 0, p: 0, c: 0, f: 0 };
    const mult = getMultiplier();
    return {
      cals: Math.round(selectedFood.macros.calories * mult),
      p: Math.round(selectedFood.macros.protein * mult),
      c: Math.round(selectedFood.macros.carbs * mult),
      f: Math.round(selectedFood.macros.fat * mult)
    };
  }, [selectedFood, amount, unit]);

  const handleSaveMeal = () => {
    if (!selectedFood) return;
    const finalAmountGram = unit === 'gram' ? amount : amount * (selectedFood.pieceWeight || selectedFood.portionWeight || 100);
    
    addFood({
      name: selectedFood.name,
      mealType,
      calories: currentMacros.cals,
      protein: currentMacros.p,
      carbs: currentMacros.c,
      fat: currentMacros.f,
      amount: finalAmountGram,
      originalFood: selectedFood
    });
    
    navigation.goBack();
  };

  const handleImagePick = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Devre dışı bırakıldı çünkü native UI İngilizce ve sorunlu
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setLoading(true);
        setErrorMsg(null);
        Toast.show({ type: 'info', text1: 'AI', text2: t('common.loading') || 'Analiz ediliyor...' });
        try {
          const data = await analyzeFoodFromImage(result.assets[0].base64, i18n.language);
          if (data && data.length > 0) {
            setResults(data);
            handleSelectFood(data[0]); // Automatically select the first identified food
          } else {
            setErrorMsg(t('meals.foodNotFound'));
          }
        } catch (err) {
          setErrorMsg(t('meals.aiImageError'));
          Alert.alert(t('meals.errorDetails'), err.message || err.toString());
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanning) return;
    setScanning(true);
    setShowCamera(false);
    setLoading(true);
    setErrorMsg(null);
    try {
      const barcodeResults = await searchFoodByBarcode(data);
      if (barcodeResults && barcodeResults.length > 0) {
        setResults(barcodeResults);
        handleSelectFood(barcodeResults[0]);
      } else {
        setErrorMsg(t('meals.barcodeNotFound'));
      }
    } catch (err) {
      setErrorMsg(t('meals.barcodeError'));
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        alert(t('meals.cameraPermissionRequired'));
        return;
      }
    }
    setShowCamera(true);
  };


  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS_THEME.background, COLORS_THEME.card, COLORS_THEME.background]} style={styles.gradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS_THEME.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t('meals.addMealHeader')}</Text>
            <Text style={styles.headerSubtitle}>{t(`dashboard.${mealType}`).toUpperCase()}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS_THEME.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('meals.searchPlaceholder')}
            placeholderTextColor={COLORS_THEME.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS_THEME.textSecondary} />
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={handleImagePick} style={{ marginRight: 12 }}>
                <MaterialCommunityIcons name="image-outline" size={24} color={COLORS_THEME.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={openCamera}>
                <MaterialCommunityIcons name="barcode-scan" size={24} color={COLORS_THEME.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Results */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS_THEME.primary} />
            <Text style={styles.loadingText}>{t('meals.aiScanning')}</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectFood(item)}>
                <View style={styles.resultIcon}>
                  <MaterialCommunityIcons name="food-apple" size={24} color={COLORS_THEME.primary} />
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultDesc}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              query.length > 2 && !loading ? (
                <View style={styles.centerContainer}>
                  <MaterialCommunityIcons name="food-off" size={48} color={COLORS_THEME.border} />
                  <Text style={styles.emptyText}>{t('meals.noResults')}</Text>
                </View>
              ) : null
            )}
          />
        )}

      </LinearGradient>

      {/* Modal / Bottom Sheet */}
      {selectedFood && (
        <Modal transparent animationType="slide" visible={!!selectedFood}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalDismiss} onPress={() => setSelectedFood(null)} />
            
            <View style={styles.modalContent}>
              <View style={styles.modalIndicator} />
              
              <Text style={styles.modalTitle}>{selectedFood.name}</Text>
              
              {/* Macros Summary */}
              <View style={styles.macrosContainer}>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroVal, {color: COLORS_THEME.accent}]}>{currentMacros.cals}</Text>
                  <Text style={styles.macroLabel}>{t('meals.macros.cals')}</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroVal, {color: '#4ade80'}]}>{currentMacros.p}g</Text>
                  <Text style={styles.macroLabel}>{t('meals.macros.protein')}</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroVal, {color: '#60a5fa'}]}>{currentMacros.c}g</Text>
                  <Text style={styles.macroLabel}>{t('meals.macros.carbs')}</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroVal, {color: '#f87171'}]}>{currentMacros.f}g</Text>
                  <Text style={styles.macroLabel}>{t('meals.macros.fat')}</Text>
                </View>
              </View>

              {/* Unit Selector */}
              <View style={styles.unitSelector}>
                {selectedFood.pieceWeight > 0 && (
                  <TouchableOpacity 
                    style={[styles.unitBtn, unit === 'piece' && styles.unitBtnActive]} 
                    onPress={() => { setUnit('piece'); setAmount(1); setInputText('1'); }}
                  >
                    <Text style={[styles.unitBtnText, unit === 'piece' && styles.unitBtnTextActive]}>{t('meals.piece')}</Text>
                  </TouchableOpacity>
                )}
                {selectedFood.portionWeight > 0 && (
                  <TouchableOpacity 
                    style={[styles.unitBtn, unit === 'portion' && styles.unitBtnActive]} 
                    onPress={() => { setUnit('portion'); setAmount(1); setInputText('1'); }}
                  >
                    <Text style={[styles.unitBtnText, unit === 'portion' && styles.unitBtnTextActive]}>{t('meals.portion')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.unitBtn, unit === 'gram' && styles.unitBtnActive]} 
                  onPress={() => { setUnit('gram'); setAmount(100); setInputText('100'); }}
                >
                  <Text style={[styles.unitBtnText, unit === 'gram' && styles.unitBtnTextActive]}>{t('meals.gram')}</Text>
                </TouchableOpacity>
              </View>

              {/* Slider & TextInput */}
              <View style={styles.sliderContainer}>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md}}>
                  <TextInput
                    style={styles.amountInput}
                    keyboardType="numeric"
                    value={inputText}
                    onChangeText={(val) => {
                      setInputText(val);
                      const num = parseFloat(val.replace(',', '.'));
                      if (!isNaN(num)) {
                        setAmount(num);
                      } else if (val === '') {
                        setAmount(0);
                      }
                    }}
                  />
                  <Text style={styles.amountUnitLabel}>{unit === 'gram' ? 'g' : unit === 'piece' ? t('meals.piece').split(' ')[0] : t('meals.portion')}</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={unit === 'gram' ? 10 : 0.1}
                  maximumValue={unit === 'gram' ? 1000 : 5}
                  step={unit === 'gram' ? 10 : 0.1}
                  value={amount}
                  onValueChange={(val) => {
                    setAmount(val);
                    setInputText(unit === 'gram' ? val.toString() : val.toFixed(1).toString());
                  }}
                  minimumTrackTintColor={COLORS_THEME.primary}
                  maximumTrackTintColor={COLORS_THEME.border}
                  thumbTintColor={COLORS_THEME.primary}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMeal}>
                <Text style={styles.saveBtnText}>{t('meals.addFood')}</Text>
                <MaterialCommunityIcons name="check-circle" size={24} color="#0D1117" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {/* Scanner Modal */}
      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerEnabled={true}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"],
            }}
            onBarcodeScanned={scanning ? undefined : handleBarcodeScanned}
          >
            <View style={{ flex: 1, backgroundColor: 'transparent', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 40 }}>
              <TouchableOpacity style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: 16, borderRadius: 50 }} onPress={() => setShowCamera(false)}>
                <MaterialCommunityIcons name="close" size={32} color="white" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>

    </View>
  );
}

const getStyles = (COLORS_THEME) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS_THEME.background },
  gradient: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.lg, color: COLORS_THEME.text },
  headerSubtitle: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: FONT_SIZE.xs, color: COLORS_THEME.primary, marginTop: 2 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS_THEME.cardLight,
    margin: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    height: 50,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: { flex: 1, color: COLORS_THEME.text, fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.md },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  loadingText: { fontFamily: TYPOGRAPHY.fontFamily.medium, color: COLORS_THEME.textSecondary, marginTop: SPACING.md },
  errorText: { fontFamily: TYPOGRAPHY.fontFamily.medium, color: COLORS_THEME.error, textAlign: 'center' },
  emptyText: { fontFamily: TYPOGRAPHY.fontFamily.medium, color: COLORS_THEME.textSecondary, marginTop: SPACING.md },
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: COLORS_THEME.card,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(151, 104, 217, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  resultInfo: { flex: 1 },
  resultName: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.md, color: COLORS_THEME.text, marginBottom: 4 },
  resultDesc: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.xs, color: COLORS_THEME.textSecondary },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalContent: {
    backgroundColor: COLORS_THEME.card,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
  },
  modalIndicator: { width: 40, height: 4, backgroundColor: COLORS_THEME.border, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.xl, color: COLORS_THEME.text, textAlign: 'center', marginBottom: SPACING.xl },
  
  macrosContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xl, paddingHorizontal: SPACING.md },
  macroBox: { alignItems: 'center' },
  macroVal: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.xl, marginBottom: 4 },
  macroLabel: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: FONT_SIZE.xs, color: COLORS_THEME.textSecondary },
  
  unitSelector: { flexDirection: 'row', backgroundColor: COLORS_THEME.background, borderRadius: BORDER_RADIUS.md, padding: 4, marginBottom: SPACING.xl },
  unitBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: BORDER_RADIUS.sm },
  unitBtnActive: { backgroundColor: COLORS_THEME.cardLight, ...SHADOWS.card },
  unitBtnText: { fontFamily: TYPOGRAPHY.fontFamily.medium, color: COLORS_THEME.textSecondary },
  unitBtnTextActive: { color: COLORS_THEME.text },
  
  sliderContainer: { alignItems: 'center', marginBottom: SPACING.xxl },
  amountInput: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 32,
    color: COLORS_THEME.primary,
    minWidth: 60,
    textAlign: 'right',
    padding: 0,
    marginRight: 8,
  },
  amountUnitLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 24,
    color: COLORS_THEME.primary,
  },
  
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS_THEME.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  saveBtnText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.md, color: '#0D1117', marginRight: 8 },
});
