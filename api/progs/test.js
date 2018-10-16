

exports.loop = function(api) {

    api.setColor(0, 255, 0);
    api.blank(0, 0, 0);
    var txtSize = api.text('nemiah', 1,1);

    api.setColor(255, 0, 0);
    api.fillBox(1,1,txtSize.w,txtSize.h);
    api.setColor(0, 255, 0);

    api.text('nemiah', 1,1);
    if(api.buttons.fire) api.exit();


};

