var express = require('express');
var router = express.Router();
const auth = require('../config/auth');



// redirige a las apis
router.use('/api', require('./api/index.js'));

/*
router.get('/notebook', auth.required, function(req, res, next) {
  targetUrl = process.env.JUP_BASE_URL + req.originalUrl
  res.redirect(targetUrl);
});
*/
module.exports = router;
