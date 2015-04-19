'use strict';

var express = require('express');
var app = express();

var path = require('path');
var url = require('url');
var crypto = require('crypto');
var fs = require('fs');
var gzip = require('zlib').createGzip();

var logger = require('morgan');
var compression = require('compression');
var redis = require('redis');
var redisPageCache = require('redis-page-cache');
var config = require('../config');

var redisConfig = config.get('redis');

var client = redis.createClient(redisConfig.port, redisConfig.server, redisConfig.options);

var staticPath = path.join(__dirname, 'public/');

app.use(logger('dev'));
app.use(compression());
app.use(express.static(staticPath));

app.get('/', function(req, res) {

  res.set({
    'Content-type': 'text/html'
  });
  
  var htmlFile = staticPath + 'test.html'; 
  
  var uri = req.protocol + '://' + req.get('host') + req.originalUrl;

  redisPageCache(client, uri, htmlFile, function(err, html) {
    res.send(html);
  });

});

var server = app.listen(config.get('port'), config.get('ip'), function() {
  var serverAddress = server.address().address,
      serverPort = server.address().port;
  console.log('Server listening at http://%s:%s', serverAddress, serverPort);
});
