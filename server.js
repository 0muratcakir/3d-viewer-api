// server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });

// Model şemaları
const assetSchema = new mongoose.Schema({
  modelId: String,
  textures: Map,
  materialTextureMap: Map,
  prices: Map,
  createdAt: { type: Date, default: Date.now }
});

const configSchema = new mongoose.Schema({
  modelId: String,
  defaultState: {
    currentSize: String,
    currentColor: String,
    currentPrice: Number
  },
  createdAt: { type: Date, default: Date.now }
});

const Asset = mongoose.model('Asset', assetSchema);
const Config = mongoose.model('Config', configSchema);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// API Routes

// Doğrulama endpoint'i
app.post('/api/validate', (req, res) => {
  const { clientKey, domain } = req.body;
  
  // Geçerli müşteri anahtarları (gerçek uygulamada veritabanında saklanmalı)
  const validClientKeys = new Map([
    ['CLIENT1KEY', { name: 'Client 1', domain: 'client1.com' }],
    ['CLIENT2KEY', { name: 'Client 2', domain: 'client2.com' }]
  ]);
  
  const client = validClientKeys.get(clientKey);
  
  if (!client || client.domain !== domain) {
    return res.status(403).json({ error: 'Invalid access' });
  }

  const token = jwt.sign(
    { clientName: client.name, domain },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

// Asset endpoints
app.get('/api/assets/:modelId', authenticateToken, async (req, res) => {
  try {
    const asset = await Asset.findOne({ modelId: req.params.modelId });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/assets', authenticateToken, async (req, res) => {
  try {
    const asset = new Asset(req.body);
    await asset.save();
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Config endpoints
app.get('/api/configs/:modelId', authenticateToken, async (req, res) => {
  try {
    const config = await Config.findOne({ modelId: req.params.modelId });
    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/configs', authenticateToken, async (req, res) => {
  try {
    const config = new Config(req.body);
    await config.save();
    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});