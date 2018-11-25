const mongoose = require('mongoose');
const debug = require('debug');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
var { DateTime } = require('luxon');

const { Schema } = mongoose;

const UsersSchema = new Schema({
  _id: String,
  email: String,
  nick: String,
  password: String
});

//hashing a password before saving it to the database
UsersSchema.pre('save', function (next) {
  var user = this;
  bcrypt.hash(user.password, saltRounds, function(err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  })
});

UsersSchema.methods.generateJWT = function() {
  //const today = DateTime.local();
  //var expirationDate = new Date(today.plus({minutes:1}).toJSDate());
  var expirationDate = DateTime.local().plus({minutes:1}).toJSDate();

  return jwt.sign( {
    subject: "petitbilly",
    issuer: "petitbilly",
    expiry: parseInt(expirationDate.getTime() / 1000, 10),
    audience: "everyone",
    email: this.email,
    nick: this.nick,
    profile: "admin"
  }, process.env.SECRET);
};

mongoose.model('users', UsersSchema);