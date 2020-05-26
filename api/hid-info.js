var HID = require('node-hid');
var devices = HID.devices();


console.log(devices);



const lastDevice = devices.pop();
const touchPanel = new HID.HID(lastDevice.path);


touchPanel.on('data',readTouch);

const touchParams = {
    touchPacketSize: 8,
    numPoints: 10,
    checkValue: 0x30,
    checkPos: 7,
    coordPos: 3,
    maxX: 4096,
    maxY: 4096
};

function readTouch(data) {

    console.log(data);

    for (let point = 0; point < 10; point++) {

        if(data[point*touchParams.touchPacketSize+touchParams.checkPos] === touchParams.checkValue) {

            const thisPoint = data.slice(point * touchParams.touchPacketSize + touchParams.coordPos, point * touchParams.touchPacketSize + touchParams.coordPos + 4);
            const touchX = thisPoint[0] | (thisPoint[1] << 8);
            const touchY = thisPoint[2] | (thisPoint[3] << 8);

            console.log(point+': '+touchX + ',' + touchY);
        }



    }





}