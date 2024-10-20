const express = require('express');
const dotenv = require('dotenv');
const cron = require('node-cron');

const weatherService = require('./services/weatherService');
const dbService = require('./services/dbService');
const routes = require('./routes');

require('dotenv').config()


const app = express();
const port = process.env.PORT || 3000;

const API_CALL_INTERVAL = 1;

// Schedule weather data fetching
cron.schedule(`*/${API_CALL_INTERVAL} * * * *`, weatherService.fetchAllCitiesWeather);

// Schedule daily aggregate calculation
cron.schedule('0 0 * * *', dbService.calculateDailyAggregates);

// Initialize routes
app.use('/', routes);

// Initialize database tables
dbService.initDb().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Fetching weather data every ${API_CALL_INTERVAL} minutes`);
  });
});