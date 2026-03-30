CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  content TEXT,
  scheduled_at TIMESTAMP,
  status TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);