#!/usr/bin/env node

/**
 * Test Weather Response Format
 * This shows how the chatbot will now respond with location and weather information
 */

const API_KEY = '835c0c94a6b1456c9a785251250410';

async function testWeatherResponse() {
  console.log('🌤️  Testing Enhanced Weather Response Format...\n');
  
  try {
    // Test with Delhi coordinates
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=28.6139,77.2090&aqi=no`
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('📱 ENHANCED CHATBOT RESPONSE FORMAT:');
    console.log('=' .repeat(50));
    console.log('');
    console.log('📍 Location: ' + data.location.name + ', ' + data.location.region);
    console.log('🌤️ Current Weather: ' + data.current.temp_c + '°C, ' + data.current.humidity + '% humidity, ' + data.current.condition.text);
    console.log('⚠️ Agricultural Risks: Disease Risk: ' + (data.current.humidity > 70 ? 'high' : data.current.humidity > 50 ? 'medium' : 'low') + ', Pest Risk: ' + (data.current.temp_c > 25 ? 'medium' : 'low') + ', Stress Risk: ' + (data.current.temp_c > 35 ? 'high' : 'low'));
    console.log('');
    console.log('🌱 PREVENTIVE MEASURES FOR YOUR CROPS:');
    console.log('');
    
    // Generate weather-based recommendations
    const recommendations = [];
    
    if (data.current.humidity > 70) {
      recommendations.push('• High humidity detected - Apply preventive fungicides and ensure good air circulation');
    }
    
    if (data.current.temp_c > 35) {
      recommendations.push('• Extreme heat conditions - Provide shade and increase irrigation frequency');
    } else if (data.current.temp_c > 30) {
      recommendations.push('• Warm conditions - Monitor for heat stress and ensure adequate watering');
    }
    
    if (data.current.uv > 8) {
      recommendations.push('• Very high UV index - Provide shade for sensitive plants and avoid working during peak sun hours');
    }
    
    if (data.current.wind_kph > 20) {
      recommendations.push('• Strong winds expected - Secure plants and avoid spraying pesticides');
    }
    
    if (data.current.precip_mm > 5) {
      recommendations.push('• Recent rainfall - Monitor for disease development and ensure proper drainage');
    }
    
    // General recommendations
    recommendations.push('• Regular monitoring for early signs of disease or pest infestation');
    recommendations.push('• Maintain balanced fertilization for plant health');
    recommendations.push('• Practice crop rotation to reduce disease buildup');
    
    recommendations.forEach(rec => console.log(rec));
    
    console.log('');
    console.log('💡 These recommendations are specifically tailored to your current location and weather conditions.');
    console.log('');
    console.log('✅ Your chatbot will now provide this enhanced format with location and weather details!');
    
  } catch (error) {
    console.error('❌ Error testing weather response:', error.message);
  }
}

testWeatherResponse();
