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
const auth = require('./config/auth');
const debug = require('debug')('main');
//Configure isProduction variable
const isProduction = (process.env.NODE_ENV === 'production');

// express rutas por defecto
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api/index');

// declaración por defecto de app Express
var app = express();

// express por defecto
app.use(logger(process.env.NODE_ENV)); // en express: 'dev'
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors()); // añadimos CORS
app.use(cookieParser(process.env.SECRET)); //  modificado para descodificar las signed-cookies


// APIs sin authentication
app.use('/users', usersRouter);

// redirige hacia las apis con authentication
app.use('/api', auth.required.unless({path:['/api/users/signup','/api/users/login']}), apiRouter);

// protect all other assets unless index.html
app.use('/main.html', auth.required, (req,res,next) => next());

// rutas por defecto Express
app.use(express.static(path.join(__dirname, 'public'))); //auth.required.unless({path:['/index.html','/login.html']})

// catch API errors, send 500 status and error JSON
app.use('/api',(err, req, res, next) => {
    console.error("Caught API error, responding json.\r\nStacktrace: "+err.stacktrace);
    err.status = err.status || 500;
    return res.status(err.status).json({error: {message: err.message, stacktrace: err.stacktrace}});
});

// catch other errors, send 500 status and redirecto to login
app.use((err, req, res, next) => {
    console.error("Caught error, redirecting to login.\r\nStacktrace: "+err.stacktrace);
    err.status = err.status || 500;
    if (err.constructor.name == "CredentialsError" || err.constructor.name == "UnauthorizedError")
        return res.status(err.status).redirect('/login.html');
    return res.status(err.status).redirect('/index.html');
});

// load mqtt - elastic bridge
require('./mqtt/mqtt-elastic');

// modulo Express por defecto
module.exports = app;
