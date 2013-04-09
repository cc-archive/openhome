CC OpenHome
===========

CC OpenHome is a small node.js application that hosts metadata for academic
works (papers, etc) and allows scholars to generate beautiful, simple
homepages they can link to or embed into other pages.

Installation
------------

First install dependencies:

    npm install

Then follow the **required configuration** section below. Once you've done
that, just start it up:

    node .

Configuration
-------------

Config settings are set in the following locations, in order of precedence:

1. Env vars

* PORT: set this to the desired port to have the server listen on.

2. Local config file

Default location: `config.json`

Not in version control. This file is where you should store any local settings
or (importantly) secret keys. See "Required configuration" below.

3. Default config file

Default location: ``config-defaults.json`

Check out this file to see all the config settings you can tweak.

Required configuration
----------------------

You need to create a local config file, `config/local.json`, with a few
secrets. You can override any settings you like in this file, but in
particular you need to set the audience-base (the audience minus the port,
which gets automatically appended) and secrets as in the example below:

File: `config/local.json`

    {
        "audience-base": "http://my-server.org",
        "client-sessions-secret": "really long random string here",
        "aws": {
            "id": "Amazon Web Services ID",
            "secret": "Amazon Web Services secret key"
        },
        "dropbox": {
            "key": "Dropbox app key",
            "secret": "Dropbox app secret"
        }
    }

Hacking
-------

In addition to the standard dependencies, [awsbox][] is useful for deploying
to AWS, and [forever][] is great for hacking without having to manually
restart the server all the time:

    [sudo] npm install -g forever
    forever -w index.js

Have fun!

[awsbox]: "https://github.com/mozilla/awsbox"
[forever]: "https://github.com/nodejitsu/forever"
