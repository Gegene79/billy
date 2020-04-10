'use strict'
var express = require('express');
var router = express.Router();
var { DateTime } = require('luxon');
var el = require ('../../config/db');
var debug = require('debug')('gallery');
//var chrono = require('chrono-node');
var from = 0;
var size = 50;

/*** Defaults parameters ***/

function sendresult(res,result){
    res.contentType('application/json');
    res.status(200).json(result);
};

router.use(function (req, res, next) {

    if (req.query.from){
        from = parseInt(req.query.from);
    } else from = 0;

    if (req.query.size){
        size = parseInt(req.query.size);
    } else size = 50;

    next();
});

router.get('/search', function(req, res, next) {
    
    let query = req.query.q;
    
    let fecha = chrono.parseDate(query); 

    el.client.search({
        index: process.env.EL_IMG_INDEX,
        type: '_doc',
        body: {"from" : from, "size" : size,
            "track_total_hits": "true",
            "query" : {
                "multi_match" : {
                    "query": q,
                    "type": "most_fields",
                    "fields": ["tokens", "year_month"]
                }
            },
            "sort": [
                {"_score": "desc"},
                {"ts": "desc"}
            ]}
    })
    .then((result)=>sendResults(res,result))
    .catch((error) => next(error));
});

module.exports = router;