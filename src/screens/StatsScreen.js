import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';

import { useThemeColors } from '../hooks/useThemeColors';
import { useUserStore } from '../store/userStore';
import { fetchStepHistory } from '../services/healthService';
import { SPACING, FONT_SIZE, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';
import HorizontalSlider from '../components/HorizontalSlider';

const { width } = Dimensions.get('window');
const chartWidth = width - SPACING.lg * 2;

export default function StatsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const COLORS_THEME = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS_THEME), [COLORS_THEME]);

  const { weightHistory, calorieHistory, stepHistory, consumedToday, profile, updateWeight, updateStepHistory } = useUserStore();

  const [timeRange, setTimeRange] = useState('7d'); // '7d' or '30d'
  const [weightInput, setWeightInput] = useState(profile?.weight?.toString() || '75');

  const handleSaveWeight = () => {
    const newWeight = parseFloat(weightInput.replace(',', '.')) || parseFloat(profile?.weight);
    if (newWeight) {
      updateWeight(newWeight);
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('common.back') === 'Geri' ? 'Kilonuz başarıyla güncellendi!' : 'Weight updated successfully!',
        position: 'top',
        topOffset: 60,
      });
    }
  };

  useEffect(() => {
    const loadSteps = async () => {
      const days = timeRange === '7d' ? 7 : 30;
      const history = await fetchStepHistory(days);
      if (history && history.length > 0) {
        updateStepHistory(history);
      }
    };
    loadSteps();
  }, [timeRange]);

  // --- Weight Data ---
  const weightDataPoints = useMemo(() => {
    let history = weightHistory || [];
    const days = timeRange === '7d' ? 7 : 30;
    history = history.slice(-days);
    
    if (history.length < 2) return null;

    const labels = history.map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    const data = history.map(d => parseFloat(d.weight));

    return { labels, data };
  }, [weightHistory, timeRange]);

  // --- Calories Data (Bar Chart) ---
  const calorieDataPoints = useMemo(() => {
    let history = calorieHistory || [];
    const days = timeRange === '7d' ? 7 : 30;
    
    history = history.slice(-days);

    if (history.length === 0) return null;

    const displayHistory = timeRange === '7d' ? history : history.slice(-7);

    const labels = displayHistory.map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    const data = displayHistory.map(d => d.calories || 0);

    return { labels, data };
  }, [calorieHistory, timeRange]);

  // --- Step Data (Bar Chart) ---
  const stepDataPoints = useMemo(() => {
    let history = stepHistory || [];
    const days = timeRange === '7d' ? 7 : 30;
    
    const displayHistory = history.slice(-days);

    if (displayHistory.length === 0) return null;

    const labels = displayHistory.map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    const data = displayHistory.map(d => d.steps || 0);

    return { labels, data };
  }, [stepHistory, timeRange]);

  // --- Macros Data (Pie Chart) ---
  const macroDataPoints = useMemo(() => {
    const p = consumedToday?.protein || 0;
    const c = consumedToday?.carbs || 0;
    const f = consumedToday?.fat || 0;

    if (p === 0 && c === 0 && f === 0) return null;

    return [
      {
        name: t('common.back') === 'Geri' ? ' Protein' : ' Protein',
        amount: Math.round(p),
        color: '#FF6B6B',
        legendFontColor: COLORS_THEME.text,
        legendFontSize: 12
      },
      {
        name: t('common.back') === 'Geri' ? ' Karb' : ' Carbs',
        amount: Math.round(c),
        color: '#4DABF7',
        legendFontColor: COLORS_THEME.text,
        legendFontSize: 12
      },
      {
        name: t('common.back') === 'Geri' ? ' Yağ' : ' Fat',
        amount: Math.round(f),
        color: '#FCC419',
        legendFontColor: COLORS_THEME.text,
        legendFontSize: 12
      }
    ];
  }, [consumedToday, COLORS_THEME, t]);

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(64, 192, 87, ${opacity})`,
    labelColor: (opacity = 1) => COLORS_THEME.textSecondary,
    style: { borderRadius: BORDER_RADIUS.md },
    propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS_THEME.primary },
    propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.05)' },
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS_THEME.background, COLORS_THEME.card, COLORS_THEME.background]} style={styles.gradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS_THEME.text} />
          </TouchableOpacity>
          <View style={{flex: 1}}>
            <Text style={styles.headerTitle}>{t('common.back') === 'Geri' ? 'İstatistikler' : 'Statistics'}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Top Hero Card: Weight Entry Panel */}
          <LinearGradient colors={['rgba(64,192,87,0.15)', 'rgba(64,192,87,0.02)']} style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={[styles.heroIconBox, { backgroundColor: 'rgba(64,192,87,0.2)' }]}>
                <MaterialCommunityIcons name="scale-bathroom" size={24} color={COLORS_THEME.primary} />
              </View>
              <View style={{ marginLeft: SPACING.sm }}>
                <Text style={styles.heroTitle}>{t('common.back') === 'Geri' ? 'Bugünün Kilosu' : "Today's Weight"}</Text>
                <Text style={styles.heroSubtitle}>{t('common.back') === 'Geri' ? 'Hedefine ne kadar yakınsın?' : 'How close are you to your goal?'}</Text>
              </View>
            </View>

            <View style={{ alignItems: 'center', marginTop: SPACING.md }}>
              <HorizontalSlider
                value={parseFloat(weightInput.replace(',', '.')) || parseFloat(profile?.weight) || 75}
                min={30} max={200} step={0.1}
                onChange={(val) => setWeightInput(val.toString())}
                color={COLORS_THEME.primary}
                unit="kg"
              />
              
              <TouchableOpacity style={[styles.heroSaveBtn, { width: '100%', alignItems: 'center', marginTop: SPACING.lg }]} onPress={handleSaveWeight} activeOpacity={0.8}>
                <Text style={styles.heroSaveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Time Range Pills */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, timeRange === '7d' && styles.tabActive]}
              onPress={() => setTimeRange('7d')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, timeRange === '7d' && styles.tabTextActive]}>
                {t('common.back') === 'Geri' ? 'Son 7 Gün' : 'Last 7 Days'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, timeRange === '30d' && styles.tabActive]}
              onPress={() => setTimeRange('30d')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, timeRange === '30d' && styles.tabTextActive]}>
                {t('common.back') === 'Geri' ? 'Son 30 Gün' : 'Last 30 Days'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chart 1: Weight Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <MaterialCommunityIcons name="chart-bell-curve" size={20} color={COLORS_THEME.primary} />
              <Text style={styles.chartTitle}>{t('common.back') === 'Geri' ? 'Kilo Değişimi' : 'Weight Trend'}</Text>
            </View>
            
            {weightDataPoints ? (
              <View style={styles.chartWrapper}>
                <LineChart
                  data={{ labels: weightDataPoints.labels, datasets: [{ data: weightDataPoints.data }] }}
                  width={chartWidth - SPACING.lg * 2 + 16}
                  height={220}
                  yAxisSuffix="kg"
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chartStyle}
                />
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>{t('common.back') === 'Geri' ? 'Yeterli kilo verisi yok.' : 'Not enough weight data.'}</Text>
              </View>
            )}
          </View>

          {/* Chart 2: Calories Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <MaterialCommunityIcons name="fire" size={20} color="#4DABF7" />
              <Text style={styles.chartTitle}>{t('common.back') === 'Geri' ? 'Alınan Kaloriler' : 'Consumed Calories'}</Text>
            </View>

            {calorieDataPoints ? (
              <View style={styles.chartWrapper}>
                <BarChart
                  data={{ labels: calorieDataPoints.labels, datasets: [{ data: calorieDataPoints.data }] }}
                  width={chartWidth - SPACING.lg * 2 + 16}
                  height={220}
                  yAxisSuffix=""
                  chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(77, 171, 247, ${opacity})` }}
                  style={styles.chartStyle}
                />
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>{t('common.back') === 'Geri' ? 'Geçmiş kalori verisi bulunamadı.' : 'No calorie history found.'}</Text>
              </View>
            )}
          </View>

          {/* Chart 3: Step Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <MaterialCommunityIcons name="shoe-print" size={20} color="#FF922B" />
              <Text style={styles.chartTitle}>{t('common.back') === 'Geri' ? 'Adım Geçmişi' : 'Step History'}</Text>
            </View>

            {stepDataPoints ? (
              <View style={styles.chartWrapper}>
                <BarChart
                  data={{ labels: stepDataPoints.labels, datasets: [{ data: stepDataPoints.data }] }}
                  width={chartWidth - SPACING.lg * 2 + 16}
                  height={220}
                  yAxisSuffix=""
                  chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(255, 146, 43, ${opacity})` }}
                  style={styles.chartStyle}
                />
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>{t('common.back') === 'Geri' ? 'Geçmiş adım verisi bulunamadı.' : 'No step history found.'}</Text>
              </View>
            )}
          </View>

          {/* Chart 4: Macros Pie Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <MaterialCommunityIcons name="chart-pie" size={20} color="#FCC419" />
              <Text style={styles.chartTitle}>{t('common.back') === 'Geri' ? 'Bugünkü Makro Dağılımı' : "Today's Macro Split"}</Text>
            </View>

            {macroDataPoints ? (
              <View style={styles.chartWrapper}>
                <PieChart
                  data={macroDataPoints}
                  width={chartWidth - SPACING.lg * 2 + 16}
                  height={200}
                  chartConfig={chartConfig}
                  accessor={"amount"}
                  backgroundColor={"transparent"}
                  paddingLeft={"15"}
                  absolute
                />
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>{t('common.back') === 'Geri' ? 'Bugün henüz öğün eklenmedi.' : 'No meals added today.'}</Text>
              </View>
            )}
          </View>

          <View style={{height: 100}} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (COLORS_THEME) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS_THEME.background },
  gradient: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS_THEME.border,
  },
  backBtn: { padding: SPACING.xs, marginRight: SPACING.md },
  headerTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.xl, color: COLORS_THEME.text },
  
  scrollContent: { padding: SPACING.lg },
  
  // Hero Card (Weight Entry)
  heroCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS_THEME.text,
  },
  heroSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS_THEME.textSecondary,
    marginTop: 2,
  },
  heroInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS_THEME.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  heroInput: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS_THEME.text,
    padding: 0,
  },
  heroInputUnit: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.md,
    color: COLORS_THEME.textSecondary,
    marginRight: SPACING.md,
  },
  heroSaveBtn: {
    backgroundColor: COLORS_THEME.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.glow,
  },
  heroSaveBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#0D1117',
    fontSize: FONT_SIZE.md,
  },

  // Pill Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS_THEME.card,
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
  },
  tab: { 
    flex: 1, 
    paddingVertical: SPACING.sm, 
    alignItems: 'center', 
    borderRadius: BORDER_RADIUS.full 
  },
  tabActive: { backgroundColor: COLORS_THEME.primary },
  tabText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS_THEME.textSecondary, fontSize: FONT_SIZE.sm },
  tabTextActive: { color: '#0D1117' },

  // Chart Cards
  chartCard: {
    backgroundColor: COLORS_THEME.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    ...SHADOWS.card,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  chartTitle: { 
    fontFamily: TYPOGRAPHY.fontFamily.bold, 
    fontSize: FONT_SIZE.md, 
    color: COLORS_THEME.text,
    marginLeft: SPACING.sm,
  },
  chartWrapper: {
    alignItems: 'center',
    marginLeft: -10, // Adjust for internal chart kit paddings
  },
  chartStyle: { borderRadius: BORDER_RADIUS.md },
  
  emptyChart: { height: 150, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: BORDER_RADIUS.md },
  emptyText: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS_THEME.textSecondary, fontSize: FONT_SIZE.sm },
});
