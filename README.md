# Weather Monitoring Project

This project implements a weather monitoring system that fetches data from the OpenWeatherMap API, stores it in a PostgreSQL database, and provides visualizations and alerts through a web interface.

## Database Schema 
![image](https://github.com/user-attachments/assets/f9c86162-f17d-4c08-a883-c48d20c01691)


## Features

- Fetch weather data for multiple Indian cities at regular intervals
- Store weather data in a PostgreSQL database
- Calculate and store daily weather aggregates
- Provide visualizations for current weather, daily aggregates, and historical trends
- Implement an alert system for extreme temperatures
- RESTful API for accessing weather data and visualizations
- Scheduled tasks for data fetching and aggregation

## Tech Stack

- Backend: Node.js, Express.js
- Database: PostgreSQL
- External API: OpenWeatherMap
- Additional: node-cron for scheduling, nodemailer for email alerts, Chart.js for visualizations

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- PostgreSQL (v12 or later)
- OpenWeatherMap API key

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/weather-monitoring.git
   cd weather-monitoring
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the database:
   - Create a PostgreSQL database for the project
   - Update the `.env` file with your database credentials and OpenWeatherMap API key:
     ```
     DB_USER=your_username
     DB_HOST=localhost
     DB_NAME=your_database_name
     DB_PASSWORD=your_password
     DB_PORT=5432
     OPENWEATHERMAP_API_KEY=your_api_key
     EMAIL_USER=your_email@example.com
     EMAIL_PASS=your_email_password
     NOTIFICATION_EMAIL=recipient@example.com
     ```

## Running the Application

1. Start the backend server:
   ```
   cd src
   node app.js
   ```
   The server will start on `http://localhost:3000`

2. The application will automatically start fetching weather data and calculating aggregates based on the configured schedules.

## API Endpoints

- GET `/current-weather`: Get current weather for all monitored cities
- GET `/daily-aggregates`: Get daily weather aggregates with visualization
- GET `/historical-trends`: Get historical weather trends with visualization
- GET `/triggered-alerts`: Get a list of triggered temperature alerts

## Usage Examples

### Fetching Current Weather

```javascript
fetch('/current-weather')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Viewing Daily Aggregates

Open `http://localhost:3000/daily-aggregates` in a web browser to see the daily aggregates chart and table.

### Checking Historical Trends

Open `http://localhost:3000/historical-trends` in a web browser to view the historical weather trends chart.

## Scheduled Tasks

- Weather data fetching: Runs every 5 minutes
- Daily aggregate calculation: Runs once a day at midnight

## Alert System

The system sends email alerts for extreme temperatures based on the following thresholds:
- High temperature: > 35°C
- Low temperature: < 10°C

Alerts are sent to the email address specified in the `NOTIFICATION_EMAIL` environment variable.

## Testing

As this project does not include automated unit tests, we encourage manual testing. Please test the following scenarios:

1. Verify that weather data is being fetched and stored correctly every 5 minutes.
2. Check that daily aggregates are calculated accurately at midnight.
3. Ensure that temperature alerts are triggered and emails are sent for extreme temperatures.
4. Test all API endpoints and verify the correctness of returned data and visualizations.
5. Simulate various error conditions (e.g., API unavailability, database connection issues) to ensure proper error handling.

## Additional Notes

- The project uses environment variables for configuration. Ensure all required variables are set in the `.env` file.
- CORS is not enabled by default. If you're running a separate frontend, you may need to enable CORS in the Express application.
- The application uses Chart.js for creating visualizations. Ensure you have a stable internet connection to load the Chart.js library from CDN.

