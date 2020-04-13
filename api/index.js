const fs = require('fs');
const api = require('./api.js');




var screen = 'home';

var path = './progs';
var progs = [];
var gotProgs = false;
var gettingProgs = false;
var curProg = 0;
var textScroll = 0.0;
var preTextScroll = 0.0;
var menuScroll = 0.0;

var btnDownPressed;
var btnUpPressed;

var prog;


    api.start({
        callbackLoop: loop,
        fpsLimit: 30,
        consoleData: true
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
            textScroll = 0;
            preTextScroll = api.pxlW;
            if (curProg >= progs.length) curProg = 0;
            gettingProgs = false;
            gotProgs = true;
        });
    }

    if(gotProgs) {
        const touches = api.getTouch();
        let touchDown, touchUp, touchEnter;

        if(touches.length) {


            for (let i = 0; i < touches.length; i++) {
                    touchUp = touches[0].y < 4;
                    touchDown = touches[0].y > 14;
                    touchEnter = touches[0].y > 4 && touches[0].y < 14;
            }
        }

        if ((api.buttons.bottom || touchDown) && !btnDownPressed) {
            curProg++;
            textScroll = 0;
            preTextScroll = api.pxlW;
            if (curProg >= progs.length) curProg = progs.length-1;
            btnDownPressed = true;
        }

        if ((api.buttons.top || touchUp) && !btnUpPressed) {
            curProg--;
            textScroll = 0;
            preTextScroll = api.pxlW;
            if (curProg < 0) curProg = 0;
            btnUpPressed = true;
        }

        if (!api.buttons.bottom && !touchDown) btnDownPressed = false;
        if (!api.buttons.top && !touchUp) btnUpPressed = false;


        if (api.buttons.left || api.buttons.right || touchEnter) {
            if (curProg === progs.length - 1) {
                api.clearInputs();
                textScroll = 0;
                gotProgs = false;
                screen = 'settings';
                return;
            } else {
                screen = 'prog';
                api.clearInputs();
                loadProg(progs[curProg]);
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



        if (progs.length) {
            api.blank(0, 0, 0);

            if(menuScroll > curProg * -10) menuScroll--;
            if(menuScroll < curProg * -10) menuScroll++;
            if(preTextScroll > 0) {
                preTextScroll--;
            } else {
                textScroll--;
            }
            for(let i=0;i < progs.length;i++) {
                api.setColor(100, 100, 100);


                if(i === curProg) {
                    api.setColor(0, 255, 255);
                    const textSize = api.text(progs[i], -100,0);
                    let textPos = 0;
                    if(textSize.w > api.pxlW) textPos = Math.round(textScroll);
                    api.text(progs[i], textPos, i*10 + menuScroll + api.pxlH/2 - 5);
                    if (textScroll < 0 - textSize.w) textScroll = api.pxlW;
                } else {
                    api.text(progs[i], 0, i*10 + menuScroll + api.pxlH/2 - 5);
                }


            }
            if (curProg === progs.length - 1) api.setColor(50, 0, 255);

        }

        /*  green rotation arrows - maybe have diagonal opposite corners or somethign instead?
        api.setColor(0,255,0,0.2);

        api.fillBox(api.pxlW/2-2,api.pxlH-1,4,1);
        api.fillBox(api.pxlW/2-1,api.pxlH-2,2,1);

        api.fillBox(api.pxlW/2-2,0,4,1);
        api.fillBox(api.pxlW/2-1,1,2,1);

        api.fillBox(0,api.pxlH/2-2,1,4);
        api.fillBox(1,api.pxlH/2-1,1,2);

        api.fillBox(api.pxlW-1,api.pxlH/2-2,1,4);
        api.fillBox(api.pxlW-2,api.pxlH/2-1,1,2);
        */
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
    var txtSize=api.text('Brightness',Math.round(textScroll),1);
    textScroll = textScroll - 0.7;
    if (textScroll < -txtSize.w) textScroll = api.pxlW;

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
}

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
}