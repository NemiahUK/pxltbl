const PxlTbl = require('./api.js');
const fs = require('fs');
const loudness = require('loudness');

let screen = 'home';

const path = './progs';
let progs = [];
let gotProgs = false;
let gettingProgs = false;
let curProg = 0;

let textScroll = 0.0;
let preTextScroll = 0.0;
let menuScroll = 0.0;

let btnDownPressed = false;
let btnUpPressed = false;

let prog;


const api = PxlTbl.setup({
    consoleDisplay: false,
    debugging: true,
    loop: loop,
    fpsLimit: 30
});





function loop() {

    if(api.getGoHome()) {
        screen = 'home';
        api.goneHome();
        api.clearInputs();
        api.setFpsLimit(30);
        api.setOrientation(0);
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
        case 'volume':
            volume();
            break;
        case 'brightness':
            brightness();
            break;
        case 'ip':
            ip();
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

            for (let i = 0; i < items.length; i++) {

                try {
                    if (fs.existsSync(path + '/' + items[i] + '/main.js')) {
                        progs.push(items[i])
                    }
                } catch(err) {
                    console.error(err)
                }
            }

            progs.push('Settings');
            textScroll = 0;
            preTextScroll = api.getScreenWidth();
            if (curProg >= progs.length) curProg = 0;
            gettingProgs = false;
            gotProgs = true;
        });
    }

    if(gotProgs) {
        const touches = api.getTouch();
        const buttons = api.getButtons();

        let touchDown, touchUp, touchEnter;

        if(touches.length) {


            for (let i = 0; i < touches.length; i++) {
                touchUp = touches[0].y < 4;
                touchDown = touches[0].y > 14;
                touchEnter = touches[0].y > 4 && touches[0].y < 14;
            }
        }

        if ((buttons.bottom || touchDown) && !btnDownPressed) {
            curProg++;
            textScroll = 0;
            preTextScroll = api.getScreenWidth();
            if (curProg >= progs.length) curProg = progs.length-1;
            btnDownPressed = true;
        }

        if ((buttons.top || touchUp) && !btnUpPressed) {
            curProg--;
            textScroll = 0;
            preTextScroll = api.getScreenWidth();
            if (curProg < 0) curProg = 0;
            btnUpPressed = true;
        }

        if (!buttons.bottom && !touchDown) btnDownPressed = false;
        if (!buttons.top && !touchUp) btnUpPressed = false;


        if (buttons.left || buttons.right || touchEnter) {
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


        api.setDrawColor(255, 255, 0);
        api.fillBox(1, 1, 3, 4);
        api.setPixel(2, 0);
        api.setPixel(0, 2);
        api.setPixel(4, 2);
        api.setDrawColor(0, 0, 0);
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
                api.setDrawColor(100, 100, 100);


                if(i === curProg) {
                    api.setDrawColor(0, 255, 255);
                    const textSize = api.text(progs[i], -100,0);
                    let textPos = 0;
                    if(textSize.w > api.getScreenWidth()) textPos = Math.round(textScroll);
                    api.text(progs[i], textPos, i*10 + menuScroll + api.getScreenHeight()/2 - 5);
                    if (textScroll < 0 - textSize.w) textScroll = api.getScreenWidth();
                } else {
                    api.text(progs[i], 0, i*10 + menuScroll + api.getScreenHeight()/2 - 5);
                }


            }
            if (curProg === progs.length - 1) api.setDrawColor(50, 0, 255);

        }

        /*  green rotation arrows - maybe have diagonal opposite corners or somethign instead?
        api.setDrawColor(0,255,0,0.2);

        api.fillBox(api.getScreenWidth()/2-2,api.getScreenHeight()-1,4,1);
        api.fillBox(api.getScreenWidth()/2-1,api.getScreenHeight()-2,2,1);

        api.fillBox(api.getScreenWidth()/2-2,0,4,1);
        api.fillBox(api.getScreenWidth()/2-1,1,2,1);

        api.fillBox(0,api.getScreenHeight()/2-2,1,4);
        api.fillBox(1,api.getScreenHeight()/2-1,1,2);

        api.fillBox(api.getScreenWidth()-1,api.getScreenHeight()/2-2,1,4);
        api.fillBox(api.getScreenWidth()-2,api.getScreenHeight()/2-1,1,2);
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
    api.setDrawColor(255,0,0);
    api.text('Err',3,2);
}


const settingsMenu = [
    'Volume',
    'Brightness',
    'IP'
]
let curSetting = 0;
let gotSettings = false;

function settings() {
    if (!gotSettings) {

        textScroll = 0;
        preTextScroll = api.getScreenWidth();
        curSetting = 0;

        gotSettings = true;
    }

    const touches = api.getTouch();
    const buttons = api.getButtons();

    let touchDown, touchUp, touchEnter;

    if (touches.length) {
        for (let i = 0; i < touches.length; i++) {
            touchUp = touches[0].y < 4;
            touchDown = touches[0].y > 14;
            touchEnter = touches[0].y > 4 && touches[0].y < 14;
        }
    }

    if ((buttons.bottom || touchDown) && !btnDownPressed) {

        curSetting++;
        textScroll = 0;
        preTextScroll = api.getScreenWidth();
        if (curSetting >= settingsMenu.length) curSetting = settingsMenu.length - 1;
        btnDownPressed = true;
    }

    if ((buttons.top || touchUp) && !btnUpPressed) {

        curSetting--;
        textScroll = 0;
        preTextScroll = api.getScreenWidth();
        if (curSetting < 0) curSetting = 0;
        btnUpPressed = true;
    }

    if (!buttons.bottom && !touchDown) btnDownPressed = false;
    if (!buttons.top && !touchUp) btnUpPressed = false;

    if (buttons.left || buttons.right || touchEnter) {
        api.clearInputs();
        textScroll = 0;

        screen = settingsMenu[curSetting].toLowerCase();
        return;
    }

    // Display the settingsMenu list now that it's filled with our settings
    // Refactor this into it's own function as it's used multiple times
    api.setDrawColor(255, 255, 0);
    api.fillBox(1, 1, 3, 4);
    api.setPixel(2, 0);
    api.setPixel(0, 2);
    api.setPixel(4, 2);
    api.setDrawColor(0, 0, 0);
    api.setPixel(2, 4);

    if (settingsMenu.length) {
        api.blank(0, 0, 0);

        if (menuScroll > curSetting * -10) menuScroll--;
        if (menuScroll < curSetting * -10) menuScroll++;
        if (preTextScroll > 0) {
            preTextScroll--;
        } else {
            textScroll--;
        }
        for (let i = 0; i < settingsMenu.length; i++) {
            api.setDrawColor(100, 100, 100);

            if (i === curSetting) {
                api.setDrawColor(0, 255, 255);
                const textSize = api.text(settingsMenu[i], -100, 0);
                let textPos = 0;
                if (textSize.w > api.getScreenWidth()) textPos = Math.round(textScroll);
                api.text(settingsMenu[i], textPos, i * 10 + menuScroll + api.getScreenHeight() / 2 - 5);
                if (textScroll < 0 - textSize.w) textScroll = api.getScreenWidth();
            } else {
                api.text(settingsMenu[i], 0, i * 10 + menuScroll + api.getScreenHeight() / 2 - 5);
            }
        }
        if (curSetting === settingsMenu.length - 1) api.setDrawColor(50, 0, 255);
    }
}



async function volume() {
    const step = 100 / api.getScreenWidth();
    const curVol = await loudness.getVolume()
    let setVol = curVol;
    const maxVol = 100;
    const minVol = 0;
    const oldVol = curVol;

    let barWidthPercent = curVol / maxVol;
    let barWidth = Math.round(api.getScreenWidth() * barWidthPercent);

    const buttons = api.getButtons();

    if(buttons.leftBottom) {
        setVol = curVol - step;
        setVol = Math.max(setVol, minVol);
        --barWidth;
        barWidth = Math.max(barWidth, 0);
    }

    if(buttons.rightBottom) {
        setVol = curVol + step;
        setVol = Math.min(setVol, maxVol);
        ++barWidth;
        barWidth = Math.min(barWidth, api.getScreenWidth())
    }

    if (setVol !== oldVol) {
        loudness.setVolume(setVol)
    }


    api.blank(255,255,255);
    api.setDrawColor(255,0,55);
    api.fillBox(0,0, barWidth, api.getScreenHeight());
}

function brightness() {
    const step = 4;
    const buttons = api.getButtons();

    if(buttons.leftBottom)
    {
        api.brightness-=step;
    }

    if(buttons.rightBottom) {
        api.brightness += step;
    }

    api.blank(255,255,255);
    api.setDrawColor(50,0,255);
    api.fillBox(0,0,api.brightness/10, api.getScreenHeight());
}

function ip() {
    const _interfaces = require('os').networkInterfaces();

    let foundIp = false;
    let ip = "0.0.0.0";

    for (let _deviceName in _interfaces) {
        let _interface = _interfaces[_deviceName];

        for (let i = 0; i < _interface.length; i++) {
            let alias = _interface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                ip = alias.address;
                foundIp = true;

                break;
            }

            if (foundIp) break;
        }

        if (foundIp) break;
    }


    api.blank(0,0,0);
    api.setDrawColor(0,255,255);


    if(preTextScroll > 0) {
        preTextScroll--;
    } else {
        textScroll--;
    }

    const textSize = api.text(ip, -100,0);
    let textPos = 0;
    if(textSize.w > api.getScreenWidth()) textPos = Math.round(textScroll);
    api.text(ip, textPos, api.getScreenHeight()/2 -3);
    if (textScroll < 0 - textSize.w) textScroll = api.getScreenWidth();
}

function loadProg(file) {
    purgeCache(path+'/'+file+'/main.js');
    prog = require(path+'/'+file+'/main.js');
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