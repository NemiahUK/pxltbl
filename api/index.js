
const PxlTbl = require('./api.js');

const api = PxlTbl.setup({
    consoleDisplay: false,
    debugging: true,
    loop: loop,
    fpsLimit: 30
});





function loop() {
    api.blank(255,0,128);

    api.setDrawColor(0, 255, 0);
    //api.fillBox(2,2,5,5);

    api.text('Test!', 5, 5)

    api.beep();

    // const context = new AudioContext()
    // const o = context.createOscillator()
    // const  g = context.createGain()
    // o.connect(g)
    // g.connect(context.destination)
    // o.start(0)
    //
    // g.gain.exponentialRampToValueAtTime(
    //     0.00001, context.currentTime + 0.04
    // )
}