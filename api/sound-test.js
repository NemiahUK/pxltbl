var fs = require('fs');
var wav = require('wav');
var Speaker = require('speaker');


var file = fs.createReadStream('wav/sqr-400-100.wav');
var ding = new wav.Reader();

var speaker;

var wavFormat = {
  audioFormat: 1,
  endianness: 'LE',
  channels: 2,
  sampleRate: 22050,
  byteRate: 88200,
  blockAlign: 4,
  bitDepth: 16,
  signed: true 
};

  speaker = new Speaker(format);
  speaker.on('open', function(data) {
      console.log('Opened '+ (new Date().getTime() - start));
  });
  speaker.on('flush', function(data) {
      console.log('Flushed '+ (new Date().getTime() - start));
  });
  speaker.on('close', function(data) {
      console.log('Closed '+ (new Date().getTime() - start));
  });




// the "format" event gets emitted at the end of the WAVE header
ding.on('format', function (format) {



  // the WAVE header is stripped from the output of the reader
  console.log('File loaded '+ (new Date().getTime() - start));

    ding.pipe(speaker);

});

// pipe the WAVE file to the Reader instance
var start = new Date().getTime();

console.log('Start '+ start);
file.pipe(ding);





