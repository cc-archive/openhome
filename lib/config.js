var config = require('nconf');

// Load config settings. Priority is:
// 1. Select env vars ('PORT')
// 2. config.json
// 4. config-defaults.json

config
  .overrides({ port: process.env['PORT'] })
  .file('local', { file: __dirname + '/../config.json' })
  .file('default', { file: __dirname + '/../config-defaults.json' });

module.exports = config;
