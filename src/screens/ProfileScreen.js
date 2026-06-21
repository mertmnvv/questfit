import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

import { useThemeColors } from '../hooks/useThemeColors';
import { useUserStore } from '../store/userStore';
import { logoutUser, updateUserAvatar } from '../services/authService';
import { getUserPosts, deletePost, updatePost } from '../services/communityService';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { SPACING, FONT_SIZE, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';
import HorizontalSlider from '../components/HorizontalSlider';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const COLORS_THEME = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS_THEME), [COLORS_THEME]);
  const navigation = useNavigation();

  const { user } = useAuth();
  const {
    profile, updateProfileField, setAppTheme, setAppLanguage, setTutorialSeen, clearStore, appTheme,
    notificationsEnabled, aiCustomPromptEnabled, setNotificationsEnabled, setAiCustomPromptEnabled
  } = useUserStore();

  // Screen States
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'posts'
  
  // Post States
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Avatar State
  const [avatarUrl, setAvatarUrl] = useState(user?.photoURL || null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Settings Modals State
  const [microsModalVisible, setMicrosModalVisible] = useState(false);
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [stepModalVisible, setStepModalVisible] = useState(false);

  // Settings Inputs State
  const [waterInput, setWaterInput] = useState(profile?.customMicros?.water?.toString() || '2.5');
  const [fiberInput, setFiberInput] = useState(profile?.customMicros?.fiber?.toString() || '30');
  const [nicknameInput, setNicknameInput] = useState(profile?.nickname || '');
  const [stepInput, setStepInput] = useState(profile?.stepTarget?.toString() || '10000');

  // --- Post Management ---
  const fetchMyPosts = useCallback(async () => {
    if (!user?.uid) return;
    setLoadingPosts(true);
    try {
      const posts = await getUserPosts(user.uid);
      setUserPosts(posts);
    } catch (error) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('toasts.postLoadedError') });
    } finally {
      setLoadingPosts(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchMyPosts();
    }
  }, [activeTab, fetchMyPosts]);

  const handleDeletePost = (postId) => {
    Alert.alert(
      t('profile.deletePostTitle'),
      t('profile.deletePostDesc'),
      [
        { text: t('common.cancel'), style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost(postId);
              setUserPosts(prev => prev.filter(p => p.id !== postId));
              Toast.show({ type: 'success', text1: t('toasts.deleted'), text2: t('toasts.postDeleted') });
            } catch (error) {
              Toast.show({ type: 'error', text1: t('common.error'), text2: t('toasts.deleteError') });
            }
          }
        }
      ]
    );
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setEditContent(post.content || '');
    setEditImage(post.imageUrl || null);
    setEditModalVisible(true);
  };

  const handlePickEditImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setEditImage(result.assets[0].uri);
    }
  };

  const handleUpdatePost = async () => {
    if (!editContent.trim() && !editImage) return;
    setIsSubmittingEdit(true);
    try {
      let finalImageUrl = editImage;
      if (editImage && editImage.startsWith('file://')) {
        finalImageUrl = await uploadImageToCloudinary(editImage);
      }

      await updatePost(editingPost.id, editContent, finalImageUrl);
      setUserPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, content: editContent, imageUrl: finalImageUrl } : p));
      setEditModalVisible(false);
      Toast.show({ type: 'success', text1: t('toasts.updated'), text2: t('toasts.postUpdated') });
    } catch (error) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('toasts.updateError') });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleChangeAvatar = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
      });
    if (!result.canceled && result.assets?.length > 0) {
      setAvatarLoading(true);
      try {
        const localUri = result.assets[0].uri;
        const uploadedUrl = await uploadImageToCloudinary(localUri);
        await updateUserAvatar(uploadedUrl);
        setAvatarUrl(uploadedUrl);
        Toast.show({ type: 'success', text1: t('common.success'), text2: t('toasts.profilePhotoUpdated') });
      } catch (error) {
        Toast.show({ type: 'error', text1: t('common.error'), text2: t('toasts.profilePhotoUpdateError') });
      } finally {
        setAvatarLoading(false);
      }
    }
    } catch (err) {
      console.log('Image picker error:', err);
      Toast.show({ type: 'error', text1: t('common.error'), text2: 'Resim seçilemedi' });
    }
  };

  // --- Settings Management (Kept Intact) ---
  const handleLogout = async () => {
    try {
      await logoutUser();
      clearStore();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleReplayTutorial = () => {
    setTutorialSeen(false);
    Toast.show({ type: 'success', text1: t('common.success'), text2: t('toasts.tutorialReset') });
    navigation.navigate('DashboardTab');
  };

  const handleSaveMicros = () => {
    const newWater = parseFloat(waterInput.replace(',', '.')) || 2.5;
    const newFiber = parseInt(fiberInput, 10) || 30;
    updateProfileField('customMicros', { water: newWater, fiber: newFiber });
    setMicrosModalVisible(false);
    Toast.show({ type: 'success', text1: t('common.success'), text2: t('toasts.targetsUpdated') });
  };

  const handleSaveNickname = () => {
    if (nicknameInput.trim() !== '') {
      updateProfileField('nickname', nicknameInput.trim());
      Toast.show({ type: 'success', text1: t('common.success'), text2: t('toasts.usernameUpdated') });
    }
    setNicknameModalVisible(false);
  };

  const handleSaveStepTarget = () => {
    const target = parseInt(stepInput, 10) || 10000;
    updateProfileField('stepTarget', target);
    setStepModalVisible(false);
    Toast.show({ type: 'success', text1: t('common.success'), text2: t('toasts.stepsUpdated') });
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
    setAppLanguage(newLang);
  };

  const toggleTheme = () => {
    setAppTheme(appTheme === 'dark' ? 'light' : 'dark');
  };



  const maxXp = useMemo(() => {
    const currentLevel = profile?.level || 1;
    return 200 * Math.pow(2, currentLevel - 1);
  }, [profile?.level]);

  const xpProgress = useMemo(() => {
    const currentXp = profile?.exp || 0;
    return Math.min(100, Math.max(0, (currentXp / maxXp) * 100));
  }, [profile?.exp, maxXp]);

  const getGoalLabel = (goalKey) => {
    if (!goalKey) return '';
    const key = goalKey.toLowerCase();
    if (key === 'lose weight' || key === 'lose') return t('profile.goalLose');
    if (key === 'maintain weight' || key === 'maintain') return t('profile.goalMaintain');
    if (key === 'build muscle' || key === 'gain') return t('profile.goalGain');
    
    // Fallback: İlk harfini büyüterek döndür
    return goalKey.charAt(0).toUpperCase() + goalKey.slice(1);
  };

  // --- Render Functions ---
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
        <TouchableOpacity style={styles.crestCircle} onPress={handleChangeAvatar} disabled={avatarLoading}>
          {avatarLoading ? (
            <ActivityIndicator size="small" color={COLORS_THEME.primary} />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <MaterialCommunityIcons name="camera-plus" size={24} color={COLORS_THEME.primary} />
          )}
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.nicknameRow}>
            <TouchableOpacity onPress={() => { setNicknameInput(profile?.nickname || ''); setNicknameModalVisible(true); }}>
              <Text style={styles.nicknameText}>{profile?.nickname || 'User'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setNicknameInput(profile?.nickname || ''); setNicknameModalVisible(true); }}>
              <MaterialCommunityIcons name="pencil-circle" size={18} color={COLORS_THEME.primary} style={{ marginLeft: 4, marginRight: 8 }} />
            </TouchableOpacity>
            <View style={styles.crestLevelBadge}>
              <Text style={styles.crestLevelText}>LVL {profile?.level || 1}</Text>
            </View>
          </View>

          <View style={styles.xpContainer}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
              <Text style={styles.xpProgressText}>XP</Text>
              <Text style={styles.xpProgressText}>{profile?.exp || 0} / {maxXp}</Text>
            </View>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${xpProgress}%`, backgroundColor: COLORS_THEME.primary }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'settings' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>{t('profile.settings')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'posts' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>{t('profile.myPosts')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPostItem = ({ item }) => {
    const dateStr = item.createdAt?.seconds 
      ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Şimdi';

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <Text style={styles.postDate}>{dateStr}</Text>
          </View>
          <View style={styles.postActions}>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.postActionBtn}>
              <Ionicons name="pencil" size={18} color={COLORS_THEME.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeletePost(item.id)} style={styles.postActionBtn}>
              <Ionicons name="trash-outline" size={18} color="#FA5252" />
            </TouchableOpacity>
          </View>
        </View>

        {item.content ? <Text style={styles.postText}>{item.content}</Text> : null}

        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
        )}
      </View>
    );
  };

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      {/* Preferences Group */}
      <Text style={styles.settingsGroupTitle}>{t('profile.settings')}</Text>
      <View style={styles.settingsGroup}>
        <TouchableOpacity style={styles.settingsRow} onPress={() => navigation.navigate('Stats')}>
          <View style={[styles.iconBox, { backgroundColor: '#FAB005' }]}><MaterialCommunityIcons name="scale-bathroom" size={22} color="#FFF" /></View>
          <View style={styles.settingsTextContainer}>
            <Text style={styles.settingsLabel}>{t('profile.weightAndStats')}</Text>
            <Text style={styles.settingsValue}>{profile?.weight || '75'} kg</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS_THEME.textSecondary} />
        </TouchableOpacity>
        <View style={styles.settingsDivider} />
        <TouchableOpacity style={styles.settingsRow} onPress={() => setGoalModalVisible(true)}>
          <View style={[styles.iconBox, { backgroundColor: COLORS_THEME.primary }]}><MaterialCommunityIcons name="target" size={22} color="#FFF" /></View>
          <View style={styles.settingsTextContainer}>
            <Text style={styles.settingsLabel}>{t('profile.dietTarget')}</Text>
            <Text style={styles.settingsValue}>{getGoalLabel(profile?.goal)}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS_THEME.textSecondary} />
        </TouchableOpacity>
        <View style={styles.settingsDivider} />
        <TouchableOpacity style={styles.settingsRow} onPress={() => { setWaterInput(profile?.customMicros?.water?.toString() || '2.5'); setFiberInput(profile?.customMicros?.fiber?.toString() || '30'); setMicrosModalVisible(true); }}>
          <View style={[styles.iconBox, { backgroundColor: '#4DABF7' }]}><MaterialCommunityIcons name="water-percent" size={22} color="#FFF" /></View>
          <View style={styles.settingsTextContainer}>
            <Text style={styles.settingsLabel}>{t('profile.microTargets')}</Text>
            <Text style={styles.settingsValue}>{profile?.customMicros?.water || '2.5'}L / {profile?.customMicros?.fiber || '30'}g</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS_THEME.textSecondary} />
        </TouchableOpacity>
        <View style={styles.settingsDivider} />
        <TouchableOpacity style={styles.settingsRow} onPress={() => { setStepInput(profile?.stepTarget?.toString() || '10000'); setStepModalVisible(true); }}>
          <View style={[styles.iconBox, { backgroundColor: '#FF922B' }]}><MaterialCommunityIcons name="shoe-print" size={22} color="#FFF" /></View>
          <View style={styles.settingsTextContainer}>
            <Text style={styles.settingsLabel}>{t('profile.stepTarget')}</Text>
            <Text style={styles.settingsValue}>{profile?.stepTarget || '10000'}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS_THEME.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* System Group */}
      <Text style={styles.settingsGroupTitle}>{t('profile.systemPrefs')}</Text>
      <View style={styles.settingsGroup}>
        <TouchableOpacity style={styles.settingsRow} onPress={toggleLanguage}>
          <View style={[styles.iconBox, { backgroundColor: '#FCC419' }]}><MaterialCommunityIcons name="translate" size={22} color="#FFF" /></View>
          <View style={styles.settingsTextContainer}>
            <Text style={styles.settingsLabel}>{t('profile.appLanguage')}</Text>
            <Text style={styles.settingsValue}>{i18n.language === 'tr' ? 'Türkçe' : 'English'}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS_THEME.textSecondary} />
        </TouchableOpacity>
        <View style={styles.settingsDivider} />
        <TouchableOpacity style={styles.settingsRow} onPress={toggleTheme}>
          <View style={[styles.iconBox, { backgroundColor: '#9775FA' }]}><MaterialCommunityIcons name={appTheme === 'dark' ? 'weather-night' : 'weather-sunny'} size={22} color="#FFF" /></View>
          <View style={styles.settingsTextContainer}>
            <Text style={styles.settingsLabel}>{t('profile.appearance') || 'Görünüm'}</Text>
            <Text style={styles.settingsValue}>{appTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
          </View>
          <MaterialCommunityIcons name="theme-light-dark" size={24} color={COLORS_THEME.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Account Actions Group */}
      <Text style={styles.settingsGroupTitle}>{t('profile.accountActions')}</Text>
      <View style={styles.settingsGroup}>
        <TouchableOpacity style={styles.settingsRow} onPress={handleReplayTutorial}>
          <View style={[styles.iconBox, { backgroundColor: '#20C997' }]}><MaterialCommunityIcons name="information-variant" size={22} color="#FFF" /></View>
          <View style={styles.settingsTextContainer}>
            <Text style={styles.settingsLabel}>{t('profile.replayTutorial')}</Text>
          </View>
          <MaterialCommunityIcons name="refresh" size={24} color={COLORS_THEME.textSecondary} />
        </TouchableOpacity>
        <View style={styles.settingsDivider} />
        <TouchableOpacity style={styles.settingsRow} onPress={handleLogout}>
          <View style={[styles.iconBox, { backgroundColor: '#FA5252' }]}><MaterialCommunityIcons name="logout-variant" size={22} color="#FFF" /></View>
          <View style={styles.settingsTextContainer}>
            <Text style={[styles.settingsLabel, { color: COLORS_THEME.error }]}>{t('profile.logout')}</Text>
          </View>
          <MaterialCommunityIcons name="exit-to-app" size={24} color={COLORS_THEME.error} />
        </TouchableOpacity>
      </View>

      <Text style={styles.versionLabel}>QuestFit v1.0.0</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activeTab === 'posts' ? userPosts : [{ id: 'settings' }]}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => {
          if (activeTab === 'settings') return renderSettings();
          
          if (activeTab === 'posts') {
            return renderPostItem({ item });
          }
          return null;
        }}
        ListEmptyComponent={() => {
          if (activeTab === 'posts') {
            if (loadingPosts) return <ActivityIndicator size="large" color={COLORS_THEME.primary} style={{ marginTop: 40 }} />;
            return (
              <View style={styles.emptyContainer}>
                <Ionicons name="images-outline" size={48} color={COLORS_THEME.border} />
                <Text style={styles.emptyText}>{t('profile.noPostsYet')}</Text>
              </View>
            );
          }
          return null;
        }}
      />

      {/* --- Existing Settings Modals --- */}
      <Modal visible={microsModalVisible} transparent={true} animationType="slide" onRequestClose={() => setMicrosModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{t('profile.microTargets')}</Text>
            <HorizontalSlider title={t('profile.waterTarget')} value={parseFloat(waterInput.replace(',', '.')) || 2.5} min={1} max={8} step={0.1} onChange={(val) => setWaterInput(val.toString())} color="#4DABF7" unit="L" />
            <HorizontalSlider title={t('profile.fiberTarget')} value={parseInt(fiberInput, 10) || 30} min={10} max={100} step={1} onChange={(val) => setFiberInput(val.toString())} color="#40C057" unit="g" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setMicrosModalVisible(false)}><Text style={styles.cancelBtnText}>{t('common.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleSaveMicros}><Text style={styles.confirmBtnText}>{t('common.save')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={nicknameModalVisible} transparent={true} animationType="slide" onRequestClose={() => setNicknameModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{t('profile.changeNickname')}</Text>
            <TextInput style={styles.modalInput} value={nicknameInput} onChangeText={setNicknameInput} maxLength={20} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setNicknameModalVisible(false)}><Text style={styles.cancelBtnText}>{t('common.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleSaveNickname}><Text style={styles.confirmBtnText}>{t('common.save')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={goalModalVisible} transparent={true} animationType="fade" onRequestClose={() => setGoalModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{t('profile.changeGoal')}</Text>
            <TouchableOpacity style={[styles.modalSelectItem, profile?.goal === 'Lose Weight' && styles.modalSelectItemActive]} onPress={() => { updateProfileField('goal', 'Lose Weight'); setGoalModalVisible(false); }}>
              <Text style={[styles.modalSelectItemText, profile?.goal === 'Lose Weight' && { color: COLORS_THEME.primary }]}>{t('profile.goalLose')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalSelectItem, profile?.goal === 'Maintain Weight' && styles.modalSelectItemActive]} onPress={() => { updateProfileField('goal', 'Maintain Weight'); setGoalModalVisible(false); }}>
              <Text style={[styles.modalSelectItemText, profile?.goal === 'Maintain Weight' && { color: COLORS_THEME.primary }]}>{t('profile.goalMaintain')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalSelectItem, profile?.goal === 'Build Muscle' && styles.modalSelectItemActive]} onPress={() => { updateProfileField('goal', 'Build Muscle'); setGoalModalVisible(false); }}>
              <Text style={[styles.modalSelectItemText, profile?.goal === 'Build Muscle' && { color: COLORS_THEME.primary }]}>{t('profile.goalGain')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={stepModalVisible} transparent={true} animationType="fade" onRequestClose={() => setStepModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{t('profile.stepTarget')}</Text>
            <HorizontalSlider value={parseInt(stepInput, 10) || 10000} min={1000} max={30000} step={100} onChange={(val) => setStepInput(val.toString())} color="#FF922B" unit="" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setStepModalVisible(false)}><Text style={styles.cancelBtnText}>{t('common.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleSaveStepTarget}><Text style={styles.confirmBtnText}>{t('common.save')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. Edit Post Modal */}
      <Modal visible={editModalVisible} transparent={true} animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalViewScrollView} keyboardShouldPersistTaps="handled">
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>{t('profile.editPost')}</Text>
              
              <TextInput 
                style={[styles.modalInput, { minHeight: 100, textAlignVertical: 'top' }]} 
                value={editContent} 
                onChangeText={setEditContent} 
                multiline 
                placeholder={t('profile.postContentPlaceholder')}
                placeholderTextColor={COLORS_THEME.textMuted}
              />

              {editImage && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: editImage }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removePreviewBtn} onPress={() => setEditImage(null)} disabled={isSubmittingEdit}>
                    <Ionicons name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm, marginBottom: SPACING.md }}>
                <TouchableOpacity style={styles.mediaBtn} onPress={handlePickEditImage} disabled={isSubmittingEdit}>
                  <Ionicons name="image-outline" size={24} color={COLORS_THEME.primary} />
                  <Text style={styles.mediaBtnText}>{editImage ? t('profile.changePhoto') : t('community.addPhoto')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setEditModalVisible(false)} disabled={isSubmittingEdit}>
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={handleUpdatePost} disabled={isSubmittingEdit || (!editContent.trim() && !editImage)}>
                  {isSubmittingEdit ? <ActivityIndicator size="small" color="#0D1117" /> : <Text style={styles.confirmBtnText}>{t('profile.update')}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  crestCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', marginRight: SPACING.lg,
  },
  avatarImage: {
    width: '100%', height: '100%', borderRadius: 36,
  },
  headerInfo: {
    flex: 1, justifyContent: 'center',
  },
  nicknameRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 4,
  },
  nicknameText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 20, color: COLORS.text,
  },
  crestLevelBadge: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primary,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12,
  },
  crestLevelText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 10, color: COLORS.primary,
  },
  xpContainer: {
    width: '100%', marginTop: 2,
  },
  xpProgressText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 11, color: COLORS.textSecondary,
  },
  xpBarBg: {
    width: '100%', height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%', borderRadius: 2,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row', width: '100%',
  },
  tabBtn: {
    flex: 1, paddingVertical: SPACING.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 15, color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },

  // Settings
  settingsContainer: {
    padding: SPACING.lg,
  },
  settingsGroupTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 13, color: COLORS.textSecondary,
    textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: SPACING.md, paddingLeft: 4,
  },
  settingsGroup: {
    backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden', ...SHADOWS.card,
  },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
  },
  settingsDivider: {
    height: 1, backgroundColor: COLORS.border, marginLeft: 60,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: BORDER_RADIUS.md, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  settingsTextContainer: { flex: 1 },
  settingsLabel: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 15, color: COLORS.text },
  settingsValue: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  versionLabel: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl },

  // Posts
  postCard: {
    padding: SPACING.lg, marginBottom: SPACING.md, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.xl, ...SHADOWS.card, marginHorizontal: SPACING.lg,
  },
  postHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm,
  },
  postDate: {
    fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 14, color: COLORS.textSecondary,
  },
  postActions: {
    flexDirection: 'row',
  },
  postActionBtn: {
    marginLeft: SPACING.md, padding: 4,
  },
  postText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 15, color: COLORS.text, lineHeight: 22, marginBottom: SPACING.md,
  },
  postImage: {
    width: '100%', aspectRatio: 4/3, borderRadius: 8, backgroundColor: COLORS.border,
  },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 16, color: COLORS.textSecondary, marginTop: SPACING.sm },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalViewScrollView: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: width },
  modalView: { width: '85%', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 18, color: COLORS.text, marginBottom: SPACING.lg, textAlign: 'center' },
  modalInput: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, color: COLORS.text, padding: SPACING.md, fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 15, marginBottom: SPACING.md },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md },
  modalButton: { flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm },
  cancelBtnText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary },
  confirmBtn: { backgroundColor: COLORS.primary, marginLeft: SPACING.sm },
  confirmBtnText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: '#0D1117' },
  modalSelectItem: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm, alignItems: 'center' },
  modalSelectItemActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(64,192,87,0.05)' },
  modalSelectItemText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text },
  
  // Media in Modal
  previewContainer: { width: '100%', marginTop: SPACING.sm, position: 'relative' },
  previewImage: { width: '100%', aspectRatio: 4/3, borderRadius: BORDER_RADIUS.md },
  removePreviewBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 6 },
  mediaBtn: { flexDirection: 'row', alignItems: 'center' },
  mediaBtnText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.primary, fontSize: 14, marginLeft: 6 }
});
