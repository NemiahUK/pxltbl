const createSpeaker = require('audio-speaker');
const createGenerator = require('audio-generator');

let output = createSpeaker();
let generate = createGenerator(t => Math.sin(t * Math.PI * 2 * 440));

(function loop (err, buf) {
    let buffer = generate();
    output(buffer, loop);
})();