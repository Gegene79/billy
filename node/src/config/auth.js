'use strict'
const jwt = require('express-jwt');
var { DateTime } = require('luxon');

const getTokenFromHeaders = (req) => {
  const { headers: { authorization } } = req;

  if(authorization && authorization.split(' ')[0] === 'Token') {
    return authorization.split(' ')[1];
  }
  return null;
};

const getTokenFromCookie = (req) => {
  const { token } = req.cookies;

  if (token) {
    return token;
  }
  return null;
};

exports.required = 
  jwt({
    secret: process.env.SECRET,
    getToken: getTokenFromCookie,
  });

exports.optional = 
  jwt({
    secret: process.env.SECRET,
    getToken: getTokenFromCookie,
    credentialsRequired: false
    });

exports.generateJWT = function(user) {
  
  var expirationDate = DateTime.local().plus({minutes:1}).toJSDate();
  
  return jwt.sign( {
    subject: "petitbilly",
    issuer: "petitbilly",
    expiry: parseInt(expirationDate.getTime() / 1000, 10),
    audience: "everyone",
    email: user.email,
    name: user.name,
    profile: "admin"
  }, process.env.SECRET);
};



