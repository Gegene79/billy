"use strict";
const TIMER_G2H = 60*1000;
const TIMER_CURRENT = 60*1000;
const TIMER_GWEEK = 5*60*1000;
const CITYID = 3117735;
const APIKEY = '1e5dd90ebb1974b27d7fbb47ea12fab3';
const TEMP_URL= "http://api.openweathermap.org/data/2.5/forecast?id="+CITYID+"&APPID="+APIKEY+"&units=metric";
const id_name = new Map([
                        ["HABITACION_PRINCIPAL", "Habitación"],
                        ["Habitación", "Habitación"], 
                        ["EMMA_PIERRE", "Niños"],
                        ["Emma", "Emma"],
                        ["Pierre", "Pierre"],
                        ["COCINA", "Cocina"],
                        ["Cocina", "Cocina"],
                        ["EXTERIOR", "Exterior"],
                        ["Exterior", "Exterior"],
                        ["Salón", "Salón"],
                        ["SALON", "Salón"]]);

var timerGraph2hours;
var timerCurrentVal;
var timerGraphWeek;
//var timerBsGraph;

var chartWeek = nv.models.lineWithFocusChart();

/*
    Main week graph
*/
function initWeekChart(){
    
    // mapear x e y hacia las columnas
    chartWeek.x(function(d) {
        var b = new Date(d.x).getTime();
        return b;
    });
    //chart.y(function(d) { return d.value; });
    // formato ejes
    chartWeek.xAxis
        //.staggerLabels(true)
        .tickFormat(function (d) {
            
        return d3.time.format('%a %d - %H:%M')(new Date(d));
    });
    
    chartWeek.x2Axis
        //.staggerLabels(true)
        .tickFormat(function (d) {
        return d3.time.format('%a %d - %H:%M')(new Date(d));
    });
    chartWeek.margin({top: 50, right: 50, bottom: 50, left: 50})
    chartWeek.yTickFormat(d3.format(',.1f'));
    chartWeek.yAxis.axisLabel("ºC");
    chartWeek.interpolate("basis");
    chartWeek.useInteractiveGuideline(true);

    return chartWeek;
};

function updateWeekChart(){

    var now = new Date();
    var lastweek = new Date();
    lastweek.setHours(-24*7,0,0,0);

    d3.json(API_BASEURL+"/temperature?sampling=30&ini="+lastweek.toISOString(), function(error, data) {	
        if (error) return console.log(error);

        //var max = d3.max(data, function(c) { return d3.max(c.values, function(d) { return d.y; }); })+1; 
        //var min = d3.min(data, function(c) { return d3.min(c.values, function(d) { return d.y; }); })-1;
        //chartWeek.forceY([min, max]);
        
        var weekticks = [];
        var s = new Date(lastweek);// new Date($('#hfEventStartDate').val() - 0);
        while(s.valueOf() < now.valueOf()) {
            weekticks.push(s);
            s = new Date(s.setDate(
                s.getDate() + 1
            ));
        }

        chartWeek.xAxis.tickValues(weekticks);
        chartWeek.x2Axis.tickValues(weekticks);

        data.forEach(function(element){element.key=id_name.get(element.key);});

        d3.select('#chart_week svg')
            .datum(data)
            .call(chartWeek);

        nv.utils.windowResize(chartWeek.update);
    });

    timerGraphWeek = setTimeout(updateWeekChart, TIMER_GWEEK);
    
};

function updateCurrentVal(){
    /*
    $.getJSON( API_BASEURL+"/temperature/Exterior/current", function( data ) {
        let temp= parseFloat(data[0].value);
        var radialObj = $('#ExteriorIndicator').data('radialIndicator');
        //radialObj.option('displayNumber',false);
        radialObj.animate(temp);
        //radialObj.option('displayNumber',true);
    });
    */


    
    $.getJSON( API_BASEURL+"/temperature/current", function( data ) {
        $.each( data, function(key,val) {
            let id = val._id;
            let name = id_name.get(id);
            let temp= parseFloat(val.value);
            let m = moment(val.timestamp);
            let ts = "";
            if(m.isBefore(new Date(),'day')){
                ts = m.format('ddd DD/MM HH:mm:ss');
            } else {
                ts = m.format('HH:mm:ss');
            };

            // update radial indicator
            if (id=="EXTERIOR"){
                var radialObj = $('#ExteriorIndicator').data('radialIndicator');
                radialObj.animate(temp);
            }

            $("#temp-"+id).text(temp.toFixed(1));
            $("#temp-ts-"+id).text(ts);
            
        });
    });


    //$.getJSON("http://api.openweathermap.org/data/2.5/forecast?id=524901&APPID={APIKEY}")

    timerCurrentVal = setTimeout(updateCurrentVal, TIMER_CURRENT);
};
