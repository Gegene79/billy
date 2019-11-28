"use strict";
const API_BASEURL = "/api/monitor";

var DateTime = luxon.DateTime;
var chartRefDate = DateTime.local().setLocale('ES').startOf('day');

