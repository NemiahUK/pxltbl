#include <OctoWS2811.h>


//OctoWS2811 Defn. Stuff
#define COLS_LEDS 32  
#define ROWS_LEDS 24  
#define SCREEN_ROWS_LEDS 18
#define RGB_ORDER "RGB"

#define LEDS_PER_STRIP (COLS_LEDS * (ROWS_LEDS / 8))
const int NUM_LEDS = (COLS_LEDS * ROWS_LEDS);

DMAMEM int displayMemory[LEDS_PER_STRIP*6];
int drawingMemory[LEDS_PER_STRIP*6];

const int config = WS2811_GRB | WS2811_800kHz;
OctoWS2811 leds(LEDS_PER_STRIP, displayMemory, drawingMemory, config);

//Params and global variables
#define LOGO_COLOR #CCCCCC
#define BAUD 1000000

unsigned long lastSerialRead = 0;


//Logo anim stuff
#define ANIM_FPS 40
int pxl = 0;
unsigned long lastFrameTime = 0;
unsigned int paintColor;
int logoX, logoY, logoScroll, yPos;
float xPos = -7, xScroll = 0;
int animState = 0;

//rainbow colors..
//Hue => [0,45,65,135,210,260,270]
byte rainbowR[] = {255, 255, 234,   0,   0,  85, 128};
byte rainbowG[] = {  0, 191, 255, 255, 128,   0,   0};
byte rainbowB[] = {  0,   0,   0,  64, 255, 255, 255};


void setup() {
  
  Serial1.begin(BAUD);
  //Serial.begin(BAUD);
  leds.begin();
  leds.show();
}

int serialGlediator() {
  while (!Serial1.available() && !Serial.available()) {
    if(millis() - lastSerialRead > 1000) showLogo();
  }
  if(Serial.available()) {
    resetLogo();
    return Serial.read();
  } else {
    resetLogo();
    return Serial1.read();
  }
}



void loop() {
  
  byte mode = 0;

  while (serialGlediator() != 1) {}
  mode = serialGlediator();

  switch (mode) {
    case 0x2:
      readFrame();
      break;
    case 0x3:
      returnInfo();
      break;
  }
}



void resetLogo() {
  lastSerialRead = millis();
  xPos = -7;
  xScroll = 0;
}

void showLogo() {
  int i,j,y;

  if(millis() - lastFrameTime < 1000 / ANIM_FPS) return;  //40FPS
  lastFrameTime = millis();
 
  blank(0x000000);

  yPos = SCREEN_ROWS_LEDS / 2 - 3;  //Approx horz middle of screen - 1/2 logo height

  logoX = round(xPos);
  logoScroll = round(xScroll);
  logoY = round(yPos);
  if(logoX % 6 < 3) logoY--;

  //logo
  paintColor = 0x333333;
  setPixel(logoX-logoScroll,logoY+0); setPixel(logoX-logoScroll+1,logoY+0); setPixel(logoX-logoScroll+2,logoY+0); setPixel(logoX-logoScroll+3,logoY+0); setPixel(logoX-logoScroll+4,logoY+0); setPixel(logoX-logoScroll+5,logoY+0); setPixel(logoX-logoScroll+6,logoY+0);
  setPixel(logoX-logoScroll,logoY+1); setPixel(logoX-logoScroll+6,logoY+1); 
  setPixel(logoX-logoScroll,logoY+2); setPixel(logoX-logoScroll+2,logoY+2); setPixel(logoX-logoScroll+3,logoY+2); setPixel(logoX-logoScroll+4,logoY+2); setPixel(logoX-logoScroll+6,logoY+2);
  setPixel(logoX-logoScroll,logoY+3); setPixel(logoX-logoScroll+2,logoY+3); setPixel(logoX-logoScroll+4,logoY+3); setPixel(logoX-logoScroll+6,logoY+3);
  setPixel(logoX-logoScroll,logoY+4); setPixel(logoX-logoScroll+2,logoY+4); setPixel(logoX-logoScroll+4,logoY+4); setPixel(logoX-logoScroll+6,logoY+4);
  setPixel(logoX-logoScroll,logoY+5); setPixel(logoX-logoScroll+2,logoY+5); setPixel(logoX-logoScroll+4,logoY+5); setPixel(logoX-logoScroll+6,logoY+5);
  setPixel(logoX-logoScroll,logoY+6); setPixel(logoX-logoScroll+1,logoY+6); setPixel(logoX-logoScroll+2,logoY+6); setPixel(logoX-logoScroll+4,logoY+6); setPixel(logoX-logoScroll+5,logoY+6); setPixel(logoX-logoScroll+6,logoY+6); 

  //rainbow
  for (j=0; j < 8; j++) {
        for (i = 0; i < 7; i++) {
            y = yPos;
            if((logoX-j)%6 < 3) y--;
            float alpha = 1-j/9.0;
            paintColor = Color(alpha*rainbowR[i],alpha*rainbowG[i],alpha*rainbowB[i]);
            setPixel(logoX - j - 1-logoScroll, i + y);
        }
    }

    if(animState == 0) {
        xPos+=0.2;
    } else {
        xPos+=1;
    }
    if(xPos > COLS_LEDS/2 && animState == 0) xScroll+=0.2;



    //prevent overflow
    if(xPos >= (COLS_LEDS/2)+6 && animState == 0) {
        xPos = (COLS_LEDS/2);
        xScroll = 0;
    }


    if(xPos-xScroll > COLS_LEDS){
        //animation complete
    }


  if(!leds.busy()) leds.show();
}

void readFrame() {
  byte r,g,b;
  int x,y,i;
  
  for (y=0; y < ROWS_LEDS; y++) {
    for (x=0; x < COLS_LEDS; x++) {
    
      r = serialGlediator();
      g = serialGlediator();
      b = serialGlediator();

      //if we recieve a 1 then exit out of this loop
      if(r == 1 || g == 1 || b == 1) {
        leds.show();
        return;
      }

      if(y % 6 < 3) { 
        if(y % 2) { //Usual postion
          i = (y+1)*COLS_LEDS - (x+1); 
        } else {
          i = y*COLS_LEDS + x; 
        }
      } else { //Every 3 rows we swap the "snake" pattern
        if(y % 2) {
          i = y*COLS_LEDS + x;
        } else {
          i = (y+1)*COLS_LEDS - (x+1); 
        }
      }

      leds.setPixel(i, Color(r,g,b));
      
    }
  }
  leds.show();
}

void returnInfo() {
 
  Serial.println("PxlTbl v1.0 - Params: Number of LEDs, Screen Width, Screen Height, Baud rate, RGB Order, Start, Serpantine");
  Serial.println(NUM_LEDS);
  Serial.println(COLS_LEDS);
  Serial.println(SCREEN_ROWS_LEDS);
  Serial.println(BAUD);
  Serial.println(RGB_ORDER);

  Serial1.println("PxlTbl v1.0 - Params: Number of LEDs, Screen Width, Screen Height, Baud rate, RGB Order, Start, Serpantine");
  Serial1.println(NUM_LEDS);
  Serial1.println(COLS_LEDS);
  Serial1.println(SCREEN_ROWS_LEDS);
  Serial1.println(BAUD);
  Serial1.println(RGB_ORDER);


}

/* Helper functions */

//set pixel based on X,Y
void setPixel(int x,int y) {
  int i;

  if(x < 0 || x >= COLS_LEDS) return;
  if(y < 0 || y >= ROWS_LEDS) return;

  if(y % 6 < 3) {  //Usual postion
    if(y % 2 ==0) {
      i = y*COLS_LEDS + x; 
    } else {
      i = (y+1)*COLS_LEDS - (x+1); 
    }
  } else { //Every 3 rows we swap the "snake" pattern
    if(y % 2 ==0) {
      i = (y+1)*COLS_LEDS - (x+1);
    } else {
      i = y*COLS_LEDS + x;  
    } 
  }

  leds.setPixel(i, paintColor);
  
}

//Fill all pixels with a colour
void blank(unsigned int color) {
  int i;
  for (i = 0; i < NUM_LEDS; i++) {
    leds.setPixel(i, color);
  }
}

// Create a 24 bit color value from R,G,B
unsigned int Color(byte r, byte g, byte b)
{
  return (((unsigned int)r << 16) | ((unsigned int)g << 8) | (unsigned int)b);
}
