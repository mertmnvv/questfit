const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads an image to Cloudinary using Unsigned Upload.
 * @param {string} imageUri - The local URI of the image from ImagePicker.
 * @returns {Promise<string>} - The secure URL of the uploaded image.
 */
export const uploadImageToCloudinary = async (imageUri) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary bilgileri eksik (.env kontrol edin).');
  }

  try {
    const data = new FormData();
    // FormData requires an object with uri, type, and name for files in React Native
    data.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `community_${Date.now()}.jpg`,
    });
    data.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: data,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = await response.json();
    
    if (result.secure_url) {
      return result.secure_url;
    } else {
      console.error('Cloudinary Yükleme Hatası:', result);
      throw new Error(result.error?.message || 'Resim yüklenemedi.');
    }
  } catch (error) {
    console.error('Cloudinary API Error:', error);
    throw new Error('Görsel yüklenirken bir hata oluştu. İnternet bağlantınızı kontrol edin.');
  }
};
