const express = require('express');
const {
  createUser,
  createStore,
  getDashboardStats,
  getUsers,
  getStores
} = require('../controllers/admin.controller');
const { verifyToken, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// All admin routes require token authentication and SYSTEM_ADMIN role
router.use(verifyToken, restrictTo('SYSTEM_ADMIN'));

router.post('/users', createUser);
router.post('/stores', createStore);
router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.get('/stores', getStores);

module.exports = router;
