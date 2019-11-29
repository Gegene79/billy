"use strict"
const { Client } = require('@elastic/elasticsearch')

// connect to elastic and export client
exports.client = new Client({
    log : [{
        type: 'stdio',
        levels: ['error'] // change these options
      }],
    node: process.env.EL_URL
 })
/* log: [{ type: 'stdio',
 levels: ['error']
},{ type: 'console',
 levels: ['error']
}]
 */

// constant
exports.DOC_TYPE = '_doc'
