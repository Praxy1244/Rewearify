// src/utils/geocode.js
import axios from 'axios';

/**
 * Converts a human-readable address into [longitude, latitude] using OpenStreetMap (free)
 * @param {string} address - Full address string (e.g., "MG Road, Shimoga, Karnataka, India")
 * @returns {Promise<[number, number] | null>} - [lng, lat] or null if failed
 */
export const geocodeAddress = async (address) => {
  if (!address || typeof address !== 'string' || !address.trim()) {
    return null;
  }

  try {
    // Respect Nominatim's usage policy: max 1 request per second
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address.trim(),
        format: 'json',
        countrycodes: 'IN', // Restrict to India
        limit: 1
      },
      headers: {
        // REQUIRED: Identify your app (use your real contact)
        'User-Agent': 'ReWearify App - Contact: prathikshapalankar123@gmail.com'
      },
      timeout: 5000
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const lon = parseFloat(result.lon);
      const lat = parseFloat(result.lat);

      // Validate coordinates
      if (
        !isNaN(lon) && !isNaN(lat) &&
        lon >= -180 && lon <= 180 &&
        lat >= -90 && lat <= 90
      ) {
        return [lon, lat]; // GeoJSON: [longitude, latitude]
      }
    }

    return null;
  } catch (error) {
    console.warn('🌍 Geocoding failed:', error.message);
    return null;
  }
};