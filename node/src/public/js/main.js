"use strict";

$(function() {
    // Handler for .ready() called.

    $('#photos').click(function(){ enablephotos(); browseimages(); return false; });

    $('#monitor').click(function(){ enablemonitor(); return false; });

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
        displayNumber: false,
        barColor: '#87CEEB',
        radius: 70,
        barWidth: 3,
        roundCorner : false,
        percentage: false,
        minValue: -10,
        maxValue: 50,
        fontfamily: "font-family: 'Open Sans', sans-serif;",
        fontWeight: 'normal',
        frameTime: 1,
        frameNum: 600
    });

    enablemonitor();
});

function enablephotos(){
    // stop refreshing
    clearTimeout(timerCurrentVal);
    clearTimeout(timerGraphWeek);

    d3.selectAll('#chart_week svg > *').remove();
    
    $('#container-monitor').addClass('d-none');
    $('.nvtooltip').remove();

    $('#container-photos').removeClass('d-none');
    $('#div-search-bar').removeClass('d-none');
    $('#div-text-results').removeClass('d-none');
    $('#div-nav-pg-btn').removeClass('d-none');
    $('#scan-btn').removeClass('d-none');

    $('#monitor').parent().removeClass('active');
    $('#photos').parent().addClass('active');

};


function enablemonitor(){
    $('#container-photos').addClass('d-none');
    $('#div-search-bar').addClass('hidden');
    $('#div-text-results').addClass('hidden');
    $('#div-nav-pg-btn').addClass('hidden');
    $('#scan-btn').addClass('hidden');
    
    $('#container-monitor').removeClass('d-none');
    $('#monitor').parent().addClass('active');
    $('#photos').parent().removeClass('active');

    nv.addGraph(initWeekChart);

    updateCurrentVal();
    //updateChart6Hours();
    updateWeekChart();
};

function activateCarouselImage(id){
    //$('#pig').addClass('d-none');
    //$('#carousel-container').removeClass('d-none');
    $('#carousel_'+id).addClass('active');
};

function disableCarousel(){
    $('[id^=carousel_]').removeClass('active');
};

