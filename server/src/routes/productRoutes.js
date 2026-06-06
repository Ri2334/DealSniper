const express = require('express');
const router = express.Router();
const { getProducts, getDashboardAnalytics } = require('../controllers/productController');

router.get('/', getProducts);
router.get('/analytics', getDashboardAnalytics);

module.exports = router;
