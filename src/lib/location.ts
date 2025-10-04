/**
 * Location service for getting user's current location
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface LocationPermission {
  granted: boolean;
  error?: string;
}

/**
 * Request user's current location using browser geolocation API
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        resolve(locationData);
      },
      (error) => {
        console.error('Error getting location:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

/**
 * Check if location permission is granted
 */
export async function checkLocationPermission(): Promise<LocationPermission> {
  if (!navigator.permissions) {
    return { granted: false, error: 'Permission API not supported' };
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return { granted: permission.state === 'granted' };
  } catch (error) {
    return { granted: false, error: 'Permission check failed' };
  }
}

/**
 * Request location permission from user
 */
export async function requestLocationPermission(): Promise<LocationPermission> {
  try {
    const location = await getCurrentLocation();
    return { granted: location !== null };
  } catch (error) {
    return { granted: false, error: 'Permission denied' };
  }
}

/**
 * Get location name from coordinates using reverse geocoding
 */
export async function getLocationName(lat: number, lon: number): Promise<string | null> {
  try {
    // Using a free reverse geocoding service
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    const data = await response.json();
    return `${data.city || data.locality}, ${data.principalSubdivision}, ${data.countryName}`;
  } catch (error) {
    console.error('Error getting location name:', error);
    return null;
  }
}
