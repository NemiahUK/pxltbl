w = 23;
h = 11;
x = 3;
y = 0;

buffer = new Buffer((w*h));


var fontNemiah = [];


fontNemiah[0x61] = [0x17,0x15,0x15,0x15,0x1F];
fontNemiah[0x62] = [0x7F,0x11,0x11,0x11,0x1F];
fontNemiah[0x63] = [0x1F,0x11,0x11,0x11,0x11];



text = 'abc';

var cursor = 0;

for (var i = 0; i < text.length; i++) {

    var character = fontNemiah[text.charCodeAt(i)];
    var len = character.length;

    console.log(text.charAt(i));
    console.log(character);

    for (var col = 0;  col < len; col++) {
        var column = character[col];
        var bit = 0;
        while (bit < 8) {
            if (column & 0x01) buffer[x+cursor+(6-bit+y)*w] = 1;

            bit++;
            column = column >> 1;
        }
        cursor++;
    }
    cursor++;
}


var str = '';
for (var i = 0; i < w*h; i++) {
    str += buffer[i].toString(16).padStart(1, '0') + ' ';

    if (i % 23 == 22) str += '\n';  //end of row
}

console.log(str);
