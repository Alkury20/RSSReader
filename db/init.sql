CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    pub_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_items_pub_date ON news_items(pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

INSERT INTO news_items (title, description, pub_date)
SELECT * FROM (VALUES
  ('Welcome to RSS Platform', 'This is a sample news item to get you started. You can manage news through the admin API.', NOW() - INTERVAL '1 day'),
  ('RSS Platform Features', 'Our platform supports RSS feeds, JSON APIs, and full CRUD operations for news management.', NOW() - INTERVAL '2 days'),
  ('Getting Started Guide', 'Check out our API documentation to learn how to integrate with the RSS Platform.', NOW() - INTERVAL '3 days')
) AS v(title, description, pub_date)
WHERE NOT EXISTS (SELECT 1 FROM news_items WHERE title = v.title);

INSERT INTO users (username, email, password_hash, role)
SELECT 'admin', 'admin@rssplatform.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

