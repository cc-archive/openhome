var async = require('async'),
    conf = require('../lib/config'),
    mig = require('../lib/migrationHelper'),
    ddb = require('dynamodb').ddb({
      accessKeyId: conf.get('aws:id'),
      secretAccessKey: conf.get('aws:secret')
    }),
    t = ddb.schemaTypes();

// Print out any uncaught exceptions to the console
process.addListener('uncaughtException', function(err) {
  console.error(err.stack || err);
});

exports.up = function(next) {
  async.series([
    function createThings(cb) {
      ddb.createTable('things', {hash: ['id', t.string]},
                      mig.capacity, mig.cb(cb));
    }
  ], function() { next(); });
};

exports.down = function(next) {
  async.series([
    function deleteThings(cb) {
      ddb.deleteTable('things', mig.cb(cb));
    }
  ], function() { next(); });
  next();
};
