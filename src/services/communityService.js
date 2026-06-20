import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, where, doc, deleteDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Topluluk gönderilerini getirir (En yeniden en eskiye sıralı)
 */
export const getCommunityPosts = async () => {
  try {
    const q = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const posts = [];
    querySnapshot.forEach((docSnap) => {
      posts.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    return posts;
  } catch (error) {
    console.error('Gönderileri çekerken hata:', error);
    throw new Error('Gönderiler yüklenemedi.');
  }
};

/**
 * Topluluğa yeni gönderi ekler
 */
export const createPost = async (content, imageUrl, user) => {
  try {
    const newPost = {
      content: content.trim(),
      imageUrl: imageUrl || null,
      authorId: user.uid,
      authorName: user.nickname || 'Gizemli Kahraman',
      authorAvatar: user.photoURL || null,
      createdAt: serverTimestamp(),
      likes: [],
      comments: [],
      isFoodPost: user.isFoodPost || false,
      foodData: user.foodData || null,
    };

    const docRef = await addDoc(collection(db, 'community_posts'), newPost);
    return { id: docRef.id, ...newPost, createdAt: new Date() };
  } catch (error) {
    console.error('Gönderi oluştururken hata:', error);
    throw new Error('Gönderi paylaşılamadı.');
  }
};

/**
 * Belirli bir kullanıcının kendi gönderilerini getirir
 */
export const getUserPosts = async (uid) => {
  try {
    const q = query(collection(db, 'community_posts'), where('authorId', '==', uid));
    const querySnapshot = await getDocs(q);
    
    const posts = [];
    querySnapshot.forEach((docSnap) => {
      posts.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    // Sort locally to avoid needing a composite index in Firestore for where + orderBy
    posts.sort((a, b) => {
      const timeA = a.createdAt?.seconds || Date.now() / 1000;
      const timeB = b.createdAt?.seconds || Date.now() / 1000;
      return timeB - timeA;
    });

    return posts;
  } catch (error) {
    console.error('Kullanıcı gönderileri çekerken hata:', error);
    throw new Error('Gönderileriniz yüklenemedi.');
  }
};

/**
 * Gönderiyi siler
 */
export const deletePost = async (postId) => {
  try {
    await deleteDoc(doc(db, 'community_posts', postId));
  } catch (error) {
    console.error('Gönderi silme hatası:', error);
    throw new Error('Gönderi silinemedi.');
  }
};

/**
 * Gönderiyi günceller
 */
export const updatePost = async (postId, newContent, newImageUrl) => {
  try {
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      content: newContent.trim(),
      imageUrl: newImageUrl // null is explicitly saved if removed
    });
  } catch (error) {
    console.error('Gönderi güncelleme hatası:', error);
    throw new Error('Gönderi güncellenemedi.');
  }
};

/**
 * Gönderiyi beğenir veya beğenmekten vazgeçer (Toggle Like)
 */
export const toggleLike = async (postId, userId) => {
  try {
    const postRef = doc(db, 'community_posts', postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) throw new Error('Gönderi bulunamadı');

    const postData = postSnap.data();
    const likes = postData.likes || [];
    const hasLiked = likes.includes(userId);

    if (hasLiked) {
      await updateDoc(postRef, {
        likes: arrayRemove(userId)
      });
      return false; // Liked state is now false
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(userId)
      });
      return true; // Liked state is now true
    }
  } catch (error) {
    console.error('Beğeni hatası:', error);
    throw new Error('Beğeni işlemi başarısız oldu.');
  }
};

/**
 * Gönderiye yorum ekler
 */
export const addComment = async (postId, user, text) => {
  try {
    const postRef = doc(db, 'community_posts', postId);
    const newComment = {
      id: Date.now().toString(),
      uid: user.uid,
      name: user.nickname || 'Kullanıcı',
      avatar: user.photoURL || null,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    await updateDoc(postRef, {
      comments: arrayUnion(newComment)
    });
    
    return newComment;
  } catch (error) {
    console.error('Yorum ekleme hatası:', error);
    throw new Error('Yorum eklenemedi.');
  }
};

/**
 * Yeni bir hikaye ekler (8 saat sonra kaybolacak şekilde)
 */
export const addStory = async (imageUrl, user) => {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); // 8 saat sonra

    const newStory = {
      authorId: user.uid,
      authorName: user.nickname || 'Gizemli Kahraman',
      authorAvatar: user.photoURL || null,
      imageUrl: imageUrl,
      createdAt: serverTimestamp(),
      expiresAt: expiresAt.toISOString() // Basit sorgu için string kullanıyoruz
    };

    const docRef = await addDoc(collection(db, 'stories'), newStory);
    return { id: docRef.id, ...newStory };
  } catch (error) {
    console.error('Hikaye ekleme hatası:', error);
    throw new Error('Hikaye eklenemedi.');
  }
};

/**
 * Süresi dolmamış aktif hikayeleri getirir
 */
export const getActiveStories = async () => {
  try {
    // İndeks hatasından kaçınmak için tüm hikayeleri çekip lokalde filtreliyoruz (Şimdilik)
    const querySnapshot = await getDocs(collection(db, 'stories'));
    const now = new Date().toISOString();
    
    let stories = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.expiresAt > now) {
        stories.push({ id: doc.id, ...data });
      }
    });
    
    // Kronolojik sıraya diz
    return stories.sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
  } catch (error) {
    console.error('Hikaye çekme hatası (Detaylı):', error);
    throw new Error('Hikayeler yüklenemedi. Veritabanı izinlerinizi kontrol edin.');
  }
};

/**
 * Hikayeyi siler
 */
export const deleteStory = async (storyId) => {
  try {
    await deleteDoc(doc(db, 'stories', storyId));
  } catch (error) {
    console.error('Hikaye silme hatası:', error);
    throw new Error('Hikaye silinemedi.');
  }
};
