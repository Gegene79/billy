'use strict'
const router = require('express').Router();
//const auth = require('../../config/auth');
const e = require('../../config/error');
const jwt = require('jsonwebtoken');
const debug = require('debug');
const bcrypt = require('bcryptjs');
const el = require('../../config/db');
var { DateTime } = require('luxon');

const getToken = (req) => {
  var token = req.cookies.jwt;
  const { headers: { authorization } } = req;

  if (token) {
    return token;
  }
  else if(authorization && authorization.split(' ')[0] === 'Bearer') {
    return authorization.split(' ')[1];
  }
  else return null;
};

const checkUserCredentials = async (user) => {

  let resp = await el.client.search({
    index: process.env.EL_USER_INDEX,
    type: el.DOC_TYPE,
    body: { "query": { "ids": { "values": user.email } } }
  });
  debug('Response: %O', resp);
  let total = resp.body.hits.total.value;
  if (total != 1)
    throw new e.CredentialsError("Usuario no encontrado.");

  // compara la contraseña
  let usuario = {};
  usuario = resp.body.hits.hits[0]._source;

  let ok = await bcrypt.compare(user.password, usuario.password);
  return ok;
};

const insertNewUser = async (user) => {

  // busca el usuario en el index
  let resp = await el.client.search({
    index: process.env.EL_USER_INDEX,
    type: el.DOC_TYPE,
    body: {"query": { "ids" : { "values" : user.email } }}
  })
  if (resp.body.hits.total.value > 0) throw new e.UserAlreadyExistsError("Este usuario ya existe!");

  // replace plain password with hashed pass
  user.password = await bcrypt.hash(user.password, saltRounds)

  // save in index
  let save = await el.client.index({
    id: user.email,
    index: process.env.EL_USER_INDEX,
    type: el.DOC_TYPE,
    body: user
  })

  return (save.hits > 0);
}

const generateJWT = (email) => {
  
  var expirationDate = DateTime.local().plus({month:1}).toJSDate();
  
  return jwt.sign( {
    subject: "petitbilly",
    issuer: "petitbilly",
    expiry: parseInt(expirationDate.getTime() / 1000, 10),
    exp: parseInt(expirationDate.getTime() / 1000, 10),
    audience: "everyone",
    email: email,
    profile: "admin"
  }, process.env.NODE_SECRET);
};

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
    let ok = await checkUserCredentials(user);
    
    if (ok == true) 
      return res.cookie('jwt', generateJWT(user.email))
            .status(200)
            .redirect('/main.html');
    else 
      return res.status(401).redirect('/index.html');
  }
  catch(err) {next(err)}
});

// GET authentication called by nginx auth_request /auth;
router.get('/', async (req, res, next) => {
    let token = getToken(req);
    jwt.verify(token, process.env.NODE_SECRET, function(err, decoded){
      if (err) {
        debug("Auth error: %0",err);
        return res.status(401).send({error: err.message});
      } else 
      return res.status(200).send();
    });
});

module.exports = router;


