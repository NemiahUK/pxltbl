
const PxlTbl = require('./api.js');

const api = PxlTbl.setup({
    consoleData: true,
    debugging: true,
    loop: loop,
});





function loop() {
    api.blank(255,0,128);
    //api.setColor(0, 255, 0);
    //api.setPixel(1,1);
}