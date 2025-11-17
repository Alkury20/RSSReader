const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { create } = require('xmlbuilder2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

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
  res.json({ status: 'ok', service: 'feed-service' });
});

app.get('/api/feeds', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, pub_date as "pubDate", created_at 
       FROM news_items 
       ORDER BY pub_date DESC 
       LIMIT 50`
    );
    
    res.json({
      success: true,
      items: result.rows.map(row => ({
        title: row.title,
        description: row.description,
        pubDate: row.pubDate ? new Date(row.pubDate).toUTCString() : ''
      }))
    });
  } catch (error) {
    console.error('Error fetching feeds:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.get('/api/feeds/rss', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT title, description, pub_date as "pubDate" 
       FROM news_items 
       ORDER BY pub_date DESC 
       LIMIT 50`
    );

    const rssXML = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('rss', { version: '2.0' })
        .ele('channel')
          .ele('title').txt('RSS Platform News').up()
          .ele('description').txt('Latest news from RSS Platform').up()
          .ele('link').txt(process.env.BASE_URL || 'http://localhost:3001').up()
          .ele('lastBuildDate').txt(new Date().toUTCString()).up();

    result.rows.forEach(row => {
      rssXML.ele('item')
        .ele('title').txt(row.title || '').up()
        .ele('description').txt(row.description || '').up()
        .ele('pubDate').txt(row.pubDate ? new Date(row.pubDate).toUTCString() : '').up()
        .up();
    });

    res.set('Content-Type', 'application/rss+xml');
    res.send(rssXML.end({ prettyPrint: true }));
  } catch (error) {
    console.error('Error generating RSS:', error);
    res.status(500).send('Error generating RSS feed');
  }
});

app.get('/api/feeds/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, pub_date as "pubDate", created_at 
       FROM news_items 
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Feed item not found' });
    }

    res.json({
      success: true,
      item: {
        title: result.rows[0].title,
        description: result.rows[0].description,
        pubDate: result.rows[0].pubDate ? new Date(result.rows[0].pubDate).toUTCString() : ''
      }
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

pool.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
    app.listen(PORT, () => {
      console.log(`Feed Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

module.exports = app;

