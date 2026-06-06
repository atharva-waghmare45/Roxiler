const express = require('express');
const { getDashboard } = require('../controllers/owner.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// All owner routes require token authentication and STORE_OWNER role
router.use(verifyToken, restrictTo('STORE_OWNER'));

router.get('/dashboard', getDashboard);

module.exports = router;
