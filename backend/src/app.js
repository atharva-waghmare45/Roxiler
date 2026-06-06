const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Store Rating API is active'
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
