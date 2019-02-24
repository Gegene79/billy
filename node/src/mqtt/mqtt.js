'use strict';
const debug = require('debug');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const e = require('../config/error');
var mbuffer = new Map();
const MAXDEV = new Map([["temperature", 5 / 60000],      // temperature => 5ºC per minute
                        ["humidity",    10 / 60000],     // humidity => 10% per minute
                        ["prueba_type", 10 / 60000]]);   // for testing purpose   
const Metric = mongoose.model('metrics');

// opciones de connexiones. "clean"=false evita que se borren los mensajes persistentes
// al momento de conectarse.
const client_opts = {
    clean: false,
    clientId: 'billy-node'
};
const pubsub_opts={
    qos: 2 // once-and-only-once
};
// lanza la conexión en modo persistente
const client  = mqtt.connect(process.env.MQ_URL,client_opts);


client.on('connect', function () {
    client.subscribe(process.env.MQ_TOPIC+'/#', pubsub_opts, function (err) {
        if (err) console.log(err.toString());
    });
});

client.on('message', function (topic, message) {
    // message is Buffer
    console.log('ha llegado: '+message.toString());
    // process message
    // new object
    try{
        var metric = new Metric(JSON.parse(message.toString()));
    } catch (err){
        console.log("Mensaje no valido: "+message.toString()+ "\n"+err.toString());
    }

    metric.value = Number(metric.value);
    metric.receivedAt = new Date();
    metric.topic = topic;
    if (!(metric.period)) metric.period = 'm';
    if (!(metric.timestamp)) metric.timestamp = new Date();
        else metric.timestamp = new Date(metric.timestamp);
    
    // check if value is valid
    let key = metric.type+"."+metric.name;
    if (mbuffer.has(key)) {
        let valuediff = Math.abs(metric.value - mbuffer.get(key).value);
        let timediff = Math.abs(metric.timestamp.getTime() - mbuffer.get(key).timestamp.getTime());
        let limit = MAXDEV.get(metric.type);

        if ( (valuediff / timediff) > MAXDEV.get(metric.type) ){ 
            // too much metric change for elapsed time... do not insert data.
            console.log("Erroneous value, difference of "+valuediff.toFixed(1)+" units in "+(timediff/1000).toFixed(0)+"seconds.");           
        }
    }
    mbuffer.set(key,metric); // add or replace in Map.

    metric.save().catch((err)=>{
        console.log("Imposible insertar la metrica: "+metric.toString()+"\n"+err.toString());
    });
});

