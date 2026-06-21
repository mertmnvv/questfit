import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  StatusBar,
  ScrollView,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Alert,
  PanResponder
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '../hooks/useThemeColors';
import { useAuth } from '../context/AuthContext';
import { useUserStore } from '../store/userStore';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { getCommunityPosts, createPost, toggleLike, addComment, addStory, getActiveStories, deleteStory } from '../services/communityService';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { analyzeFoodFromImage } from '../services/foodService';

const { width, height } = Dimensions.get('window');

const DoubleTapImage = ({ uri, onDoubleTap, children, isFoodPost, foodData, t }) => {
  const lastTap = useRef(null);

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      onDoubleTap();
    } else {
      lastTap.current = now;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={{ position: 'relative' }}>
        <Image source={{ uri }} style={stylesGlobal.postImage} />
        {isFoodPost && foodData && (
          <View style={stylesGlobal.foodBadge}>
            <View style={stylesGlobal.foodBadgeInner}>
              <MaterialCommunityIcons name="food-apple" size={16} color="#FFF" style={{ marginRight: 4 }} />
              <View>
                <Text style={stylesGlobal.foodBadgeTitle}>{foodData.name}</Text>
                <Text style={stylesGlobal.foodBadgeCals}>~{foodData.macros?.calories || 0} kcal</Text>
              </View>
            </View>
          </View>
        )}
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
};

const PostItem = ({ item, COLORS, styles, user, onLikeToggle, onOpenComments, t }) => {
  const dateStr = item.createdAt?.seconds 
    ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Şimdi';

  const hasLiked = item.likes?.includes(user?.uid);
  const likesCount = item.likes?.length || 0;
  const commentsCount = item.comments?.length || 0;

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const triggerLikeAnimation = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.5, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true })
      ]),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(scale, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true })
      ])
    ]).start();
  };

  const handleDoubleTap = () => {
    triggerLikeAnimation();
    if (!hasLiked) {
      onLikeToggle(item.id, user.uid, hasLiked);
    }
  };

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        {item.authorAvatar ? (
          <Image source={{ uri: item.authorAvatar }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.authorName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.authorName}</Text>
          <Text style={styles.postDate}>{dateStr}</Text>
        </View>
      </View>

      {item.content ? (
        <Text style={styles.postText}>{item.content}</Text>
      ) : null}

      {item.imageUrl && (
        <DoubleTapImage 
          uri={item.imageUrl} 
          onDoubleTap={handleDoubleTap} 
          isFoodPost={item.isFoodPost} 
          foodData={item.foodData}
          t={t}
        >
          <Animated.View style={[styles.floatingHeartContainer, { opacity, transform: [{ scale }] }]}>
            <Ionicons name="heart" size={80} color="#FA5252" />
          </Animated.View>
        </DoubleTapImage>
      )}

      <View style={styles.socialActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onLikeToggle(item.id, user.uid, hasLiked)}>
          <Ionicons name={hasLiked ? "heart" : "heart-outline"} size={26} color={hasLiked ? "#FA5252" : COLORS.textSecondary} />
          <Text style={[styles.actionText, hasLiked && { color: "#FA5252", fontFamily: TYPOGRAPHY.fontFamily.bold }]}>{likesCount > 0 ? likesCount : ''}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => onOpenComments(item)}>
          <Ionicons name="chatbubble-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>{commentsCount > 0 ? commentsCount : ''}</Text>
        </TouchableOpacity>
      </View>

      {commentsCount > 0 && (
        <View style={styles.commentsPreview}>
          <TouchableOpacity onPress={() => onOpenComments(item)}>
            <Text style={styles.viewAllCommentsText}>{t('community.viewAllComments', { count: commentsCount }) || `${commentsCount} yorumun tümünü gör`}</Text>
          </TouchableOpacity>
          {item.comments.slice(0, 1).map((comment, idx) => (
            <View key={idx} style={styles.previewCommentRow}>
              <Text style={styles.previewCommentName}>{comment.name}</Text>
              <Text style={styles.previewCommentText} numberOfLines={1}>{comment.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default function CommunityScreen() {
  const { t, i18n } = useTranslation();
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);
  
  const { user } = useAuth();
  const { profile } = useUserStore();

  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stories Modals & States
  const [uploadingStory, setUploadingStory] = useState(false);
  const [storyPreviewImage, setStoryPreviewImage] = useState(null);
  const [storyText, setStoryText] = useState('');
  const [isAddingText, setIsAddingText] = useState(false);
  const storyPreviewRef = useRef(null);

  // Draggable text state
  const textPan = useRef(new Animated.ValueXY()).current;
  const textPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: textPan.x, dy: textPan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        textPan.extractOffset();
      },
    })
  ).current;

  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const storyProgress = useRef(new Animated.Value(0)).current;

  // Post Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFoodPost, setIsFoodPost] = useState(false);

  // Comments Modal
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchPostsAndStories = useCallback(async () => {
    try {
      const [fetchedPosts, fetchedStories] = await Promise.all([
        getCommunityPosts(),
        getActiveStories()
      ]);
      setPosts(fetchedPosts);
      setStories(fetchedStories);
    } catch (error) {
      console.log('Fetch error', error);
      if (error.message.includes('Missing or insufficient permissions')) {
         Toast.show({ type: 'error', text1: t('community.permissionError') || 'Yetki Hatası', text2: t('community.firebaseRulesError') || 'Veritabanı izinlerinizi kontrol edin.' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPostsAndStories();
  }, [fetchPostsAndStories]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPostsAndStories();
  };

  // --- STORY ACTIONS ---
  const handleAddStoryClick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Artık kesmeye zorlamıyoruz, Instagram gibi container kullanacağız
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setStoryPreviewImage(result.assets[0].uri);
      setStoryText('');
      // Reset text position
      textPan.setValue({ x: 0, y: 0 });
      textPan.setOffset({ x: 0, y: 0 });
    }
  };

  const confirmAndUploadStory = async () => {
    if (!storyPreviewImage) return;
    setUploadingStory(true);
    
    try {
      // Ekranı (Text ve resmi birleşik olarak) kırparak yeni bir resim oluşturuyoruz
      let uri = await captureRef(storyPreviewRef, {
        format: 'jpg',
        quality: 0.8,
      });

      // Android bazen file:// takısı eklemiyor, Cloudinary FormData için gerekli
      if (Platform.OS === 'android' && !uri.startsWith('file://')) {
        uri = `file://${uri}`;
      }

      const imageUrl = await uploadImageToCloudinary(uri);
      await addStory(imageUrl, { uid: user.uid, nickname: profile?.nickname, photoURL: profile?.photoURL || user?.photoURL });
      
      setStoryPreviewImage(null);
      setStoryText('');
      
      // Toast'u Modal kapandıktan sonra göstermek için ufak bir bekleme (Timeout)
      setTimeout(() => {
        Toast.show({ type: 'success', text1: t('common.success') || 'Başarılı', text2: t('community.storyAdded') || 'Hikayen başarıyla eklendi!' });
      }, 500);
      
      onRefresh();
    } catch (e) {
      setStoryPreviewImage(null);
      setTimeout(() => {
        Toast.show({ type: 'error', text1: t('common.error') || 'Hata', text2: t('community.storyError') || 'Hikaye paylaşılamadı.' });
      }, 500);
    } finally {
      setUploadingStory(false);
    }
  };

  const handlePlayStories = () => {
    if (stories.length === 0) {
      Toast.show({ type: 'info', text1: t('community.title') || 'Topluluk', text2: t('community.noStories') || 'Şu an aktif bir hikaye yok.' });
      return;
    }
    setCurrentStoryIndex(0);
    setStoryViewerVisible(true);
  };

  const nextStory = useCallback(() => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else {
      closeStoryViewer();
    }
  }, [currentStoryIndex, stories.length]);

  const closeStoryViewer = () => {
    storyProgress.stopAnimation();
    setStoryViewerVisible(false);
    setCurrentStoryIndex(0);
  };

  useEffect(() => {
    if (storyViewerVisible && stories.length > 0) {
      storyProgress.setValue(0);
      Animated.timing(storyProgress, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false
      }).start(({ finished }) => {
        if (finished) {
          nextStory();
        }
      });
    }
  }, [currentStoryIndex, storyViewerVisible]);

  const handleDeleteStory = () => {
    const currentStory = stories[currentStoryIndex];
    if (!currentStory || currentStory.authorId !== user.uid) return;

    storyProgress.stopAnimation();

    Alert.alert(
      t('common.delete') || 'Sil',
      t('community.deleteStoryConfirm') || 'Bu hikayeyi silmek istediğinize emin misiniz?',
      [
        { 
          text: t('common.cancel') || 'İptal', 
          style: 'cancel',
          onPress: () => {
            // Devam et
            Animated.timing(storyProgress, {
              toValue: 1,
              duration: 5000,
              useNativeDriver: false
            }).start(({ finished }) => {
              if (finished) nextStory();
            });
          }
        },
        { 
          text: t('common.delete') || 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStory(currentStory.id);
              Toast.show({ type: 'success', text1: t('common.success') || 'Silindi', text2: 'Hikayeniz silindi.' });
              
              const newStories = stories.filter(s => s.id !== currentStory.id);
              setStories(newStories);
              
              if (newStories.length === 0) {
                closeStoryViewer();
              } else {
                if (currentStoryIndex >= newStories.length) {
                  setCurrentStoryIndex(newStories.length - 1);
                }
              }
            } catch (e) {
              Toast.show({ type: 'error', text1: t('common.error') || 'Hata', text2: 'Hikaye silinemedi.' });
              // Devam et
              Animated.timing(storyProgress, {
                toValue: 1,
                duration: 5000,
                useNativeDriver: false
              }).start(({ finished }) => {
                if (finished) nextStory();
              });
            }
          }
        }
      ]
    );
  };

  const renderListHeader = () => (
    <View style={styles.storyHeaderRow}>
      <TouchableOpacity style={styles.storyBtn} onPress={handleAddStoryClick} disabled={uploadingStory}>
        {uploadingStory ? (
          <View style={[styles.storyCircle, { backgroundColor: COLORS.cardLight, borderWidth: 0 }]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : (
          <View style={[styles.storyCircle, { backgroundColor: COLORS.cardLight, borderWidth: 0 }]}>
            <Ionicons name="add" size={28} color={COLORS.primary} />
          </View>
        )}
        <Text style={styles.storyText}>{t('community.addStory') || 'Hikaye Ekle'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.storyBtn} onPress={handlePlayStories}>
        <View style={[styles.storyCircle, { borderColor: stories.length > 0 ? COLORS.primary : COLORS.border, borderWidth: 2 }]}>
          <Ionicons name="play" size={24} color={stories.length > 0 ? COLORS.primary : COLORS.textMuted} style={{ marginLeft: 4 }} />
        </View>
        <Text style={styles.storyText}>{t('community.viewStories') || 'Topluluk Hikayeleri'}</Text>
      </TouchableOpacity>
    </View>
  );

  // --- POST ACTIONS ---
  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setSelectedImage(result.assets[0].uri);
      setSelectedImageBase64(result.assets[0].base64);
    }
  };

  const handleLikeToggle = async (postId, userId, hasLiked) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newLikes = hasLiked ? p.likes.filter(id => id !== userId) : [...(p.likes || []), userId];
        return { ...p, likes: newLikes };
      }
      return p;
    }));
    try {
      await toggleLike(postId, userId);
    } catch (error) {
      fetchPostsAndStories();
    }
  };

  const openComments = (post) => {
    setActivePost(post);
    setCommentsModalVisible(true);
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !activePost) return;
    setSubmittingComment(true);
    try {
      const newComment = await addComment(
        activePost.id, 
        { uid: user.uid, nickname: profile?.nickname, photoURL: profile?.photoURL || user?.photoURL }, 
        commentInput.trim()
      );
      const updatedPost = { ...activePost, comments: [...(activePost.comments || []), newComment] };
      setActivePost(updatedPost);
      setPosts(prev => prev.map(p => p.id === activePost.id ? updatedPost : p));
      setCommentInput('');
    } catch (error) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('community.commentError') || 'Yorum eklenemedi.' });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSubmitPost = async () => {
    if (!newPostContent.trim() && !selectedImage) return;

    setIsSubmitting(true);
    try {
      let uploadedImageUrl = null;
      let foodData = null;

      if (isFoodPost && selectedImageBase64) {
        Toast.show({ type: 'info', text1: 'AI', text2: t('community.analyzingFood') || 'Yemek analiz ediliyor...' });
        try {
          const aiResults = await analyzeFoodFromImage(selectedImageBase64, i18n.language);
          if (aiResults && aiResults.length > 0) {
            foodData = aiResults[0];
          }
        } catch (aiErr) {
          Alert.alert(
            "Yapay Zeka Hatası",
            "Görsel şu an çalışmıyor. Yemeğin adını gönderi metnine manuel olarak yazmak ister misin?",
            [{ text: "Tamam" }]
          );
          // AI failed, but we still continue to submit the post without macros
        }
      }

      if (selectedImage) {
        uploadedImageUrl = await uploadImageToCloudinary(selectedImage);
      }

      const postUser = {
        uid: user.uid,
        nickname: profile?.nickname || 'Kahraman',
        photoURL: profile?.photoURL || user?.photoURL || null,
        isFoodPost,
        foodData
      };

      await createPost(newPostContent, uploadedImageUrl, postUser);
      
      setNewPostContent('');
      setSelectedImage(null);
      setSelectedImageBase64(null);
      setIsFoodPost(false);
      setModalVisible(false);
      onRefresh(); 
    } catch (error) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStory = stories[currentStoryIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>{t('community.title')}</Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderListHeader}
            renderItem={({ item }) => <PostItem item={item} COLORS={COLORS} styles={styles} user={user} onLikeToggle={handleLikeToggle} onOpenComments={openComments} t={t} />}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyText}>{t('community.noPosts')}</Text>
                <Text style={styles.emptySubText}>{t('community.beTheFirst')}</Text>
              </View>
            }
          />
        )}

        <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="#0D1117" />
        </TouchableOpacity>
      </View>

      {/* Story Viewer Modal */}
      <Modal visible={storyViewerVisible} animationType="fade" transparent={false} onRequestClose={closeStoryViewer}>
        {currentStory && (
          <View style={styles.storyViewerContainer}>
            <Image source={{ uri: currentStory.imageUrl }} style={styles.storyViewerImage} resizeMode="cover" />
            <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={styles.storyViewerTopOverlay}>
              <View style={styles.storyProgressBarBg}>
                <Animated.View style={[styles.storyProgressBarFill, { width: storyProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
              </View>
              <View style={styles.storyViewerHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {currentStory.authorAvatar ? (
                    <Image source={{ uri: currentStory.authorAvatar }} style={styles.storyViewerAvatar} />
                  ) : (
                    <View style={styles.storyViewerAvatarFallback}>
                      <Text style={styles.storyViewerAvatarText}>{currentStory.authorName.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={styles.storyViewerAuthor}>{currentStory.authorName}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {currentStory.authorId === user.uid && (
                    <TouchableOpacity onPress={handleDeleteStory} style={{ marginRight: 16 }} hitSlop={{top:20, bottom:20, left:20, right:20}}>
                      <Ionicons name="trash-outline" size={28} color="#FFF" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={closeStoryViewer} hitSlop={{top:20, bottom:20, left:20, right:20}}>
                    <Ionicons name="close" size={32} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
            
            {/* Tap areas for next/prev. (Left 30% prev, right 70% next) - Optional logic added for better UX */}
            <TouchableOpacity style={styles.storyTapLeft} onPress={() => {
              if (currentStoryIndex > 0) {
                storyProgress.stopAnimation();
                setCurrentStoryIndex(currentStoryIndex - 1);
              }
            }} />
            <TouchableOpacity style={styles.storyTapRight} onPress={() => {
              storyProgress.stopAnimation();
              nextStory();
            }} />
          </View>
        )}
      </Modal>

      {/* Post Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={() => !isSubmitting && setModalVisible(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + SPACING.md : SPACING.md }]}>
              <TouchableOpacity onPress={() => setModalVisible(false)} disabled={isSubmitting} hitSlop={{top:20, bottom:20, left:20, right:20}}>
                <Ionicons name="close" size={32} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>{t('community.newPost')}</Text>
              <TouchableOpacity style={[styles.modalSubmitBtn, (!newPostContent.trim() && !selectedImage) && styles.modalSubmitBtnDisabled]} onPress={handleSubmitPost} disabled={isSubmitting || (!newPostContent.trim() && !selectedImage)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                {isSubmitting ? <ActivityIndicator size="small" color="#0D1117" /> : <Text style={styles.modalSubmitText}>{t('community.share')}</Text>}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {selectedImage && (
                <TouchableOpacity style={[styles.foodToggleBtn, isFoodPost && styles.foodToggleBtnActive]} onPress={() => setIsFoodPost(!isFoodPost)}>
                  <MaterialCommunityIcons name="food-fork-drink" size={20} color={isFoodPost ? "#FFF" : COLORS.textSecondary} />
                  <Text style={[styles.foodToggleText, isFoodPost && { color: '#FFF' }]}>{t('community.isFoodPost') || 'Bu bir yemektir 🍽️'}</Text>
                </TouchableOpacity>
              )}

              <TextInput style={styles.modalInput} placeholder={t('community.whatsOnYourMind')} placeholderTextColor={COLORS.textMuted} value={newPostContent} onChangeText={setNewPostContent} multiline autoFocus />

              {selectedImage && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removePreviewBtn} onPress={() => { setSelectedImage(null); setSelectedImageBase64(null); setIsFoodPost(false); }} disabled={isSubmitting}>
                    <Ionicons name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.mediaBtn} onPress={handlePickImage} disabled={isSubmitting}>
                <Ionicons name="image-outline" size={26} color={COLORS.primary} />
                <Text style={styles.mediaBtnText}>{t('community.addPhoto')}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={commentsModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCommentsModalVisible(false)}>
        <KeyboardAvoidingView style={styles.commentsModalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.commentsModalContent}>
            <View style={styles.commentsModalHeader}>
              <Text style={styles.commentsModalTitle}>{t('community.comments') || 'Yorumlar'}</Text>
              <TouchableOpacity onPress={() => setCommentsModalVisible(false)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={activePost?.comments || []}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.commentAvatar} />
                  ) : (
                    <View style={styles.commentAvatarFallback}>
                      <Text style={styles.commentAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentName}>{item.name}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyComments}>
                  <Text style={styles.emptyCommentsText}>{t('community.noComments') || 'İlk yorumu siz yapın!'}</Text>
                </View>
              }
            />

            <View style={styles.commentInputRow}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.commentInputAvatar} />
              ) : (
                <View style={styles.commentInputAvatarFallback}>
                  <Text style={styles.commentAvatarText}>{(profile?.nickname || 'U').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <TextInput style={styles.commentInput} placeholder={t('community.addComment') || 'Yorum ekle...'} placeholderTextColor={COLORS.textMuted} value={commentInput} onChangeText={setCommentInput} multiline />
              <TouchableOpacity style={styles.commentSendBtn} onPress={handleAddComment} disabled={submittingComment || !commentInput.trim()}>
                {submittingComment ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Ionicons name="send" size={20} color={commentInput.trim() ? COLORS.primary : COLORS.textMuted} />}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* INSTAGRAM STYLE STORY PREVIEW MODAL */}
      <Modal visible={!!storyPreviewImage} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#000' }}>
          
          {/* ÇEKİM ALANI (CAPTURE REF) - Instagram Mantığı: Resim kesilmez (contain), text üstüne eklenir */}
          <View ref={storyPreviewRef} style={{ flex: 1, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' }}>
            <Image 
              source={{ uri: storyPreviewImage }} 
              style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
            />
            {/* SÜRÜKLENEBİLİR TEXT */}
            {storyText && !isAddingText ? (
              <Animated.View 
                {...textPanResponder.panHandlers}
                style={{ 
                  position: 'absolute', 
                  transform: [{ translateX: textPan.x }, { translateY: textPan.y }],
                  padding: 20
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 32, fontFamily: TYPOGRAPHY.fontFamily.bold, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 10 }}>
                  {storyText}
                </Text>
              </Animated.View>
            ) : null}
          </View>

          {/* EKRAN ÜSTÜ KONTROLLER (Screenshot'a dahil edilmez) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 15, zIndex: 10, position: 'absolute', top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, width: '100%' }}>
            <TouchableOpacity onPress={() => setStoryPreviewImage(null)} style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setIsAddingText(true)} style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}>
              <MaterialCommunityIcons name="format-text" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* TEXT GİRİŞ MODU AKTİFSE */}
          {isAddingText && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 20, justifyContent: 'center', alignItems: 'center' }}>
              <TextInput
                style={{ color: '#FFF', fontSize: 32, fontFamily: TYPOGRAPHY.fontFamily.bold, textAlign: 'center', width: '90%' }}
                placeholder="Yazı ekle..."
                placeholderTextColor="#999"
                value={storyText}
                onChangeText={setStoryText}
                autoFocus
                multiline
              />
              <TouchableOpacity onPress={() => setIsAddingText(false)} style={{ position: 'absolute', top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, right: 15 }}>
                <Text style={{ color: '#FFF', fontSize: 18, fontFamily: TYPOGRAPHY.fontFamily.bold }}>Bitti</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* GÖNDER BUTONU */}
          {!isAddingText && (
            <View style={{ position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' }}>
              <TouchableOpacity 
                style={{ 
                  backgroundColor: COLORS.primary, 
                  paddingHorizontal: 40, 
                  paddingVertical: 15, 
                  borderRadius: 30, 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                  elevation: 5
                }}
                onPress={confirmAndUploadStory}
                disabled={uploadingStory}
              >
                {uploadingStory ? (
                  <ActivityIndicator color="#000" style={{ marginRight: 10 }} />
                ) : (
                  <Ionicons name="send" size={20} color="#000" style={{ marginRight: 10 }} />
                )}
                <Text style={{ color: '#000', fontSize: 18, fontFamily: TYPOGRAPHY.fontFamily.bold }}>
                  {uploadingStory ? 'Paylaşılıyor...' : 'Hikayeyi Paylaş'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const stylesGlobal = StyleSheet.create({
  postImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: '#1E1E1E' },
  foodBadge: { position: 'absolute', bottom: SPACING.md, left: SPACING.md, right: SPACING.md, backgroundColor: 'rgba(13, 17, 23, 0.75)', borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, backdropFilter: 'blur(10px)', ...SHADOWS.card },
  foodBadgeInner: { flexDirection: 'row', alignItems: 'center' },
  foodBadgeTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: '#FFF', fontSize: 14 },
  foodBadgeCals: { fontFamily: TYPOGRAPHY.fontFamily.medium, color: '#4ade80', fontSize: 12 }
});

const getStyles = (COLORS) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  topBarTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 22, color: COLORS.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 100 },
  
  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 18, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySubText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 14, color: COLORS.textMuted, marginTop: 4 },

  // Story Header
  storyHeaderRow: { flexDirection: 'row', padding: SPACING.lg, paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  storyBtn: { alignItems: 'center', marginRight: SPACING.lg },
  storyCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  storyText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 12, color: COLORS.textSecondary },

  // Story Viewer
  storyViewerContainer: { flex: 1, backgroundColor: '#000' },
  storyViewerImage: { width: '100%', height: '100%', position: 'absolute' },
  storyViewerTopOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, paddingHorizontal: 10 },
  storyProgressBarBg: { height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, marginBottom: 16 },
  storyProgressBarFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 2 },
  storyViewerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6 },
  storyViewerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#FFF' },
  storyViewerAvatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#FFF' },
  storyViewerAvatarText: { color: '#0D1117', fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 16 },
  storyViewerAuthor: { color: '#FFF', fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 16, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  storyTapLeft: { position: 'absolute', top: 120, bottom: 0, left: 0, width: '30%' },
  storyTapRight: { position: 'absolute', top: 120, bottom: 0, right: 0, width: '70%' },

  // Post Feed Items
  postContainer: { padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  avatarImage: { width: 36, height: 36, borderRadius: 18, marginRight: SPACING.sm },
  avatarText: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 16 },
  authorInfo: { flex: 1 },
  authorName: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 15, color: COLORS.text },
  postDate: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 12, color: COLORS.textSecondary },
  postText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 15, color: COLORS.text, lineHeight: 22, marginBottom: SPACING.md },
  
  // Social Actions
  socialActions: { flexDirection: 'row', marginTop: SPACING.md, alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: SPACING.lg },
  actionText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 14, color: COLORS.textSecondary, marginLeft: 6 },
  floatingHeartContainer: { position: 'absolute', top: '50%', left: '50%', marginLeft: -40, marginTop: -40, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  
  // Comments Preview
  commentsPreview: { marginTop: SPACING.sm },
  viewAllCommentsText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  previewCommentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  previewCommentName: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 13, color: COLORS.text, marginRight: 6 },
  previewCommentText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 13, color: COLORS.text, flex: 1 },

  // FAB
  fab: { position: 'absolute', bottom: SPACING.xl, right: SPACING.xl, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },

  // Post Modal
  modalSafeArea: { flex: 1, backgroundColor: COLORS.background },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalHeaderTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 18, color: COLORS.text },
  modalSubmitBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 70, alignItems: 'center' },
  modalSubmitBtnDisabled: { backgroundColor: COLORS.border },
  modalSubmitText: { color: '#0D1117', fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 14 },
  modalBody: { flex: 1, padding: SPACING.lg },
  foodToggleBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: COLORS.cardLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  foodToggleBtnActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  foodToggleText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 13, color: COLORS.textSecondary, marginLeft: 6 },
  modalInput: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 18, color: COLORS.text, minHeight: 80, textAlignVertical: 'top' },
  previewContainer: { marginTop: SPACING.md, position: 'relative', alignSelf: 'center', width: '100%' },
  previewImage: { width: '100%', aspectRatio: 3 / 4, borderRadius: 12 },
  removePreviewBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 6 },
  modalFooter: { flexDirection: 'row', padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center' },
  mediaBtn: { flexDirection: 'row', alignItems: 'center' },
  mediaBtnText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.primary, fontSize: 16, marginLeft: 8 },

  // Comments Modal
  commentsModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  commentsModalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: SPACING.lg, paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg },
  commentsModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  commentsModalTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 18, color: COLORS.text },
  emptyComments: { padding: SPACING.xl, alignItems: 'center' },
  emptyCommentsText: { fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: 15, color: COLORS.textSecondary },
  commentItem: { flexDirection: 'row', marginBottom: SPACING.md },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: SPACING.sm },
  commentAvatarFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  commentAvatarText: { color: COLORS.textSecondary, fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 14 },
  commentBubble: { flex: 1, backgroundColor: COLORS.cardLight, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderTopLeftRadius: 4 },
  commentName: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 13, color: COLORS.text, marginBottom: 2 },
  commentText: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 14, color: COLORS.text },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md },
  commentInputAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: SPACING.sm },
  commentInputAvatarFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  commentInput: { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: COLORS.cardLight, borderRadius: 20, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, color: COLORS.text, fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: 14 },
  commentSendBtn: { marginLeft: SPACING.sm, width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.cardLight, justifyContent: 'center', alignItems: 'center' }
});
