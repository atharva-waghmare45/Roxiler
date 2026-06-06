const express = require('express');
const { getStores, submitRating } = require('../controllers/user.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// All user routes require token authentication and NORMAL_USER role
router.use(verifyToken, restrictTo('NORMAL_USER'));

router.get('/stores', getStores);
router.post('/ratings', submitRating);

module.exports = router;
