'use strict';
const express = require('express');
const path = require('path');
const env = require('dotenv').config();
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const errorHandler = require('errorhandler');
const cors = require('cors');
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
// descodifica las cookies con el string de secreto
app.use(cookieParser(process.env.SECRET));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

if(!isProduction) {
  app.use(errorHandler());
}

// declare routes
app.use(require('./routes'));
app.use(express.static('public'));
require('./mqtt/mqtt-elastic');

//Error handlers & middlewares
app.use((err, req, res, next) => {
  
  debug(err.constructor.name);

  if (err instanceof e.UnauthorizedError) {
    // jwt authentication error
    req.flash('warning', err.message);
    return res.redirect('/login.html');
  }
  next(err);
});

app.use((err, req, res, next) => {
  
  if (err instanceof e.CredentialsError) {
    // jwt authentication error
    req.flash('critical', err.message);
    return res.redirect('/login.html');
  }
  next(err);
});

app.use((err, req, res, next) => {
  
  // default to 500 server error
  return res.status(500).json({ message: err.message });
});

module.exports = app;
