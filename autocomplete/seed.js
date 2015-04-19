var Q = require('q');

var searchTerms = [{
    name: "Apple iPhone 5S",
    popularity: 9
  }, {
    name: "Apple iPhone 5C",
    popularity: 6
  }, {
    name: "Samsung Galaxy Note 3",
    popularity: 8
  }, {
    name: "Samsung Galaxy Nexus",
    popularity: 7
  }];

module.exports = function(client) {

  client.flushdb();

  var createArray = function(terms) {
    var multiAdd = [];
    var deferred = Q.defer();

    terms.forEach(function(term) {
      var words = term.name.toLowerCase().split(' '); 
      var key = words.join('_');
      
      words.forEach(function(word) {
        var len = word.length,
            builtWord = '',
            i = 0;

        for (i; i < len; i += 1) {
          builtWord += word[i];
          multiAdd.push(['zadd', builtWord, term.popularity, key]);
        }
      });
      multiAdd.push(['hset', 'titles', key, term.name]);
      deferred.resolve(multiAdd);
    });
    return deferred.promise;
  };

  createArray(searchTerms)
    .then(function(builtArr) {
      client.multi(builtArr)
       .exec(function(err, results) {
         if (err) throw new Error('Error in seeding: ', err, err.stack);
         console.log('results: ', results);
      });
    });
};

/* .zadd('a', 9, 'apple_iphone_5s')*/
  //.zadd('ap', 9, 'apple_iphone_5s')
  //.zadd('app', 9, 'apple_iphone_5s')
  //.zadd('apple', 9, 'apple_iphone_5s')
  //.zadd('i', 9, 'apple_iphone_5s')
  //.zadd('ip', 9, 'apple_iphone_5s')
  //.zadd('iph', 9, 'apple_iphone_5s')
  //.zadd('ipho', 9, 'apple_iphone_5s')
  //.zadd('iphon', 9, 'apple_iphone_5s')
  //.zadd('iphone', 9, 'apple_iphone_5s')
  //.zadd('5', 9, 'apple_iphone_5s')
  //.zadd('5s', 9, 'apple_iphone_5s')
  //.hset('titles', 'apple_iphone_5s', 'Apple iPhone 5S')
  