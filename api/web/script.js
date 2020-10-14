var socket = io();

socket.on('connect', function(){
    $('#conn').text('Connected').attr('class','text-success');
});

socket.on('version', function(data){
    $('#version').text(data);
});

socket.on('leds', function(data){

    var int8View = new Uint8Array(data);
    var pixels = $('#display li').toArray();

    $('#display li').each(function(index, pixel){
        $(pixel).css('background-color','rgba('+int8View[index*3]+','+int8View[index*3+1]+','+int8View[index*3+2]+',1)');
    });

});



socket.on('frameData', function(data){

    $('#stats').html('');
    $.each(data, function (key, val) {
        $('#stats').append('<li>'+key+': '+val+'</li>');
        if(key === "fps") $('#fps').text(val);
        if(key === "webClients") $('#clients').text(val);
    });



    if(pxlW === false) {
        pxlW = data.pxlW;
        pxlH = data.pxlH;

        pxlSize = (75 / pxlW) + 'vmin';
        if($('body').hasClass('fullscreen'))  pxlSize = (96 / pxlW) + 'vw';

        //init LEDs
        for (var y = 0; y < pxlH; y++) {
            $('#display').append($('<ul>'));
            for (var x = 0; x < pxlW; x++) {
                $('#display ul').last().append($('<li data-x="'+x+'" data-y="'+y+'" data-i="'+ ((y*pxlW)+x) +'">'));
            }

        }

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

socket.on('info', function(data){
    if(typeof data == 'object') {
        data = JSON.stringify(data);
    }
    $('#console').append('<pre class="text-info">'+data+'</pre>');
    $('#console').scrollTop($('#console')[0].scrollHeight);

});

socket.on('debug', function(data){
    if(typeof data == 'object') {
        data = JSON.stringify(data);
    }
    $('#console').append('<pre class="debug">'+data+'</pre>');
    $('#console').scrollTop($('#console')[0].scrollHeight);

});

socket.on('warn', function(data){
    if(typeof data == 'object') {
        data = JSON.stringify(data);
    }
    $('#console').append('<pre class="text-warning">'+data+'</pre>');
    $('#console').scrollTop($('#console')[0].scrollHeight);

});

socket.on('error', function(data){
    if(typeof data == 'object') {
        data = JSON.stringify(data);
    }
    $('#console').append('<pre class="text-danger">'+data+'</pre>');
    $('#console').scrollTop($('#console')[0].scrollHeight);

});


socket.on('disconnect', function(){
    $('conn').text('Disconnected').attr('class','text-danger');

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

function openTab(evt, cityName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tab__content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tab__link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}
