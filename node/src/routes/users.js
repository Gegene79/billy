'use strict'
var express = require('express');
var router = express.Router();
const e = require('../config/error');
const bcrypt = require('bcryptjs');
const el = require('../config/db');

//POST login route (optional, everyone has access)
router.post('/login', auth.optional, async (req, res, next) => {
  try{
    const { body: { user } } = req;

    if(!user.email) throw new e.InfoRequiredError("Email necesario.");
    if(!user.password) throw new e.InfoRequiredError("Contraseña necesaria.");

    // busca el usuario en el index
    let resp = await el.client.search({
      index: process.env.EL_USER_INDEX,
      type: '_doc',
      body: {"query": { "ids" : { "values" : user.email } }}
    });
    const { total } = resp.hits.total.value;
    if ( (!total) || total != 1) throw new e.CredentialsError("Usuario no encontrado");

    // compara la contraseña
    const { usuario } = resp.hits.hits[0]._source;
    let ok = await bcrypt.compare(user.password, usuario.password);
    
    if (ok) return res.cookie('jwt', auth.generateJWT(usuario), { httpOnly: true, secure: true })
            .status(200)
            .redirect('/main.html'); 
    else throw new e.CredentialsError("Credenciales no validas.");
  }
  catch(err) {next(err)}
}); 

module.exports = router;
