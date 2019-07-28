'use strict'
const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/monitor', require('./monitor'));

// after all other middlewares, send results.
router.use(function (req, res, next) {
    res.contentType('application/json');
    res.status(200).json(res.locals.result);
});

// catch API errors, send 500 status and error JSON
router.use((err, req, res, next) => {
    // default to 500 server error
    return res.status(500).json({status: 500, error: {message: err.message}});
});

module.exports = router;