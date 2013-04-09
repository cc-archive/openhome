var config = require('nconf');

// Load config settings. Priority is:
// 1. Env vars ('PORT', 'CONFIG')
// 2. ./config-local.json
// 3. ./config-prod.json (if NODE_ENV == production)
// 4. ./config.json

var defaultConfig = __dirname + '/../config/';
config.overrides({ port: process.env['PORT'],
                   config: { local: process.env['CONFIG'] ||
                             defaultConfig + 'local.json' }});
config.file('local', { file: config.get('config:local') });
if ('production' == process.env['NODE_ENV'])
  config.file('prod', { file: defaultConfig + 'prod.json' });
config.file('default', { file: defaultConfig + 'default.json' });

module.exports = config;
