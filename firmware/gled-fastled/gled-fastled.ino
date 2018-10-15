/*
This one works with Glediator!
 */
#include <FastLED.h>
#define NUM_LEDS 253
const int dataline = 6;
CRGB leds[NUM_LEDS];

void setup() {
    Serial.begin(115200);
    LEDS.addLeds<WS2812, dataline, GRB>(leds, NUM_LEDS).setCorrection(TypicalSMD5050);

    for (int p=0;p<= NUM_LEDS;p++) {

        if(p > 0) leds[p-1].setRGB( 0,0,0);
        if(p < NUM_LEDS) leds[p].setRGB( 255,255,255);
        FastLED.show();
    }

}

int serialReadBlocking() {
  while (!Serial.available()) {}
  return Serial.read(); 
}

void loop() {
while (serialReadBlocking() != 1) {} 
   
   for (long i=0; i < NUM_LEDS; i++) {
     leds[i].g = serialReadBlocking();
     leds[i].r = serialReadBlocking();
     leds[i].b = serialReadBlocking();
   }
   FastLED.show();
}
