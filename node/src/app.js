'use strict';
// express por defecto
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// dependencias añadidas
const e = require('./config/error');
const cors = require('cors');
const env = require('dotenv').config();
//Configure isProduction variable
const isProduction = (process.env.NODE_ENV === 'production');

// express rutas por defecto
var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api/index');


// declaración por defecto de app Express
var app = express();

// express por defecto
app.use(logger(process.env.NODE_ENV)); // en express: 'dev'
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.SECRET)); // modificado para descodificar las signed-cookies
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors()); // añadimos CORS

// rutas por defecto Express
app.use('/', indexRouter);
// redirige hacia las apis
app.use('/api', apiRouter);

// load mqtt - elastic bridge
require('./mqtt/mqtt-elastic');

// modulo Express por defecto
module.exports = app;
