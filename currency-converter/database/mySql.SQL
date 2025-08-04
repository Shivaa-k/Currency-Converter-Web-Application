-- Create database
CREATE DATABASE IF NOT EXISTS currency_converter;
USE currency_converter;

-- Create conversions table
CREATE TABLE IF NOT EXISTS conversions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_currency VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    converted_amount DECIMAL(15, 2) NOT NULL,
    exchange_rate DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX idx_currencies ON conversions(source_currency, target_currency);

-- Example: src/components/CurrencyConverter.js
const API_BASE_URL = "http://localhost:3001"; // Make sure this matches your backend

// When fetching currencies:

fetch(`${API_BASE_URL}/api/currencies`)
  .then(res => res.json())
  .then(data => setCurrencies(data))
  .catch(() => setError("Failed to load currencies"));

// Find this line in server.js
const errorHandler = require('./models/error');

--cd "C:\Users\shiva\Desktop\Currency Converter Web Application\currency-converter\backend"
--npm run dev