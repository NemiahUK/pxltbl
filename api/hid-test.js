var HID = require('node-hid');
var devices = HID.devices();

var touchPanel = new HID.HID('/dev/hidraw1');

let points = Array(10);

console.log('devices:',devices);

setInterval(showPoints,100);

touchPanel.on("data", function(data) {
    for (let point = 0; point < 10; point++) {
        if (data[1 + point * 10] === 7) {
            points[point] = data.slice(point + 2, point + 11);
        } else {
            points[point] = undefined;
        }
    }
});

function showPoints() {
    console.clear();
    for (let point = 0; point < 10; point++) {
        if (points[point] !== undefined) {
            const x = points[point][0] | (points[point][1] << 8);
            const y = points[point][2] | (points[point][3] << 8);

            console.log('Point '+point+' X:' + x + ' Y:' + y);
        }
    }
}