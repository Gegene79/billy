'use strict'
const router = require('express').Router();
const auth = require('../config/auth');
const e = require('../config/error');
const debug = require('debug');


//POST new user route (optional, everyone has access)
router.post('/signup', async (req, res, next) => {
  try{
    const { body: { user } } = req;
    console.log('Signing up new user ' + JSON.stringify(user));

    if(!user.email) throw new e.InfoRequiredError("Email necesario.");
    if(!user.password) throw new e.InfoRequiredError("Contraseña necesaria.");

    let ok = auth.insertNewUser(user);
    
    if (ok) return res.cookie('jwt', auth.generateJWT(user.email))
                      .status(200)
                      .redirect('/main.html');
    else return res.status(500).redirect('/index.html');

  } catch (err) {next(err)}
});

//POST login route (optional, everyone has access)
router.post('/login', async (req, res, next) => {
  try{
    
    if(!req.body.email) throw new e.InfoRequiredError("Email necesario.");
    if(!req.body.password) throw new e.InfoRequiredError("Contraseña necesaria.");

    var user = {}
    user.email = req.body.email;
    user.password = req.body.password;

    // busca el usuario en el index
    let ok = await auth.checkUserCredentials(user);
    
    if (ok == true) 
      return res.cookie('jwt', auth.generateJWT(user.email))
            .status(200)
            .redirect('/main.html');
    else 
      return res.status(401).redirect('/index.html');
  }
  catch(err) {next(err)}
});

module.exports = router;


