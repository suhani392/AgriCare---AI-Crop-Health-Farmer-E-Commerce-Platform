
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, Cloud, Sun, Wind, Droplets, Lightbulb, Thermometer, AlertTriangle, Search, LocateFixed, CalendarDays, Zap, CloudSun, CloudRain, CloudDrizzle, CloudLightning, CloudSnow } from 'lucide-react';
import type { WeatherData, LocalizedFarmingTip } from '@/types';
import { getLocalizedFarmingTipsAction, generateWeatherImageAction, getWeatherForLocationAction } from '@/lib/actions';
import { LeafLoader } from '@/components/ui/leaf-loader';
import { useLanguage } from '@/contexts/LanguageContext';


const getTipIcon = (category: string): React.ElementType => {
  const catLower = category.toLowerCase();
  if (catLower.includes('pest') || catLower.includes('disease')) return Lightbulb;
  if (catLower.includes('soil') || catLower.includes('fertiliz')) return Droplets; 
  if (catLower.includes('irrigat') || catLower.includes('water')) return Droplets;
  if (catLower.includes('sowing') || catLower.includes('plant')) return CalendarDays;
  if (catLower.includes('harvest')) return Zap; 
  if (catLower.includes('weather') || catLower.includes('advisory')) return CloudSun;
  return Lightbulb;
};

const LucideIconIndex = {
  Sun, CloudSun, CloudRain, Cloud, CloudDrizzle, Wind, Thermometer, Lightbulb, Droplets, CalendarDays, Zap, MapPin, Search, LocateFixed, AlertTriangle, CloudLightning, CloudSnow
};

export default function WeatherPage() {
  const { t } = useLanguage();
  const [locationInput, setLocationInput] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherImage, setWeatherImage] = useState<string | null>(null);
  const [farmingTips, setFarmingTips] = useState<LocalizedFarmingTip[] | null>(null);
  const [generalAdvice, setGeneralAdvice] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchDataForLocation = async (location: { locationName: string }) => {
    setIsLoading(true);
    setError(null);
    setWeatherData(null);
    setWeatherImage(null);
    setFarmingTips(null);
    setGeneralAdvice(null);

    try {
      const weatherResult = await getWeatherForLocationAction(location);
      
      if (weatherResult.error || !weatherResult.weather) {
        throw new Error(weatherResult.error || "Failed to fetch weather data.");
      }
      
      const fetchedWeather = weatherResult.weather;
      setWeatherData(fetchedWeather);

      // Fetch tips and image in parallel
      const [tipsResult, imageResult] = await Promise.all([
        getLocalizedFarmingTipsAction({
          locationName: fetchedWeather.locationName,
          weatherCondition: fetchedWeather.condition,
          temperatureCelsius: parseFloat(fetchedWeather.temperature.replace('°C', '')) || undefined,
        }),
        generateWeatherImageAction({
          weatherDescription: fetchedWeather.condition,
          locationName: fetchedWeather.locationName
        })
      ]);

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
      
      if('error' in imageResult) {
          console.warn("AI image generation failed:", imageResult.error);
          setWeatherImage(null); // Fallback to no image
      } else if (imageResult.imageUrl) {
          setWeatherImage(imageResult.imageUrl);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch local information. Please try again.');
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
    handleFetchDataForLocation({ locationName: locationInput });
  };
  
  const WeatherIcon = weatherData?.iconName ? (LucideIconIndex[weatherData.iconName as keyof typeof LucideIconIndex] || Cloud) : Cloud;


  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-headline tracking-tight">{t('header.weather')} & Farming Tips</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Enter your location to get real-time weather forecasts and AI-powered farming tips for your area in India.
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
              placeholder="Enter your city or district (e.g., Nagpur)"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="flex-grow text-base"
              aria-label="Enter location"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <LeafLoader size={16} className="mr-2" /> : <Search className="mr-2 h-4 w-4" />} Search
            </Button>
          </form>
           <p className="text-xs text-muted-foreground mt-3">
            Tip: For accurate results, provide your city name.
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
                  {isLoading && !weatherImage ? (
                    <div className="rounded-lg aspect-[2/1] bg-muted/50 flex flex-col items-center justify-center">
                        <LeafLoader size={32} />
                        <p className="text-sm text-muted-foreground mt-2">Generating weather art...</p>
                    </div>
                  ) : weatherImage ? (
                     <Image 
                        src={weatherImage} 
                        alt={`AI generated image for ${weatherData.condition}`} 
                        width={600} 
                        height={300} 
                        className="rounded-lg aspect-[2/1] object-cover border" 
                        priority={true}
                      />
                  ) : (
                    <div className="rounded-lg aspect-[2/1] bg-muted/50 flex flex-col items-center justify-center">
                        <CloudDrizzle className="h-12 w-12 text-muted-foreground/50"/>
                        <p className="text-sm text-muted-foreground mt-2">Could not generate image</p>
                    </div>
                  )}
              </div>
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
                const TipIcon = tip.iconName ? (LucideIconIndex[tip.iconName as keyof typeof LucideIconIndex] || Lightbulb) : Lightbulb;
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
                    <p className="text-xs text-muted-foreground">Tips generated by AI based on real-time weather and location.</p>
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
            <p className="text-sm text-muted-foreground mt-1">We'll fetch real-time weather and AI-powered farming tips for you.</p>
        </div>
      )}

    </div>
  );
}
