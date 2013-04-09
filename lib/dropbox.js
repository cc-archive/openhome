var dbox = require("dbox"),
    conf = require('./config');

var app = dbox.app({
  "app_key": conf.get('dropbox:key'),
  "app_secret": conf.get('dropbox:secret'),
  "root": conf.get('dropbox:root')
});

// helper for async.js, etc which use "errno"-style convention (first
// arg null if no errors)
app.cb = function(func) {
  return function(status, reply) { func(null, status, reply); };
};


module.exports = app;
