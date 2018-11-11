'use strict';
const express = require('express');
const path = require('path');
const env = require('dotenv').config();
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const cors = require('cors');
//Configure isProduction variable
const isProduction = (process.env.NODE_ENV === 'production');

// initiate app
const app = express();

//Configure our app
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
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

//Error handlers & middlewares
app.use((err, req, res, next) => {
  
  if (typeof (err) === 'string') {
    // custom application error
    return res.status(400).json({ message: err });
  }

  if (err.name === 'UnauthorizedError') {
    // jwt authentication error
    return res.status(401).json({ message: 'Invalid Token' });
  }

  // default to 500 server error
  return res.status(500).json({ message: err.message });

});


// declare routes
app.use(require('./routes'));

module.exports = app;
