'use strict'
const router = require('express').Router();
const auth = require('../../config/auth');
const e = require('../../config/error');
const debug = require('debug');
const bcrypt = require('bcryptjs');
const el = require('../../config/db');
const saltRounds = 10;

//POST new user route (optional, everyone has access)
router.post('/signup', auth.optional, async (req, res, next) => {
  try{
    const { body: { user } } = req;
    console.log('Signing up new user ' + JSON.stringify(user));

    if(!user.email) throw new e.InfoRequiredError("Email necesario.");
    if(!user.password) throw new e.InfoRequiredError("Contraseña necesaria.");

    // busca el usuario en el index
    const resp = await el.client.search({
      index: process.env.EL_USER_INDEX,
      type: el.DOC_TYPE,
      body: {"query": { "ids" : { "values" : user.email } }}
    })
    if (resp.body.hits.total.value > 0) throw new e.UserAlreadyExistsError("Este usuario ya existe!");
    
    // replace plain password with hashed pass
    user.password = await bcrypt.hash(user.password, saltRounds)
    
    // save in index
    el.client.index({
      id: user.email,
      index: process.env.EL_USER_INDEX,
      type: el.DOC_TYPE,
      body: user
    })
    .then((resp)=>{res.locals.result={result: resp.body.result}; next();})
    
  } catch (err) {next(err)}
})

module.exports = router;