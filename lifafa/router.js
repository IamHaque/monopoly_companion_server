const express = require('express');

// Express router
const router = express.Router();

// Controller for lifafa routes
const LifafaController = require('./controller');

router.post('/verify-vpa', LifafaController.verifyUpiId);
router.post('/create', LifafaController.createLifafa);
router.post('/claim', LifafaController.claimLifafa);

router.get('/all', LifafaController.getAllLifafa);
router.get('/:lifafaId', LifafaController.verifyUpiId);

module.exports = router;
