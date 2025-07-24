const express = require('express');
const { getDashboardData, getStatistics } = require('../controllers/dashboard');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Tutte le routes sono protette
router.use(protect);

router.get('/', getDashboardData);
router.get('/statistics', getStatistics);

console.log(getDashboardData, getStatistics);

module.exports = router;
