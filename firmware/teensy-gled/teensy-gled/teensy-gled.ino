// Glediator example with OctoWS2811, by mortonkopf
//
// https://forum.pjrc.com/threads/33012-Gladiator-with-OctoWS2811-working-example

// You can also use Jinx to record Glediator format data to a SD card.
// To play the data from your SD card, use this modified program:
// https://forum.pjrc.com/threads/46229&viewfull=1#post153927

#include <OctoWS2811.h>


//OctoWS2811 Defn. Stuff
#define COLS_LEDS 32  
#define ROWS_LEDS 24  


#define LEDS_PER_STRIP (COLS_LEDS * (ROWS_LEDS / 8))
#define NUM_LEDS COLS_LEDS*ROWS_LEDS;

DMAMEM int displayMemory[LEDS_PER_STRIP*6];
int drawingMemory[LEDS_PER_STRIP*6];

const int config = WS2811_GRB | WS2811_800kHz;
OctoWS2811 leds(LEDS_PER_STRIP, displayMemory, drawingMemory, config);


void setup() {
  Serial1.begin(1000000);
  leds.begin();
  leds.show();
  
}

int serialGlediator() {
  while (!Serial1.available()) {}
  return Serial1.read();
  
}



void loop() {
  byte r,g,b;
  int x,y,i;

  

  

  while (serialGlediator() != 1) {}
 
  for (y=0; y < ROWS_LEDS; y++) {
    for (x=0; x < COLS_LEDS; x++) {
    
      b = serialGlediator();
      r = serialGlediator();
      g = serialGlediator();

      
      
      
      if(y % 6 < 3) { 
        i = y*COLS_LEDS + x; //Usual postion
      } else {
         i = (y+1)*COLS_LEDS - (x+1); //Every 3 rows we swap the "snake" pattern
      }

      leds.setPixel(i, Color(r,g,b));
      
    }
  }
  leds.show();
  
}

/* Helper functions */
// Create a 24 bit color value from R,G,B
unsigned int Color(byte r, byte g, byte b)
{
  return (((unsigned int)b << 16) | ((unsigned int)r << 8) | (unsigned int)g);
}
