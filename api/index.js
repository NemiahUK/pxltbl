
const PxlTbl = require('./api.js');

const api = PxlTbl.setup({
    debugging: true,
    consoleData: false,
    loop: loop,
});





function loop() {
    api.blank(255,0,0);
    api.debug('message');
    api.shutdown();
    //api.setColor(0, 255, 0);
    //api.setPixel(1,1);
}