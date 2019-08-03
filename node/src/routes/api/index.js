'use strict'
const express = require('express');
const router = express.Router();
const debug = require('debug')('routes:api:index')

// log requests
router.all((req, res, next) => { debug('url: '+req.originalUrl); next(); });

router.use('/users', require('./users'));
router.use('/monitor', require('./monitor'));

// after all other middlewares, send results.
router.all(function (req, res, next) {
    res.contentType('application/json');
    res.status(200).json(res.locals.result);
});

// catch API errors, send 500 status and error JSON
router.all((err, req, res, next) => {
    // default to 500 server error
    return res.status(500).json({status: 500, error: {message: err.message}});
});

module.exports = router;