'use strict';

var express = require('express');
var app = express();

var path = require('path');
var url = require('url');
var crypto = require('crypto');
var fs = require('fs');

var logger = require('morgan');
var bodyParser = require('body-parser');
var redis = require('redis');
var redisPageCache = require('redis-page-cache');
var config = require('../config');

var redisConfig = config.get('redis');

var client = redis.createClient(redisConfig.port, redisConfig.server, redisConfig.options);

var staticPath = path.join(__dirname, 'public/');

app.use(logger('dev'));
app.use(bodyParser());
app.use(express.static(staticPath));

var product_key = 'catalog:item:3';
var user_key = 'user:2000:cart:9';

var options = {
  cad: true,
  watch: product_key,
  retry: 3
};

//starts the cart
client.expire(user_key, 24 * 60 * 60);

app.post('/order', function(req, res) {

  var order_quantity = req.body.order_quantity;

  client.watch(product_key);

  client.hget(product_key, 'available_quantity', function(err, result) {
    if (err) res.send(err);
    
    var multi = client.multi();
    
    if (result >= order_quantity) {

      multi
        .hincrby(product_key, 'available_quantity', (order_quantity - 1))
        .hset(user_key, 'Status:COMPLETE', new Date().getTime())
        .expire(user_key, '-1')
        .exec(function(err, results) {
          if (err) res.send(err);
          res.send(results);
        });

    } else {
      res.send('Not enough in stock to order!');
    }
  });

});

var server = app.listen(config.get('port'), config.get('ip'), function() {
  var serverAddress = server.address().address,
      serverPort = server.address().port;
  console.log('Server listening at http://%s:%s', serverAddress, serverPort);
});
