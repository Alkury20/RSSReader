const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'rss_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'admin-service' });
});

const validateNewsItem = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('pubDate').optional().isISO8601().withMessage('Invalid date format'),
];

app.get('/api/admin/news', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM news_items');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT id, title, description, pub_date as "pubDate", created_at, updated_at 
       FROM news_items 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/admin/news/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, pub_date as "pubDate", created_at, updated_at 
       FROM news_items 
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'News item not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching news item:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/admin/news', validateNewsItem, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, description, pubDate } = req.body;
    const result = await pool.query(
      `INSERT INTO news_items (title, description, pub_date) 
       VALUES ($1, $2, $3) 
       RETURNING id, title, description, pub_date as "pubDate", created_at, updated_at`,
      [title, description, pubDate || new Date()]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating news item:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.put('/api/admin/news/:id', validateNewsItem, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { title, description, pubDate } = req.body;
    const result = await pool.query(
      `UPDATE news_items 
       SET title = $1, description = $2, pub_date = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING id, title, description, pub_date as "pubDate", created_at, updated_at`,
      [title, description, pubDate || new Date(), req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'News item not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating news item:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.delete('/api/admin/news/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM news_items WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'News item not found' });
    }

    res.json({ success: true, message: 'News item deleted successfully' });
  } catch (error) {
    console.error('Error deleting news item:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

pool.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
    app.listen(PORT, () => {
      console.log(`Admin Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

module.exports = app;

