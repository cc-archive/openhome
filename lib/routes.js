var async = require('async'),
    dbox = require('./dropbox'),
    conf = require('./config'),
    user = require('./user'),
    ddb = require('./db');

module.exports = function routes(app) {
  app.get('/', function(req, res) {

    // No user logged in
    if (!req.user || !req.user.email) {
      console.log("Welcome splash");
      res.render('splash', req.viewData());
    }

    // Brand new user
    else if (req.user.isNew) {
      console.log("New user");
      res.render('newuser', req.viewData());
    }

    // Returning user
    else {
      console.log("Returning user " + req.user.id);
      res.redirect('/user/' + req.user.id);
    }
  });

  app.get('/user/:id', function(req, res) {
    if (req.user.dropboxConnected) {
      var client = dbox.client(req.user.dropboxToken);
      var folder = conf.get('dropbox:openhome-folder');

      async.waterfall(
        [
          function(next) {
            client.metadata(folder, dbox.cb(next));
          },
          function(status, reply, next) {
            if (status == 404 || reply.is_deleted == true) {
              console.log("making Dropbox folder");
              client.mkdir(folder, function(status, reply) {
                next();
              });
            } else
              next();
          },
          function(next) {
            client.readdir(folder, dbox.cb(next));
          },
          function(status, files, next) {
            async.map(files, function(f, nextFile) {
              client.media(f, function(status, link) {
                nextFile(null, link);
              });
            }, next);
          }
        ],
        function(err, links) {
          var data = req.viewData();
          data.mediaFiles = links;
          res.render('home', data);
        });
      return;
    }

    //        ddb.query('Things', user.email, {}, function(err, things) {
    //          if (things.items)
    //            req.data.things = things.items;
    //        });

    res.render('home', req.viewData());
  });

  app.post('/user/save', function(req, res) {
    req.user.name = req.body.name;
    req.user.save(function() {
      res.json({status: "okay"});
    });
  });

  app.get('/connect/dropbox', function(req, res) {
    if (req.user.dropboxToken) {
      console.log("User already has a Dropbox token");
      console.log(req.user.dropboxToken);
    }
    dbox.requesttoken(function(status, tok) {
      var returl = conf.get('audience-base') + ':' + conf.get('port') +
            '/connect/dropbox/2';
      var encurl = encodeURIComponent(returl);
      req.session.dropboxReqToken = tok;
      res.redirect("https://www.dropbox.com/1/oauth/authorize?" +
                   "oauth_callback=" + encurl + "&" +
                   "oauth_token=" + tok.oauth_token);
    });
  });

  app.get('/connect/dropbox/2', function(req, res) {
    if (req.query.not_approved) {
      console.log("Dropbox access denied.");
      res.redirect('/');
      return;
    }
    if (!req.session.dropboxReqToken) {
      console.log("No Dropbox request token in session");
      res.redirect('/');
      return;
    }
    dbox.accesstoken(
      req.session.dropboxReqToken, function(status, access_token) {
        console.log("Dropbox dance complete");
        req.user.dropboxToken = access_token;
        req.user.save(function() {
          console.log("Dropbox access token saved");
          res.redirect('/');
        });
    });
  });
};
