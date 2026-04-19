/**
 * Утилита для загрузки изображений и видео на Cloudinary.
 * Использует Unsigned Upload Preset для безопасности на стороне клиента.
 */

const CLOUD_NAME = 'dk6vlluon';
const UPLOAD_PRESET = 'pyazo29x';
const API_KEY = '229342116895779';

export const uploadMedia = async (file: File | Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('api_key', API_KEY);

    // Используем 'auto', чтобы Cloudinary сам определил тип (фото или видео)
    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Ошибка при загрузке на Cloudinary');
        }

        const data = await response.json();
        return data.secure_url; // Возвращаем HTTPS ссылку
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw error;
    }
};
