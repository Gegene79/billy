'use strict';
const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('users');
const debug = require('debug');
const bcrypt = require('bcrypt');

//POST new user route (optional, everyone has access)
router.post('/signup', auth.optional, (req, res, next) => {
  const { body: { user } } = req;
  
  if(!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  };
  user._id = user.email;

  if(!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  };

  var finalUser = new Users(user);

  //finalUser.setPassword(user.password);

  //return res.json({'msg':'OK'});
  //return res.cookie('jwt', finalUser.generateJWT(), { httpOnly: true, secure: true }).status(200).redirect('/main.html');
  
  finalUser.save()
    .then(() => {
      return res.cookie('jwt', finalUser.generateJWT(), { httpOnly: true, secure: true })
            .status(200).redirect('/main.html');
    })
    .catch((err)=>{
      debug(err);
      if (err.code == 11000) { // a user with same email already exists
      return res.status(409).json({
        errors: {
          "msg": finalUser.email +' already exists',
        },
      });
    } else {
      next();
    }
    });
});


//POST login route (optional, everyone has access)
router.post('/login', auth.optional, async (req, res, next) => {
  const user = {
      'email': req.body.email,
      'password': req.body.password
  }; 

  if(!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }


  
  try{
    let usuario = await Users.findOne({ _id: user.email });
      if (!usuario) return res.status(401).send({errors: { 'user': 'not found' } });
    
    let ok = await bcrypt.compare(user.password, usuario.password);
    
    if (ok) return res.cookie('jwt', usuario.generateJWT(), { httpOnly: true, secure: true })
            .status(200).redirect('/main.html') 
    else return res.status(401).send({errors: { 'email or password': 'is invalid' } });
  }
  catch(err) {next(err);}
});  


//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res, next) => {
  const user = req.user;

  return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.sendStatus(400).json({errors: { 'error': 'hay un problema' } });
      }

      return res.json(user);
    });
});

module.exports = router;