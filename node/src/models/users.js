"use strict"
const debug = require('debug');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
var { DateTime } = require('luxon');
var el = require('../config/db')

//hashing a password before saving it to the database
exports.passhash = (next) => {
  bcrypt.hash(user.password, saltRounds, function(err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  })
};

generateJWT = function(user) {
  //const today = DateTime.local();
  //var expirationDate = new Date(today.plus({minutes:1}).toJSDate());
  var expirationDate = DateTime.local().plus({minutes:1}).toJSDate();

  return jwt.sign( {
    subject: "petitbilly",
    issuer: "petitbilly",
    expiry: parseInt(expirationDate.getTime() / 1000, 10),
    audience: "everyone",
    email: user.email,
    nick: user.nick,
    profile: "admin"
  }, process.env.SECRET);
};

exports.findUser = (email) => {

  el_client.search({
    index: 'users',
    type: '_doc',
    body: 
    {
      "query": {
          "match": {
              "email": email
          }
      }
    }
  })
  .then((result)=>{
    result.hits.hits.forEach(function(entry){
  })
})
.catch(function(error){
    next(error);
});


};