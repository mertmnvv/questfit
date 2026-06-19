import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { useThemeColors } from '../hooks/useThemeColors';
import { useUserStore } from '../store/userStore';
import { logoutUser } from '../services/authService';
import { SPACING, FONT_SIZE, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';
import HorizontalSlider from '../components/HorizontalSlider';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const COLORS_THEME = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS_THEME), [COLORS_THEME]);
  const navigation = useNavigation();

  // Zustand Store values
  const {
    profile,
    updateProfileField,
    setAppTheme,
    setAppLanguage,
    setTutorialSeen,
    clearStore,
    appTheme,
  } = useUserStore();

  // Modals Visibility State
  const [microsModalVisible, setMicrosModalVisible] = useState(false);
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [stepModalVisible, setStepModalVisible] = useState(false);

  // Inputs State
  const [waterInput, setWaterInput] = useState(profile?.customMicros?.water?.toString() || '2.5');
  const [fiberInput, setFiberInput] = useState(profile?.customMicros?.fiber?.toString() || '30');
  const [nicknameInput, setNicknameInput] = useState(profile?.nickname || '');
  const [stepInput, setStepInput] = useState(profile?.stepTarget?.toString() || '10000');

  // Log out user
  const handleLogout = async () => {
    try {
      await logoutUser();
      clearStore(); // clear local store state
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Replay Onboarding Walkthrough
  const handleReplayTutorial = () => {
    setTutorialSeen(false);
    Toast.show({
      type: 'success',
      text1: t('common.success'),
      text2: t('common.back') === 'Geri' ? 'Rehber sıfırlandı!' : 'Tutorial reset!',
      position: 'top',
      topOffset: 60,
    });
    navigation.navigate('DashboardTab');
  };

  // Save targets: water & fiber
  const handleSaveMicros = () => {
    const newWater = parseFloat(waterInput.replace(',', '.')) || 2.5;
    const newFiber = parseInt(fiberInput, 10) || 30;

    const customMicros = {
      water: newWater,
      fiber: newFiber,
    };

    updateProfileField('customMicros', customMicros);
    setMicrosModalVisible(false);
    Toast.show({
      type: 'success',
      text1: t('common.success'),
      text2: t('common.back') === 'Geri' ? 'Hedef limitler güncellendi!' : 'Nutrition targets updated!',
      position: 'top',
      topOffset: 60,
    });
  };

  // Save user name/nickname
  const handleSaveNickname = () => {
    if (nicknameInput.trim() !== '') {
      updateProfileField('nickname', nicknameInput.trim());
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('common.back') === 'Geri' ? 'Kullanıcı adı güncellendi!' : 'Nickname updated!',
        position: 'top',
        topOffset: 60,
      });
    }
    setNicknameModalVisible(false);
  };

  // Save Step Target
  const handleSaveStepTarget = () => {
    const target = parseInt(stepInput, 10) || 10000;
    updateProfileField('stepTarget', target);
    setStepModalVisible(false);
    Toast.show({
      type: 'success',
      text1: t('common.success'),
      text2: t('common.back') === 'Geri' ? 'Adım hedefi güncellendi!' : 'Step target updated!',
      position: 'top',
      topOffset: 60,
    });
  };

  // Toggle Language
  const toggleLanguage = () => {
    const newLang = i18n.language === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
    setAppLanguage(newLang);
  };

  // Toggle Dark/Light Theme
  const toggleTheme = () => {
    setAppTheme(appTheme === 'dark' ? 'light' : 'dark');
  };

  // Calculated Level XP Progress
  const maxXp = useMemo(() => {
    const currentLevel = profile?.level || 1;
    return 200 * Math.pow(2, currentLevel - 1);
  }, [profile?.level]);

  const xpProgress = useMemo(() => {
    const currentXp = profile?.exp || 0;
    return Math.min(100, Math.max(0, (currentXp / maxXp) * 100));
  }, [profile?.exp, maxXp]);

  const getGoalLabel = (goalKey) => {
    if (goalKey === 'Lose Weight' || goalKey === 'Lose') return t('profile.goalLose');
    if (goalKey === 'Maintain Weight' || goalKey === 'Maintain') return t('profile.goalMaintain');
    if (goalKey === 'Build Muscle' || goalKey === 'Gain') return t('profile.goalGain');
    return goalKey;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS_THEME.background, COLORS_THEME.card, COLORS_THEME.background]} style={styles.gradient}>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header Profile Section */}
          <LinearGradient colors={['rgba(64,192,87,0.15)', 'rgba(64,192,87,0.01)']} style={styles.headerProfileCard}>
            <View style={styles.crestCircle}>
              <MaterialCommunityIcons name="shield-crown" size={48} color={COLORS_THEME.primary} />
            </View>
            <View style={styles.crestLevelBadge}>
              <Text style={styles.crestLevelText}>LEVEL {profile?.level || 1}</Text>
            </View>

            <TouchableOpacity 
              style={styles.nicknameRow} 
              onPress={() => { setNicknameInput(profile?.nickname || ''); setNicknameModalVisible(true); }}
            >
              <Text style={styles.nicknameText}>{profile?.nickname || 'User'}</Text>
              <MaterialCommunityIcons name="pencil-circle" size={20} color={COLORS_THEME.primary} style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <View style={styles.xpContainer}>
              <Text style={styles.xpProgressText}>{profile?.exp || 0} / {maxXp} XP</Text>
              <View style={styles.xpBarBg}>
                <LinearGradient 
                  colors={['#40C057', '#2B8A3E']} 
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} 
                  style={[styles.xpBarFill, { width: `${xpProgress}%` }]} 
                />
              </View>
            </View>
          </LinearGradient>

          {/* Settings Section */}
          <View style={styles.settingsContainer}>
            
            {/* Preferences Group */}
            <Text style={styles.settingsGroupTitle}>{t('profile.settings')}</Text>
            <View style={styles.settingsGroup}>
              
              {/* Weight & Stats Navigation */}
              <TouchableOpacity style={styles.settingsRow} onPress={() => navigation.navigate('Stats')}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(250,176,5,0.1)' }]}>
                  <MaterialCommunityIcons name="scale-bathroom" size={22} color="#FAB005" />
                </View>
                <View style={styles.settingsTextContainer}>
                  <Text style={styles.settingsLabel}>{t('common.back') === 'Geri' ? 'Kilo ve İstatistikler' : 'Weight & Stats'}</Text>
                  <Text style={styles.settingsValue}>{profile?.weight || '75'} kg</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS_THEME.textSecondary} />
              </TouchableOpacity>
              
              <View style={styles.settingsDivider} />

              <TouchableOpacity style={styles.settingsRow} onPress={() => setGoalModalVisible(true)}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(64,192,87,0.1)' }]}>
                  <MaterialCommunityIcons name="target" size={22} color={COLORS_THEME.primary} />
                </View>
                <View style={styles.settingsTextContainer}>
                  <Text style={styles.settingsLabel}>{t('common.back') === 'Geri' ? 'Diyet Hedefi' : 'Diet Goal'}</Text>
                  <Text style={styles.settingsValue}>{getGoalLabel(profile?.goal)}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS_THEME.textSecondary} />
              </TouchableOpacity>
              
              <View style={styles.settingsDivider} />

              <TouchableOpacity style={styles.settingsRow} onPress={() => {
                  setWaterInput(profile?.customMicros?.water?.toString() || '2.5');
                  setFiberInput(profile?.customMicros?.fiber?.toString() || '30');
                  setMicrosModalVisible(true);
                }}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(77,171,247,0.1)' }]}>
                  <MaterialCommunityIcons name="water-percent" size={22} color="#4DABF7" />
                </View>
                <View style={styles.settingsTextContainer}>
                  <Text style={styles.settingsLabel}>{t('profile.microTargets')}</Text>
                  <Text style={styles.settingsValue}>{profile?.customMicros?.water || '2.5'}L / {profile?.customMicros?.fiber || '30'}g</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS_THEME.textSecondary} />
              </TouchableOpacity>

              <View style={styles.settingsDivider} />

              <TouchableOpacity style={styles.settingsRow} onPress={() => {
                  setStepInput(profile?.stepTarget?.toString() || '10000');
                  setStepModalVisible(true);
                }}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255,146,43,0.1)' }]}>
                  <MaterialCommunityIcons name="shoe-print" size={22} color="#FF922B" />
                </View>
                <View style={styles.settingsTextContainer}>
                  <Text style={styles.settingsLabel}>{t('common.back') === 'Geri' ? 'Adım Hedefi' : 'Step Target'}</Text>
                  <Text style={styles.settingsValue}>{profile?.stepTarget || '10000'} {t('common.back') === 'Geri' ? 'adım' : 'steps'}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS_THEME.textSecondary} />
              </TouchableOpacity>

            </View>

            {/* System Group */}
            <Text style={styles.settingsGroupTitle}>{t('common.back') === 'Geri' ? 'Sistem Tercihleri' : 'System Preferences'}</Text>
            <View style={styles.settingsGroup}>
              
              <TouchableOpacity style={styles.settingsRow} onPress={toggleLanguage}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(252,196,25,0.1)' }]}>
                  <MaterialCommunityIcons name="translate" size={22} color="#FCC419" />
                </View>
                <View style={styles.settingsTextContainer}>
                  <Text style={styles.settingsLabel}>{t('common.back') === 'Geri' ? 'Uygulama Dili' : 'App Language'}</Text>
                  <Text style={styles.settingsValue}>{i18n.language === 'tr' ? 'Türkçe' : 'English'}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS_THEME.textSecondary} />
              </TouchableOpacity>

              <View style={styles.settingsDivider} />

              <TouchableOpacity style={styles.settingsRow} onPress={toggleTheme}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(151,117,250,0.1)' }]}>
                  <MaterialCommunityIcons name={appTheme === 'dark' ? 'weather-night' : 'weather-sunny'} size={22} color="#9775FA" />
                </View>
                <View style={styles.settingsTextContainer}>
                  <Text style={styles.settingsLabel}>{t('common.back') === 'Geri' ? 'Görünüm' : 'Appearance'}</Text>
                  <Text style={styles.settingsValue}>{appTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
                </View>
                <MaterialCommunityIcons name="theme-light-dark" size={24} color={COLORS_THEME.textSecondary} />
              </TouchableOpacity>

            </View>

            {/* Account Actions Group */}
            <Text style={styles.settingsGroupTitle}>{t('common.back') === 'Geri' ? 'Hesap İşlemleri' : 'Account Actions'}</Text>
            <View style={styles.settingsGroup}>
              
              <TouchableOpacity style={styles.settingsRow} onPress={handleReplayTutorial}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(32,201,151,0.1)' }]}>
                  <MaterialCommunityIcons name="information-variant" size={22} color="#20C997" />
                </View>
                <View style={styles.settingsTextContainer}>
                  <Text style={styles.settingsLabel}>{t('profile.replayTutorial')}</Text>
                </View>
                <MaterialCommunityIcons name="refresh" size={24} color={COLORS_THEME.textSecondary} />
              </TouchableOpacity>

              <View style={styles.settingsDivider} />

              <TouchableOpacity style={styles.settingsRow} onPress={handleLogout}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(250,82,82,0.1)' }]}>
                  <MaterialCommunityIcons name="logout-variant" size={22} color="#FA5252" />
                </View>
                <View style={styles.settingsTextContainer}>
                  <Text style={[styles.settingsLabel, { color: COLORS_THEME.error }]}>{t('profile.logout')}</Text>
                </View>
                <MaterialCommunityIcons name="exit-to-app" size={24} color={COLORS_THEME.error} />
              </TouchableOpacity>

            </View>

          </View>

          {/* Footer version label */}
          <Text style={styles.versionLabel}>QuestFit v1.0.0</Text>

          <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />
        </ScrollView>
      </LinearGradient>

      {/* Modals */}
      {/* 1. Custom Nutrition Targets Modal */}
      <Modal visible={microsModalVisible} transparent={true} animationType="slide" onRequestClose={() => setMicrosModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{t('profile.microTargets')}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400, width: '100%' }}>
              <View style={{ alignItems: 'center' }}>
                <HorizontalSlider 
                  title={t('profile.waterTarget')}
                  value={parseFloat(waterInput.replace(',', '.')) || 2.5} 
                  min={1} max={8} step={0.1} 
                  onChange={(val) => setWaterInput(val.toString())} 
                  color="#4DABF7" unit="L" 
                />

                <HorizontalSlider 
                  title={t('profile.fiberTarget')}
                  value={parseInt(fiberInput, 10) || 30} 
                  min={10} max={100} step={1} 
                  onChange={(val) => setFiberInput(val.toString())} 
                  color="#40C057" unit="g" 
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setMicrosModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleSaveMicros}>
                <Text style={styles.confirmBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Nickname Change Modal */}
      <Modal visible={nicknameModalVisible} transparent={true} animationType="slide" onRequestClose={() => setNicknameModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{t('profile.changeNickname')}</Text>
            <Text style={styles.modalInputLabel}>{t('profile.nickname')}</Text>
            <TextInput style={styles.modalInput} value={nicknameInput} onChangeText={setNicknameInput} maxLength={20} placeholderTextColor={COLORS_THEME.textSecondary} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setNicknameModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleSaveNickname}>
                <Text style={styles.confirmBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Goal Change Modal */}
      <Modal visible={goalModalVisible} transparent={true} animationType="fade" onRequestClose={() => setGoalModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{t('profile.changeGoal')}</Text>
            
            <TouchableOpacity style={[styles.modalSelectItem, profile?.goal === 'Lose Weight' && styles.modalSelectItemActive]} onPress={() => { updateProfileField('goal', 'Lose Weight'); setGoalModalVisible(false); }}>
              <View>
                <Text style={[styles.modalSelectItemText, profile?.goal === 'Lose Weight' && { color: COLORS_THEME.primary }]}>{t('profile.goalLose')}</Text>
                <Text style={[styles.modalSelectItemDesc, profile?.goal === 'Lose Weight' && { color: COLORS_THEME.primary }]}>{t('common.back') === 'Geri' ? 'Kalori açığı oluşturarak yağ yakımına odaklan.' : 'Focus on fat burn by creating a calorie deficit.'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalSelectItem, profile?.goal === 'Maintain Weight' && styles.modalSelectItemActive]} onPress={() => { updateProfileField('goal', 'Maintain Weight'); setGoalModalVisible(false); }}>
              <View>
                <Text style={[styles.modalSelectItemText, profile?.goal === 'Maintain Weight' && { color: COLORS_THEME.primary }]}>{t('profile.goalMaintain')}</Text>
                <Text style={[styles.modalSelectItemDesc, profile?.goal === 'Maintain Weight' && { color: COLORS_THEME.primary }]}>{t('common.back') === 'Geri' ? 'Mevcut kilonu koru ve daha sağlıklı beslen.' : 'Maintain current weight and eat healthier.'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalSelectItem, { marginBottom: SPACING.lg }, profile?.goal === 'Build Muscle' && styles.modalSelectItemActive]} onPress={() => { updateProfileField('goal', 'Build Muscle'); setGoalModalVisible(false); }}>
              <View>
                <Text style={[styles.modalSelectItemText, profile?.goal === 'Build Muscle' && { color: COLORS_THEME.primary }]}>{t('profile.goalGain')}</Text>
                <Text style={[styles.modalSelectItemDesc, profile?.goal === 'Build Muscle' && { color: COLORS_THEME.primary }]}>{t('common.back') === 'Geri' ? 'Kalori fazlası oluşturarak kas kütleni artır.' : 'Increase muscle mass by creating a calorie surplus.'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setGoalModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. Step Target Modal */}
      <Modal visible={stepModalVisible} transparent={true} animationType="fade" onRequestClose={() => setStepModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{t('common.back') === 'Geri' ? 'Adım Hedefi' : 'Step Target'}</Text>
            
            <HorizontalSlider 
              value={parseInt(stepInput, 10) || 10000} 
              min={1000} max={30000} step={100} 
              onChange={(val) => setStepInput(val.toString())} 
              color="#FF922B" unit={t('common.back') === 'Geri' ? 'adım' : 'steps'} 
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setStepModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleSaveStepTarget}>
                <Text style={styles.confirmBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: SPACING.lg,
  },
  
  // Header Card
  headerProfileCard: {
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xxl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  crestCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    borderWidth: 3,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  crestLevelBadge: {
    marginTop: -14,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  crestLevelText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 12,
    color: '#0D1117',
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  nicknameText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.text,
  },
  xpContainer: {
    width: '100%',
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  xpProgressText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 1,
  },
  xpBarBg: {
    width: '85%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },

  // Settings Section
  settingsContainer: {
    marginBottom: SPACING.xl,
  },
  settingsGroupTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: SPACING.sm,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  settingsGroup: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginLeft: 60, // Align with text
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  settingsValue: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  versionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },

  // Modal Styles (kept generic and consistent)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '85%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalInputLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  cancelBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  confirmBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#0D1117',
  },
  modalSelectItem: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
  },
  modalSelectItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(64,192,87,0.05)',
  },
  modalSelectItemText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalSelectItemDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.textSecondary,
  },
});
