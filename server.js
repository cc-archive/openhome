var express = require('express'),
    hbs = require('express-hbs'),
    clientSessions = require('client-sessions'),
    conf = require('./lib/config'),
    mw = require('./lib/middleware'),
    user = require('./lib/user'),
    app = express();

// Print out any uncaught exceptions to the console
process.addListener('uncaughtException', function(err) {
  console.error(err.stack || err);
});

// Set up handlebar engine & paths, set .hbs as default extension
app.engine('hbs', hbs.express3({
  partialsDir: __dirname + '/views/partials',
  layoutsDir: __dirname + '/views/layouts'
}));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

// Middleware

// Static files (at top to skip other middleware)
app.use(express.static(__dirname + '/static'))
  .use(express.bodyParser())
// Client sessions: set secret to a lage random string in config-local.json
  .use(clientSessions({ secret: conf.get('client-sessions-secret') }))
// sets session._csrf and requires it to match in POST bodies
  .use(express.csrf())
// Log requests (but not the routes defined by MW above)
  .use(express.logger())
// note: mw.filter runs middleware on all paths except the ones given
// mw.viewData adds a req.data hash to hang all data passed on to view
  .use(mw.filter(mw.viewData, ['/persona']))
// Load user data from db for logged in user
  .use(mw.filter(user.loadUser, ['/persona']));

// Adds /persona/verify, /persona/logout routes, also adds
// session.email when logged in
// Note: must be below all middleware since it adds routes and causes
// router to be installed
var aud = conf.get('audience-base')
if (conf.get('audience-with-port'))
  aud += ':' + conf.get('port');
console.log("Audience: " + aud);
require("express-persona")(app, { audience: aud });

// Install application routes
require('./lib/routes')(app);

// Start server
console.log("Server running on port " + conf.get('port'));
app.listen(conf.get('port'), '0.0.0.0');
