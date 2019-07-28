'use strict'
var express = require('express');
var router = express.Router();
const debug = require('debug');
const e = require('../config/error');

/* GET home page. 
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});*/

//Error handlers & middlewares
router.use((err, req, res, next) => {
  
  debug(err.constructor.name);

  if (err instanceof e.UnauthorizedError) {
    return res.redirect('/login.html');
  }
  if (err instanceof e.CredentialsError) {
    return res.redirect('/login.html');
  }
  if (err instanceof e.InfoRequiredError) {
    return res.redirect('/login.html');
  }
  next(err);
});

router.use((err, req, res, next) => {
  // default to 500 server error
  return res.status(500).json({ message: err.message });
});

module.exports = router;
