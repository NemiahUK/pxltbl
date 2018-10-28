# Getting Started
#### A quick guide to setting up Pixel Table on your PC and creating your first prog.

If you just want to use the web-based emulator instead of building your own Pixel Table, then this is the guide for you.

Pixel Table is designed to run on a Raspberry Pi 3+, but it should run on any platform that Node supports. We've tested it on Windows 10.

* Check to see if Node is already installed by typing `node -v` into the console
* If needed, Install Node.js you want the LTS version (currently 8.12.0) https://nodejs.org/en/download/ or 
in Ubuntu you can run the following command in terminal to install automatically `curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash - sudo apt-get install -y nodejs` 
* *EITHER* install git (if needed) the clone the repo by typing  `git clone https://github.com/TmpR/pxltbl.git`
* *OR* Download the zip file from https://github.com/TmpR/pxltbl/archive/master.zip and extract it
* Navigate to the project directory and enter the sub-folder `api/` 
* Type `npm install`
* To run the app type `node index.js`
* Visit http://127.0.0.1:3000 in your browser

## Adding your own progs

* Navigate to the subfolder `progs/`
* Copy the `hello-world.js` file to `your-prog.js` create your own prog.

See https://github.com/TmpR/pxltbl/blob/master/docs/api-reference.md for more info on how to use the API.
