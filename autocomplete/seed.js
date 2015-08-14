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

    terms.forEach(function(term, termIdx) {
      var words = term.name.toLowerCase().split(' '); 
      var key = words.join('_');
      var builtDest = words[0];
      var cachedIdx = 0;

      words.forEach(function(word, wordIdx) {
        var len = word.length,
            builtWord = '',
            i = 0;

        if (wordIdx > cachedIdx) {
          builtDest += '_';
          cachedIdx++;
        }

        for (i; i < len; i += 1) {
          builtWord += word[i];
          multiAdd.push(['zadd', builtWord, term.popularity, key]);
          if (wordIdx > 0) {
            builtDest += word[i]; 
            var zinterBeg = ['zinterstore', builtDest, wordIdx + 1];
            var termsArr = builtDest.split('_'); 
            var zinterCmd = zinterBeg.concat(termsArr).concat(['aggregate', 'max']); 
            multiAdd.push(zinterCmd);
          }
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
         console.log('Seeding results: ', results);
      });
    }).fail(function(err) {
      console.error(err);
    });
};

