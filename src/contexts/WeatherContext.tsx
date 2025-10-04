'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocationData, getCurrentLocation, getLocationName } from '@/lib/location';
import { WeatherData, getCurrentWeather, analyzeAgriculturalWeather, AgriculturalWeatherData } from '@/lib/weather';

interface WeatherContextType {
  location: LocationData | null;
  weather: WeatherData | null;
  agriculturalWeather: AgriculturalWeatherData | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
  refreshWeather: () => Promise<void>;
  hasLocationPermission: boolean;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

interface WeatherProviderProps {
  children: ReactNode;
}

export function WeatherProvider({ children }: WeatherProviderProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [agriculturalWeather, setAgriculturalWeather] = useState<AgriculturalWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Check for saved location on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        setLocation(parsedLocation);
        setHasLocationPermission(true);
        // Auto-fetch weather if location is available
        fetchWeather(parsedLocation);
      } catch (error) {
        console.error('Error parsing saved location:', error);
        localStorage.removeItem('userLocation');
      }
    }
  }, []);

  const fetchWeather = async (locationData: LocationData) => {
    try {
      setIsLoading(true);
      setError(null);

      const weatherData = await getCurrentWeather(locationData.latitude, locationData.longitude);
      
      if (weatherData) {
        setWeather(weatherData);
        
        // Analyze weather for agricultural insights
        const agriculturalData = analyzeAgriculturalWeather(weatherData);
        setAgriculturalWeather(agriculturalData);
      } else {
        setError('Failed to fetch weather data');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setError('Failed to fetch weather data');
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const locationData = await getCurrentLocation();
      
      if (locationData) {
        setLocation(locationData);
        setHasLocationPermission(true);
        
        // Save location to localStorage
        localStorage.setItem('userLocation', JSON.stringify(locationData));
        
        // Get location name
        const locationName = await getLocationName(locationData.latitude, locationData.longitude);
        if (locationName) {
          setLocation(prev => prev ? { ...prev, address: locationName } : null);
        }
        
        // Fetch weather data
        await fetchWeather(locationData);
      } else {
        setError('Location access denied or not available');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWeather = async () => {
    if (location) {
      await fetchWeather(location);
    }
  };

  const value: WeatherContextType = {
    location,
    weather,
    agriculturalWeather,
    isLoading,
    error,
    requestLocation,
    refreshWeather,
    hasLocationPermission,
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}
