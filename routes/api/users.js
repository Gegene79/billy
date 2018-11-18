'use strict';
const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../../config/auth');
const e = require('../../config/error');
const Users = mongoose.model('users');
const debug = require('debug');
const bcrypt = require('bcrypt');

//POST new user route (optional, everyone has access)
router.post('/signup', auth.optional, (req, res, next) => {
  const { body: { user } } = req;
  
  if(!user.email) throw new e.InfoRequiredError("Email necesario.");
  if(!user.password) throw new e.InfoRequiredError("Contraseña necesaria.");

  user._id = user.email;
  var finalUser = new Users(user);
 
  finalUser.save()
    .then(() => {
      return res.cookie('jwt', finalUser.generateJWT(), { httpOnly: true, secure: true })
            .status(200).redirect('/main.html');
    })
    .catch((err)=>{
      debug(err);
      if (err.code == 11000) 
        throw new e.EmailAlreadyTakenError();
      else 
        next(err);
    });
});


//POST login route (optional, everyone has access)
router.post('/login', auth.optional, async (req, res, next) => {
  const user = {
      'email': req.body.email,
      'password': req.body.password
  }; 

  if(!user.email) throw new e.InfoRequiredError("Email necesario.");
  if(!user.password) throw new e.InfoRequiredError("Contraseña necesaria.");

  try{
    let usuario = await Users.findOne({ _id: user.email });
      if (!usuario) throw new e.CredentialsError("Usuario no encontrado");
    
    let ok = await bcrypt.compare(user.password, usuario.password);
    
    if (ok) return res.cookie('jwt', usuario.generateJWT(), { httpOnly: true, secure: true })
            .status(200).redirect('/main.html'); 
    else throw new e.CredentialsError("Credenciales no validas.");
  }
  catch(err) {next(err)}
});  

module.exports = router;