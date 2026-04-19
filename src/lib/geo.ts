/**
 * Утилита для получения названия города по координатам (Reverse Geocoding).
 * Использует бесплатный API Nominatim (OpenStreetMap).
 */

export const getCityName = async (lat: number, lng: number): Promise<string> => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'ru', // Получаем название на русском
                }
            }
        );

        if (!response.ok) throw new Error('Geocoding failed');

        const data = await response.json();
        const city = data.address.city || data.address.town || data.address.village || data.address.state || 'Алматы';
        
        return city;
    } catch (error) {
        console.error('Geocoding error:', error);
        return 'Алматы'; // Фолбек на Алматы
    }
};
