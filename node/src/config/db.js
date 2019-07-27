"use strict"

const elastic = require('elasticsearch');

const client = new elastic.Client({
    host: process.env.EL_HOST,
    log: 'trace'
});

exports.client = client;