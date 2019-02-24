'use strict';
const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/monitor', require('./monitorelastic'));

module.exports = router;