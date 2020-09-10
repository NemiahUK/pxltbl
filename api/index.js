
const PxlTbl = require('./api.js');

const api = PxlTbl.setup({
    consoleData: false,
    loop: loop,
});





function loop() {
    api.blank(255,0,0);
    console.log(api);
    api.shutdown();
    //api.setColor(0, 255, 0);
    //api.setPixel(1,1);



    api.shutdown();
}