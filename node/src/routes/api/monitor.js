'use strict'
var express = require('express');
var router = express.Router();
var { DateTime } = require('luxon');
var el = require ('../../config/db');
const min =  60*1000;
const hour = 60*min;

/*** Utility functions ***/

function upsertMetric(array, metric){
    let i = array.findIndex(m => (m.name==metric.name && m.type==metric.type));
    if ( i == -1)
        array.push(metric);
    else 
        Object.assign(array[i],metric);
}

function transform_query(docs){

    return new Promise(function(resolve,reject){

        var result = [];
        
        docs.body.aggregations.min_max.buckets.forEach((entry) => {
            let min_metric = { name: entry.key, 
                type: entry.min.hits.hits[0]._source.type, 
                min: Math.round(entry.min.hits.hits[0]._source.value*10)/10,
                min_ts: entry.min.hits.hits[0]._source.ts };
            upsertMetric(result, min_metric);

            let max_metric = { name: entry.key, 
                type: entry.max.hits.hits[0]._source.type, 
                max: Math.round(entry.max.hits.hits[0]._source.value*10)/10,
                max_ts: entry.max.hits.hits[0]._source.ts };
            upsertMetric(result, max_metric);
        });

        docs.body.aggregations.last_day.now_yesterday.buckets.forEach((entry) => {
            let d1_metric = { name: entry.key, 
                type: entry.yesterday.hits.hits[0]._source.type, 
                d1_value: Math.round(entry.yesterday.hits.hits[0]._source.value*10)/10,
                d1_ts: entry.yesterday.hits.hits[0]._source.ts };
            upsertMetric(result, d1_metric);

            let metric = { name: entry.key, 
                type: entry.now.hits.hits[0]._source.type, 
                value: Math.round(entry.now.hits.hits[0]._source.value*10)/10,
                ts: entry.now.hits.hits[0]._source.ts };
            upsertMetric(result, metric);
        });

        return resolve(result);
    });
};

function transform_agg(docs){

    return new Promise(function(resolve,reject){

        var result = [];
        docs.body.aggregations.nombres.buckets.forEach(function(entry){
            
            entry.cada_30mins.buckets.forEach((val)=>{
                if (val.doc_count >0) {
                    let datapoint = { x: val.key_as_string, y: Math.round(val.avg_temp.value*10)/10 };
                    
                    let exist_metric = result.find((a)=> {
                        return (a.key == entry.key);
                    });
                    if (exist_metric)
                        exist_metric.values.push(datapoint);
                    else 
                        result.push({key: entry.key, values: [datapoint]});
                }
            });
        });

        return resolve(result);
    });
};

function sendResults(res, result){
    res.contentType('application/json');
    res.status(200).json(result);
}

/*** set defaults parameters ***/
router.use(function (req, res, next) {

    if (req.query.ini){
        //ini = DateTime.fromString(req.query.ini,'yyyy-MM-ddTHH:mm:ss.SSS').toJSDate();
        req.query.ini = DateTime.fromSeconds(Number(req.query.ini));
    } else {
        req.query.ini = DateTime.local().minus({days:7}).startOf('day');
    }

    if (req.query.end){
        req.query.end = DateTime.fromSeconds(Number(req.query.end));
    } else {
        req.query.end = DateTime.local();
    }

    next();
});


// get historical values for all metrics
router.get('/', function(req, res, next) { // in fact /api

    el.client.search({
        index: 'metrics',
        type: '_doc',
        body: {
                "aggs": {
                    "group": {
                        "terms": {
                            "field": "name"
                        },
                        "aggs": {
                            "group_docs": {
                                "top_hits": {
                                    "size": 1,
                                    "sort": [
                                        {
                                            "ts": {
                                                "order": "desc"
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
    })
    .then(transform_query)
    .then((result)=>sendResults(res,result))
    .catch((error) => next(error));
});

// get current values for all metrics
router.get('/current', function(req, res, next) {
    
    el.client.search({
        index: 'metrics',
        type: '_doc',
        body: 
        {
            "query": {
                "match": {
                    "type": "temperature"
                }
            },
            "collapse" : {
                "field" : "name.keyword" 
            },
            "sort": {"ts": "desc"}
        }
    })
    .then(transform_query)
    .then((result)=>sendResults(res,result))
    .catch((error) => next(error));
});

// get historical values for all metrics of some type
router.get('/:type', function(req, res, next) {
    //  
    var obj = {
        "size": 0,
        "query": {
            "bool": {
               "filter": [ 
                   { "term":  { "type": req.params.type } },
                   { "range": { "ts": { "gte" : req.query.ini.toMillis(), "lt" :  req.query.end.toMillis()} } }
                   ]
            }
       },
       "aggs" : {
           "nombres" : {
               "terms" : { "field" : "name.keyword" },
               "aggs" : {
                   "cada_30mins": {
                       "date_histogram": {
                           "field": "ts",
                           "interval": "30m"
                       }
                       ,
                       "aggs": {
                           "avg_temp": { "avg" : { "field" : "value" } }
                       }
                   },
                    "max_temp": { "max" : { "field" : "value" } },
                    "min_temp": { "min" : { "field" : "value" } }
               }
           }
       }
   };
    el.client.search({
        index: 'metrics',
        type: '_doc',
        body: obj
    })
    .then(transform_agg)
    .then((result)=>{sendResults(res,result);})
    .catch((error) => next(error));  
});

// get current values of all metrics of some type
router.get('/:type/current', function(req, res, next) {

    el.client.search({
        index: 'metrics',
        type: '_doc',
        body: 
        {
            "size": 0,
            "query": {
                "bool": {
                   "filter": [ 
                       { "term":  { "type": req.params.type } }, 
                       { "range": { "ts": { "gte" : req.query.ini.toMillis(), "lt" :  req.query.end.toMillis()} } } 
                       ]
                }
           },
           "aggs" : {
               "min_max" : {
                   "terms" : { "field" : "name.keyword" },
                   "aggs" : {
                       "min": {
                           "top_hits": {
                               "size": 1,
                               "sort": [{"value": {"order": "asc"}}]
                           }
                       },
                       "max": {
                           "top_hits": {
                               "size": 1,
                               "sort": [{"value": {"order": "desc"}}]
                           }
                       }
                   }
               },
               "last_day":{
                   "filter": { "range": { "ts": { "gte" : "now-1d", "lt" :  "now"} } },
                   "aggs": {
                       "now_yesterday": {
                           "terms" : { "field" : "name.keyword"},
                           "aggs": {
                               "now": {
                                   "top_hits": {
                                       "size": 1,
                                       "sort": [{"ts": {"order": "desc"} }]
                                   }
                               },
                               "yesterday": {
                                   "top_hits": {
                                       "size": 1,
                                       "sort": [{"ts": {"order": "asc"} }]
                                   }
                               }
                           }
                       }
                   }
               }
           }
       }
    })
    .then(transform_query)
    .then((result)=>{console.log(JSON.stringify(result));sendResults(res,result);})
    .catch((error) => next(error));
});

// get values for a type and a name
router.get('/:type/:name/current', function(req, res, next) {
    el.client.search({
        index: 'metrics',
        type: '_doc',
        body: 
        {
            "size": 0,
            "query": {
                "bool": {
                   "filter": [ 
                       { "term":  { "type": req.params.type } },
                       { "term" : { "name.keyword" : req.params.name } },
                       { "range": { "ts": { "gte" : "now-1d", "lt" :  "now"} } } 
                       ]
                }
           },
           "aggs" : {
                "min": {
                    "top_hits": {
                        "size": 1,
                        "sort": [{"value": {"order": "asc"}}]
                    }
                },
                "max": {
                    "top_hits": {
                        "size": 1,
                        "sort": [{"value": {"order": "desc"}}]
                    }
                },
                "tiempo": {
                    "filter": { "range": { "ts": { "gte" : "now-1d", "lt" :  "now"} } },
                    "aggs": {
                        "now": {
                            "top_hits": {
                                "size": 1,
                                "sort": [{"ts": {"order": "desc"}}]
                            }
                        },
                        "yesterday": {
                            "top_hits": {
                                "size": 1,
                                "sort": [{"ts": {"order": "asc"}}]
                            }
                        }
                    }
                }
            }
       }

    })
    .then(transform_agg)
    .then((result)=>sendResults(res,result))
    .catch((error) => next(error));    
});

// insert metric
router.post('/:type/:name', function(req,res,next){

    var metric = req.body;
    metric.value = Number(metric.value);
    metric.name = req.params.name;
    metric.type = req.params.type;

    
    
});

module.exports = router;
