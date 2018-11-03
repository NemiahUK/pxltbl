const fs = require('fs');
const api = require('./api.js');




var screen = 'home';

var path = './progs';
var progs = [];
var gotProgs = false;
var gettingProgs = false;
var curProg = 0;
var scroll = 0.0;

var btnDownPressed;
var btnUpPressed;

var prog;


    api.start({
        callbackLoop: loop,
        fpsLimit: 30,
        consoleData: false
    });








function loop() {




    if(api.goHome) {
        screen = 'home';
        api.goHome = false;
        api.clearInputs();
        api.fpsLimit = 30;
        api.setRotation(0);
    }

    switch(screen) {
        case 'home':
            home();
            break;
        case 'err':
            err();
            break;
        case 'settings':
            settings();
            break;
        case 'brightness':
            brightness();
            break;
        case 'prog':
            try {
                prog.loop(api);
            } catch (err) {
                screen = 'err';
                api.error(err);
            }
            break;
    }

}




function home() {

    if(!gotProgs && !gettingProgs) {
        gettingProgs = true;
        progs = [];
        fs.readdir(path, function(err, items) {


            for (var i=0; i<items.length; i++) {
                progs.push(items[i].substr(0,items[i].length-3));

            }
            progs.push('Settings');
            scroll = api.pxlW;
            if (curProg >= progs.length) curProg = 0;
            gettingProgs = false;
            gotProgs = true;
        });
    }

    if(gotProgs) {
        if ((api.buttons.bottom) && !btnDownPressed) {
            curProg++;
            scroll = api.pxlW;
            if (curProg >= progs.length) curProg = 0;
            btnDownPressed = true;
        }

        if ((api.buttons.top) && !btnUpPressed) {
            curProg--;
            scroll = api.pxlW;
            if (curProg < 0) curProg = progs.length - 1;
            btnUpPressed = true;
        }

        if (!api.buttons.bottom) btnDownPressed = false;
        if (!api.buttons.top) btnUpPressed = false;


        if (api.buttons.left || api.buttons.right) {
            if (curProg == progs.length - 1) {
                api.clearInputs();
                scroll = api.pxlW;
                gotProgs = false;
                screen = 'settings';
                return;
            } else {
                screen = 'prog';
                loadProg(progs[curProg]);
                api.clearInputs();
                gotProgs = false;
                return;
            }
        }


        api.setColor(255, 255, 0);
        api.fillBox(1, 1, 3, 4);
        api.setPixel(2, 0);
        api.setPixel(0, 2);
        api.setPixel(4, 2);
        api.setColor(0, 0, 0);
        api.setPixel(2, 4);

        api.setColor(255, 255, 255);

        if (progs.length) {
            api.blank(0, 0, 0);
            if (curProg == progs.length - 1) api.setColor(50, 0, 255);
            var txtSize = api.text(progs[curProg], Math.round(scroll), 1);
            scroll = scroll - 1;
            if (scroll < -txtSize.w) scroll = api.pxlW; //TODO add text bounds to api then use that to calc length
        }
    }

}

var errStart = false;
function err() {
    if(errStart === false) {
        errStart = api.millis;
        api.playWav('looser');
    }
    if(api.millis - errStart > 3000) {
        errStart = false;
        api.goHome = true;
    }
    api.blank(50,0,0);
    api.setColor(255,0,0);
    api.text('Err',3,2);
}

function settings() {

    if(api.buttons.bottomLeft && !btnDownPressed) {
        //no other menu items yet

        btnDownPressed = true;
    }

    if(api.buttons.rightBottom) {
        //only one thing to do
        api.clearInputs();
        screen = 'brightness';
        return;
    }

    if(!api.buttons.bottomLeft) btnDownPressed = false;


    api.blank(0,0,0);
    api.setColor(50,0,255);
    var txtSize=api.text('Brightness',Math.round(scroll),1);
    scroll = scroll - 0.7;
    if (scroll < -txtSize.w) scroll = api.pxlW;

}

function brightness() {
    var step = 4;
    if(api.buttons.leftBottom && api.brightness > 1+step) api.brightness-=step;
    if(api.buttons.rightBottom && api.brightness < 255-step ) api.brightness+=step;

    api.blank(255,255,255);
    api.setColor(50,0,255);
    api.fillBox(0,10,api.brightness/10,1);

}

function loadProg(file) {
    purgeCache(path+'/'+file+'.js');
    prog = require(path+'/'+file+'.js');
    try {
        prog.setup(api);
    } catch (err) {
        screen = 'err';
    }

}



/**
 * Removes a module from the cache
 */
function purgeCache(moduleName) {
    // Traverse the cache looking for the files
    // loaded by the specified module name
    searchCache(moduleName, function (mod) {
        delete require.cache[mod.id];
    });

    // Remove cached paths to the module.
    // Thanks to @bentael for pointing this out.
    Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
        if (cacheKey.indexOf(moduleName)>0) {
            delete module.constructor._pathCache[cacheKey];
        }
    });
};

/**
 * Traverses the cache to search for all the cached
 * files of the specified module name
 */
function searchCache(moduleName, callback) {
    // Resolve the module identified by the specified name
    var mod = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    // the cache
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function traverse(mod) {
            // Go over each of the module's children and
            // traverse them
            mod.children.forEach(function (child) {
                traverse(child);
            });

            // Call the specified callback providing the
            // found cached module
            callback(mod);
        }(mod));
    }
};