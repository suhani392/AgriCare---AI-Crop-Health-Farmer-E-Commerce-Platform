# Weather API Setup Guide

This guide will help you set up the weather API for location-based agricultural advice in your AgriCare application.

## 🌤️ **Recommended API: WeatherAPI**

**Why WeatherAPI?**
- ✅ **Generous free tier**: 1 million calls/month
- ✅ **Agricultural-specific data**: UV index, humidity, soil temperature
- ✅ **Reliable and fast**: 99.9% uptime
- ✅ **Cost-effective**: Free tier is sufficient for most applications
- ✅ **Good documentation**: Easy to integrate

## 🔑 **Step 1: Get Your API Key**

1. **Visit WeatherAPI**: Go to [https://www.weatherapi.com/signup.aspx](https://www.weatherapi.com/signup.aspx)
2. **Sign up**: Create a free account
3. **Get API Key**: Copy your API key from the dashboard
4. **Free Tier**: 1 million calls/month (more than enough for your application)

## ⚙️ **Step 2: Configure Environment Variables**

Create a `.env.local` file in your project root:

```bash
# Weather API Configuration
WEATHER_API_KEY=your_weather_api_key_here
WEATHER_API_BASE_URL=https://api.weatherapi.com/v1

# Optional: OpenWeatherMap as backup (if you want to use it)
# OPENWEATHER_API_KEY=your_openweather_api_key_here
```

**Replace `your_weather_api_key_here` with your actual API key from WeatherAPI.**

## 🚀 **Step 3: Test the Integration**

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Go to the chatbot page**: Navigate to `/chatbot`

3. **Enable location access**: Click "Enable Location" when prompted

4. **Test weather-based advice**: Ask questions like:
   - "What preventive measures should I take for my crops?"
   - "How can I protect my plants from diseases?"
   - "What's the best time to apply pesticides?"

## 📊 **Features You'll Get**

### **Weather-Based Agricultural Advice**
- **Disease Risk Assessment**: Based on humidity, temperature, and precipitation
- **Pest Risk Analysis**: Considers temperature, humidity, and wind conditions
- **Plant Stress Monitoring**: Evaluates extreme temperatures, UV index, and humidity
- **Location-Specific Recommendations**: Tailored advice for your area

### **Smart Recommendations**
- **High humidity** → Disease prevention advice
- **Extreme temperatures** → Plant protection measures
- **High UV index** → Shade and timing recommendations
- **Wind conditions** → Pesticide application timing
- **Precipitation** → Irrigation and disease management

## 🔄 **How It Works**

1. **User grants location permission** → Gets coordinates
2. **System fetches weather data** → Current conditions for the location
3. **AI analyzes weather + agricultural risks** → Generates smart recommendations
4. **Chatbot provides location-aware advice** → Tailored to current conditions

## 🛠️ **Alternative APIs (If Needed)**

### **OpenWeatherMap**
- **Free Tier**: 1,000 calls/day
- **Setup**: Get API key from [openweathermap.org](https://openweathermap.org/api)
- **Environment Variable**: `OPENWEATHER_API_KEY=your_key_here`

### **AccuWeather**
- **Free Tier**: 50 calls/day
- **Setup**: Get API key from [developer.accuweather.com](https://developer.accuweather.com/)
- **Environment Variable**: `ACCUWEATHER_API_KEY=your_key_here`

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"Weather API key not found"**
   - Check your `.env.local` file exists
   - Verify the API key is correct
   - Restart your development server

2. **"Location access denied"**
   - Ensure HTTPS in production
   - Check browser permissions
   - Try refreshing the page

3. **"Failed to fetch weather data"**
   - Check your internet connection
   - Verify API key is valid
   - Check API quota limits

### **Debug Steps**

1. **Check browser console** for error messages
2. **Verify environment variables** are loaded
3. **Test API key** directly with curl:
   ```bash
   curl "https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=28.6139,77.2090"
   ```

## 📈 **Monitoring Usage**

- **WeatherAPI Dashboard**: Monitor your API usage at [weatherapi.com](https://www.weatherapi.com/)
- **Free Tier Limits**: 1 million calls/month
- **Typical Usage**: ~100-500 calls/day for a small application

## 🔒 **Security Notes**

- **Never commit API keys** to version control
- **Use environment variables** for all sensitive data
- **Rotate API keys** periodically
- **Monitor usage** for unusual activity

## 🎯 **Expected Results**

After setup, your chatbot will provide:

- ✅ **Location-aware advice** based on current weather
- ✅ **Disease prevention** recommendations for current conditions
- ✅ **Pest control timing** based on weather patterns
- ✅ **Plant stress management** for extreme conditions
- ✅ **Optimal application timing** for pesticides and fertilizers

Your agricultural chatbot is now powered by real-time weather data! 🌱🌤️
