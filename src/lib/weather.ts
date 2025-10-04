/**
 * Weather API service for location-based agricultural advice
 * Uses WeatherAPI (weatherapi.com) for weather data
 */

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
    };
    humidity: number;
    cloud: number;
    feelslike_c: number;
    uv: number;
    wind_kph: number;
    wind_dir: string;
    pressure_mb: number;
    precip_mm: number;
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        avghumidity: number;
        maxwind_kph: number;
        totalprecip_mm: number;
        uv: number;
        condition: {
          text: string;
          icon: string;
        };
      };
    }>;
  };
}

export interface AgriculturalWeatherData {
  location: string;
  temperature: number;
  humidity: number;
  uvIndex: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  agriculturalRisk: {
    diseaseRisk: 'low' | 'medium' | 'high';
    pestRisk: 'low' | 'medium' | 'high';
    stressRisk: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
}

/**
 * Get current weather data for a location
 */
export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      console.error('Weather API key not found. Please set WEATHER_API_KEY in your environment variables.');
      return null;
    }

    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=no`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    return data as WeatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

/**
 * Get weather forecast for a location
 */
export async function getWeatherForecast(lat: number, lon: number, days: number = 3): Promise<WeatherData | null> {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      console.error('Weather API key not found. Please set WEATHER_API_KEY in your environment variables.');
      return null;
    }

    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=${days}&aqi=no&alerts=no`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    return data as WeatherData;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return null;
  }
}

/**
 * Analyze weather data for agricultural risks and recommendations
 */
export function analyzeAgriculturalWeather(weather: WeatherData): AgriculturalWeatherData {
  const { current } = weather;
  
  // Calculate agricultural risks based on weather conditions
  const diseaseRisk = calculateDiseaseRisk(current.humidity, current.temp_c, current.precip_mm);
  const pestRisk = calculatePestRisk(current.temp_c, current.humidity, current.wind_kph);
  const stressRisk = calculateStressRisk(current.temp_c, current.humidity, current.uv);
  
  // Generate recommendations based on conditions
  const recommendations = generateWeatherRecommendations(current, diseaseRisk, pestRisk, stressRisk);

  return {
    location: `${weather.location.name}, ${weather.location.region}`,
    temperature: current.temp_c,
    humidity: current.humidity,
    uvIndex: current.uv,
    windSpeed: current.wind_kph,
    precipitation: current.precip_mm,
    condition: current.condition.text,
    agriculturalRisk: {
      diseaseRisk,
      pestRisk,
      stressRisk,
    },
    recommendations,
  };
}

/**
 * Calculate disease risk based on weather conditions
 */
function calculateDiseaseRisk(humidity: number, temperature: number, precipitation: number): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  
  // High humidity increases disease risk
  if (humidity > 80) riskScore += 3;
  else if (humidity > 60) riskScore += 2;
  else if (humidity > 40) riskScore += 1;
  
  // Moderate temperature (20-30°C) is ideal for many diseases
  if (temperature >= 20 && temperature <= 30) riskScore += 2;
  else if (temperature >= 15 && temperature <= 35) riskScore += 1;
  
  // Precipitation increases disease risk
  if (precipitation > 10) riskScore += 2;
  else if (precipitation > 5) riskScore += 1;
  
  if (riskScore >= 5) return 'high';
  if (riskScore >= 3) return 'medium';
  return 'low';
}

/**
 * Calculate pest risk based on weather conditions
 */
function calculatePestRisk(temperature: number, humidity: number, windSpeed: number): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  
  // Warm temperatures favor pest activity
  if (temperature >= 25 && temperature <= 35) riskScore += 2;
  else if (temperature >= 20 && temperature <= 40) riskScore += 1;
  
  // Moderate humidity favors pests
  if (humidity >= 40 && humidity <= 70) riskScore += 2;
  else if (humidity >= 30 && humidity <= 80) riskScore += 1;
  
  // Low wind speed favors pest activity
  if (windSpeed < 10) riskScore += 1;
  
  if (riskScore >= 4) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}

/**
 * Calculate plant stress risk based on weather conditions
 */
function calculateStressRisk(temperature: number, humidity: number, uvIndex: number): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  
  // Extreme temperatures cause stress
  if (temperature > 35 || temperature < 5) riskScore += 3;
  else if (temperature > 30 || temperature < 10) riskScore += 2;
  else if (temperature > 25 || temperature < 15) riskScore += 1;
  
  // Low humidity causes stress
  if (humidity < 30) riskScore += 2;
  else if (humidity < 40) riskScore += 1;
  
  // High UV index causes stress
  if (uvIndex > 8) riskScore += 2;
  else if (uvIndex > 6) riskScore += 1;
  
  if (riskScore >= 4) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}

/**
 * Generate weather-based agricultural recommendations
 */
function generateWeatherRecommendations(
  current: WeatherData['current'],
  diseaseRisk: 'low' | 'medium' | 'high',
  pestRisk: 'low' | 'medium' | 'high',
  stressRisk: 'low' | 'medium' | 'high'
): string[] {
  const recommendations: string[] = [];
  
  // Disease prevention recommendations
  if (diseaseRisk === 'high') {
    recommendations.push('High disease risk detected. Apply preventive fungicides and ensure good air circulation.');
  } else if (diseaseRisk === 'medium') {
    recommendations.push('Moderate disease risk. Monitor crops closely and consider preventive measures.');
  }
  
  // Pest control recommendations
  if (pestRisk === 'high') {
    recommendations.push('High pest activity expected. Apply appropriate insecticides and use physical barriers.');
  } else if (pestRisk === 'medium') {
    recommendations.push('Moderate pest risk. Monitor for pest activity and apply control measures if needed.');
  }
  
  // Plant stress recommendations
  if (stressRisk === 'high') {
    recommendations.push('High plant stress risk. Provide shade, increase irrigation, and avoid heavy fertilization.');
  } else if (stressRisk === 'medium') {
    recommendations.push('Moderate plant stress risk. Monitor plant health and adjust care accordingly.');
  }
  
  // Temperature-based recommendations
  if (current.temp_c > 35) {
    recommendations.push('Extreme heat conditions. Provide shade and increase irrigation frequency.');
  } else if (current.temp_c < 5) {
    recommendations.push('Cold conditions. Protect sensitive crops with covers or move indoors.');
  }
  
  // Humidity-based recommendations
  if (current.humidity > 80) {
    recommendations.push('High humidity. Ensure good ventilation and avoid overhead watering.');
  } else if (current.humidity < 30) {
    recommendations.push('Low humidity. Increase irrigation and consider mulching to retain moisture.');
  }
  
  // UV index recommendations
  if (current.uv > 8) {
    recommendations.push('Very high UV index. Provide shade for sensitive plants and avoid working during peak sun hours.');
  }
  
  // Wind recommendations
  if (current.wind_kph > 30) {
    recommendations.push('Strong winds expected. Secure plants and avoid spraying pesticides.');
  }
  
  return recommendations;
}
