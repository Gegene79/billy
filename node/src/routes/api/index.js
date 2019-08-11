'use strict'
const express = require('express');
var router = express.Router();
const debug = require('debug')('routes:api:index')

// log requests
router.all('*', (req, res, next) => { debug('API URL: '+req.originalUrl); next(); });

router.use('/users', require('./users'));
router.use('/monitor', require('./monitor'));

// after all other middlewares, send results.
router.all('*', function (req, res, next) {
    res.contentType('application/json');
    res.status(200).json(res.locals.result);
});

module.exports = router;