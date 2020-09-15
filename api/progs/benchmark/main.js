
const iterations = 1000000;
let frameCounter = 0;

let benchmarkDone = false;
let fpsTestDone = false;
let fpsStressTestDone = false;

let benchmarkTime = 0;

let fpsStartFrame = null;
let fpsStartTime = null;
let aveFps = null;
let aveFpsStress = null;

exports.setup = function(api) {
    // Code here gets executed once at program startup.



    api.setFpsLimit(0);

};

exports.loop = function(api) {

    if(!benchmarkDone) {
        benchmark(api);
    } else if(!fpsTestDone) {
        fpsTest(api);
    } else if(!fpsStressTestDone) {
        fpsStressTest(api);
    } else {
        //check for exit

    }

    frameCounter++;

};



function benchmark(api) {

    let startTime = null;
    let testTime = null;

    api.blank(0, 0, 0);
    api.setDrawColor(0, 255, 0);
    api.fillBox(0,api.getScreenHeight()/2-2,api.getScreenWidth(),5);
    api.setDrawColor(0, 0, 0);
    api.fillBox(1,api.getScreenHeight()/2-1,api.getScreenWidth()-2,3);
    api.setDrawColor(0, 255, 0);
    api.fillBox(1,api.getScreenHeight()/2-1,(api.getScreenWidth()-2) * frameCounter / 100,3);


    switch(frameCounter) {
        case 0:
            api.log('Benchmark to run '+iterations+' iterations.');

            break;
        case 10:
            api.log('Test 1: setDrawColor with r,g,b params.');
            startTime = new Date();
            for(let i = 0; i < iterations; i++) {
                api.setDrawColor(128, 128, 128);
            }
            testTime = new Date()-startTime;
            benchmarkTime+= testTime;
            api.log('Done in '+ testTime +'ms');
            break;
        case 20:
            api.log('Test 2: setDrawColor with r,g,b object.');
            startTime = new Date();
            for(let i = 0; i < iterations; i++) {
                api.setDrawColor({r: 128, g:128, b:128});
            }
            testTime = new Date()-startTime;
            benchmarkTime+= testTime;
            api.log('Done in '+ testTime +'ms');
            break;
        case 30:
            api.log('Test 3: setDrawColor with r,g,b,a params.');
            startTime = new Date();
            for(let i = 0; i < iterations; i++) {
                api.setDrawColor(128, 128, 128, 0.5);
            }
            testTime = new Date()-startTime;
            benchmarkTime+= testTime;
            api.log('Done in '+ testTime +'ms');
            break;
        case 40:
            api.log('Test 4: setDrawColor with r,g,b,a object.');
            startTime = new Date();
            for(let i = 0; i < iterations; i++) {
                api.setDrawColor({r: 128, g:128, b:128, a:0.5});
            }
            testTime = new Date()-startTime;
            benchmarkTime+= testTime;
            api.log('Done in '+ testTime +'ms');
            break;
        case 50:
            api.log('Test 5: render text.');
            api.setDrawColor(128, 128, 128);
            startTime = new Date();
            for(let i = 0; i < iterations; i++) {
                api.text('Test',1,1);
            }
            testTime = new Date()-startTime;
            benchmarkTime+= testTime;
            api.log('Done in '+ testTime +'ms');
            break;
        case 60:
            api.log('Test 6: render text with alpha.');
            api.setDrawColor(128, 128, 128, 0.5);
            startTime = new Date();
            for(let i = 0; i < iterations; i++) {
                api.text('Test',1,1);
            }
            testTime = new Date()-startTime;
            benchmarkTime+= testTime;
            api.log('Done in '+ testTime +'ms');
            break;
        case 70:
            api.log('Test 7: get text bounds.');
            api.setDrawColor(128, 128, 128);
            startTime = new Date();
            for(let i = 0; i < iterations; i++) {
                let test = api.textBounds('Test');
            }
            testTime = new Date()-startTime;
            benchmarkTime+= testTime;
            api.log('Done in '+ testTime +'ms');
            break;
        case 80:
            api.log('Test 8: fill box');
            api.setDrawColor(128, 128, 128);
            startTime = new Date();
            for(let i = 0; i < iterations; i++) {
                api.fillBox(1,1,10,10);
            }
            testTime = new Date()-startTime;
            benchmarkTime+= testTime;
            api.log('Done in '+ testTime +'ms');
            break;
        case 100:
            api.log('Benchmark done in '+ (benchmarkTime/1000) +' seconds');
            benchmarkDone = true;
    }
}


function fpsTest(api) {
    if(fpsStartFrame == null) {
        api.log('Starting FPS test...');
        api.setDrawColor(0, 255, 255);
        fpsStartFrame = frameCounter;
        fpsStartTime = new Date();
    }

    if(new Date() - fpsStartTime >= 10000) {
        fpsTestDone = true;
        aveFps = Math.round((frameCounter - fpsStartFrame) / (new Date() - fpsStartTime) * 1000);
        api.log('Result: rendered '+(frameCounter - fpsStartFrame)+' frames in '+((new Date() - fpsStartTime) / 1000)+' seconds. Average FPS is '+ aveFps);
        fpsStartFrame = null;
    }
    api.blank(0, 0, 0);
    api.text(api.getFps(), 1, 1);

    api.setPixel(frameCounter % api.getScreenWidth(), 10);
    api.setPixel((frameCounter / 10) % api.getScreenWidth(), 11);
    api.setPixel((frameCounter / 100) % api.getScreenWidth(), 12);
}

function fpsStressTest(api) {
    if(fpsStartFrame == null) {
        api.log('Starting FPS stress test...');
        api.setDrawColor(0, 255, 255);
        fpsStartFrame = frameCounter;
        fpsStartTime = new Date();
    }

    if(new Date() - fpsStartTime >= 10000) {
        fpsStressTestDone = true;
        aveFpsStress = Math.round((frameCounter - fpsStartFrame) / (new Date() - fpsStartTime) * 1000);
        api.log('Result: rendered '+(frameCounter - fpsStartFrame)+' frames in '+((new Date() - fpsStartTime) / 1000)+' seconds. Average FPS is '+ aveFpsStress);
        finalScore(api);
        return;
    }
    api.blank(0, 0, 0);

    for(let i = 0; i < 1000; i++) {
        api.setDrawColor({h: Math.random() * 360, s: 255, l: 128, a: Math.random()});
        api.fillBox(Math.random()*api.getScreenWidth()-5, Math.random()*api.getScreenHeight()-5, Math.random()*10, Math.random()*10);
    }

    api.setDrawColor(0,0,0);
    api.text(api.getFps(), 1, 1);


}


function finalScore(api) {
    api.setFpsLimit(30);
    api.blank(0, 0, 0);
    api.setDrawColor(0,255,255);
    api.text(aveFps, 1, 1);
    api.setDrawColor(255,0,255);
    api.text(aveFpsStress, 1, 10);

    api.log('Results...   Benchmark: '+(benchmarkTime/1000)+' seconds    FPS: '+aveFps+'    Stress FPS: '+aveFpsStress);

}