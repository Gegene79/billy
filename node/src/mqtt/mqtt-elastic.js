'use strict'
const debug = require('debug')('mqtt');
const mqtt = require('mqtt');
const e = require('../config/error');
var el = require('../config/db');
var mbuffer = new Map();
const MAXDEV = new Map([["temperature", 5 / 60000],      // temperature => 5ºC per minute
                        ["humidity",    10 / 60000],     // humidity => 10% per minute
                        ["prueba_type", 10 / 60000]]);   // for testing purpose   


// opciones de connexiones. "clean"=false evita que se borren los mensajes persistentes
// al momento de conectarse.
const mq_client_opts = {
    clean: false,
    clientId: process.env.MQ_CLIENTID
};
const pubsub_opts={
    qos: 2 // once-and-only-once
};
// lanza la conexión en modo persistente
const mq_client  = mqtt.connect(process.env.MQ_URL,mq_client_opts);

mq_client.on('connect', () => {
    debug("connected to "+process.env.MQ_URL);
    mq_client.subscribe(process.env.MQ_TOPIC+'/#', pubsub_opts, function (err) {
        if (err) console.error(err.toString())
        else debug("suscribed to "+process.env.MQ_TOPIC);
    });
    mq_client.subscribe(process.env.MQ_SENSOR_TOPIC+'/#', pubsub_opts, function (err) {
        if (err) console.error(err.toString());
        else debug("suscribed to "+process.env.MQ_SENSOR_TOPIC);
    });
});

mq_client.on('message', (topic, message) => {
    // message in Queue
    debug('Message in topic ' + topic + ': ' + message.toString());
    try{
        var msg = JSON.parse(message.toString());
        msg.topic = topic;
        msg.receivedAt = new Date();

        // process message depending on topic root
        let topic_root = topic.split("/")[0];
        switch(topic_root){
            case process.env.MQ_TOPIC: 
                msg.value = Number(msg.value);
                return processMetric(msg);

            case process.env.MQ_SENSOR_TOPIC:
                return processStatusMsg(msg);
                
            default:
                console.error("Topic no valido: "+topic+", msg: "+message.toString()+ "\n"+err.toString());
        }
    } catch (err){
        console.error("Mensaje no valido: "+message.toString()+ "\n"+err.toString());
        return;
    }
});


function processMetric(metric){

    // complete metric info
    if (!(metric.period)) metric.period = 'm';
    if (!(metric.ts)) metric.ts = new Date();
        else metric.ts = new Date(metric.ts*1000);
    
    // check if value is valid
    let key = metric.type+"."+metric.name;
    if (mbuffer.has(key)) {
        let valuediff = Math.abs(metric.value - mbuffer.get(key).value);
        let timediff = Math.abs(metric.ts.getTime() - mbuffer.get(key).ts.getTime());
        let limit = MAXDEV.get(metric.type);

        if ( (valuediff / timediff) > MAXDEV.get(metric.type) ){ 
            // too much metric change for elapsed time... do not insert data.
            console.log("Erroneous value, difference of "+valuediff.toFixed(1)+" units in "+(timediff/1000).toFixed(0)+" seconds.");           
        }
    }
    mbuffer.set(key,metric); // add or replace in buffer Map.

    el.client.index({
        index: process.env.EL_METRIC_INDEX,
        type: el.DOC_TYPE, // hard coded
        body: metric
    })
    .then(
        (result) => {
            debug('Saved metric in ' + process.env.EL_METRIC_INDEX + '\nResult: %O',result);
        })
    .catch((err)=>{
        console.error("Imposible insertar la metrica: "+JSON.stringify(metric)+"\nError: "+err.toString());
    });
};


function saveStatusMsg(message){
        
    el.client.index({
        index: process.env.EL_SENSOR_INDEX,
        type: el.DOC_TYPE,
        body: message
    })
    .catch((err)=>{
        console.error("Imposible insertar el status: "+JSON.stringify(message)+"\n"+err.toString());
    });
};

exports.processMetric = processMetric
exports.saveStatusMsg = saveStatusMsg