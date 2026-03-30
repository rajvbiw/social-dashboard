-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50),
  metric_name VARCHAR(50),
  value INTEGER,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Insert test user (password: test123)
INSERT INTO users (email, password_hash) 
VALUES ('test@example.com', '$2a$10$rQKjT7XJ7XJ7XJ7XJ7XJ7u') 
ON CONFLICT (email) DO NOTHING;

-- Insert test posts for user test@example.com
INSERT INTO posts (user_id, content, scheduled_for, status)
SELECT id, 'Hello world! This is my first scheduled post.', NOW() + INTERVAL '1 hour', 'pending' FROM users WHERE email = 'test@example.com'
UNION ALL
SELECT id, 'Check out this cool new dashboard!', NOW() - INTERVAL '2 hours', 'published' FROM users WHERE email = 'test@example.com'
UNION ALL
SELECT id, 'Automation is the future of DevOps.', NOW() - INTERVAL '5 hours', 'published' FROM users WHERE email = 'test@example.com'
ON CONFLICT DO NOTHING;

-- Insert initial metrics for user test@example.com
INSERT INTO metrics (user_id, platform, metric_name, value, recorded_at)
SELECT id, 'Twitter', 'Followers', 120, NOW() - INTERVAL '2 days' FROM users WHERE email = 'test@example.com'
UNION ALL
SELECT id, 'Twitter', 'Followers', 150, NOW() - INTERVAL '1 day' FROM users WHERE email = 'test@example.com'
UNION ALL
SELECT id, 'Twitter', 'Followers', 220, NOW() FROM users WHERE email = 'test@example.com'
ON CONFLICT DO NOTHING;