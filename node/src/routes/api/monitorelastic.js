"use strict";
var express = require('express');
var router = express.Router();
var { DateTime } = require('luxon');
const elastic = require('elasticsearch');
const el_client = new elastic.Client({
    host: process.env.EL_HOST,
    log: 'trace'
});

var ini = DateTime.local();
var end = DateTime.local();
const min =  60*1000;
const hour = 60*min;
var sampling;

/*** Utility functions ***/

function transform_query(docs){

    return new Promise(function(resolve,reject){

        var result = [];
        docs.hits.hits.forEach(function(entry){
            if (!((entry._source.value == null) || (entry._source.value == NaN))){

                var exist_metric = result.find((a) => {
                        return ((a._id == entry._source.name) && (a.type == entry._source.type));
                    });

                if (exist_metric){ // la metrica con nombre _id.name ya esta en result, solo hay que añadir el datapoint
                    exist_metric.values.push(datapoint);
                } else { // la metrica no esta en result, hay que añadirla con su primer datapoint
                    var metric = {  '_id' : entry._source.name,
                                    'type': entry._source.type,
                                    'timestamp': entry._source.ts, 
                                    'value': Math.round(entry._source.value*10)/10 };
                    result.push(metric);
                }
            }
        });

        return resolve(result);
    });
};

function transform_agg(docs){

    return new Promise(function(resolve,reject){

        var result = [];
        docs.aggregations.nombres.buckets.forEach(function(entry){
            
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

function sendresult(res,result){
    res.contentType('application/json');
    res.status(200).json(result);
};

/*** Defaults parameters ***/

router.use(function (req, res, next) {

    ini = DateTime.local().plus({days:-7}).set({hour:0, minute:0, second:0}).toJSDate();
    //ini = myDate().subtract(7,'days').startOf('day').toDate();      // default: since one week
    //end = myDate().toDate();                                        // default: up to now
    end = DateTime.local();
    sampling = 5*min;                                               // default: values are averaged on 5 mins intervals

    if (req.query.ini){
        //ini = DateTime.fromString(req.query.ini,'yyyy-MM-ddTHH:mm:ss.SSS').toJSDate();
        ini = DateTime.fromISO(req.query.ini);
    } 
    if (req.query.end){
        end = DateTime.fromISO(req.query.end);
    }
    if (req.query.sampling){
        sampling = req.query.sampling*min;
    }

    next();
});


// get historical values for all metrics
router.get('/', function(req, res, next) {
    
    el_client.search({
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
    .then((result)=>{sendresult(res,result);})
    .catch(function(error){
        next(error);
    });
});

// get current values for all metrics
router.get('/current', function(req, res, next) {
    
    el_client.search({
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
    .then((result)=>{sendresult(res,result);})
    .catch(function(error){
        next(error);
    });
});


// get historical values for all metrics of some type
router.get('/:type', function(req, res, next) {
    
    el_client.search({
        index: 'metrics',
        type: '_doc',
        body: 
        {
            "size": 0,
            "query": {
                "bool": {
                   "filter": [ 
                       { "term":  { "type": req.params.type } }, 
                       { "range": { "ts": { "gte" : ini.toMillis(), "lt" :  end.toMillis()} } } 
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
                       }
                   }
               }
           }
       }

    })
    .then(transform_agg)
    .then((result)=>{sendresult(res,result);})
    .catch(function(error){
        console.log(JSON.stringify(error));
        next(error);
    });  
});

// get current values of all metrics of some type
router.get('/:type/current', function(req, res, next) {

    el_client.search({
        index: 'metrics',
        type: '_doc',
        body: 
        {
            "query": {
                "match": {
                    "type": req.params.type
                }
            },
            "collapse" : {
                "field" : "name.keyword" 
            },
            "sort": {"ts": "desc"}
        }
    })
    .then(transform_query)
    .then((result)=>{sendresult(res,result);})
    .catch(function(error){
        console.log(JSON.stringify(error));
        next(error);
    });
});

// get historical values for a type and a name
router.get('/:type/:name', function(req, res, next) {
    el_client.search({
        index: 'metrics',
        type: '_doc',
        body:
        {
        "size": 0,
        "query": {
            "bool": {
               "filter": [ 
                   { "term":  { "type": "temperature" } }, 
                   { "range": { "ts": { "gte" : "now-2d/d", "lt" :  "now"} } } 
                   ]
            }
       },
       "aggs" : {
           "names" : {
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
                   }
               }
           }
       }
   }
})
     .then(transform_agg)
    .then(function(result){sendresult(res,result);})
    .catch(function(error){
        next(error);
    });  
});

// get current value for a type and a name
router.get('/:type/:name/current', function(req, res, next) {

    db.getCurrentValueByTypeAndName(req.params.type,req.params.name,ini)
    .then(function(result){
        sendresult(res,result);
    })
    .catch(function(error){
        next(error);
    });
});

// insert metric
router.post('/:type/:name', function(req,res,next){

    var metric = req.body;
    metric.value = Number(metric.value);
    metric.name = req.params.name;
    metric.type = req.params.type;

    var key = metric.type+"."+metric.name;
    
    if (!(metric.period)) {
        metric.period = 'm';
    }
    if (!(metric.timestamp)){
        metric.timestamp = new Date();
    }
    
    if (mbuffer.has(key)) {
        let valuediff = Math.abs(metric.value - mbuffer.get(key).value);
        let timediff = Math.abs(metric.timestamp.getTime() - mbuffer.get(key).timestamp.getTime());
        let limit = MAXDEV.get(metric.type);

        if ( (valuediff / timediff) > MAXDEV.get(metric.type) ){ 
            // too much metric change for elapsed time... do not insert data.
            return next(new Error("Erroneous value, difference of "+valuediff.toFixed(1)+" units in "+(timediff/1000).toFixed(0)+"seconds."));           
        }
    }
    mbuffer.set(key,metric); // add or replace in Map.

    db.insertMetric(metric)
    .then(function(result){sendresult(res,result);})
    .catch(function(error){
        next(error);
    });
});

module.exports = router;
