var async = require('async'),
    conf = require('./config'),
    ddb = require('./db'),
    gravatar = require('gravatar');

// TODO: caching!

var DB = {

  // Expects property: schema
  // with value such as e.g.: {name: "string"}

  // marshall({name: "Dan"}) // native data
  // -> {name: {S: "Dan"}}   // DynamoDB data
  marshall: function (nativeData) {
    var awsData = {};
    for (var key in nativeData) {
      if (key in this.schema) {
        if ('string' == this.schema[key])
          awsData[key] = { S: nativeData[key] };
        else if ('json' == this.schema[key])
          awsData[key] = {
            S: new Buffer(JSON.stringify(nativeData[key])).toString('base64')
          };
        else if ('number' == this.schema[key])
          awsData[key] = { N: nativeData[key].toString() }; // TODO: eek
        else
          console.error("Property " + key +
                        " has unknown schema type " + this.schema[key]);
      }
    }

    return awsData;
  },

  // unmarshall({name: {S: "Dan"}}) // DynamoDB data
  // -> {name: "Dan"}               // native data
  unmarshall: function (awsData) {
    var nativeData = {};

    for (var key in awsData) {
      if (key in this.schema) {
        if ('string' == this.schema[key])
          nativeData[key] = awsData[key].S;
        else if ('json' == this.schema[key])
          nativeData[key] = JSON.parse(
            new Buffer(awsData[key].S, 'base64').toString('utf8'));
        else if ('number' == this.schema[key])
          nativeData[key] = awsData[key].N;
        else
          console.error("Property " + key +
                        " has unknown schema type " + this.schema[key]);
      }
    }

    return nativeData;
  }
};

var UserDB = Object.create(DB);
UserDB.schema = {
  id: "number",
  email: "string",
  name: "string",
  pictureUrl: "string",
  dropboxToken: "json"
};

// Looks up a user ID, and if one is not found, creates a new one
UserDB.lookupOrNewId = function(email, next) {
  if (!email) {
    next(new Error('No email given'));
    return;
  }

  async.waterfall([
    function(n) {
      UserDB.lookupId(email, n);
    },
    function(id, n) {
      if (id)
        next(null, id);
      else
        UserDB.saveEmailWithNewId(email, next);
    }
  ]);
};

// Makes a new ID and saves the email-ID mapping
UserDB.saveEmailWithNewId = function(email, next) {
  if (!email) {
    next(new Error('No email given'));
    return;
  }

  async.waterfall([
    function(n) {
      UserDB.makeNewId(n);
    },
    function(newId, n) {
      if (!newId) {
        n(new Error('No new ID to save'));
      }
      UserDB.setEmailId(email, newId, function(err, ret) {
        n(err, newId);
      });
    }
  ], function(err, newId) {
    next(err, newId);
  });
};

// Look up user ID by email
UserDB.lookupId = function(email, next) {
  if (!email) {
    next(new Error('No email given'));
    return;
  }

  ddb.getItem(
    {TableName: 'userEmails', Key: {HashKeyElement: {S: email}}},
    function(err, res) {
      if (err)
        next(err);
      else if (res && res.Item)
        next(null, res.Item.id.N);
      else
        next(null, null);
    });
};

// Make new user ID
UserDB.makeNewId = function(next) {
  // Max user id is kept under the special user id 0 in users table
  ddb.updateItem(
    {
      TableName: 'users',
      Key: { HashKeyElement: {N: '0'} },
      AttributeUpdates: { maxId: {Value: {N: '1'}, Action: 'ADD'} },
      ReturnValues: 'UPDATED_NEW'
    },
    function(err, res) {
      if (err)
        next(err);
      else if (res && res.Attributes)
        next(null, res.Attributes.maxId.N);
      else
        next();
    });
};

// Set user (email) ID to specified ID
// Returns email-id mapping object, in DB serialization format
UserDB.setEmailId = function(email, id, next) {
  if (!email || !id) {
    next(new Error('Email or id missing'));
    return;
  }
  ddb.putItem(
    {
      TableName: 'userEmails',
      Item: {
        email: {S: email},
        id: {N: id}
      }
    }, next);
};

// Load user data associated with given ID
// Returns item data, in native (not DB) format, or undefined/null
// if no object is saved in DB
UserDB.loadData = function(id, next) {
  if (!id) {
    next(new Error('No ID given'));
    return;
  }
  var udb = this;
  ddb.getItem(
    {
      TableName: 'users',
      Key: { HashKeyElement: {N: id} }
    },
    function(err, res) {
      if (res)
        next(err, udb.unmarshall(res.Item));
      else
        next(err, null);
    });
};

// Set user data to specified object
UserDB.setData = function(id, userData, next) {
  if (!userData) {
    next(new Error('User data not provided'));
    return;
  }
  userData.id = id;
  console.log("Saving user:");
  console.log(this.marshall(userData));
  ddb.putItem(
    {
      TableName: 'users',
      Item: this.marshall(userData)
    },
    function(err, res) {
      console.log("Saved user:");
      console.log(err);
      next(err, res); // XXX ?
    });
};

var User = function(email, onInit) {
  this._email = email;
  if (onInit)
    this.init(onInit);
};
User.prototype = {
  get id() { return this._id; },
  get email() { return this._email; },
  get name() { return this._data.name; },
  set name(value) { this._data.name = value; },
  get pictureUrl() {
    if (this._data && this._data.pictureUrl)
      return this._data.pictureUrl;
    else if (this.email)
      return gravatar.url(this.email, {s: '300', r: 'x', d: 'retro'}, true);
    else
      return null; // XXX - something else?
  },
  set pictureUrl(value) { this._data.pictureUrl = value; },

  get dropboxConnected() { return this.dropboxToken? true : false; },
  get dropboxToken() { return this._data.dropboxToken; },
  set dropboxToken(value) { this._data.dropboxToken = value; },
  get userData() {
    for (var prop in this._data) {
      if (this._data.hasOwnProperty(prop)) return true;
    }
    return false; // if this._data is {}, or other falsey value
  },
  get isNew() {
    if (this._data && (Object.keys(this._data).length > 0))
      return false;
    return true;
  },

  init: function(onComplete) {
    var user = this;
    async.waterfall([
      function(next) {
        UserDB.lookupOrNewId(user.email, next);
      },
      function(id, next) {
        user._id = id;
        UserDB.loadData(id, next);
      }
    ], function(err, data) {
      if (err)
        console.error(err); // XXX - and return immediately?
      user._data = (data || {});
      onComplete();
    });
  },

  viewData: function() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      pictureUrl: this.pictureUrl,
      dropboxConnected: this.dropboxConnected,
      userData: this.userData
    };
  },

  save: function(next) {
    UserDB.setData(this.id, this._data, next);
  }
};

exports.loadUser = function(req, res, nextMW) {
  req.user = new User(req.session.email, nextMW);
};
