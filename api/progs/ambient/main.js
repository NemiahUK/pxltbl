// Hello world example prog.

// Put variables here that you need to persist between loops.
let ARENA = [];

const MIN_X = 0;
const MIN_Y = 0;
let MAX_X = 0;
let MAX_Y = 0;

let CAN_TOUCH = true;
let TIME_LAST_TOUCHED = 0;

let LAST_STEP = 0;

const TOUCH_COOLDOWN = 200;


exports.setup = function(api) {
    // Code here gets executed once at program startup.

    api.clearInputs();

    MAX_X = api.getScreenWidth() - 1;
    MAX_Y = api.getScreenHeight() - 1;

    // Set up the arena
    let width = api.getScreenWidth();

    while(width--)
        ARENA.push(new Array(api.getScreenHeight()).fill(0));
};

exports.loop = function(api) {
    // Draw arena ---------------------------------------------------------------

    // Set the drawing colour.
    api.blank(0, 0, 0);
    api.setDrawColor(100,255,0);

    ARENA.forEach((col, curX) => {
        col.forEach((value, curY) => {
            // Only draw if something is there (= 1)
            if(ARENA[curX][curY]) {
                api.setPixel(curX, curY);
            }
        });
    });

    // Touch input --------------------------------------------------------------

        const touches = api.getTouch();

        if(touches.length > 0) {


            for (let i = 0; i < touches.length; i++) {
                // Add to ARENA matrix
                ARENA[touches[i].x][touches[i].y] = 1;
            }
        }


    if(api.getRunTime() - LAST_STEP > 100) {
        LAST_STEP = api.getRunTime();
        stepGameForward();
    }

};


// Functions

function stepGameForward() {
    let tmpArena = [];

    let width = MAX_X + 1;

    while(width--)
        tmpArena.push(new Array(MAX_Y + 1).fill(0));

    //consoleArena();


    for(let curY = 0; curY <= MAX_Y; curY++) {
        for(let curX = 0; curX <= MAX_X; curX++) {
            let neighborCount = 0;

            // Loop through neighbor cells

            // can't check outside the bounds of the array, so set start and end values for x and y
            // that are within bounds
            let startPosX = (curX - 1 < MIN_X) ? curX : curX - 1;
            let startPosY = (curY - 1 < MIN_Y) ? curY : curY - 1;
            let endPosX =   (curX + 1 > MAX_X) ? curX : curX + 1;
            let endPosY =   (curY + 1 > MAX_Y) ? curY : curY + 1;

            // Now we know the range for our neighbor cells, see how many are alive.
            for (let rowNum = startPosX; rowNum <= endPosX; rowNum++) {
                for (let colNum = startPosY; colNum <= endPosY; colNum++) {
                    if(ARENA[rowNum][colNum]) neighborCount++;
                }
            }


            //Now that we know about neighbor cells, we can see if this cell changes state
            if (ARENA[curX][curY] === 1) { // This is alive
                //console.log('LIVE: ' + curX + ' ' + curY + ': ' + ARENA[curX][curY] + ' : ' + neighborCount);
                neighborCount--; // one was the cell itself

                if(neighborCount <= 1 || neighborCount >= 4) tmpArena[curX][curY] = 0;
                else tmpArena[curX][curY] = 1;

            } else {// This is dead
                //if(neighborCount > 0) console.log('DEAD: ' + curX + ' ' + curY + ': ' + ARENA[curX][curY] + ' : ' + neighborCount);

                if(neighborCount === 3) tmpArena[curX][curY] = 1;
                else tmpArena[curX][curY] = 0;
            }
        }
    }

    ARENA = tmpArena;
}

function consoleArena() {
    let str = '\n\n\n';
    for(let y = 0; y <= MAX_Y; y++) {
        for(let x = 0; x <= MAX_X; x++) {

            str += '[' +
                ((ARENA[x][y]) ? 'X' : ' ') +
                ']'

        }

        str += '\n'
    }

    console.log(str);
}

