const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const Queue = require('bull');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/social_dashboard'
});

// Redis connection
const postQueue = new Queue('post-scheduling', process.env.REDIS_URL || 'redis://localhost:6379');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Social Dashboard API is running' });
});

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hashed]
    );
    res.status(201).json({ message: 'User created', userId: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production', { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get metrics
app.get('/api/metrics', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT value, recorded_at FROM metrics WHERE user_id = $1 ORDER BY recorded_at ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all posts for authenticated user
app.get('/api/posts', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Schedule a post
app.post('/api/posts', authenticate, async (req, res) => {
  const { content, scheduledFor } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO posts (user_id, content, scheduled_for, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.userId, content, scheduledFor, 'pending']
    );
    
    const postId = result.rows[0].id;
    const delay = new Date(scheduledFor).getTime() - Date.now();

    await postQueue.add({
      postId,
      userId: req.userId,
      content,
      scheduledFor
    }, {
      delay: Math.max(0, delay)
    });

    res.status(201).json({ message: 'Post scheduled', postId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seed sample data for the authenticated user
app.post('/api/seed', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Check if data already exists to avoid duplication
    const postsCheck = await pool.query('SELECT id FROM posts WHERE user_id = $1 LIMIT 1', [userId]);
    const metricsCheck = await pool.query('SELECT id FROM metrics WHERE user_id = $1 LIMIT 1', [userId]);

    if (postsCheck.rows.length === 0) {
      // Insert posts
      await pool.query(`
        INSERT INTO posts (user_id, content, scheduled_for, status)
        VALUES 
          ($1, 'Sample Post 1: Learning Docker is fun!', NOW() - INTERVAL '1 day', 'published'),
          ($1, 'Sample Post 2: Building scalable apps with Node.js', NOW() - INTERVAL '5 hours', 'published'),
          ($1, 'Sample Post 3: Monitoring with Prometheus and Grafana', NOW() + INTERVAL '2 hours', 'pending')
      `, [userId]);
    }

    if (metricsCheck.rows.length === 0) {
      // Insert metrics
      await pool.query(`
        INSERT INTO metrics (user_id, platform, metric_name, value, recorded_at)
        VALUES 
          ($1, 'Twitter', 'Followers', 100, NOW() - INTERVAL '3 days'),
          ($1, 'Twitter', 'Followers', 150, NOW() - INTERVAL '2 days'),
          ($1, 'Twitter', 'Followers', 200, NOW() - INTERVAL '1 day'),
          ($1, 'Twitter', 'Followers', 250, NOW())
      `, [userId]);
    }

    if (postsCheck.rows.length > 0 && metricsCheck.rows.length > 0) {
      return res.status(200).json({ message: 'User already has data' });
    }

    res.status(201).json({ message: 'Sample data generated successfully' });
  } catch (err) {
    console.error("Seeding error:", err);
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3070;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});