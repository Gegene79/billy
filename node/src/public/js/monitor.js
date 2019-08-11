"use strict";
const TIMER_G2H = 60*1000;
const TIMER_CURRENT = 60*1000;
const TIMER_GWEEK = 5*60*1000;
const CITYID = 3117735;
const APIKEY = '1e5dd90ebb1974b27d7fbb47ea12fab3';
const TEMP_URL= "http://api.openweathermap.org/data/2.5/forecast?id="+CITYID+"&APPID="+APIKEY+"&units=metric";
const id_name = new Map([
                        ["HABITACION_PRINCIPAL", "Habitación"],
                        ["HABITACION", "Habitación"],
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

var chartWeek = nv.models.lineWithFocusChart();

/*
    Main week graph
*/

function formatAxis(x_value){
    let date = DateTime.fromMillis(Number(x_value)).setLocale("ES");
    if (date.hour == 0) return "|" ;
    else if (date.hour == 12) {
        if (Math.round(date.diffNow('day').as('days')) == 0) return "hoy";
        else return date.toFormat("EEE dd 'de' LLL");
    }
    else return date.toFormat("HH:ss");
}


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
        .tickFormat((d)=>formatAxis(d));
    
    chartWeek.x2Axis
        //.staggerLabels(true)
        .tickFormat((d)=>formatAxis(d));

    chartWeek.margin({top: 50, right: 100, bottom: 50, left: 50})
    chartWeek.yTickFormat(d3.format(',.1f'));
    chartWeek.yAxis.axisLabel("ºC");
    chartWeek.interpolate("basis");
    chartWeek.useInteractiveGuideline(true);
    chartWeek.legend.keyFormatter = (d) => DateTime.fromMillis(Number(d)).toFormat("HH:ss");

    return chartWeek;
};

function updateWeekChart(refDate){

    $("#referenceDate").text(refDate.toFormat("EEE dd 'de' LLL"));

    var ini = refDate.minus({day: 5}).startOf('day');
    var end = refDate.plus({day: 2}).startOf('day');

    d3.json(API_BASEURL+"/temperature?sampling=30&ini="+ini.toSeconds()+"&end="+end.toSeconds(), function(error, data) {
        if (error) return console.log(error);

        //var max = d3.max(data, function(c) { return d3.max(c.values, function(d) { return d.y; }); })+1; 
        //var min = d3.min(data, function(c) { return d3.min(c.values, function(d) { return d.y; }); })-1;
        //chartWeek.forceY([min, max]);
        
        var weekticks = [];
        var s = ini;
        while(s.toSeconds() <= end.toSeconds()) {
            weekticks.push(s.toJSDate());
            s = s.plus({hours: 12});
        };

        chartWeek.xAxis.tickValues(weekticks);
        chartWeek.xAxis.scale(d3.time.scale().domain([ini.toJSDate(),end.toJSDate()]));
        chartWeek.x2Axis.tickValues(weekticks);
        chartWeek.x2Axis.scale(d3.time.scale().domain([ini.toJSDate(),end.toJSDate()]));

        data.forEach(function(element){element.key=id_name.get(element.key);});

        d3.select('#chart_week svg')
            .datum(data)
            .call(chartWeek);

        nv.utils.windowResize(chartWeek.update);
    });

    timerGraphWeek = setTimeout(function() {updateWeekChart(chartRefDate)}, TIMER_GWEEK);
    
};

function updateCurrentVal(){
    
    $.getJSON( API_BASEURL+"/temperature/current", function( data ) {
        data.forEach( (metric) => {
            
            let dif = (parseFloat(metric.d1_value) - parseFloat(metric.value))
            let s_dif = (dif>0?'+':'') + dif.toFixed(1);
            let m = DateTime.fromISO(metric.ts);
            let ts = "";
            if(m < DateTime.local().startOf('day')){
                ts = m.setLocale('ES').toFormat('ccc d LLL HH:mm');
            } else {
                ts = m.toFormat('HH:mm');
            };

            // update radial indicator
            if (metric.name=="EXTERIOR"){
                var radialObj = $('#ExteriorIndicator').data('radialIndicator');
                radialObj.animate(metric.value);
            }

            $("#temp-"+metric.name).text(parseFloat(metric.value).toFixed(1));
            $("#temp-ts-"+metric.name).text(ts);
            $("#temp-max-"+metric.name+" span").text(parseFloat(metric.max).toFixed(1)+"ºC");
            $("#temp-avg-"+metric.name).text(s_dif+"ºC");
            $("#temp-min-"+metric.name+" span").text(parseFloat(metric.min).toFixed(1)+"ºC");
            
        });
    });


    //$.getJSON("http://api.openweathermap.org/data/2.5/forecast?id=524901&APPID={APIKEY}")

    timerCurrentVal = setTimeout(updateCurrentVal, TIMER_CURRENT);
};
