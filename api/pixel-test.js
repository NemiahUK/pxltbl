var pixel = require("node-pixel");
var five = require("johnny-five");
var Raspi = require("raspi-io");

var opts = {
	length : 256
};


var board = new five.Board({
  io: new Raspi()
});

board.on("ready", function() {
    strip = new pixel.Strip({
        board: this,
        controller: "I2CBACKPACK",
	length: 253
    });

    strip.on("ready", function() {
        // do stuff with the strip here.
console.log('Ready');
	strip.off();
strip.color("#330000");
strip.show();

    });
});