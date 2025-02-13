// server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Geçerli müşteri anahtarları (gerçek uygulamada veritabanında saklanmalı)
const validClientKeys = new Map([
  ['CLIENT1KEY', { name: 'Client 1', domain: 'client1.com' }],
  ['CLIENT2KEY', { name: 'Client 2', domain: 'client2.com' }]
]);

// Doğrulama endpoint'i
app.post('/validate', (req, res) => {
  const { clientKey, domain } = req.body;
  
  const client = validClientKeys.get(clientKey);
  
  if (!client || client.domain !== domain) {
    return res.status(403).json({ error: 'Invalid access' });
  }

  // Geçici token oluştur
  const token = jwt.sign(
    { clientName: client.name, domain },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});