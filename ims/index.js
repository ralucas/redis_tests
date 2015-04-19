'use strict';

var express = require('express');
var app = express();

var path = require('path');

var logger = require('morgan');
var bodyParser = require('body-parser');
var redis = require('redis');

var config = require('../config');

var redisConfig = config.get('redis');

var client = redis.createClient(redisConfig.port, redisConfig.server, redisConfig.options);

var staticPath = path.join(__dirname, 'public/');

app.use(logger('dev'));
app.use(bodyParser());
app.use(express.static(staticPath));

var product_key = 'catalog:item:3';
var user_key = 'user:2000:cart:9';

//set up monitoring for redis
client.monitor(function (err, res) {
  if (err) throw new Error('Error with monitoring mode: ', err, err.stack);
  console.log("Entering monitoring mode.");
});

client.on("monitor", function (time, args) {
  console.log(time + ": " + util.inspect(args));
});

//seeds and starts the cart
client.multi()
  .hmset('catalog:item:1', 'title', 'Awesome Product 1', 'price', 10, 'available_quantity', 4)
  .hmset('catalog:item:2', 'title', 'Awesome Product 2', 'price', 14, 'available_quantity', 0)
  .hmset('catalog:item:3', 'title', 'Awesome Product 3', 'price', 12, 'available_quantity', 2)
  .hmset('catalog:item:4', 'title', 'Awesome Product 4', 'price', 29, 'available_quantity', 16)
  .expire(user_key, 24 * 60 * 60)
  .exec(function(err, results) {
    if (err) throw new Error('Error in seeding data: ', err, err.stack);
    console.log('seed results: ', results);
  });

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
