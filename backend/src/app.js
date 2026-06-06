const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const ownerRoutes = require('./routes/owner.routes');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Load swagger DDL spec
const swaggerDocument = YAML.load(path.join(__dirname, '../../docs/swagger.yaml'));

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://roxiler-3m7g.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());

// Mount Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/owner', ownerRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Store Rating API is active'
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

module.exports = app;
