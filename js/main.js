var app = {};
var States = {};
var frozenDist;
var twoClicksAgo;
var freeze=0;
var Layer;
var latitude = 37.5; //38.82;
var longitude = -97; // -77.28;
var latLng = new L.LatLng(latitude, longitude);
var map = L.map('map')
  .setView(latLng, 4);
var $sidebar = $('#sidebar');
var $mapHelp = $("#map-help");
var $endorseHelp = $("#endorsement-process");

$(document).ready( function() {
  var sourcebox = $("#senate-template-infobox").html();
  app.infoboxTemplate = Handlebars.compile(sourcebox);
//  app.defaultTemplate = Handlebars.compile(defaultText);
//  app.endorseTemplate = Handlebars.compile(endorseText);
    var filename = window.location.pathname.split('/').pop();

    var public_spreadsheet_url = 'https://docs.google.com/spreadsheet/pub?key=0Ao3Ts9D8bHHpdDI2bm1NTUMwSC14T19mQlB6VkZDaWc&output=html';
  Tabletop.init( { key: public_spreadsheet_url,
    callback: showInfo,
    parseNumbers: true } );
});

function showInfo(data, tabletop) {
  $.each( tabletop.sheets("Sheet1").all(), function(i, stateinfo) {
    States[stateinfo.stateproper] = stateinfo;
  });
  loadGeo();
}

function getColor(score) {
    return score == '0' ? 'rgb(163, 163, 163)' :
    score == '1' ? 'rgb(26,150,65)' :
    score == '2'  ? 'rgb(166,217,106)' :
    score == '3'   ? 'rgb(255,255,191)' :
    score == '4'   ? 'rgb(253,174,97)' :
    score == '5'   ? 'rgb(215,25,28)' :
      'rgb(165, 255, 38)';
}

var geoStyle = function(data) {
  var statename = data.properties.name;
  console.log("statename", statename);
  console.log("States", States);
  console.log(States[statename]);
  var fillColor = getColor(States[statename].colorcategory.toString());

  return {
    fillColor: fillColor,
    weight: 2,
    opacity: 0.3,
    color: '#666',
    dashArray: '0',
    fillOpacity:.7
  }
};

function loadGeo(district) {
  L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    maxZoom: 17,
    minZoom:2,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    id: 'mroswell.i6hfjp09'
  }).addTo(map);
  //'examples.map-9ijuk24y'

    var filename = window.location.pathname.split('/').pop();
    var distmap = statesData;

  Layer = L.geoJson(statesData, {
    onEachFeature:onEachFeature,
    style: geoStyle
  });

  Layer.addTo(map);
}

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight
//    click: mapMemberDetailClick,
//    dblclick: mapDblClick
  });
}

function highlightFeature(e) {
  var layer = e.target;
  var districtNumber = layer.feature.properties.name;
  districtNumber = districtNumber.replace(/^0+/, '');
  var memberDetail = States[districtNumber];
  if(!memberDetail){
    return;
  }
//  var html;
//  html = "<div class='highlightFeatureInfo'>";
//  html += "<strong>" + memberDetail.stateproper + "</strong>";
//  html += "</div>";

 // $('.info').html(html);

  layer.setStyle({
    weight: 5,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.6
  });
  if (!freeze) {
    html = app.infoboxTemplate(memberDetail);
    $('#sidebar').html(html);
    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }
    info.update(layer.feature.properties);
  }
}

function resetHighlight(e) {

  info.update();
  var layer = e.target;
  Layer.resetStyle(layer);
  info.update();
  if (!freeze) {
    clearInfobox(e);
  }

  styleDistrict(frozenDist,5,0.3,'#b7907f',0.25);
}

function clearInfobox() {
  $sidebar.html(' ');
  styleDistrict(frozenDist,1,0.3,'#ffffff',.7);
}

function styleDistrict(whichDist, weight, opacity, fillColor, fillOpacity) {
  if (typeof frozenDist == 'object' && freeze) {
    var frozenDistrictNumber = whichDist.target.feature.properties.name;
    var frozenDistrictDetail = States[frozenDistrictNumber];
    whichDist.target.setStyle({
      fillColor: getColor(frozenDistrictDetail.competitivescale),
      weight: weight,
      opacity: opacity,
//      color: color,
      fillOpacity:fillOpacity
    })
  }
}

function mapMemberDetailClick(e) {
  if (typeof frozenDist == 'object' && freeze) {
    twoClicksAgo = _.clone(frozenDist);
  }
  freeze=1;
  var boundary = e.target;
  var districtNumber = boundary.feature.properties.name;
  var districtDetail = States[districtNumber];
  var member = memberDetailFunction(districtNumber);
  if (twoClicksAgo) {
   Layer.resetStyle(twoClicksAgo.target);
  }
  boundary.setStyle({
    weight: 5,
    color: '#b7907f',
//    dashArray: '',
    fillOpacity: 0.1
  });
  frozenDist = _.clone(e);
}

function memberDetailFunction(districtNumber){
  var districtDetail = States[districtNumber];
  // 1. Build Template for the information box from districtDetails attributes.
  var html = app.infoboxTemplate(districtDetail);
  // 2. Insert the rendered template into #sidebar
  $('#sidebar').html(html);
}

function mapDblClick(e) {
  var layer = e.target;
  var districtNumber = layer.feature.properties.name;
  districtNumber = districtNumber.replace(/^0+/, '');
  var bbox = layer.getBounds();
  map.fitBounds(bbox);
  layer.setStyle({
    weight: 5,
    color: '#666',
//    dashArray: '',
    fillOpacity: 0.2
  });
  mapMemberDetailClick(e);
}

var info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
  this.update();
  return this._div;
};
//   // method that we will use to update the control based on feature properties passed
info.update = function (props) {
};

info.setPosition('bottomleft').addTo(map);

$mapHelp.click(function() {
  var html = app.defaultTemplate({});
  $('#sidebar').html(html);
  freeze=false;
});

$endorseHelp.click(function() {
  var html = app.endorseTemplate({});
  $('#sidebar').html(html);
  freeze=false;
});

$(document).on("click",".close",function(event) {
  event.preventDefault();
  clearInfobox();
    freeze=0;
});