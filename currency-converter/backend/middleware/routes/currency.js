const express = require('express');
const axios = require('axios');
const db = require('../../config/database');
const router = express.Router();

// Get available currencies
router.get('/currencies', async (req, res) => {
  try {
    const response = await axios.get(`${process.env.EXCHANGE_API_URL}/${process.env.EXCHANGE_API_KEY}/codes`);
    
    if (response.data.result === 'success') {
      const currencies = response.data.supported_codes.map(([code, name]) => ({
        code,
        name
      }));
      
      res.json({
        success: true,
        currencies
      });
    } else {
      throw new Error('Failed to fetch currencies');
    }
  } catch (error) {
    console.error('Error fetching currencies:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available currencies'
    });
  }
});

// Convert currency
router.post('/convert', async (req, res) => {
  try {
    const { sourceCurrency, targetCurrency, amount } = req.body;

    // Validate input
    if (!sourceCurrency || !targetCurrency || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sourceCurrency, targetCurrency, amount'
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    // Fetch exchange rate
    const response = await axios.get(
      `${process.env.EXCHANGE_API_URL}/${process.env.EXCHANGE_API_KEY}/pair/${sourceCurrency}/${targetCurrency}`
    );

    if (response.data.result !== 'success') {
      throw new Error('Failed to fetch exchange rate');
    }

    const exchangeRate = response.data.conversion_rate;
    const convertedAmount = (parseFloat(amount) * exchangeRate).toFixed(2);

    // Save to database
    try {
      const query = `
        INSERT INTO conversions (source_currency, target_currency, amount, converted_amount, exchange_rate)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      await db.execute(query, [
        sourceCurrency,
        targetCurrency,
        parseFloat(amount),
        parseFloat(convertedAmount),
        exchangeRate
      ]);
    } catch (dbError) {
      console.error('Database error:', dbError.message);
      // Continue without failing the conversion
    }

    res.json({
      success: true,
      data: {
        sourceCurrency,
        targetCurrency,
        amount: parseFloat(amount),
        convertedAmount: parseFloat(convertedAmount),
        exchangeRate,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Conversion error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to convert currency. Please try again.'
    });
  }
});

// Get conversion history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const query = `
      SELECT id, source_currency, target_currency, amount, converted_amount, 
             exchange_rate, timestamp
      FROM conversions 
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.execute(query, [limit, offset]);

    // Get total count
    const [countResult] = await db.execute('SELECT COUNT(*) as total FROM conversions');
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        conversions: rows,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });

  } catch (error) {
    console.error('History fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversion history'
    });
  }
});

// Example: Get all conversions
router.get('/conversions', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM conversions');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;