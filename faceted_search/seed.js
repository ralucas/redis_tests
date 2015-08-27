var Q = require('q');
var _ = require('lodash');

var searchTerms = [{
    name: "Apple iPhone 5S",
    os: "iOs",
    manufacturer: "Apple",
    sim: "Single"
  }, {
    name: "Apple iPhone 5C",
    os: "iOs",
    manufacturer: "Apple",
    sim: "Single"
  }, {
    name: "Samsung Galaxy Note 3",
    os: "Android",
    manufacturer: "Samsung",
    sim: "Single"
  }, {
    name: "Samsung Galaxy Nexus",
    os: "Android",
    manufacturer: "Samsung",
    sim: "Single"
  }, {
    name: "Samsung Wave 3",
    os: "Bada",
    manufacturer: "Samsung",
    sim: "Single"
  }];

module.exports = function(client) {

  client.flushdb();

  var createStatements = function(terms) {
    var multiAdd = [];
    var deferred = Q.defer();

    terms.forEach(function(term, idx) {
      var phone = 'phone:' + (idx + 1);
      multiAdd.push(['hmset', phone, 'title', term.name]);
      _.each(term, function(val, key) {
        if (key !== 'name') {
          multiAdd.push(['sadd', key.toUpperCase() + ':' + val, phone]);
        }
      });
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

