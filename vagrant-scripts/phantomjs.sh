#!/usr/bin/env bash

# A hack needed to install phantomjs globally with the latest version of npm. We then have to
# install phantomjs-prebuilt as the ubuntu user. TODO: remove all the extra stuff here after
# npm/phantomjs figure out the best process.
chown -R ubuntu /usr/lib/node_modules
# Install a more recent version of phantomjs for our selenium testing
sudo -u ubuntu npm install -g phantomjs-prebuilt
