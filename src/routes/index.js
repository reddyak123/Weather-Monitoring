const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const config = require('../config');

router.get('/current-weather', async (req, res) => {
  const client = await dbService.pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM weather_data
      WHERE dt = (SELECT MAX(dt) FROM weather_data)
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching current weather:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.get('/daily-aggregates', async (req, res) => {
  const client = await dbService.pool.connect();
  try {
    const result = await client.query('SELECT * FROM daily_aggregates ORDER BY date DESC, city');
    const aggregates = result.rows;

    // Prepare data for Chart.js
    const cities = [...new Set(aggregates.map(a => a.city))];
    const dates = [...new Set(aggregates.map(a => a.date))].sort((a, b) => new Date(a) - new Date(b));
    
    const datasets = cities.map(city => ({
      label: city,
      data: dates.map(date => {
        const aggregate = aggregates.find(a => a.city === city && a.date === date);
        return aggregate ? aggregate.avg_temp : null;
      })
    }));

    res.send(`
      <html>
        <head>
          <title>Daily Weather Aggregates</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        </head>
        <body>
          <h1>Daily Weather Aggregates</h1>
          <canvas id="weatherChart" width="800" height="400"></canvas>
          <script>
            const ctx = document.getElementById('weatherChart').getContext('2d');
            new Chart(ctx, {
              type: 'line',
              data: {
                labels: ${JSON.stringify(dates)},
                datasets: ${JSON.stringify(datasets)}
              },
              options: {
                responsive: true,
                title: {
                  display: true,
                  text: 'Average Temperature by City'
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Temperature (°C)'
                    }
                  }
                }
              }
            });
          </script>
          <table border="1">
            <tr>
              <th>Date</th>
              <th>City</th>
              <th>Avg Temp</th>
              <th>Max Temp</th>
              <th>Min Temp</th>
              <th>Dominant Condition</th>
            </tr>
            ${aggregates.map(a => `
              <tr>
                <td>${a.date}</td>
                <td>${a.city}</td>
                <td>${a.avg_temp.toFixed(2)}</td>
                <td>${a.max_temp.toFixed(2)}</td>
                <td>${a.min_temp.toFixed(2)}</td>
                <td>${a.dominant_condition}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error fetching daily aggregates:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

router.get('/historical-trends', async (req, res) => {
    const client = await dbService.pool.connect();
    try {
      const result = await client.query('SELECT city, DATE(dt) as date, AVG(temp) as avg_temp FROM weather_data GROUP BY city, DATE(dt) ORDER BY city, date');
      const trends = result.rows;
  
      // Prepare data for Chart.js
      const cities = [...new Set(trends.map(t => t.city))];
      const dates = [...new Set(trends.map(t => t.date))].sort((a, b) => new Date(a) - new Date(b));
      
      const datasets = cities.map(city => ({
        label: city,
        data: dates.map(date => {
          const trend = trends.find(t => t.city === city && t.date === date);
          return trend ? parseFloat(trend.avg_temp) : null;
        })
      }));
  
      res.send(`
        <html>
          <head>
            <title>Historical Weather Trends</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          </head>
          <body>
            <h1>Historical Weather Trends</h1>
            <canvas id="trendsChart" width="800" height="400"></canvas>
            <script>
              const ctx = document.getElementById('trendsChart').getContext('2d');
              new Chart(ctx, {
                type: 'line',
                data: {
                  labels: ${JSON.stringify(dates)},
                  datasets: ${JSON.stringify(datasets)}
                },
                options: {
                  responsive: true,
                  title: {
                    display: true,
                    text: 'Historical Average Temperature Trends by City'
                  },
                  scales: {
                    x: {
                      type: 'time',
                      time: {
                        unit: 'day'
                      },
                      title: {
                        display: true,
                        text: 'Date'
                      }
                    },
                    y: {
                      beginAtZero: false,
                      title: {
                        display: true,
                        text: 'Temperature (°C)'
                      }
                    }
                  }
                }
              });
            </script>
            <table border="1">
              <tr>
                <th>Date</th>
                <th>City</th>
                <th>Avg Temp</th>
              </tr>
              ${trends.map(t => `
                <tr>
                  <td>${t.date}</td>
                  <td>${t.city}</td>
                  <td>${parseFloat(t.avg_temp).toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error fetching historical trends:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  });
  
  router.get('/triggered-alerts', async (req, res) => {
    const client = await dbService.pool.connect();
    try {
      const result = await client.query(`
        SELECT city, dt, temp,
          CASE
            WHEN temp > $1 THEN 'High Temperature'
            WHEN temp < $2 THEN 'Low Temperature'
            ELSE 'Normal'
          END as alert_type
        FROM weather_data
        WHERE temp > $1 OR temp < $2
        ORDER BY dt DESC
        LIMIT 100
      `, [config.ALERT_THRESHOLDS.highTemperature, config.ALERT_THRESHOLDS.lowTemperature]);
      const alerts = result.rows;
  
      res.send(`
        <html>
          <head>
            <title>Triggered Weather Alerts</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          </head>
          <body>
            <h1>Triggered Weather Alerts</h1>
            <canvas id="alertsChart" width="800" height="400"></canvas>
            <script>
              const ctx = document.getElementById('alertsChart').getContext('2d');
              new Chart(ctx, {
                type: 'scatter',
                data: {
                  datasets: ${JSON.stringify(alerts.map(a => ({
                    label: a.city,
                    data: [{x: new Date(a.dt).toISOString(), y: parseFloat(a.temp)}],
                    backgroundColor: a.alert_type === 'High Temperature' ? 'red' : 'blue'
                  })))}
                },
                options: {
                  responsive: true,
                  title: {
                    display: true,
                    text: 'Triggered Weather Alerts'
                  },
                  scales: {
                    x: {
                      type: 'time',
                      time: {
                        unit: 'day'
                      },
                      title: {
                        display: true,
                        text: 'Date'
                      }
                    },
                    y: {
                      title: {
                        display: true,
                        text: 'Temperature (°C)'
                      }
                    }
                  }
                }
              });
            </script>
            <table border="1">
              <tr>
                <th>Date</th>
                <th>City</th>
                <th>Temperature</th>
                <th>Alert Type</th>
              </tr>
              ${alerts.map(a => `
                <tr>
                  <td>${new Date(a.dt).toLocaleString()}</td>
                  <td>${a.city}</td>
                  <td>${parseFloat(a.temp).toFixed(2)}</td>
                  <td>${a.alert_type}</td>
                </tr>
              `).join('')}
            </table>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error fetching triggered alerts:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  });
  
  module.exports = router;