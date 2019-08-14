'use strict'
const express = require('express');
var router = express.Router();
const debug = require('debug')('routes:api:index')

router.use('/users', require('./users'));
router.use('/monitor', require('./monitor'));

module.exports = router;