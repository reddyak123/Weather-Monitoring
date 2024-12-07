const nodemailer = require('nodemailer');
const config = require('../config');
require('dotenv').config()
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  function checkAlerts(weatherData) {
    const alerts = [];
    if (weatherData.temp > config.ALERT_THRESHOLDS.highTemperature) {
      alerts.push(`High temperature alert for ${weatherData.city}: ${weatherData.temp.toFixed(2)}°C`);
    }
    if (weatherData.temp < config.ALERT_THRESHOLDS.lowTemperature) {
      alerts.push(`Low temperature alert for ${weatherData.city}: ${weatherData.temp.toFixed(2)}°C`);
    }
    return alerts;
  }
  //handle alerts
  async function handleAlerts(alerts) {
    alerts.forEach(alert => {
      console.log('ALERT:', alert);
      sendEmailAlert(alert);
    });
  }
  
  async function sendEmailAlert(alert) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: 'Weather Alert',
      text: alert
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log('Email alert sent successfully');
    } catch (error) {
      console.error('Error sending email alert:', error);
    }
  }
  
  module.exports = {
    checkAlerts,
    handleAlerts,
  };