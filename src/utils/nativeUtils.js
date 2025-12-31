import { Capacitor } from '@capacitor/core';

/**
 * Saves a File object to the device's native gallery/filesystem if running on Capacitor.
 * @param {File} file - The file to save
 * @param {string} albumName - Optional album name (not supported by all plugins)
 */
export const saveToNativeGallery = async (file, albumName = 'TerrAqua') => {
    if (!Capacitor.isNativePlatform()) {
        console.log('[Native] Not a native platform, skipping gallery save');
        return false;
    }

    try {
        // Dynamically import Capacitor plugins to avoid web build issues
        const { Filesystem, Directory } = await import('@capacitor/filesystem');

        // Convert File to Base64 (Filesystem plugin requires base64)
        const base64Data = await fileToBase64(file);

        // Save to the Documents/External folder
        // Note: On Android, saving to Directory.External tends to make it visible in Gallery
        const fileName = `TerrAqua_${Date.now()}_${file.name}`;

        const result = await Filesystem.writeFile({
            path: `${albumName}/${fileName}`,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true
        });

        console.log('[Native] File saved to filesystem:', result.uri);
        return true;
    } catch (error) {
        console.error('[Native] Failed to save to gallery:', error);
        return false;
    }
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
