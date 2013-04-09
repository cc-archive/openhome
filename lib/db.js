var conf = require('./config'),
    mig = require('./migrationHelper'),
    aws = require('aws-sdk');

aws.config.update({
  accessKeyId: conf.get('aws:id'),
  secretAccessKey: conf.get('aws:secret'),
  region: conf.get('aws:region')
});
var ddb = new aws.DynamoDB().client;

var types = { number: 'N',
              string: 'S',
              number_array: 'NS',
              string_array: 'SS' };

module.exports = ddb;
