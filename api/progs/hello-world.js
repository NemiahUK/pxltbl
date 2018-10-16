

exports.loop = function(api) {

    api.setColor(0, 100, 100);
    api.blank(0, 0, 0);
    api.text('Hi =]', 1,2);

    if(api.buttons.fire) api.exit();


}

