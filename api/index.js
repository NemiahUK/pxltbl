const fs = require('fs');
const api = require('./api.js');







    api.start({
        callbackLoop: loop,
        fpsLimit: 30
    });







var screen = 'home';


function loop() {

    if(api.goHome) {
        screen = 'home';
        api.goHome = false;
        api.clearInputs();
    }

    switch(screen) {
        case 'home':
            home();
            break;
        case 'prog':
            try {
                prog.loop(api);
            } catch (err) {
                screen = 'home';
            }
            break;
    }

}


var path = './progs'
var progs = [];
var gotProgs = false;
var curProg = 0;
var scroll = 0.0;

var btnDownPressed;
var btnFirePressed;

var prog;

function home() {



    if(!gotProgs) {
        gotProgs = true;
        fs.readdir(path, function(err, items) {

            for (var i=0; i<items.length; i++) {
                progs.push(items[i].substr(0,items[i].length-3));

            }
            scroll = 23;
        });
    }


    if(api.buttons.down && !btnDownPressed) {
        curProg++;
        scroll = 23;
        if(curProg >= progs.length) curProg = 0;
        btnDownPressed = true;
    }

    if(api.buttons.fire && !btnFirePressed) {
        loadProg(progs[curProg]);
        api.clearInputs();
        screen = 'prog';
        return;
    }

    if(!api.buttons.down) btnDownPressed = false;
    if(!api.buttons.fire) btnFirePressed = false;






    api.setColor(100,100,0);
    api.fillBox(1,1,3,4);
    api.setPixel(2,0);
    api.setPixel(0,2);
    api.setPixel(4,2);
    api.setColor(0,0,0);
    api.setPixel(2,4);

    api.setColor(100,100,100);

    if(progs.length) {
        api.blank(0,0,0);
        api.text(progs[curProg],Math.round(scroll),1);
        scroll = scroll - 0.7;
        if (scroll < -60) scroll = 23; //TODO add text bounds to api then use that to calc length
    }


}

function loadProg(file) {
    //console.log(file);
    prog = require(path+'/'+file+'.js');
}