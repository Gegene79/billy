const jwt = require('express-jwt');
const mongoose = require('mongoose');
const users = mongoose.model('users');
const expiration = 1000 * 60 * 60 * 24 * 31;

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


exports.generateToken = (user) => { 
  return user.generateJWT();
};



