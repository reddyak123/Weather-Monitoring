const { Pool } = require('pg');
require('dotenv').config()
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});
console.log(process.env.DB_USER);
async function storeWeatherData(data) {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO weather_data (city, dt, temp, feels_like, temp_min, temp_max, pressure, humidity, wind_speed, wind_deg, weather_condition)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [data.city, data.dt, data.temp, data.feels_like, data.temp_min, data.temp_max, data.pressure, data.humidity, data.wind_speed, data.wind_deg, data.weather_condition]);
  } finally {
    client.release();
  }
}

async function calculateDailyAggregates() {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO daily_aggregates (date, city, avg_temp, max_temp, min_temp, dominant_condition)
      SELECT 
        DATE(dt) as date,
        city,
        AVG(temp) as avg_temp,
        MAX(temp) as max_temp,
        MIN(temp) as min_temp,
        MODE() WITHIN GROUP (ORDER BY weather_condition) as dominant_condition
      FROM weather_data
      WHERE DATE(dt) = CURRENT_DATE - INTERVAL '1 day'
      GROUP BY DATE(dt), city
      ON CONFLICT (date, city) DO UPDATE
      SET 
        avg_temp = EXCLUDED.avg_temp,
        max_temp = EXCLUDED.max_temp,
        min_temp = EXCLUDED.min_temp,
        dominant_condition = EXCLUDED.dominant_condition
    `);
  } finally {
    client.release();
  }
}

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS weather_data (
        id SERIAL PRIMARY KEY,
        city VARCHAR(50),
        dt TIMESTAMP,
        temp FLOAT,
        feels_like FLOAT,
        temp_min FLOAT,
        temp_max FLOAT,
        pressure INTEGER,
        humidity INTEGER,
        wind_speed FLOAT,
        wind_deg INTEGER,
        weather_condition VARCHAR(50)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_aggregates (
        date DATE,
        city VARCHAR(50),
        avg_temp FLOAT,
        max_temp FLOAT,
        min_temp FLOAT,
        dominant_condition VARCHAR(50),
        PRIMARY KEY (date, city)
      )
    `);
  } finally {
    client.release();
  }
}

module.exports = {
  storeWeatherData,
  calculateDailyAggregates,
  initDb,
  pool,
};