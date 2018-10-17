#!/usr/bin/env bash

/vagrant/vagrant-scripts/ubuntu.sh

/vagrant/vagrant-scripts/nodejs.sh

/vagrant/vagrant-scripts/phantomjs.sh

/vagrant/vagrant-scripts/java.sh

/vagrant/vagrant-scripts/docker.sh

# Add hosts
echo "127.0.0.1 pxltbl.vm" >> /etc/hosts

# Default to app dir
echo "cd /vagrant/api" >> /home/vagrant/.bashrc
