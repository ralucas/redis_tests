'use strict';

var express = require('express');
var app = express();
var path = require('path');
var util = require('util');
var logger = require('morgan');
var bodyParser = require('body-parser');
var Q = require('q');
var redis = require('redis');
var config = require('../config');
var redisConfig = config.get('redis');

var seed = require('./seed');

var client = redis.createClient(redisConfig.port, redisConfig.server, redisConfig.options);

seed(client);

var staticPath = path.join(__dirname, 'public/');

app.use(logger('dev'));
app.use(bodyParser());
app.use(express.static(staticPath));

//set up monitoring for redis
//client.monitor(function (err, res) {
  //if (err) throw new Error('Error with monitoring mode: ', err, err.stack);
  //console.log("Entering monitoring mode.");
//});

//client.on("monitor", function (time, args) {
  //console.log(time + ": " + args);
//});

function getPredictedSearch(term) {
  return Q.ninvoke(client,'zrange', term, 0, 4)
    .then(function(results) {
      console.log('zrange res: ', results);
      var promises = [];
      results.forEach(function(result) {
        var promise = Q.ninvoke(client, 'hmget', 'titles', result);
        promises.push(promise);
      });
      return Q.all(promises);
    })
    .then(function(results) {
      console.log('hget res: ', results);
      return results;
    });
}

app.get('/search', function(req, res) {
  var searchTerm = req.query.q;
  console.log('searchTerm: ', searchTerm);
  getPredictedSearch(searchTerm)
    .then(function(results) {
      console.log('prediction: ', results);
      if (results[0]) {
        res.send(results);
      }
    });
});

var server = app.listen(config.get('port'), config.get('ip'), function() {
  var serverAddress = server.address().address,
      serverPort = server.address().port;
  console.log('Server listening at http://%s:%s', serverAddress, serverPort);
});

