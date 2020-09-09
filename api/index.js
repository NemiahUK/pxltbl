
const PxlTbl = require('./api.js');

const api = PxlTbl.setup({
    debugging: true,
    loop: loop,
});





function loop(api) {
    api.blank(0,0,0);
    api.setColor(0, 255, 0);
    api.setPixel(1,1);
}