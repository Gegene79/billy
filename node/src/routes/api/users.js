'use strict'
const router = require('express').Router();
const auth = require('../../config/auth');
const e = require('../../config/error');
const debug = require('debug');
const bcrypt = require('bcryptjs');
const el = require('../../config/db');
const saltRounds = 10;

//POST new user route (optional, everyone has access)
router.post('/signup', async (req, res, next) => {
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

//POST login route (optional, everyone has access)
router.post('/login', async (req, res, next) => {
  try{
    
    if(!req.body.email) throw new e.InfoRequiredError("Email necesario.");
    if(!req.body.password) throw new e.InfoRequiredError("Contraseña necesaria.");

    var user = {}
    user.email = req.body.email;
    user.password = req.body.password;

    // busca el usuario en el index
    let resp = await el.client.search({
      index: process.env.EL_USER_INDEX,
      type: el.DOC_TYPE,
      body: {"query": { "ids" : { "values" : user.email } }}
    });
    debug('Response: %O',resp);
    let total = resp.body.hits.total.value;
    if (total != 1) 
      throw new e.CredentialsError("Usuario no encontrado.");

    // compara la contraseña
    let usuario = {}
    usuario = resp.body.hits.hits[0]._source;
    let ok = await bcrypt.compare(user.password, usuario.password);
    
    if (ok) return res.cookie('jwt', auth.generateJWT(usuario))
            .status(200)
            .redirect('/main.html'); 
    else throw new e.CredentialsError("Credenciales no validas.");
  }
  catch(err) {
    next(err)}
});

module.exports = router;