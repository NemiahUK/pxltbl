
exports.setup = function(api) {

};

exports.loop = function(api) {

    api.blank(0, 0, 0);
    var txtSize = api.text('nemiah', 1,1);

    api.setColor(255,255,255);
    api.fillBox(0,0,txtSize.w+2,txtSize.h+2);
    api.setColor(0, 0, 0);

    api.text('nemiah', 1,1);
    if(api.buttons.fire) api.exit();


};

