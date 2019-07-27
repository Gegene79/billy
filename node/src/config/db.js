"use strict"
const { Client } = require('@elastic/elasticsearch')

// connect to elastic and export client
exports.client = new Client({ node: process.env.EL_HOST })
