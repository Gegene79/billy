var express = require('express');
var router = express.Router();
const auth = require('../config/auth');


// redirige a las apis
router.use('/api', require('./api'));

/* GET home page. 
router.get('/', auth.required, function(req, res, next) {
  return res.redirect('/main.html');
});
*/
module.exports = router;
