"use strict";
var expect  = require("chai").expect;
var request = require("request");
require('dotenv').config();

let url1 = "http://localhost:"+process.env.PORT+"/api/prueba_type/prueba_name";
let value1 = 20+Math.random()*10;


    describe("insert metric with value "+value1+" using old url.", function() {

        it("returns status 200", function(done) {
            var json = { value: value1,period: 'm'};
            request.post({url:url1, json: json}, function(err, resp, body) {
                if (err) {
                    console.error('post failed:', err);
                    done(err);
                }
                try{
                    expect(resp.statusCode).to.equal(200);
                    done();
                }
                catch(e){
                    done(e);
                }
            });
        });
    });
    
    describe("retrieve metric data", function() {
        
        it("returns the correct value", function(done) {
            request.get(url1+'/current', function(error, response, body) {
                try{
                    expect(response.statusCode).to.equal(200);
                    let resp = JSON.parse(response.body);
                    //console.log("value retrieved: "+resp[0].value);
                    expect(resp[0].value).to.equal(value1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });
    });

    let url2 = "http://localhost:"+process.env.PORT+"/api/monitor/prueba_type/prueba_name";
    let value2 = value1+0.001;

    describe("insert 2nd metric with value "+value2+" using new url", function() {
        it("returns status 200", function(done) {
            var json = {
                value: value2,
                period: 'm'
            };
            request.post({url:url2, json: json}, function(err, resp, body) {
                if (err) {
                    console.error('post failed:', err);
                    done(err);
                }
                try{
                    expect(resp.statusCode).to.equal(200);
                    done();
                }
                catch(e){
                    done(e);
                }
            });
        });
        
    });
       
    let url3 = "http://localhost:"+process.env.PORT+"/api/monitor/prueba_type/prueba_name";
    let value3 = value1+10.0;

    describe("try to insert 3rd metric with value "+value3, function() {
        it("returns status 500 as too much difference in value", function(done) {
            var json = {
                value: value3,
                period: 'm'
            };
            request.post({url:url3, json: json}, function(err, resp, body) {
                if (err) {
                    console.error('post failed:', err);
                    done(err);
                }
                try{
                    expect(resp.statusCode).to.equal(500);
                    done();
                }
                catch(e){
                    done(e);
                }
            });
        });
    });
    
    describe("retrieve most recent metric data", function() {
        it("returns the 2nd value inserted, not the third", function(done) {
            
            request.get(url2+'/current', function(error, response, body) {
                try{
                    expect(response.statusCode).to.equal(200);
                    let resp = JSON.parse(response.body);
                    //console.log("value retrieved: "+resp[0].value);
                    expect(resp[0].value).to.equal(value2);
                    done();
                }
                catch(e){
                    done(e);
                }
            });
        });
    });

    let url4 = "http://localhost:"+process.env.PORT+"/api/monitor/prueba_type/prueba_name_2";
    let value4 = value1+1.01;

    describe("Insert other metric prueba2 with value "+value4, function() {
        it("returns status 200", function(done) {
            var json = {
                value: value4,
                period: 'm'
            };
            request.post({url:url4, json: json}, function(err, resp, body) {
                if (err) {
                    console.error('post failed:', err);
                    done(err);
                }
                try{
                    expect(resp.statusCode).to.equal(200);
                    done();
                }
                catch(e){
                    done(e);
                }
            });
        });
    });

    

    let value5 = value4+0.001;
    describe("Insert a second value for metric prueba2, value "+value5, function() {
        it("returns status 200", function(done) {
            var json = {
                value: value5,
                period: 'm'
            };
            request.post({url:url4, json: json}, function(err, resp, body) {
                if (err) {
                    console.error('post failed:', err);
                    done(err);
                }
                try{
                    expect(resp.statusCode).to.equal(200);
                    done();
                }
                catch(e){
                    done(e);
                }
            });
        });
    });

    let url5 = "http://localhost:"+process.env.PORT+"/api/monitor/prueba_type";
    
    describe("retrieve most recent metrics data", function() {
        it("returns the most recent values from the 2 metrics", function(done) {
            
            request.get(url5+'/current', function(error, response, body) {
                try{
                    expect(response.statusCode).to.equal(200);
                    let resp = JSON.parse(response.body);
                    //[{"_id":"prueba_name","timestamp":"2017-08-19T19:42:38.990Z","value":26.131281641822312},{"_id":"prueba_name_2","timestamp":"2017-08-20T06:37:44.002Z","value":30.885181782120664}]
                    let expectedresp = [
                        {_id:"prueba_name",value: value2},
                        {_id:"prueba_name_2",value: value5}
                    ];
                    console.log("values retrieved: "+JSON.stringify(resp)+"\n");
                    console.log("values expected: "+JSON.stringify(expectedresp));
                    
                    expect(resp[0]._id).to.equal(expectedresp[0]._id);
                    expect(resp[0].value).to.equal(expectedresp[0].value);
                    expect(resp[1]._id).to.equal(expectedresp[1]._id);
                    expect(resp[1].value).to.equal(expectedresp[1].value);
                    
                    done();
                }
                catch(e){
                    done(e);
                }
            });
        });
    });