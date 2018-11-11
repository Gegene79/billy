"use strict";
const IMG_PER_PAGE=100;
var currentpage = 1;
var currentpagenb = 0;
var currenturl = "";
var currentquery = {};


var options = {
  containerId: 'pig',
  classPrefix: 'pig',
  figureTagName: 'figure',
  spaceBetweenImages: 8,
  transitionSpeed: 500,
  primaryImageBufferHeight: 1000,
  secondaryImageBufferHeight: 300,
  thumbnailSize: 20,
  urlForSize: function(filename, size) {
    return filename;
  },
  getMinAspectRatio: function(lastWindowWidth) {
    if (lastWindowWidth <= 640)  // Phones
      return 2;
    else if (lastWindowWidth <= 1280)  // Tablets
      return 4;
    else if (lastWindowWidth <= 1920)  // Laptops
      return 5;
    return 6;  // Large desktops
  },
  getImageSize: function(lastWindowWidth) {
    if (lastWindowWidth <= 640)  // Phones
      return 100;
    else if (lastWindowWidth <= 1920) // Tablets and latops
      return 250;
    return 500;  // Large desktops
  }
};



function browseimages(){
    // set url to use browse API
    currenturl = API_BASEURL + "/gallery/browseimages?limit="+IMG_PER_PAGE
    // set body to empty
    currentquery = {};
    // launch api request
    //gotopage(1);

    $.getJSON( currenturl, currentquery)
    .done(function( data ) {
        data.images.forEach( image => {
            image.filename2=image.filename;
            image.filename=image.smallthumb;
        } );
        var pig = new Pig(data.images, options).enable();

    });
};

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

