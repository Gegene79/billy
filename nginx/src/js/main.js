"use strict";

$(function() {
    // Handler for .ready() called.

    $('#photos').click(function(){ disableMonitor(); disableNotebook(); enablePhotos(); browseimages(); return false; });

    $('#monitor').click(function(){ disablePhotos(); disableNotebook(); enableMonitor(); return false; });

    $('#notebook').click(function(){ disablePhotos(); disableMonitor(); enableNotebook(); return false; });

    $( '#search-btn' ).on('click',function(){
        event.preventDefault();
        launchsearch();
    });

    $('#search-text').on('keypress',function(event){
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if(keycode == '13'){
            launchsearch();
        }
    });

    $('button[data-dismiss="modal"]').on('click',function(){
        disableCarousel();
    });

    $( '#prev-btn' ).on('click',function(){
        event.preventDefault();
        prevpage();
    });

    $( '#next-btn' ).on('click',function(){
        event.preventDefault();
        nextpage();
    });

    $('#ExteriorIndicator').radialIndicator({
        barBgColor: '#FFFFFF',
        displayNumber: false,
        barColor: '#87CEEB',
        radius: 80,
        barWidth: 4,
        roundCorner : false,
        percentage: false,
        minValue: -10,
        maxValue: 50,
        fontfamily: "font-family: 'Open Sans', sans-serif;",
        fontWeight: 'normal',
        frameTime: 1,
        frameNum: 300
    });

    // monitor event handlers
    $( '#prev-week-btn' ).on('click',function(){
        event.preventDefault();
        chartRefDate = chartRefDate.minus({ week: 1})
        updateWeekChart(chartRefDate);
    });

    $( '#first-week-btn' ).on('click',function(){
        event.preventDefault();
        chartRefDate = chartRefDate.minus({ month: 1})
        updateWeekChart(chartRefDate);
    });

    $( '#next-week-btn' ).on('click',function(){
        event.preventDefault();
        if (chartRefDate.plus({ week: 1}).toSeconds() > DateTime.local().toSeconds()) {
            chartRefDate = DateTime.local().setLocale('ES').startOf('day');
        } else chartRefDate = chartRefDate.plus({ week: 1})
        updateWeekChart(chartRefDate);
    });

    $( '#last-week-btn' ).on('click',function(){
        event.preventDefault();
        if (chartRefDate.plus({ month: 1}).toSeconds() > DateTime.local().toSeconds()) {
            chartRefDate = DateTime.local().setLocale('ES').startOf('day');
        } else chartRefDate = chartRefDate.plus({ month: 1})
        updateWeekChart(chartRefDate);
    });

    disablePhotos();
    disableNotebook();
    enableMonitor();
});

function enablePhotos(){
    
    $('#container-photos').removeClass('d-none');
    $('#div-search-bar').removeClass('d-none');
    $('#div-text-results').removeClass('d-none');
    $('#div-nav-pg-btn').removeClass('d-none');
    $('#scan-btn').removeClass('d-none');

    $('#photos').parent().addClass('active');

};

function disablePhotos(){
    $('#container-photos').addClass('d-none');
    $('#div-search-bar').addClass('hidden');
    $('#div-text-results').addClass('hidden');
    $('#div-nav-pg-btn').addClass('hidden');
    $('#scan-btn').addClass('hidden');
    $('#photos').parent().removeClass('active');
};

function enableMonitor(){
    
    $('#container-monitor').removeClass('d-none');
    $('#monitor').parent().addClass('active');
    
    nv.addGraph(initWeekChart);

    $("#referenceDate").text(chartRefDate.toLocaleString("EEE dd 'de' LLL"));
    updateCurrentVal();
    //updateChart6Hours();
    updateWeekChart(chartRefDate);
};

function disableMonitor(){
    // stop refreshing
    clearTimeout(timerCurrentVal);
    clearTimeout(timerGraphWeek);

    d3.selectAll('#chart_week svg > *').remove();

    $('#container-monitor').addClass('d-none');
    $('.nvtooltip').remove();
    $('#monitor').parent().removeClass('active');
};

function enableNotebook() {
    $('#container-notebook').removeClass('d-none');
    $('#notebook').parent().addClass('active');
}

function disableNotebook() {
    $('#container-notebook').addClass('d-none');
    $('#notebook').parent().removeClass('active');
}

function activateCarouselImage(id){
    //$('#pig').addClass('d-none');
    //$('#carousel-container').removeClass('d-none');
    $('#carousel_'+id).addClass('active');
};

function disableCarousel(){
    $('[id^=carousel_]').removeClass('active');
};

