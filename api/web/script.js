var socket = io(document.location.href);

socket.on('connect', function(){
    $('#console').append('<p>Connected.</p>');
});

socket.on('leds', function(data){

    var int8View = new Uint8Array(data);
    var pixels = $('#display li').toArray();

    $('#display li').each(function(index, pixel){
        $(pixel).css('background-color','rgba('+int8View[index*3]+','+int8View[index*3+1]+','+int8View[index*3+2]+',1)');
    });

});

socket.on('debug', function(data){

    if(typeof data == 'object') {
        data = 'Debug: '+JSON.stringify(data);
    }
    $('#console').append('<p class="debug">'+data+'</p>');
    $('#console').scrollTop($('#console')[0].scrollHeight);

});

socket.on('frameData', function(data){

    $('#stats').html('');
    $.each(data, function (key, val) {
        $('#stats').append('<ul>'+key+': '+val+'</ul>');
    });



    if(pxlW === false) {
        pxlW = data.pxlW;
        pxlH = data.pxlH;

        pxlSize = (75 / pxlW) + 'vmin';

        //init LEDs
        for (var y = 0; y < pxlH; y++) {
            $('#display').append($('<ul>'));
            for (var x = 0; x < pxlW; x++) {
                $('#display ul').last().append($('<li data-x="'+x+'" data-y="'+y+'" data-i="'+ ((y*pxlW)+x) +'">'));
            }

        }

        $('#display ul').css('height',pxlSize).css('line-height',pxlSize);
        $('#display li').css('width',pxlSize).css('height',pxlSize);

        $('#pxlTbl').css('opacity',1);
    }

    var y = 0;
    if(data.rotation == 90 || data.rotation == 270) {
        $('#rotate-padding').css('height','40vmin');
        y = 20;
    } else {
        $('#rotate-padding').css('height','0');

    }
    if(data.rotation == 270) {
        data.rotation = 90;
    } else {

        data.rotation*=-1;
    }
    $('#pxlTbl').css('transform','translateY('+y+'vmin) rotate('+data.rotation+'deg) ');


});

socket.on('error', function(data){

    if(typeof data == 'object') {
        data = 'Error: '+JSON.stringify(data);
    }
    $('#console').append('<p class="error">'+data+'</p>');

    $('#console').scrollTop($('#console')[0].scrollHeight);

});


socket.on('disconnect', function(){
    $('#log').text('Disconnected');

});

//need to get these from api data instead
var pxlW = false;
var pxlH = false;
var pxlSize = false;

$(function() {




    // buttons...

    $('#pxlTbl button').mousedown(function(){
        socket.emit('buttonDown',$(this).data('cmd'));
    });

    $('#pxlTbl button').mouseup(function(){
        socket.emit('buttonUp',$(this).data('cmd'));
    });



    // touch...

    $('#display li').mouseenter(function(e){
        if(e.which == 1) {
            var data = $(this).data('i');
            socket.emit('touchDown', data);
        }
    });
    $('#display li').mousedown(function(e){

        var data = $(this).data('i');
        socket.emit('touchDown',data);
    });

    $('#display li').mouseleave(function(e){

        var data = $(this).data('i');
        socket.emit('touchUp',data);
    });
    $('#display li').mouseup(function(e){

        var data = $(this).data('i');
        socket.emit('touchUp',data);
    });


    // keypresses...

    $('body').keydown(function(e) {
        e.preventDefault();
        switch (e.which) {
            case 27:
                socket.emit('buttonDown','31');
                break;
        }

    });

    $('body').keyup(function(e) {
        e.preventDefault();
        switch (e.which) {
            case 27:
                socket.emit('buttonUp','31');
                break;
        }

    });


});