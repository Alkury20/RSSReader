const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

const FEED_SERVICE_URL = process.env.FEED_SERVICE_URL || 'http://feed-service:3001';
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://admin-service:3002';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3003';

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'api-gateway',
    services: {
      feed: FEED_SERVICE_URL,
      admin: ADMIN_SERVICE_URL,
      auth: AUTH_SERVICE_URL
    }
  });
});

app.use('/api/feeds', createProxyMiddleware({
  target: FEED_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/feeds': '/api/feeds'
  },
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error('Feed service error:', err);
    if (!res.headersSent) {
      res.status(503).json({ error: 'Feed service unavailable' });
    }
  }
}));

app.use('/api/admin', createProxyMiddleware({
  target: ADMIN_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/admin': '/api/admin'
  },
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error('Admin service error:', err);
    if (!res.headersSent) {
      res.status(503).json({ error: 'Admin service unavailable' });
    }
  }
}));

app.use('/api/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  timeout: 30000,
  proxyTimeout: 30000,
  onError: (err, req, res) => {
    console.error('Auth service error:', err);
    if (!res.headersSent) {
      res.status(503).json({ error: 'Auth service unavailable' });
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} to ${AUTH_SERVICE_URL}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Received response from auth-service: ${proxyRes.statusCode}`);
  }
}));

app.get('/', (req, res) => {
  res.json({
    message: 'RSS Platform API Gateway',
    version: '1.0.0',
    endpoints: {
      feeds: '/api/feeds',
      admin: '/api/admin',
      auth: '/api/auth',
      health: '/health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Proxying to:`);
  console.log(`  - Feed Service: ${FEED_SERVICE_URL}`);
  console.log(`  - Admin Service: ${ADMIN_SERVICE_URL}`);
  console.log(`  - Auth Service: ${AUTH_SERVICE_URL}`);
});

module.exports = app;

