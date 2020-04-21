var HID = require('node-hid');
var devices = HID.devices();


console.log(devices);




const touchPanel = new HID.HID('/dev/hidraw0');

touchPanel.on('data',readTouch);



function readTouch(data) {

    console.log(data);

    for (let point = 0; point < 10; point++) {
        if (data[1 + point * 10] === 7) {
            const thisPoint = data.slice(point*10 + 2, point*10 + 11);
            //console.log(thisPoint);




        }
    }




}