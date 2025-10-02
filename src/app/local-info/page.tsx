
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
// import type { Metadata } from 'next'; // Metadata should be defined in a server component or layout
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Cloud, Sun, Wind, Droplets, Lightbulb, Thermometer, AlertTriangle, Search, LocateFixed, CalendarDays, Zap, CloudSun, CloudRain, CloudDrizzle } from 'lucide-react';
import type { WeatherData, LocalizedFarmingTip, LocalizedFarmingTipsOutput } from '@/types';
import { getLocalizedFarmingTipsAction } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { LeafLoader } from '@/components/ui/leaf-loader';


// Mock Indian locations for simulated reverse geocoding
const mockIndianLocations = [
  "Nagpur, Maharashtra",
  "Ludhiana, Punjab",
  "Guntur, Andhra Pradesh",
  "Indore, Madhya Pradesh",
  "Mysuru, Karnataka",
  "Patna, Bihar",
  "Jaipur, Rajasthan"
];

const fetchMockWeather = async (location: string | { lat: number; lon: number }): Promise<WeatherData> => {
  console.log("Fetching mock weather for:", location);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000)); 

  let locationName: string;
  if (typeof location === 'object') {
    // Simulate reverse geocoding: Pick a random Indian location
    // In a real app, you'd call a reverse geocoding API here with location.lat and location.lon
    // e.g., const address = await reverseGeocode(location.lat, location.lon); locationName = address.city || address.town;
    locationName = mockIndianLocations[Math.floor(Math.random() * mockIndianLocations.length)];
  } else {
    locationName = location;
  }
      
  // Simulate different weather conditions randomly for better testing
  const conditions = [
    { cond: "Sunny and clear", icon: "Sun", hint: "clear sky farm"},
    { cond: "Partly cloudy", icon: "CloudSun", hint: "cloudy farm" },
    { cond: "Cloudy with chance of monsoon showers", icon: "CloudRain", hint: "monsoon farm india"},
    { cond: "Overcast and humid", icon: "Cloud", hint: "overcast field"},
    { cond: "Light drizzle", icon: "CloudDrizzle", hint: "rainy farm"}
  ];
  const randomCond = conditions[Math.floor(Math.random() * conditions.length)];

  return {
    condition: randomCond.cond,
    temperature: `${Math.floor(Math.random() * 15) + 20}°C`, // Temp between 20-34°C
    humidity: `${Math.floor(Math.random() * 40) + 50}%`,    // Humidity between 50-89%
    wind: `${Math.floor(Math.random() * 15) + 5} km/h ${['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random()*8)]}`,
    iconName: randomCond.icon,
    locationName: locationName, // Use the (potentially reverse geocoded) location name
    dataAiHint: randomCond.hint
  };
};

// Helper to get an icon based on tip category
const getTipIcon = (category: string): React.ElementType => {
  const catLower = category.toLowerCase();
  if (catLower.includes('pest') || catLower.includes('disease')) return Lightbulb;
  if (catLower.includes('soil') || catLower.includes('fertiliz')) return Droplets; 
  if (catLower.includes('irrigat') || catLower.includes('water')) return Droplets;
  if (catLower.includes('sowing') || catLower.includes('plant')) return CalendarDays;
  if (catLower.includes('harvest')) return Zap; 
  if (catLower.includes('weather') || catLower.includes('advisory')) return CloudSun;
  return Lightbulb; // Default
};


export default function LocalInfoPage() {
  const [locationInput, setLocationInput] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [farmingTips, setFarmingTips] = useState<LocalizedFarmingTip[] | null>(null);
  const [generalAdvice, setGeneralAdvice] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Example: Fetch data for a default location on initial load
    // handleFetchDataForLocation("Wardha District, Maharashtra"); 
  }, []);

  const handleFetchDataForLocation = async (location: string | { lat: number; lon: number }) => {
    setIsLoading(true);
    setError(null);
    setWeatherData(null);
    setFarmingTips(null);
    setGeneralAdvice(null);

    try {
      // TODO: Replace fetchMockWeather with your actual weather API call.
      // If 'location' is an object (lat/lon), you'd first call a reverse geocoding API,
      // then use the resulting location name for the weather API.
      const fetchedWeather = await fetchMockWeather(location);
      setWeatherData(fetchedWeather);

      if (fetchedWeather) {
        const tipsInput = {
          locationName: fetchedWeather.locationName, // This will now be the (mock) city/town name
          weatherCondition: fetchedWeather.condition,
          temperatureCelsius: parseFloat(fetchedWeather.temperature.replace('°C', '')) || undefined,
        };
        const tipsResult = await getLocalizedFarmingTipsAction(tipsInput);
        if ('error' in tipsResult) {
          setError(tipsResult.error);
          setFarmingTips([]); 
        } else if (tipsResult && tipsResult.tips) {
          setFarmingTips(tipsResult.tips.map(tip => ({...tip, iconName: getTipIcon(tip.category).displayName || 'Lightbulb' })));
          setGeneralAdvice(tipsResult.generalAdvice || null);
        } else {
           setError("Received no tips from the AI service.");
           setFarmingTips([]);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError('Failed to fetch local information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) {
      setError("Please enter a location.");
      return;
    }
    handleFetchDataForLocation(locationInput);
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      setIsGpsLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Pass coordinates to the fetch function
          handleFetchDataForLocation({ lat: latitude, lon: longitude });
          setIsGpsLoading(false);
        },
        (geoError) => {
          setError(`GPS Error: ${geoError.message}. Please ensure location services are enabled or try entering your location manually.`);
          setIsGpsLoading(false);
        },
        { timeout: 10000 } 
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };
  
  const WeatherIcon = weatherData?.iconName ? (LucideReact[weatherData.iconName as keyof typeof LucideReact] || Cloud) : Cloud;


  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-headline tracking-tight">Local Farming Information</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Enter your location or use GPS to get tailored weather forecasts and AI-powered farming tips for your area in India.
        </p>
      </header>

      <Card className="mb-8 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl">Find Your Location</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 items-start">
            <Input
              type="text"
              placeholder="Enter your city or district (e.g., Nagpur, Punjab)"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="flex-grow text-base"
              aria-label="Enter location"
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="submit" disabled={isLoading || isGpsLoading} className="w-1/2 sm:w-auto">
                {isLoading && !isGpsLoading ? <LeafLoader size={16} className="mr-2" /> : <Search className="mr-2 h-4 w-4" />} Search
              </Button>
              <Button variant="outline" onClick={handleDetectLocation} disabled={isLoading || isGpsLoading} className="w-1/2 sm:w-auto">
                {isGpsLoading ? <LeafLoader size={16} className="mr-2" /> : <LocateFixed className="mr-2 h-4 w-4" />} Use GPS
              </Button>
            </div>
          </form>
           <p className="text-xs text-muted-foreground mt-3">
            Note: GPS-based location will show a simulated nearby Indian town/city name. Weather data is also simulated.
          </p>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && !weatherData && (
        <div className="text-center py-10">
          <LeafLoader size={48} className="mx-auto mb-4" />
          <p className="text-muted-foreground">Fetching local data...</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 items-start">
        {weatherData && (
          <Card className="shadow-xl rounded-xl flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Thermometer className="text-primary"/> Current Weather
              </CardTitle>
              <CardDescription>Forecast for {weatherData.locationName}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <div className="flex items-center justify-around p-4 bg-secondary/30 rounded-lg">
                <WeatherIcon className="h-16 w-16 text-primary" />
                <div className="text-center">
                  <p className="text-4xl font-semibold">{weatherData.temperature}</p>
                  <p className="text-muted-foreground capitalize">{weatherData.condition}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><strong className="font-medium">Humidity:</strong> {weatherData.humidity}</p>
                <p><strong className="font-medium">Wind:</strong> {weatherData.wind}</p>
              </div>
              <div className="mt-auto pt-4">
                  <Image 
                    src={`https://placehold.co/600x300.png`} 
                    alt={`Weather image for ${weatherData.locationName}`} 
                    width={600} 
                    height={300} 
                    className="rounded-lg aspect-[2/1] object-cover" 
                    data-ai-hint={weatherData.dataAiHint || "farm landscape india"}
                    priority={false}
                  />
                   <p className="text-xs text-muted-foreground mt-1 text-center">Illustrative image. Actual conditions may vary.</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Weather data is currently simulated. Integrate a real weather API for live forecasts and a reverse geocoding service for accurate GPS location names.
              </p>
            </CardContent>
          </Card>
        )}

        {(isLoading && weatherData) && ( 
           <Card className="shadow-xl rounded-xl flex flex-col justify-center items-center min-h-[300px]">
             <LeafLoader size={40} className="mb-3" />
             <p className="text-muted-foreground">Fetching AI farming tips...</p>
           </Card>
        )}


        {farmingTips && farmingTips.length > 0 && !isLoading && (
          <Card className="shadow-xl rounded-xl flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                  <Lightbulb className="text-primary"/> AI Farming Tips
              </CardTitle>
              <CardDescription>Tailored advice for {weatherData?.locationName || 'your area'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generalAdvice && (
                <Alert className="bg-accent/10 border-accent/30 mb-4">
                  <AlertTriangle className="h-4 w-4 text-accent" />
                  <AlertTitle className="text-accent">General Advice</AlertTitle>
                  <AlertDescription>{generalAdvice}</AlertDescription>
                </Alert>
              )}
              {farmingTips.map((tip, index) => {
                const TipIcon = tip.iconName ? (LucideReact[tip.iconName as keyof typeof LucideReact] || Lightbulb) : Lightbulb;
                return (
                  <div key={index} className="p-3 border rounded-lg bg-background/50 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-1">
                       <TipIcon className="h-5 w-5 text-primary" />
                       <h3 className="font-headline text-lg">{tip.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 ml-8">{tip.category}</p>
                    <p className="text-sm text-muted-foreground ml-8">{tip.content}</p>
                  </div>
                );
              })}
            </CardContent>
             {weatherData && (
                <CardFooter>
                    <p className="text-xs text-muted-foreground">Tips generated by AI based on current (mock) weather and location.</p>
                </CardFooter>
            )}
          </Card>
        )}
        
        {!isLoading && weatherData && farmingTips === null && !error && (
             <Card className="shadow-xl rounded-xl flex flex-col justify-center items-center min-h-[300px]">
                <Search className="h-10 w-10 text-muted-foreground mb-3"/>
                <p className="text-muted-foreground">Could not retrieve farming tips at this time.</p>
             </Card>
        )}

        {!isLoading && weatherData && farmingTips && farmingTips.length === 0 && !error && (
             <Card className="shadow-xl rounded-xl flex flex-col justify-center items-center min-h-[300px]">
                <Search className="h-10 w-10 text-muted-foreground mb-3"/>
                <p className="text-muted-foreground">No specific farming tips available for this location/weather combination.</p>
             </Card>
        )}


      </div>
      {!weatherData && !isLoading && !error && (
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-card">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
            <p className="text-xl font-semibold text-muted-foreground">Enter a location to get started.</p>
            <p className="text-sm text-muted-foreground mt-1">We'll fetch weather and AI-powered farming tips for you.</p>
        </div>
      )}

    </div>
  );
}

const LucideReact = {
  Sun, CloudSun, CloudRain, Cloud, CloudDrizzle, Wind, Thermometer, Lightbulb, Droplets, CalendarDays, Zap, MapPin, Search, LocateFixed, AlertTriangle,
};
