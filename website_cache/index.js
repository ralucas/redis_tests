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
var config = require('../config');

var redisConfig = config.get('redis');

var client = redis.createClient(redisConfig.port, redisConfig.server, redisConfig.options);

var md5 = crypto.createHash('md5');

var staticPath = path.join(__dirname, 'public/');

var pageHash;

app.use(logger('dev'));
app.use(compression());
app.use(express.static(staticPath));

app.get('/', function(req, res) {

  res.set({
    'Content-type': 'text/html'
  });
  
  var htmlFile = staticPath + 'test.html'; 
  
  var uri = req.protocol + '://' + req.get('host') + req.originalUrl;

  if (!pageHash) {
    md5.update(uri, 'utf8');
    pageHash = md5.digest('hex');
  }
 
  client.exists(pageHash, function(err, r) {
    if (err) res.send(err);
    if (r !== 0) {
      client.get(pageHash, function(err, contents) {
        if (err) res.status(500).send(err);
        res.send(contents);
      });
    } else {
      fs.readFile(htmlFile, function(err, data) {
        if (err) res.status(500).send(err);
        var html = data.toString();
        client.set(pageHash, html);  
        res.send(html);
      });
    }
  });
});

var server = app.listen(config.get('port'), config.get('ip'), function() {
  var serverAddress = server.address().address,
      serverPort = server.address().port;
  console.log('Server listening at http://%s:%s', serverAddress, serverPort);
});
