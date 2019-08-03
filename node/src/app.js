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
var apiRouter = require('./routes/api/index');

// declaración por defecto de app Express
var app = express();

// express por defecto
app.use(logger(process.env.NODE_ENV)); // en express: 'dev'
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors()); // añadimos CORS
app.use(cookieParser(process.env.SECRET)); //  modificado para descodificar las signed-cookies


// redirige hacia las apis
app.use('/api', auth.required.unless({path:['/api/users/signup','/api/users/login']}), apiRouter);
app.use('/main.html', auth.required, (req,res,next) => 
    { debug('main.html solicitado'); next()});
// rutas por defecto Express
app.use(express.static(path.join(__dirname, 'public'))); //auth.required.unless({path:['/index.html','/login.html']})

// catch errors, send 500 status and error JSON
app.use((err, req, res, next) => {
    
    if (err.name === 'UnauthorizedError')  {
        return res.status(401).redirect('/login.html');
    }
    // default to 500 server error
    return res.status(500).redirect('/index.html');
});

// load mqtt - elastic bridge
require('./mqtt/mqtt-elastic');

// modulo Express por defecto
module.exports = app;
