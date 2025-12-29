// import { Capacitor } from '@capacitor/core';

/**
 * Saves a File object to the device's native gallery/filesystem.
 * Commented out during development to avoid Vite resolution errors for missing @capacitor/filesystem package.
 */
export const saveToNativeGallery = async (file, albumName = 'TerrAqua') => {
    console.log('[Native] Save to gallery bypassed in dev mode:', file.name);
    return true;

    /* 
    // Original implementation (requires @capacitor/filesystem and @capacitor/core):
    
    if (!Capacitor.isNativePlatform()) {
      console.log('[Native] Not a native platform, skipping gallery save');
      return false;
    }
  
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const base64Data = await fileToBase64(file);
      const fileName = `TerrAqua_${Date.now()}_${file.name}`;
      
      await Filesystem.writeFile({
        path: `${albumName}/${fileName}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
      return true;
    } catch (error) {
      console.error('[Native] Failed to save to gallery:', error);
      return false;
    }
    */
};

/**
 * Utility to convert a File/Blob to Base64 string
 */
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};
