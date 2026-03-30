const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { query } = require('./db')
const Queue = require('bull')
require('dotenv').config()
const postRoutes = require("./routes/post");
const app = express()
app.use(cors())
app.use(express.json())
app.use("/api/posts", postRoutes);
// Redis connection for Bull
const postQueue = new Queue('post-scheduling', process.env.REDIS_URL)

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ message: 'No token provided' })
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body
  try {
    const hashed = await bcrypt.hash(password, 10)
    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hashed]
    )
    res.status(201).json({ message: 'User created', userId: result.rows[0].id })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email already exists' })
    }
    res.status(500).json({ message: err.message })
  }
})

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const result = await query('SELECT id, password_hash FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get metrics (dummy data for demo)
app.get('/api/metrics', authenticate, async (req, res) => {
  try {
    // In a real app, you'd fetch from database. For simplicity, return mock.
    const mockMetrics = [
      { recorded_at: new Date(Date.now() - 86400000).toISOString(), value: 150 },
      { recorded_at: new Date().toISOString(), value: 220 }
    ]
    res.json(mockMetrics)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Schedule a post
app.post('/api/posts', authenticate, async (req, res) => {
  const { content, scheduledFor } = req.body
  try {
    const result = await query(
      'INSERT INTO posts (user_id, content, scheduled_for, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.userId, content, scheduledFor, 'pending']
    )
    // Add job to Bull queue
    await postQueue.add({
      postId: result.rows[0].id,
      userId: req.userId,
      content,
      scheduledFor
    })
    res.status(201).json({ message: 'Post scheduled', postId: result.rows[0].id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})