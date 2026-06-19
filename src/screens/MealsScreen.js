import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Animated,
  Keyboard,
  Platform,
  Dimensions,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useThemeColors } from '../hooks/useThemeColors';
import { searchFood } from '../services/foodService';
import { useUserStore } from '../store/userStore';
import { SPACING, FONT_SIZE, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';
import HorizontalSlider from '../components/HorizontalSlider';

const { width, height } = Dimensions.get('window');

const MOCK_QUICK_FOODS = [
  { 
    id: 'q1', name: 'Yumurta (Haşlanmış)', type: 'Protein', description: '1 Adet Orta Boy', 
    baseAmount: 100, pieceWeight: 50, portionWeight: 100, macros: { calories: 155, protein: 13, carbs: 1.1, fat: 11 } 
  },
  { 
    id: 'q2', name: 'Yulaf Ezmesi', type: 'Karb', description: 'Lif kaynağı', 
    baseAmount: 100, pieceWeight: 0, portionWeight: 50, macros: { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 } 
  },
  { 
    id: 'q3', name: 'Tavuk Göğsü', type: 'Protein', description: 'Izgara, Derisiz', 
    baseAmount: 100, pieceWeight: 150, portionWeight: 150, macros: { calories: 165, protein: 31, carbs: 0, fat: 3.6 } 
  },
  { 
    id: 'q4', name: 'Muz', type: 'Meyve', description: 'Orta boy', 
    baseAmount: 100, pieceWeight: 120, portionWeight: 120, macros: { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 } 
  }
];

export default function MealsScreen() {
  const { t } = useTranslation();
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);

  const navigation = useNavigation();
  const route = useRoute();
  const mealType = route.params?.mealType || t('dashboard.snack');

  const { addFood, recentFoods, recentSearches, addRecentSearch } = useUserStore();

  // Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Bottom Sheet State
  const [selectedFood, setSelectedFood] = useState(null);
  const [amountInput, setAmountInput] = useState('100');
  const [unit, setUnit] = useState('Gram');
  const [sheetVisible, setSheetVisible] = useState(false);

  // Dynamic Calories Calculation
  const dynamicCalories = useMemo(() => {
    if (!selectedFood) return 0;
    const inputVal = parseFloat(amountInput.replace(',', '.')) || 0;
    
    let finalGrams = inputVal;
    if (unit === 'Porsiyon') {
      finalGrams = inputVal * (selectedFood.portionWeight || 200);
    } else if (unit === 'Adet') {
      finalGrams = inputVal * (selectedFood.pieceWeight || 100);
    }

    const calsPer100 = selectedFood.macros?.calories || 0;
    return (finalGrams / 100) * calsPer100;
  }, [selectedFood, amountInput, unit]);

  // Search Function
  const handleSearch = async (overrideQuery) => {
    const searchQuery = typeof overrideQuery === 'string' ? overrideQuery : query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setHasSearched(true);
    Keyboard.dismiss();
    try {
      addRecentSearch(searchQuery);
      const data = await searchFood(searchQuery);
      setResults(data);
      if (data.length === 0) {
        Toast.show({ type: 'info', text1: 'Sonuç bulunamadı', text2: 'Farklı bir arama yapmayı deneyin.' });
      }
    } catch (error) {
      Toast.show({ 
        type: 'error', 
        text1: 'Arama Hatası', 
        text2: error.message || 'Yapay zeka servisi şu an yanıt veremiyor.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Bottom Sheet Open
  const openBottomSheet = (food) => {
    setSelectedFood(food);
    setUnit('Gram');
    setAmountInput('100');
    setSheetVisible(true);
  };

  const closeBottomSheet = () => {
    setSheetVisible(false);
    setTimeout(() => setSelectedFood(null), 300); // Wait for animation
  };

  // Add Food Action
  const handleAddFood = () => {
    const inputVal = parseFloat(amountInput.replace(',', '.'));
    if (!inputVal || inputVal <= 0) {
      Toast.show({ type: 'error', text1: 'Lütfen geçerli bir miktar girin' });
      return;
    }

    let finalGrams = inputVal;
    if (unit === 'Porsiyon') {
      finalGrams = inputVal * (selectedFood.portionWeight || 200);
    } else if (unit === 'Adet') {
      finalGrams = inputVal * (selectedFood.pieceWeight || 100);
    }

    addFood(selectedFood, finalGrams, mealType);
    
    Toast.show({
      type: 'success',
      text1: 'Başarıyla Eklendi',
      text2: `${inputVal} ${unit} ${selectedFood.name} günlüğe kaydedildi.`,
      position: 'top',
      topOffset: 60,
    });
    
    closeBottomSheet();
    navigation.navigate('MainTabs', { screen: 'DashboardTab' });
  };

  // UI Renders
  const renderFoodCard = ({ item }) => {
    // Safely get macros
    const cals = item.macros?.calories ? Math.round(item.macros.calories) : 0;
    const pro = item.macros?.protein ? Math.round(item.macros.protein) : 0;
    const carb = item.macros?.carbs ? Math.round(item.macros.carbs) : 0;
    const fat = item.macros?.fat ? Math.round(item.macros.fat) : 0;

    return (
      <TouchableOpacity
        style={styles.foodCard}
        onPress={() => openBottomSheet(item)}
        activeOpacity={0.8}
      >
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodDesc} numberOfLines={1}>{item.description}</Text>
          
          <View style={styles.macroBadges}>
            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <MaterialCommunityIcons name="fire" size={12} color={COLORS.accent} />
              <Text style={[styles.badgeText, { color: COLORS.text }]}>{cals} kcal</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(255,107,107,0.1)' }]}>
              <Text style={[styles.badgeText, { color: '#FF6B6B' }]}>P: {pro}g</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(77,171,247,0.1)' }]}>
              <Text style={[styles.badgeText, { color: '#4DABF7' }]}>K: {carb}g</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(252,196,25,0.1)' }]}>
              <Text style={[styles.badgeText, { color: '#FCC419' }]}>Y: {fat}g</Text>
            </View>
          </View>
        </View>

        <View style={styles.addIconContainer}>
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecentSearches = () => {
    if (!recentSearches || recentSearches.length === 0) return null;
    return (
      <View style={{ paddingHorizontal: SPACING.lg, marginBottom: SPACING.md }}>
        <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary, fontSize: 12, marginBottom: SPACING.sm }}>
          Son Aramalar
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentSearches.map((s, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
              onPress={() => {
                setQuery(s);
                handleSearch(s);
              }}
            >
              <Text style={{ color: COLORS.text, fontSize: 12 }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderQuickAccess = () => {
    const displayFoods = (recentFoods && recentFoods.length > 0) ? recentFoods : MOCK_QUICK_FOODS;
    const title = (recentFoods && recentFoods.length > 0) ? 'Son Eklenenler' : 'Sık Tüketilenler';

    return (
      <View style={styles.quickAccessSection}>
        {renderRecentSearches()}
        <Text style={styles.sectionTitle}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.lg }}>
          {displayFoods.map(food => (
            <TouchableOpacity key={food.id} style={styles.quickCard} onPress={() => openBottomSheet(food)}>
              <View style={styles.quickIconCircle}>
                <MaterialCommunityIcons name="food-apple" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.quickCardName} numberOfLines={1}>{food.name}</Text>
              <Text style={styles.quickCardCals}>{Math.round(food.macros.calories)} kcal</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.background, COLORS.card, COLORS.background]} style={styles.gradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{mealType} Ekle</Text>
            <Text style={styles.headerSubtitle}>Akıllı besin arama motoru</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Smart Search Bar */}
          <View style={styles.searchWrapper}>
            <MaterialCommunityIcons name="magnify" size={24} color={COLORS.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Örn: 2 yumurta ve 1 dilim kepek ekmeği..."
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={() => { setQuery(''); setHasSearched(false); setResults([]); }}>
                <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.searchActionBtn} onPress={handleSearch}>
              <MaterialCommunityIcons name="auto-fix" size={20} color={COLORS.background} />
            </TouchableOpacity>
          </View>

          {/* Results / Quick Access */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Yapay zeka besin değerlerini hesaplıyor...</Text>
            </View>
          ) : hasSearched ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              renderItem={renderFoodCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyList}>
                  <MaterialCommunityIcons name="food-off" size={48} color={COLORS.textMuted} />
                  <Text style={styles.emptyListText}>Sonuç bulunamadı.</Text>
                </View>
              )}
            />
          ) : (
            renderQuickAccess()
          )}
        </View>

      </LinearGradient>

      {/* Bottom Sheet Modal */}
      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={closeBottomSheet}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackgroundTouchable} activeOpacity={1} onPress={closeBottomSheet} />
          
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>{selectedFood?.name}</Text>
                <Text style={styles.sheetSubtitle}>{selectedFood?.description}</Text>
              </View>
              <View style={styles.sheetMacroBox}>
                <MaterialCommunityIcons name="fire" size={16} color={COLORS.accent} />
                <Text style={styles.sheetMacroText}>{Math.round(dynamicCalories)} kcal</Text>
                <Text style={styles.sheetMacroSub}>Toplam</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>Miktar ve Birim</Text>
            <View style={styles.unitSelector}>
              {['Gram', 'Porsiyon', 'Adet'].map((u) => {
                if (u === 'Adet' && (!selectedFood?.pieceWeight || selectedFood.pieceWeight <= 0)) return null;
                if (u === 'Porsiyon' && (!selectedFood?.portionWeight || selectedFood.portionWeight <= 0)) return null;
                
                return (
                  <TouchableOpacity 
                    key={u} 
                    style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                    onPress={() => {
                      setUnit(u);
                      if (u === 'Gram') setAmountInput('100');
                      else setAmountInput('1');
                    }}
                  >
                    <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>{u}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
              <HorizontalSlider
                value={parseFloat(amountInput.replace(',', '.')) || (unit === 'Gram' ? 100 : 1)}
                min={unit === 'Gram' ? 1 : 0.5} 
                max={unit === 'Gram' ? 1000 : 20} 
                step={unit === 'Gram' ? 1 : 0.5}
                onChange={(val) => setAmountInput(val.toString())}
                color={COLORS.primary}
                unit={unit}
              />
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddFood} activeOpacity={0.9}>
              <Text style={styles.addButtonText}>Günlüğe Ekle</Text>
              <MaterialCommunityIcons name="plus-circle" size={20} color={COLORS.background} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: SPACING.xs, marginRight: SPACING.md },
  headerTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.xl, color: COLORS.text },
  headerSubtitle: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  
  content: { flex: 1, paddingTop: SPACING.lg },
  
  // Search Bar
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 54,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: SPACING.xl,
    ...SHADOWS.glow,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    height: '100%',
  },
  clearBtn: { padding: SPACING.xs },
  searchActionBtn: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },

  // Loading & Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptyList: { alignItems: 'center', marginTop: 100 },
  emptyListText: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textSecondary, marginTop: SPACING.md },

  // List
  listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  
  // Card
  foodCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  foodInfo: { flex: 1, marginRight: SPACING.md },
  foodName: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: FONT_SIZE.md, marginBottom: 2 },
  foodDesc: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textMuted, fontSize: 11, marginBottom: SPACING.sm },
  
  macroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 9 },

  addIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(64,192,87,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(64,192,87,0.3)',
  },

  // Quick Access
  quickAccessSection: { paddingHorizontal: SPACING.lg, marginTop: SPACING.md },
  sectionTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: FONT_SIZE.md, marginBottom: SPACING.md },
  quickCard: {
    width: 110,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(64,192,87,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickCardName: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: 11, textAlign: 'center', marginBottom: 2 },
  quickCardCals: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textSecondary, fontSize: 10 },

  // Bottom Sheet
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalBackgroundTouchable: { flex: 1 },
  bottomSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.lg },
  
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  sheetTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: FONT_SIZE.lg },
  sheetSubtitle: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textMuted, fontSize: FONT_SIZE.sm, marginTop: 2 },
  sheetMacroBox: { alignItems: 'flex-end' },
  sheetMacroText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.accent, fontSize: FONT_SIZE.md },
  sheetMacroSub: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textMuted, fontSize: 10 },

  inputLabel: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.md },
  
  unitSelector: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: BORDER_RADIUS.md, padding: 4, marginBottom: SPACING.xl },
  unitBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: BORDER_RADIUS.sm },
  unitBtnActive: { backgroundColor: COLORS.primary },
  unitBtnText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textMuted, fontSize: FONT_SIZE.sm },
  unitBtnTextActive: { color: COLORS.background },

  inputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xxl },
  amountInput: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 48,
    color: COLORS.text,
    borderBottomWidth: 2,
    borderColor: COLORS.primary,
    minWidth: 100,
    textAlign: 'center',
    paddingVertical: 0,
  },
  amountUnit: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary, fontSize: FONT_SIZE.lg, marginLeft: SPACING.sm, marginTop: 15 },

  addButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  addButtonText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.background, fontSize: FONT_SIZE.md },
});
