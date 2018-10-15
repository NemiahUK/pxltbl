

const api = require('./api.js');







    api.start({
        callbackLoop: loop,
        callbackButton: buttonPress,
        fpsLimit: 30
    });










t = 23;

function loop() {

    api.setColor(60,0,100);
    api.blank(0,0,0);
    api.text('Hey guys, how\'s it going? £300  {code}  "oh yeah"',t,0,0,100,0,1);



}



function buttonPress(button){

    //console.log(button);
    switch(button) {
        case 'up':

            break;
        case 'down':

            break;
        case 'left':
            t--;

            break;
        case 'right':
            t++;
            break;
        case 'space':

            break;
    }


}