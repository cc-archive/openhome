var async = require('async'),
    conf = require('../lib/config'),
    mig = require('../lib/migrationHelper'),
    ddb = require('dynamodb').ddb({
      accessKeyId: conf.get('aws:id'),
      secretAccessKey: conf.get('aws:secret')
    }),
    t = ddb.schemaTypes();

var db = {};

exports.up = function(next) {
  async.series([
    function createUsers(cb) {
      ddb.createTable('users', {hash: ['id', t.number]},
                      mig.capacity, mig.cb(cb));
    },
    function waitForUsers(cb) {
      var ok = false;
      async.until(
        function() { return ok; },
        function(tick) {
          setTimeout(function() {
            ddb.describeTable('users', function(err, res) {
              if (res && res.TableStatus != "CREATING")
                ok = true;
              tick();
            });
          }, 1000);
        }, cb);
    },
    function createUserZero(cb) {
      ddb.putItem('users', {id: 0, maxId:0}, {}, mig.cb(cb));
    },
    function createEmailIndex(cb) {
      ddb.createTable('userEmails', {hash: ['email', t.string]},
                      mig.capacity, mig.cb(cb));
    }
  ], function() { next(); });
};

exports.down = function(next) {
  async.series([
    function deleteUsers(cb) {
      ddb.deleteTable('users', mig.cb(cb));
    },
    function deleteEmailIndex(cb) {
      ddb.deleteTable('userEmails', mig.cb(cb));
    }
  ], function() { next(); });
};
