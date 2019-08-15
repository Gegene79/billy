'use strict'
const jwt = require('express-jwt');
const JWT = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const el = require('./db');
const e = require('./error');
const saltRounds = 10;
const debug = require('debug')('auth');
var { DateTime } = require('luxon');



const getTokenFromHeaders = (req) => {
  const { headers: { authorization } } = req;

  if(authorization && authorization.split(' ')[0] === 'Token') {
    return authorization.split(' ')[1];
  }
  return null;
};

const getTokenFromCookie = (req) => {
  var token = req.cookies.jwt;

  if (token) {
    return token;
  }
  return null;
};

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

exports.checkUserCredentials = async (user) => {

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

exports.insertNewUser = async (user) => {

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

exports.required = 
  jwt({
    secret: process.env.SECRET,
    getToken: getToken,
  });

exports.optional = 
  jwt({
    secret: process.env.SECRET,
    getToken: getToken,
    credentialsRequired: false
    });

exports.generateJWT = function(email) {
  
  var expirationDate = DateTime.local().plus({month:1}).toJSDate();
  
  return JWT.sign( {
    subject: "petitbilly",
    issuer: "petitbilly",
    expiry: parseInt(expirationDate.getTime() / 1000, 10),
    exp: parseInt(expirationDate.getTime() / 1000, 10),
    audience: "everyone",
    email: email,
    profile: "admin"
  }, process.env.SECRET);
};



