var conf = require('./config'),
    ddb = require('./db'),
    gravatar = require('gravatar');

// Custom middleware

var mw = {};

// For running middleware on all paths except a few
mw.filter = function(mw, filter) {
  return function(req, res, next) {
    var found = false;
    filter.forEach(function (f) {
      if (req.path.indexOf(f) == 0)
        found = true;
    });
    if (found)
      next();
    else
      mw(req, res, next);
  };
};

// Sets req.data which other middleware adds to and eventually is
// passed into view
mw.viewData = function(req, res, next) {
  req.viewData = function() {
    return {
      csrfToken: req.session._csrf,
      user: req.user.viewData()
    }
  };
  next();
};

module.exports = mw;
