'use strict'
const router = require('express').Router();
const auth = require('../../config/auth');
const e = require('../../config/error');
const debug = require('debug');


//POST new user route (optional, everyone has access)
router.post('/signup', async (req, res, next) => {
  try{
    const { body: { user } } = req;
    console.log('Signing up new user ' + JSON.stringify(user));

    if(!user.email) throw new e.InfoRequiredError("Email necesario.");
    if(!user.password) throw new e.InfoRequiredError("Contraseña necesaria.");

    let ok = await auth.insertNewUser(user);
    
    if (ok) return res.status(200).json({jwt: auth.generateJWT(user.email)});
    else throw new e.DatabaseError("No se ha posido dar de alta el usuario.");

  } catch(err) {next(err)}
});

//POST login route (optional, everyone has access)
router.post('/login', async (req, res, next) => {
  try{
    
    if(!req.body.user.email) throw new e.InfoRequiredError("Email necesario.");
    if(!req.body.user.password) throw new e.InfoRequiredError("Contraseña necesaria.");

    var user = {}
    user.email = req.body.user.email;
    user.password = req.body.user.password;

    // busca el usuario en el index
    let ok = await auth.checkUserCredentials(user);

    if (ok) res.status(200).json({jwt: auth.generateJWT(user.email)});
    else throw new e.CredentialsError("Credenciales no validas.");
  }
  catch(err) {next(err)}
});

module.exports = router;


