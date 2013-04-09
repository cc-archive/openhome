var conf = require('./config'),
    ddb = require('dynamodb').ddb({
      accessKeyId: conf.get('aws:id'),
      secretAccessKey: conf.get('aws:secret')
    });

var mig = {};

mig.capacity = { read: conf.get('aws:read-capacity'),
                write: conf.get('aws:write-capacity') };

// standard db callback - handy with async.series()
mig.cb = function(next) {
  return function(err, res) {
    if(err)
      throw err;
    next(err, res);
  };
};

module.exports = mig;
