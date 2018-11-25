const mongoose = require('mongoose');
const debug = require('debug');
const { DateTime } = require('luxon');
const { Schema } = mongoose;

const MetricSchema = new Schema({
  name: String,
  period: String,
  type: String,
  topic: String,
  timestamp: Date,
  receivedAt: Date,
  value: Number
});

mongoose.model('metrics', MetricSchema);