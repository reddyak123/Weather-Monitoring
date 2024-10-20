const axios = require('axios');
const dbService = require('./dbService');
const alertService = require('./alertService');
const config = require('../config');
require('dotenv').config()
const API_KEY = process.env.OPENWEATHERMAP_API_KEY;

async function getCoordinates(city) {
  try {
    const response = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${city},${config.COUNTRY_CODE}&limit=1&appid=${API_KEY}`);
    const [location] = response.data;
    return { lat: location.lat, lon: location.lon };
  } catch (error) {
    console.error(`Error fetching coordinates for ${city}:`, error);
    throw error;
  }
}

async function fetchWeatherData(lat, lon) {
  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching weather data for coordinates (${lat}, ${lon}):`, error);
    throw error;
  }
}

function kelvinToCelsius(kelvin) {
  return kelvin - 273.15;
}

async function fetchAllCitiesWeather() {
  for (const city of config.CITIES) {
    try {
      const { lat, lon } = await getCoordinates(city);
      const weatherData = await fetchWeatherData(lat, lon);
      
      const processedData = {
        city,
        dt: new Date(weatherData.dt * 1000),
        temp: kelvinToCelsius(weatherData.main.temp),
        feels_like: kelvinToCelsius(weatherData.main.feels_like),
        temp_min: kelvinToCelsius(weatherData.main.temp_min),
        temp_max: kelvinToCelsius(weatherData.main.temp_max),
        pressure: weatherData.main.pressure,
        humidity: weatherData.main.humidity,
        wind_speed: weatherData.wind.speed,
        wind_deg: weatherData.wind.deg,
        weather_condition: weatherData.weather[0].main
      };

      await dbService.storeWeatherData(processedData);
      const alerts = alertService.checkAlerts(processedData);
      if (alerts.length > 0) {
        await alertService.handleAlerts(alerts);
      }
    } catch (error) {
      console.error(`Error processing weather data for ${city}:`, error);
    }
  }
}

module.exports = {
  fetchAllCitiesWeather,
};