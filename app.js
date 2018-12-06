'use strict';
const express = require('express');
const path = require('path');
const env = require('dotenv').config();
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const cors = require('cors');
var session = require('express-session');
const flash = require('connect-flash');
const e = require('./config/error');
const debug = require('debug');
//Configure isProduction variable
const isProduction = (process.env.NODE_ENV === 'production');

// initiate app
const app = express();

//Configure our app
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.SECRET));
app.use(session({cookie: { maxAge: 60000 }}));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

if(!isProduction) {
  app.use(errorHandler());
  
}

//Configure Mongoose
const options = {
  user: process.env.DB_USER,
  pass: process.env.DB_PASS,
  useNewUrlParser: true,
  useCreateIndex: false,
  useFindAndModify: false,
  autoIndex: false, // Don't build indexes
  reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
  reconnectInterval: 1000, // Reconnect every 1000ms
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0,
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};

mongoose.promise = global.Promise;
mongoose.connect(process.env.DB_URL, options);
mongoose.set('debug', !isProduction);

// Modelos
require('./models/users');
require('./models/metrics');

// declare routes
app.use(require('./routes'));
app.use(express.static('public'));
app.use('/js',express.static((__dirname + '/js')));
require('./mqtt/mqtt');

//Error handlers & middlewares
app.use(function authError(err, req, res, next) {
  
  debug(err.constructor.name);

  if (err instanceof e.UnauthorizedError) {
    // jwt authentication error
    req.flash('warning', err.message);
    return res.redirect('/login.html');
  }
  next(err);
});

app.use(function credentialsError(err, req, res, next) {
  
  if (err instanceof e.CredentialsError) {
    // jwt authentication error
    req.flash('critical', err.message);
    return res.redirect('/login.html');
  }
  next(err);
});

app.use(function otherError(err, req, res, next) {
  
  // default to 500 server error
  return res.status(500).json({ message: err.message });
});

module.exports = app;
