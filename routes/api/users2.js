'use strict';
const router = require('express').Router();
const auth = require('../auth');

//POST new user route (optional, everyone has access)
router.post('/signup', auth.auth.optional, (req, res, next) => {
  return next;
});

module.exports = router;